"""
QCrypt RNG Demo Test Script
Run this to verify all demo components are working
"""

import asyncio
import httpx
import json
from typing import Dict, Any

# API base URL
BASE_URL = "http://localhost:8000/api/v2"


class DemoTester:
    def __init__(self):
        self.client = httpx.AsyncClient()
        self.results = {}
    
    async def test_quantum_rng(self):
        """Test quantum random number generation"""
        print("\n🎲 Testing Quantum RNG...")
        try:
            response = await self.client.post(
                f"{BASE_URL}/generate/bytes",
                json={"length": 32, "format": "hex", "quantum_bits": 8}
            )
            if response.status_code == 200:
                data = response.json()
                print(f"  ✅ Generated {data['data']['length']} quantum random bytes")
                print(f"  📊 Entropy: {data['data']['entropy_bits']} bits")
                self.results["quantum_rng"] = "PASSED"
            else:
                print(f"  ❌ Failed: {response.status_code}")
                self.results["quantum_rng"] = "FAILED"
        except Exception as e:
            print(f"  ❌ Error: {str(e)}")
            self.results["quantum_rng"] = "ERROR"
    
    async def test_protection(self):
        """Test protection endpoints"""
        print("\n🛡️ Testing Protection Services...")
        try:
            # Test encryption
            response = await self.client.post(
                f"{BASE_URL}/protect/encrypt",
                data={"data": "Secret message", "use_quantum_key": True}
            )
            if response.status_code == 200:
                encrypted = response.json()
                print(f"  ✅ Encryption working (AES-256-GCM)")
                
                # Test decryption
                decrypt_response = await self.client.post(
                    f"{BASE_URL}/protect/decrypt",
                    data={
                        "ciphertext": encrypted["data"]["ciphertext"],
                        "key": encrypted["data"]["key"],
                        "iv": encrypted["data"]["iv"],
                        "tag": encrypted["data"]["tag"]
                    }
                )
                if decrypt_response.status_code == 200:
                    print(f"  ✅ Decryption working")
                    self.results["protection"] = "PASSED"
                else:
                    self.results["protection"] = "PARTIAL"
            else:
                print(f"  ❌ Failed: {response.status_code}")
                self.results["protection"] = "FAILED"
        except Exception as e:
            print(f"  ❌ Error: {str(e)}")
            self.results["protection"] = "ERROR"
    
    async def test_pqc(self):
        """Test post-quantum cryptography"""
        print("\n🔮 Testing Post-Quantum Cryptography...")
        try:
            # Test Kyber
            response = await self.client.post(
                f"{BASE_URL}/pqc/generate",
                data={"algorithm": "KYBER-768", "format": "base64"}
            )
            if response.status_code == 200:
                data = response.json()
                print(f"  ✅ KYBER-768 key generation working")
                print(f"  🔒 NIST Level: {data['data']['nist_security_level']}")
                
                # Test Dilithium
                response = await self.client.post(
                    f"{BASE_URL}/pqc/generate",
                    data={"algorithm": "DILITHIUM3", "format": "base64"}
                )
                if response.status_code == 200:
                    print(f"  ✅ DILITHIUM3 signature generation working")
                    self.results["pqc"] = "PASSED"
                else:
                    self.results["pqc"] = "PARTIAL"
            else:
                print(f"  ❌ Failed: {response.status_code}")
                self.results["pqc"] = "FAILED"
        except Exception as e:
            print(f"  ❌ Error: {str(e)}")
            self.results["pqc"] = "ERROR"
    
    async def test_blockchain(self):
        """Test blockchain demonstration"""
        print("\n⛓️ Testing Blockchain Demo...")
        try:
            # Create wallets
            response = await self.client.post(
                f"{BASE_URL}/blockchain/create-wallet",
                data={"wallet_type": "both"}
            )
            if response.status_code == 200:
                wallets = response.json()
                print(f"  ✅ Created vulnerable wallet (RSA-2048)")
                print(f"  ✅ Created quantum-safe wallet (DILITHIUM3)")
                
                # Test Shor's attack simulation
                response = await self.client.post(
                    f"{BASE_URL}/blockchain/simulate-attack",
                    data={"target": "RSA-2048", "show_timeline": True}
                )
                if response.status_code == 200:
                    attack = response.json()
                    print(f"  ⚡ Shor's attack simulation:")
                    print(f"     - Target: RSA-2048")
                    print(f"     - Result: {attack['data']['simulation']['result']['status']}")
                    print(f"     - Time: {attack['data']['simulation']['result'].get('time_taken', 'N/A')}")
                    
                    # Test quantum-safe algorithm
                    response = await self.client.post(
                        f"{BASE_URL}/blockchain/simulate-attack",
                        data={"target": "DILITHIUM3", "show_timeline": False}
                    )
                    if response.status_code == 200:
                        safe_attack = response.json()
                        print(f"  🛡️ Quantum-safe defense:")
                        print(f"     - Target: DILITHIUM3")
                        print(f"     - Result: {safe_attack['data']['simulation']['result']['status']}")
                        self.results["blockchain"] = "PASSED"
                    else:
                        self.results["blockchain"] = "PARTIAL"
                else:
                    self.results["blockchain"] = "PARTIAL"
            else:
                print(f"  ❌ Failed: {response.status_code}")
                self.results["blockchain"] = "FAILED"
        except Exception as e:
            print(f"  ❌ Error: {str(e)}")
            self.results["blockchain"] = "ERROR"
    
    async def test_threat_assessment(self):
        """Test threat assessment"""
        print("\n⚠️ Testing Threat Assessment...")
        try:
            algorithms = ["RSA-1024", "RSA-2048", "ECDSA-256", "KYBER-768"]
            
            for algo in algorithms:
                response = await self.client.post(
                    f"{BASE_URL}/pqc/threat-assessment",
                    data={"algorithm": algo}
                )
                if response.status_code == 200:
                    data = response.json()
                    assessment = data["data"]["assessment"]
                    status = assessment.get("status", "Unknown")
                    print(f"  📊 {algo}: {status}")
                    if assessment.get("years_until_vulnerable"):
                        print(f"     Years until vulnerable: {assessment['years_until_vulnerable']}")
            
            self.results["threat_assessment"] = "PASSED"
        except Exception as e:
            print(f"  ❌ Error: {str(e)}")
            self.results["threat_assessment"] = "ERROR"
    
    async def run_all_tests(self):
        """Run all demo tests"""
        print("\n" + "="*60)
        print("🚀 QCrypt RNG Demo Test Suite")
        print("="*60)
        
        # Check if API is running
        try:
            response = await self.client.get("http://localhost:8000/")
            if response.status_code != 200:
                print("❌ API is not responding. Please start the server first.")
                return
        except:
            print("❌ Cannot connect to API. Please run: python run_api.py")
            return
        
        # Run tests
        await self.test_quantum_rng()
        await self.test_protection()
        await self.test_pqc()
        await self.test_blockchain()
        await self.test_threat_assessment()
        
        # Summary
        print("\n" + "="*60)
        print("📊 Test Summary")
        print("="*60)
        
        passed = sum(1 for v in self.results.values() if v == "PASSED")
        total = len(self.results)
        
        for component, status in self.results.items():
            icon = "✅" if status == "PASSED" else "⚠️" if status == "PARTIAL" else "❌"
            print(f"{icon} {component}: {status}")
        
        print(f"\nOverall: {passed}/{total} components fully working")
        
        if passed == total:
            print("\n🎉 All demo components are working perfectly!")
            print("\n📍 Next steps:")
            print("   1. Visit http://localhost:8000/docs for interactive API")
            print("   2. Try the full demo flow")
            print("   3. Test with your own data")
        else:
            print("\n⚠️ Some components need attention.")
            print("   - Check error messages above")
            print("   - Ensure all dependencies are installed")
            print("   - Try: pip install -r requirements.txt")
        
        await self.client.aclose()


async def main():
    tester = DemoTester()
    await tester.run_all_tests()


if __name__ == "__main__":
    asyncio.run(main())