"""
QCrypt RNG - Core Quantum Random Number Generator
Enterprise-grade quantum random number generation with hardware interface support
"""

from typing import Optional, List, Dict, Any, Tuple
import hashlib
import secrets
import time
import asyncio
from datetime import datetime
from dataclasses import dataclass, field
import numpy as np
from loguru import logger

try:
    from qrisp import QuantumFloat, h, measure
    QRISP_AVAILABLE = True
except ImportError:
    QRISP_AVAILABLE = False
    logger.info("Qrisp not available. Using quantum simulation.")

from app.config import settings
from app.utils.monitoring import track_quantum_generation
from app.quantum.hardware_interface import (
    get_quantum_hardware_manager,
    QuantumHardwareManager,
    SimulatedQRNG,
    PhotonicQRNG,
    SuperconductingQRNG,
    QuantumMeasurement
)


@dataclass
class QuantumGenerationResult:
    """Result from quantum random number generation"""
    data: Any
    format: str
    length: int
    entropy_bits: int
    generation_time_ms: float
    quantum_backend: str
    qubits_used: int
    measurement_count: int
    request_id: str
    timestamp: datetime = field(default_factory=datetime.utcnow)


@dataclass
class EntropyAnalysis:
    """Entropy analysis results"""
    shannon_entropy: float
    min_entropy: float
    chi_square_statistic: float
    chi_square_p_value: float
    autocorrelation: float
    bit_balance: float
    health_status: str
    pool_size: int
    passed_tests: Dict[str, bool]


