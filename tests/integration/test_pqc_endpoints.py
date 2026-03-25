"""
Integration tests for PQC API endpoints

Tests for Kyber KEM, FALCON, SPHINCS+, NTRU, and SABER endpoints.
"""

import pytest
import asyncio
from unittest.mock import Mock, patch, MagicMock
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent.parent))

from fastapi.testclient import TestClient
from app.main import create_app


@pytest.fixture(scope="module")
def client():
    """Create test client"""
    app = create_app()
    with TestClient(app) as test_client:
        yield test_client


class TestKyberKEMEndpoints:
    """Tests for Kyber KEM endpoints"""

    def test_kem_generate_keypair(self, client):
        """Test Kyber keypair generation"""
        response = client.post(
            "/api/v2/pqc/kem/generate",
            data={
                "algorithm": "KYBER768",
                "encoding": "base64"
            }
        )

        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "success"
        assert "public_key" in data["data"]
        assert "private_key" in data["data"]
        assert data["data"]["algorithm"] in ["KYBER512", "KYBER768", "KYBER1024"]
        assert data["data"]["nist_level"] in [1, 3, 5]
        assert data["data"]["type"] == "key_encapsulation_mechanism"

    def test_kem_generate_different_algorithms(self, client):
        """Test Kyber generation with different algorithms"""
        for algo in ["KYBER512", "KYBER768", "KYBER1024"]:
            response = client.post(
                "/api/v2/pqc/kem/generate",
                data={"algorithm": algo, "encoding": "hex"}
            )

            assert response.status_code == 200
            data = response.json()
            assert data["data"]["algorithm"] == algo

    def test_kem_generate_hex_encoding(self, client):
        """Test Kyber generation with hex encoding"""
        response = client.post(
            "/api/v2/pqc/kem/generate",
            data={"algorithm": "KYBER768", "encoding": "hex"}
        )

        assert response.status_code == 200
        data = response.json()

        # Hex should not have +, /, or =
        public_key = data["data"]["public_key"]
        assert all(c in "0123456789abcdef" for c in public_key.lower())

    def test_kem_info(self, client):
        """Test Kyber KEM info endpoint"""
        response = client.get("/api/v2/pqc/kem/info")

        assert response.status_code == 200
        data = response.json()

        assert "what_is_kyber" in data["data"]
        assert "what_is_kem" in data["data"]
        assert "how_it_works" in data["data"]
        assert "kyber_variants" in data["data"]
        assert "applications" in data["data"]


