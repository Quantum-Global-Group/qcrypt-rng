"""
Unit tests for Quantum RNG implementation
"""

import pytest
import asyncio
from unittest.mock import Mock, patch
import numpy as np

# Add app to path
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.parent))

from app.quantum.qrng import QuantumRNG, QuantumGenerationResult, EntropyAnalysis


class TestQuantumRNG:
    """Test suite for QuantumRNG class"""
    
    @pytest.fixture
    def qrng(self):
        """Create QuantumRNG instance for testing"""
        return QuantumRNG(backend="qrisp_simulator")
    
    @pytest.mark.asyncio
    async def test_generate_bytes_basic(self, qrng):
        """Test basic byte generation"""
        result = await qrng.generate_bytes(32, 8, "hex")
        
        assert isinstance(result, QuantumGenerationResult)
        assert result.length == 32
        assert result.format == "hex"
        assert result.entropy_bits == 32 * 8
        assert result.qubits_used == 8
        assert len(result.data) == 64  # 32 bytes = 64 hex chars
    
    @pytest.mark.asyncio
    async def test_generate_bytes_formats(self, qrng):
        """Test different output formats"""
        # Test hex format
        result_hex = await qrng.generate_bytes(16, 8, "hex")
        assert isinstance(result_hex.data, str)
        assert len(result_hex.data) == 32  # 16 bytes = 32 hex chars
        
        # Test base64 format
        result_b64 = await qrng.generate_bytes(16, 8, "base64")
        assert isinstance(result_b64.data, str)
        assert result_b64.data.endswith('=') or len(result_b64.data) % 4 == 0
        
        # Test array format
        result_array = await qrng.generate_bytes(16, 8, "array")
        assert isinstance(result_array.data, list)
        assert len(result_array.data) == 16
        assert all(0 <= b <= 255 for b in result_array.data)
        
        # Test raw format
        result_raw = await qrng.generate_bytes(16, 8, "raw")
        assert isinstance(result_raw.data, bytes)
        assert len(result_raw.data) == 16
    
    @pytest.mark.asyncio
    async def test_generate_bytes_validation(self, qrng):
        """Test input validation"""
        # Test invalid byte count
        with pytest.raises(ValueError, match="at least 1"):
            await qrng.generate_bytes(0, 8, "hex")
        
        # Test invalid qubit count
        with pytest.raises(ValueError, match="at least 1"):
            await qrng.generate_bytes(32, 0, "hex")
        
        # Test exceeding qubit limit
        with pytest.raises(ValueError, match="exceeds limit"):
            await qrng.generate_bytes(32, 100, "hex")
    
    @pytest.mark.asyncio
    async def test_generate_key(self, qrng):
        """Test cryptographic key generation"""
        # Test AES key generation
        result = await qrng.generate_key(256, "AES")
        assert isinstance(result.data, dict)
        assert result.data["algorithm"] == "AES"
        assert result.data["key_size_bits"] == 256
        assert len(result.data["key"]) == 64  # 256 bits = 32 bytes = 64 hex chars
        
        # Test invalid key size
        with pytest.raises(ValueError, match="Invalid key size"):
            await qrng.generate_key(512, "AES")
        
        # Test invalid algorithm
        with pytest.raises(ValueError, match="Unsupported algorithm"):
            await qrng.generate_key(256, "INVALID")
    
    @pytest.mark.asyncio
    async def test_generate_token(self, qrng):
        """Test session token generation"""
        # Test URL-safe token
        result = await qrng.generate_token(32, url_safe=True)
        assert isinstance(result.data, str)
        # URL-safe base64 should not contain +, /, or =
        assert '+' not in result.data
        assert '/' not in result.data
        
        # Test non-URL-safe token
        result = await qrng.generate_token(32, url_safe=False)
        assert isinstance(result.data, str)
    
    @pytest.mark.asyncio
    async def test_generate_uuid(self, qrng):
        """Test UUID generation"""
        result = await qrng.generate_uuid(4)
        
        assert isinstance(result.data, str)
        assert result.format == "uuid"
        
        # Validate UUID format
        uuid_parts = result.data.split('-')
        assert len(uuid_parts) == 5
        assert len(uuid_parts[0]) == 8
        assert len(uuid_parts[1]) == 4
        assert len(uuid_parts[2]) == 4
        assert len(uuid_parts[3]) == 4
        assert len(uuid_parts[4]) == 12
        
        # Check version bits (should be 4)
        assert uuid_parts[2][0] == '4'
        
        # Test invalid version
        with pytest.raises(ValueError, match="Only UUID v4"):
            await qrng.generate_uuid(5)
    
    def test_entropy_pool_management(self, qrng):
        """Test entropy pool updates"""
        initial_size = len(qrng.entropy_pool)
        
        # Add measurements to pool
        for i in range(10):
            qrng._update_entropy_pool(i)
        
        assert len(qrng.entropy_pool) == initial_size + 10
        assert qrng.generation_count == 10
        
        # Test pool size limit
        for i in range(2000):
            qrng._update_entropy_pool(i)
        
        assert len(qrng.entropy_pool) <= qrng.pool_size
    
    def test_entropy_analysis(self, qrng):
        """Test entropy analysis"""
        # Test with insufficient data
        analysis = qrng.analyze_entropy()
        assert analysis.health_status == "insufficient_data"
        
        # Add random data to pool
        np.random.seed(42)  # For reproducibility
        for _ in range(200):
            qrng._update_entropy_pool(np.random.randint(0, 256))
        
        # Analyze entropy
        analysis = qrng.analyze_entropy()
        
        assert isinstance(analysis, EntropyAnalysis)
        assert 0 <= analysis.shannon_entropy <= 1
        assert 0 <= analysis.bit_balance <= 1
        assert analysis.pool_size == 200
        assert isinstance(analysis.passed_tests, dict)
        assert analysis.health_status in ["excellent", "good", "poor"]
    
    def test_statistics(self, qrng):
        """Test statistics tracking"""
        stats = qrng.get_statistics()
        
        assert isinstance(stats, dict)
        assert "total_bytes_generated" in stats
        assert "total_generations" in stats
        assert "average_generation_time_ms" in stats
        assert "entropy_pool_size" in stats
        assert "backend" in stats
        assert "backend_status" in stats
    
    @pytest.mark.asyncio
    async def test_performance(self, qrng):
        """Test generation performance"""
        import time
        
        # Generate different sizes and measure time
        sizes = [32, 128, 512, 1024]
        
        for size in sizes:
            start_time = time.time()
            result = await qrng.generate_bytes(size, 8, "hex")
            elapsed = (time.time() - start_time) * 1000
            
            assert result.length == size
            assert result.generation_time_ms > 0
            assert result.generation_time_ms < 5000  # Should be < 5 seconds
            
            print(f"Generated {size} bytes in {elapsed:.2f}ms")
    
    @pytest.mark.asyncio
    async def test_randomness_quality(self, qrng):
        """Test quality of generated random numbers"""
        # Generate a large sample
        result = await qrng.generate_bytes(1000, 8, "array")
        data = np.array(result.data)
        
        # Test uniform distribution
        mean = np.mean(data)
        assert 100 < mean < 155  # Should be around 127.5
        
        # Test standard deviation
        std = np.std(data)
        assert 60 < std < 90  # Should be around 74
        
        # Test uniqueness
        unique_ratio = len(np.unique(data)) / len(data)
        assert unique_ratio > 0.2  # At least 20% unique values
        
        # Test no obvious patterns
        diffs = np.diff(data)
        assert np.std(diffs) > 50  # Differences should vary
    
    @pytest.mark.asyncio
    async def test_concurrent_generation(self, qrng):
        """Test concurrent generation requests"""
        # Create multiple concurrent tasks
        tasks = []
        for i in range(10):
            task = qrng.generate_bytes(32, 8, "hex")
            tasks.append(task)
        
        # Execute concurrently
        results = await asyncio.gather(*tasks)
        
        # Verify all results are unique
        assert len(results) == 10
        hex_values = [r.data for r in results]
        assert len(set(hex_values)) == 10  # All should be different
    
    def test_request_id_generation(self, qrng):
        """Test request ID uniqueness"""
        ids = set()
        for _ in range(100):
            request_id = qrng._generate_request_id()
            assert request_id not in ids  # Should be unique
            ids.add(request_id)
            assert request_id.startswith("req_")


@pytest.mark.integration
class TestQuantumRNGIntegration:
    """Integration tests for QuantumRNG"""
    
    @pytest.mark.asyncio
    async def test_full_workflow(self):
        """Test complete workflow from initialization to analysis"""
        # Initialize
        qrng = QuantumRNG()
        
        # Generate various types of random data
        bytes_result = await qrng.generate_bytes(64, 8, "hex")
        key_result = await qrng.generate_key(256, "AES")
        token_result = await qrng.generate_token(32, True)
        uuid_result = await qrng.generate_uuid(4)
        
        # Verify all succeeded
        assert bytes_result.length == 64
        assert key_result.data["key_size_bits"] == 256
        assert len(token_result.data) > 0
        assert '-' in uuid_result.data
        
        # Check entropy pool was updated
        assert len(qrng.entropy_pool) > 0
        
        # Get statistics
        stats = qrng.get_statistics()
        assert stats["total_bytes_generated"] > 0
        assert stats["total_generations"] > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])