class QuantumRNG:
    """
    Enterprise-grade Quantum Random Number Generator

    Features:
    - Quantum-simulation and hardware-ready randomness
    - Multiple backend support (Qrisp, real quantum hardware)
    - Entropy pool management
    - Statistical validation
    - Post-processing for cryptographic quality
    - Hardware abstraction layer for seamless transition
    """

    def __init__(self, backend: Optional[str] = None):
        """
        Initialize Quantum RNG

        Args:
            backend: Quantum backend to use (default from settings)
        """
        self.backend = backend or settings.quantum_backend
        self.backend_config = settings.quantum_backend_config
        self.entropy_pool: List[int] = []
        self.generation_count = 0
        self.min_entropy_threshold = settings.min_entropy_threshold
        self.pool_size = settings.entropy_pool_size

        # Initialize quantum hardware manager
        self.hardware_manager: QuantumHardwareManager = get_quantum_hardware_manager()
        
        # Initialize quantum backend
        self._initialize_backend()

        # Statistics tracking
        self.total_bytes_generated = 0
        self.total_generation_time = 0

        logger.info(f"QuantumRNG initialized with backend: {self.backend}")

    def _initialize_backend(self):
        """Initialize the quantum backend"""
        if self.backend == "qrisp_simulator":
            # Initialize simulated quantum hardware
            self.backend_instance = "qrisp"
            # Add simulated device to hardware manager - defer to async method
            self._default_device_added = False
        elif self.backend.startswith("hardware_"):
            # Initialize connection to real hardware based on type
            if "photonic" in self.backend:
                device = PhotonicQRNG(self.backend_config.get("device_address", "default"))
            elif "superconducting" in self.backend:
                device = SuperconductingQRNG(self.backend_config.get("device_address", "default"))
            else:
                device = SimulatedQRNG("fallback")
            
            # Add device to hardware manager - defer to async method
            self._default_device_added = False
            self.backend_instance = "hardware"
        else:
            # Fallback to classical simulation
            logger.info(f"Using simulation backend: {self.backend}")
            self.backend_instance = "simulation"
            self._default_device_added = False
    
    async def generate_bytes(
        self,
        num_bytes: int,
        num_qubits: int = 8,
        output_format: str = "hex"
    ) -> QuantumGenerationResult:
        """
        Generate cryptographically secure random bytes using quantum simulation or hardware

        Args:
            num_bytes: Number of random bytes to generate (1-10240)
            num_qubits: Number of qubits to use (1-16)
            output_format: Output format (hex, base64, array, raw)

        Returns:
            QuantumGenerationResult with generated data
        """
        # Add default device if not already added
        if not hasattr(self, '_default_device_added') or not self._default_device_added:
            await self._add_default_device()
            self._default_device_added = True

        start_time = time.time()
        request_id = self._generate_request_id()

        # Validate inputs
        num_bytes = self._validate_byte_count(num_bytes)
        num_qubits = self._validate_qubit_count(num_qubits)

        logger.debug(f"Generating {num_bytes} bytes with {num_qubits} qubits")

        # Generate quantum random bytes
        random_bytes = bytearray()
        measurement_count = 0

        while len(random_bytes) < num_bytes:
            # Generate quantum randomness using hardware abstraction
            if self.backend_instance in ["qrisp", "hardware"]:
                # Use hardware interface for quantum measurements
                quantum_measurement = await self.hardware_manager.measure_qubits(num_qubits)
                quantum_value = quantum_measurement.value
            else:
                # Fallback to classical simulation
                quantum_value = self._generate_quantum_simulation(num_qubits)

            measurement_count += 1

            # Post-process for cryptographic quality
            processed_bytes = self._post_process(quantum_value, num_qubits)

            # Add to byte array
            bytes_to_add = min(len(processed_bytes), num_bytes - len(random_bytes))
            random_bytes.extend(processed_bytes[:bytes_to_add])

            # Update entropy pool
            self._update_entropy_pool(quantum_value)

        # Format output
        result_bytes = bytes(random_bytes)
        formatted_output = self._format_output(result_bytes, output_format)

        # Calculate metrics
        generation_time_ms = (time.time() - start_time) * 1000
        self.total_bytes_generated += num_bytes
        self.total_generation_time += generation_time_ms

        logger.info(f"Generated {num_bytes} bytes in {generation_time_ms:.2f}ms using {self.backend_instance} backend")

        # Track quantum generation metrics
        track_quantum_generation(
            algorithm="quantum_random",
            qubits_used=num_qubits,
            generation_time=generation_time_ms / 1000.0,  # Convert to seconds for metrics
            entropy_bits=num_bytes * 8
        )

        return QuantumGenerationResult(
            data=formatted_output,
            format=output_format,
            length=num_bytes,
            entropy_bits=num_bytes * 8,
            generation_time_ms=generation_time_ms,
            quantum_backend=self.backend,
            qubits_used=num_qubits,
            measurement_count=measurement_count,
            request_id=request_id
        )

    async def _add_default_device(self):
        """Add default quantum device to hardware manager"""
        if self.backend == "qrisp_simulator":
            await self.hardware_manager.add_device("simulated_default", SimulatedQRNG("qrisp"))
        elif self.backend.startswith("hardware_"):
            if "photonic" in self.backend:
                device = PhotonicQRNG(self.backend_config.get("device_address", "default"))
            elif "superconducting" in self.backend:
                device = SuperconductingQRNG(self.backend_config.get("device_address", "default"))
            else:
                device = SimulatedQRNG("fallback")
            
            await self.hardware_manager.add_device("real_hardware", device)
    
    def _generate_quantum_qrisp(self, num_qubits: int) -> int:
        """Generate quantum random number using Qrisp"""
        # Create quantum register
        qf = QuantumFloat(num_qubits)
        
        # Apply Hadamard gates to create superposition
        # Each qubit is now in state |0⟩ + |1⟩ / √2
        h(qf)
        
        # Measure the quantum state to collapse superposition
        measurement = qf.get_measurement()
        
        return measurement
    
    def _generate_quantum_simulation(self, num_qubits: int) -> int:
        """Fallback quantum simulation when Qrisp is not available"""
        # Simulate quantum measurement with true randomness
        # This is a simplified model but provides good randomness
        result = 0
        for bit in range(num_qubits):
            # Simulate quantum measurement (50/50 probability)
            if secrets.randbits(1):
                result |= (1 << bit)
        return result
    
    def _post_process(self, quantum_value: int, num_qubits: int) -> bytes:
        """
        Post-process quantum measurement for cryptographic quality
        
        Uses SHA3-256 with additional entropy mixing to ensure:
        - Uniform distribution
        - No bias from quantum hardware
        - Cryptographic security
        """
        # Convert quantum value to bytes
        quantum_bytes = quantum_value.to_bytes(
            (quantum_value.bit_length() + 7) // 8 or 1, 
            'big'
        )
        
        # Add additional entropy from system
        system_entropy = secrets.token_bytes(16)
        
        # Mix with SHA3-256 for uniformity
        hasher = hashlib.sha3_256()
        hasher.update(quantum_bytes)
        hasher.update(system_entropy)
        hasher.update(str(time.time_ns()).encode())
        
        return hasher.digest()
    
    def _format_output(self, data: bytes, output_format: str) -> Any:
        """Format output bytes according to requested format"""
        if output_format == "hex":
            return data.hex()
        elif output_format == "base64":
            import base64
            return base64.b64encode(data).decode('utf-8')
        elif output_format == "array":
            return list(data)
        elif output_format == "raw":
            return data
        else:
            raise ValueError(f"Invalid output format: {output_format}")
    
    def _update_entropy_pool(self, measurement: int):
        """Update entropy pool with new measurement"""
        self.entropy_pool.append(measurement)
        
        # Maintain pool size limit
        if len(self.entropy_pool) > self.pool_size:
            self.entropy_pool = self.entropy_pool[-self.pool_size:]
        
        self.generation_count += 1
    
    def _validate_byte_count(self, num_bytes: int) -> int:
        """Validate and limit byte count based on tier"""
        if num_bytes < 1:
            raise ValueError("Number of bytes must be at least 1")
        
        # Get tier limits (would be based on API key in production)
        max_bytes = settings.enterprise_tier_max_bytes
        
        if num_bytes > max_bytes:
            raise ValueError(f"Number of bytes exceeds limit: {max_bytes}")
        
        return num_bytes
    
    def _validate_qubit_count(self, num_qubits: int) -> int:
        """Validate qubit count"""
        if num_qubits < 1:
            raise ValueError("Number of qubits must be at least 1")
        
        if num_qubits > settings.max_qubits:
            raise ValueError(f"Number of qubits exceeds limit: {settings.max_qubits}")
        
        return num_qubits
    
    def _generate_request_id(self) -> str:
        """Generate unique request ID"""
        timestamp = str(time.time_ns())
        random_part = secrets.token_hex(8)
        return f"req_{timestamp}_{random_part}"
    
    async def generate_key(
        self,
        key_size: int = 256,
        algorithm: str = "AES"
    ) -> QuantumGenerationResult:
        """
        Generate cryptographic key
        
        Args:
            key_size: Key size in bits (128, 192, 256)
            algorithm: Target algorithm (AES, RSA, ECDSA)
        
        Returns:
            QuantumGenerationResult with key data
        """
        # Validate key size
        valid_sizes = {
            "AES": [128, 192, 256],
            "RSA": [2048, 3072, 4096],
            "ECDSA": [256, 384, 521]
        }
        
        if algorithm not in valid_sizes:
            raise ValueError(f"Unsupported algorithm: {algorithm}")
        
        if key_size not in valid_sizes[algorithm]:
            raise ValueError(f"Invalid key size for {algorithm}: {key_size}")
        
        # Generate key bytes
        key_bytes = key_size // 8
        result = await self.generate_bytes(key_bytes, num_qubits=16, output_format="hex")
        
        # Add algorithm metadata
        result.data = {
            "key": result.data,
            "algorithm": algorithm,
            "key_size_bits": key_size,
            "format": "hex"
        }
        
        return result
    
    async def generate_token(
        self,
        length: int = 32,
        url_safe: bool = True
    ) -> QuantumGenerationResult:
        """
        Generate secure session token
        
        Args:
            length: Token length in bytes
            url_safe: Whether to use URL-safe encoding
        
        Returns:
            QuantumGenerationResult with token
        """
        # Generate token bytes
        result = await self.generate_bytes(
            length, 
            num_qubits=12,
            output_format="base64" if url_safe else "hex"
        )
        
        # Make URL-safe if requested
        if url_safe and result.format == "base64":
            result.data = result.data.replace('+', '-').replace('/', '_').rstrip('=')
        
        return result
    
    async def generate_uuid(self, version: int = 4) -> QuantumGenerationResult:
        """
        Generate quantum UUID
        
        Args:
            version: UUID version (currently only v4 supported)
        
        Returns:
            QuantumGenerationResult with UUID
        """
        if version != 4:
            raise ValueError("Only UUID v4 is currently supported")
        
        # Generate 16 random bytes
        result = await self.generate_bytes(16, num_qubits=16, output_format="raw")
        
        # Convert to UUID v4 format
        uuid_bytes = bytearray(result.data)
        
        # Set version (4) and variant bits
        uuid_bytes[6] = (uuid_bytes[6] & 0x0f) | 0x40  # Version 4
        uuid_bytes[8] = (uuid_bytes[8] & 0x3f) | 0x80  # Variant 10
        
        # Format as UUID string
        hex_string = uuid_bytes.hex()
        uuid_string = f"{hex_string[:8]}-{hex_string[8:12]}-{hex_string[12:16]}-{hex_string[16:20]}-{hex_string[20:32]}"
        
        result.data = uuid_string
        result.format = "uuid"
        
        return result
    
    def analyze_entropy(self) -> EntropyAnalysis:
        """
        Perform comprehensive entropy analysis
        
        Returns:
            EntropyAnalysis with statistical results
        """
        if len(self.entropy_pool) < 100:
            return EntropyAnalysis(
                shannon_entropy=0,
                min_entropy=0,
                chi_square_statistic=0,
                chi_square_p_value=0,
                autocorrelation=0,
                bit_balance=0,
                health_status="insufficient_data",
                pool_size=len(self.entropy_pool),
                passed_tests={}
            )
        
        data = np.array(self.entropy_pool)
        
        # Shannon entropy
        shannon_entropy = self._calculate_shannon_entropy(data)
        
        # Min entropy
        min_entropy = self._calculate_min_entropy(data)
        
        # Chi-square test
        chi_square_stat, chi_square_p = self._chi_square_test(data)
        
        # Autocorrelation
        autocorrelation = self._calculate_autocorrelation(data)
        
        # Bit balance
        bit_balance = self._calculate_bit_balance(data)
        
        # Determine health status
        passed_tests = {
            "shannon_entropy": shannon_entropy > 0.95,
            "chi_square": chi_square_p > 0.05,
            "autocorrelation": abs(autocorrelation) < 0.1,
            "bit_balance": abs(bit_balance - 0.5) < 0.05
        }
        
        all_passed = all(passed_tests.values())
        health_status = "excellent" if all_passed else "good" if sum(passed_tests.values()) >= 3 else "poor"
        
        return EntropyAnalysis(
            shannon_entropy=shannon_entropy,
            min_entropy=min_entropy,
            chi_square_statistic=chi_square_stat,
            chi_square_p_value=chi_square_p,
            autocorrelation=autocorrelation,
            bit_balance=bit_balance,
            health_status=health_status,
            pool_size=len(self.entropy_pool),
            passed_tests=passed_tests
        )
    
    def _calculate_shannon_entropy(self, data: np.ndarray) -> float:
        """Calculate Shannon entropy"""
        _, counts = np.unique(data, return_counts=True)
        probabilities = counts / len(data)
        entropy = -np.sum(probabilities * np.log2(probabilities + 1e-10))
        max_entropy = np.log2(len(data))
        return entropy / max_entropy if max_entropy > 0 else 0
    
    def _calculate_min_entropy(self, data: np.ndarray) -> float:
        """Calculate min entropy"""
        _, counts = np.unique(data, return_counts=True)
        max_prob = np.max(counts) / len(data)
        return -np.log2(max_prob) if max_prob > 0 else 0
    
    def _chi_square_test(self, data: np.ndarray) -> Tuple[float, float]:
        """Perform chi-square test for randomness"""
        try:
            from scipy import stats
            # Create frequency bins
            observed_freq, _ = np.histogram(data, bins=16)
            expected_freq = len(data) / 16
            
            # Chi-square test
            chi2_stat, p_value = stats.chisquare(observed_freq)
            return chi2_stat, p_value
        except ImportError:
            logger.warning("scipy not available for chi-square test")
            return 0.0, 1.0
    
    def _calculate_autocorrelation(self, data: np.ndarray) -> float:
        """Calculate autocorrelation coefficient"""
        if len(data) < 2:
            return 0.0
        
        mean = np.mean(data)
        c0 = np.sum((data - mean) ** 2) / len(data)
        c1 = np.sum((data[:-1] - mean) * (data[1:] - mean)) / (len(data) - 1)
        
        return c1 / c0 if c0 > 0 else 0
    
    def _calculate_bit_balance(self, data: np.ndarray) -> float:
        """Calculate bit balance (ratio of 1s to total bits)"""
        bit_string = ''.join(format(x, '08b') for x in data)
        ones_count = bit_string.count('1')
        total_bits = len(bit_string)
        return ones_count / total_bits if total_bits > 0 else 0.5
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get generator statistics"""
        avg_time = self.total_generation_time / self.generation_count if self.generation_count > 0 else 0
        
        return {
            "total_bytes_generated": self.total_bytes_generated,
            "total_generations": self.generation_count,
            "average_generation_time_ms": avg_time,
            "entropy_pool_size": len(self.entropy_pool),
            "backend": self.backend,
            "backend_status": "operational" if self.backend_instance else "degraded"
        }


# Create singleton instance
_quantum_rng_instance: Optional[QuantumRNG] = None


def get_quantum_rng() -> QuantumRNG:
    """Get singleton QuantumRNG instance"""
    global _quantum_rng_instance
    if _quantum_rng_instance is None:
        _quantum_rng_instance = QuantumRNG()
    return _quantum_rng_instance