class TestFalconEndpoints:
    """Tests for FALCON endpoints"""

    def test_falcon_generate(self, client):
        """Test FALCON keypair generation"""
        response = client.post(
            "/api/v2/pqc/falcon/generate",
            data={"algorithm": "FALCON512", "encoding": "base64"}
        )

        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "success"
        assert "public_key" in data["data"]
        assert "private_key" in data["data"]
        assert data["data"]["algorithm"] in ["FALCON512", "FALCON1024"]
        assert data["data"]["type"] == "signature"

    def test_falcon_generate_1024(self, client):
        """Test FALCON-1024 generation"""
        response = client.post(
            "/api/v2/pqc/falcon/generate",
            data={"algorithm": "FALCON1024", "encoding": "base64"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["data"]["algorithm"] == "FALCON1024"
        assert data["data"]["nist_level"] == 5


class TestSphincsEndpoints:
    """Tests for SPHINCS+ endpoints"""

    def test_sphincs_generate(self, client):
        """Test SPHINCS+ keypair generation"""
        response = client.post(
            "/api/v2/pqc/sphincs/generate",
            data={"algorithm": "SPHINCS+-SHA2-128f", "encoding": "base64"}
        )

        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "success"
        assert "public_key" in data["data"]
        assert "private_key" in data["data"]
        assert data["data"]["type"] == "signature"

    def test_sphincs_metadata(self, client):
        """Test SPHINCS+ metadata"""
        response = client.post(
            "/api/v2/pqc/sphincs/generate",
            data={"algorithm": "SPHINCS+-SHA2-128f"}
        )

        assert response.status_code == 200
        data = response.json()

        assert "standardization" in data["metadata"]
        assert data["metadata"]["standardization"] == "NIST FIPS 205"
        assert "hash-based" in data["metadata"]["suitable_for"][0].lower()


class TestNTRUEndpoints:
    """Tests for NTRU endpoints"""

    def test_ntru_generate(self, client):
        """Test NTRU keypair generation"""
        response = client.post(
            "/api/v2/pqc/ntru/generate",
            data={"algorithm": "NTRU-HPS-2048-509", "encoding": "base64"}
        )

        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "success"
        assert "public_key" in data["data"]
        assert "private_key" in data["data"]
        assert data["data"]["type"] == "key_encapsulation_mechanism"

    def test_ntru_generate_677(self, client):
        """Test NTRU-677 generation"""
        response = client.post(
            "/api/v2/pqc/ntru/generate",
            data={"algorithm": "NTRU-HPS-2048-677", "encoding": "hex"}
        )

        assert response.status_code == 200
        data = response.json()
        assert "NTRU" in data["data"]["algorithm"]


class TestSABEREndpoints:
    """Tests for SABER endpoints"""

    def test_saber_generate_lightsaber(self, client):
        """Test SABER-LIGHTSABER generation"""
        response = client.post(
            "/api/v2/pqc/saber/generate",
            data={"algorithm": "SABER-LIGHTSABER", "encoding": "base64"}
        )

        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "success"
        assert data["data"]["algorithm"] == "SABER-LIGHTSABER"
        assert data["data"]["nist_level"] == 1

    def test_saber_generate_saber(self, client):
        """Test SABER generation"""
        response = client.post(
            "/api/v2/pqc/saber/generate",
            data={"algorithm": "SABER-SABER", "encoding": "base64"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["data"]["algorithm"] == "SABER-SABER"
        assert data["data"]["nist_level"] == 3

    def test_saber_generate_firesaber(self, client):
        """Test SABER-FIRESABER generation"""
        response = client.post(
            "/api/v2/pqc/saber/generate",
            data={"algorithm": "SABER-FIRESABER", "encoding": "base64"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["data"]["algorithm"] == "SABER-FIRESABER"
        assert data["data"]["nist_level"] == 5


class TestPQCAlgorithmsEndpoint:
    """Tests for PQC algorithms listing endpoint"""

    def test_list_algorithms(self, client):
        """Test listing all supported algorithms"""
        response = client.get("/api/v2/pqc/algorithms")

        assert response.status_code == 200
        data = response.json()

        assert "signatures" in data["data"]
        assert "key_exchange" in data["data"]
        assert "liboqs_available" in data["data"]

    def test_algorithms_includes_new(self, client):
        """Test that new algorithms are included"""
        response = client.get("/api/v2/pqc/algorithms")

        assert response.status_code == 200
        data = response.json()

        # Check signature algorithms
        sigs = data["data"]["signatures"]
        assert any("FALCON" in k for k in sigs.keys())
        assert any("SPHINCS" in k for k in sigs.keys())

        # Check KEM algorithms
        kems = data["data"]["key_exchange"]
        assert any("KYBER" in k for k in kems.keys())
        assert any("NTRU" in k for k in kems.keys()) or not data["data"].get("liboqs_available")
        assert any("SABER" in k for k in kems.keys()) or not data["data"].get("liboqs_available")


class TestPQCEndpointErrors:
    """Tests for PQC endpoint error handling"""

    def test_invalid_algorithm(self, client):
        """Test error with invalid algorithm"""
        response = client.post(
            "/api/v2/pqc/kem/generate",
            data={"algorithm": "INVALID_ALGO", "encoding": "base64"}
        )

        # Should return error (may be 400 or 500 depending on implementation)
        assert response.status_code in [400, 500]

    def test_kem_with_signature_algorithm(self, client):
        """Test KEM endpoint with signature algorithm"""
        response = client.post(
            "/api/v2/pqc/kem/generate",
            data={"algorithm": "DILITHIUM3", "encoding": "base64"}
        )

        # Should handle gracefully (either convert or error)
        assert response.status_code in [200, 400, 500]


class TestPQCPerformance:
    """Performance tests for PQC endpoints"""

    def test_kem_generation_latency(self, client):
        """Test KEM generation latency"""
        import time

        start = time.time()
        response = client.post(
            "/api/v2/pqc/kem/generate",
            data={"algorithm": "KYBER768", "encoding": "base64"}
        )
        elapsed = time.time() - start

        assert response.status_code == 200
        # Should complete in reasonable time (< 5 seconds)
        assert elapsed < 5.0

    def test_falcon_generation_latency(self, client):
        """Test FALCON generation latency"""
        import time

        start = time.time()
        response = client.post(
            "/api/v2/pqc/falcon/generate",
            data={"algorithm": "FALCON512", "encoding": "base64"}
        )
        elapsed = time.time() - start

        assert response.status_code == 200
        assert elapsed < 5.0

    def test_concurrent_requests(self, client):
        """Test concurrent PQC requests"""
        import concurrent.futures

        def make_request():
            return client.post(
                "/api/v2/pqc/kem/generate",
                data={"algorithm": "KYBER768", "encoding": "base64"}
            )

        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(make_request) for _ in range(5)]
            results = [f.result() for f in futures]

        # All should succeed
        for response in results:
            assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
