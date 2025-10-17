"""
QCrypt RNG API - Blockchain Demo Endpoints
Demonstrates quantum threats and protection for blockchain
"""

from fastapi import APIRouter, HTTPException, Form
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import hashlib
import time
import json
import base64
from datetime import datetime

from app.quantum.qrng import get_quantum_rng
from app.quantum.pqc import get_pqc
from app.api.v2.models.responses import BaseResponse, ResponseStatus
from app.utils.logging import logger

router = APIRouter()


class Block:
    """Blockchain block with transaction data"""
    
    def __init__(self, index: int, transactions: List[Dict], previous_hash: str):
        self.index = index
        self.timestamp = time.time()
        self.transactions = transactions
        self.previous_hash = previous_hash
        self.nonce = 0
        self.hash = self.calculate_hash()
    
    def calculate_hash(self) -> str:
        """Calculate block hash"""
        block_string = json.dumps({
            "index": self.index,
            "timestamp": self.timestamp,
            "transactions": self.transactions,
            "previous_hash": self.previous_hash,
            "nonce": self.nonce
        }, sort_keys=True)
        return hashlib.sha256(block_string.encode()).hexdigest()
    
    def mine_block(self, difficulty: int = 4):
        """Mine block with proof of work"""
        target = "0" * difficulty
        while self.hash[:difficulty] != target:
            self.nonce += 1
            self.hash = self.calculate_hash()


class Blockchain:
    """Simple blockchain for demonstration"""
    
    def __init__(self):
        self.chain: List[Block] = []
        self.pending_transactions: List[Dict] = []
        self.wallets: Dict[str, Dict] = {}
        self.create_genesis_block()
    
    def create_genesis_block(self):
        """Create the first block"""
        genesis = Block(0, [], "0")
        genesis.hash = genesis.calculate_hash()
        self.chain.append(genesis)
    
    def get_latest_block(self) -> Block:
        """Get the most recent block"""
        return self.chain[-1]
    
    def add_transaction(self, transaction: Dict):
        """Add transaction to pending pool"""
        self.pending_transactions.append(transaction)
    
    def mine_pending_transactions(self, miner_address: str):
        """Mine a new block with pending transactions"""
        # Add mining reward
        self.pending_transactions.append({
            "from": "Network",
            "to": miner_address,
            "amount": 10,
            "type": "mining_reward"
        })
        
        block = Block(
            len(self.chain),
            self.pending_transactions,
            self.get_latest_block().hash
        )
        block.mine_block(difficulty=2)  # Simple difficulty for demo
        
        self.chain.append(block)
        self.pending_transactions = []


# Global blockchain instances for demo
vulnerable_blockchain = Blockchain()
quantum_safe_blockchain = Blockchain()


@router.post("/create-wallet", response_model=BaseResponse)
async def create_wallet(
    wallet_type: str = Form("both", description="vulnerable, quantum-safe, or both")
):
    """
    Create blockchain wallet with both vulnerable and quantum-safe keys
    
    Demonstrates the difference between:
    - Current wallets (RSA/ECDSA) - vulnerable to Shor's algorithm
    - Quantum-safe wallets (Dilithium) - resistant to quantum attacks
    """
    try:
        qrng = get_quantum_rng()
        pqc = get_pqc()
        
        wallets = {}
        
        # Generate vulnerable wallet (current standard)
        if wallet_type in ["vulnerable", "both"]:
            # Generate RSA key pair (like current Bitcoin/Ethereum)
            rsa_key = await qrng.generate_key(2048, "RSA")
            
            # Create wallet address (simplified)
            address_hash = hashlib.sha256(str(rsa_key.data).encode()).hexdigest()[:40]
            vulnerable_address = f"0x{address_hash}"
            
            wallets["vulnerable"] = {
                "address": vulnerable_address,
                "public_key": str(rsa_key.data.get("key", ""))[:64] + "...",
                "algorithm": "RSA-2048",
                "quantum_resistant": False,
                "vulnerability": {
                    "shor_algorithm": "VULNERABLE",
                    "time_to_break": "8 hours with 4096 qubits",
                    "risk_level": "CRITICAL",
                    "bitcoin_impact": "$1.3 trillion at risk"
                }
            }
            
            # Store in vulnerable blockchain
            vulnerable_blockchain.wallets[vulnerable_address] = wallets["vulnerable"]
        
        # Generate quantum-safe wallet
        if wallet_type in ["quantum-safe", "both"]:
            # Generate Dilithium key pair (quantum-safe)
            dilithium_key = await pqc.generate_dilithium_keypair("DILITHIUM3")
            
            # Create quantum-safe address
            address_hash = hashlib.sha3_256(dilithium_key.public_key).hexdigest()[:40]
            quantum_address = f"qs_{address_hash}"
            
            wallets["quantum_safe"] = {
                "address": quantum_address,
                "public_key": base64.b64encode(dilithium_key.public_key[:64]).decode() + "...",
                "algorithm": "DILITHIUM3",
                "quantum_resistant": True,
                "security": {
                    "shor_algorithm": "IMMUNE",
                    "time_to_break": "Computationally infeasible",
                    "risk_level": "SECURE",
                    "nist_level": dilithium_key.nist_level
                }
            }
            
            # Store in quantum-safe blockchain
            quantum_safe_blockchain.wallets[quantum_address] = wallets["quantum_safe"]
        
        return BaseResponse(
            status=ResponseStatus.SUCCESS,
            request_id=f"wallet_{int(time.time()*1000000)}",
            data=wallets,
            metadata={
                "comparison": {
                    "vulnerable": "Can be broken by quantum computers",
                    "quantum_safe": "Resistant to all known quantum attacks"
                }
            }
        )
    except Exception as e:
        logger.error(f"Wallet creation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sign-transaction", response_model=BaseResponse)
async def sign_transaction(
    from_address: str = Form(...),
    to_address: str = Form(...),
    amount: float = Form(...),
    signature_type: str = Form("both", description="vulnerable, quantum-safe, or both")
):
    """
    Sign a blockchain transaction with both vulnerable and quantum-safe signatures
    
    Shows how:
    - Current signatures (ECDSA) can be forged after quantum attack
    - Quantum-safe signatures (Dilithium) remain secure
    """
    try:
        qrng = get_quantum_rng()
        pqc = get_pqc()
        
        # Create transaction
        transaction = {
            "from": from_address,
            "to": to_address,
            "amount": amount,
            "timestamp": time.time(),
            "nonce": await qrng.generate_bytes(16, 8, "hex")
        }
        
        # Serialize transaction for signing
        tx_bytes = json.dumps(transaction, sort_keys=True).encode()
        
        signatures = {}
        
        # Vulnerable signature (ECDSA - current standard)
        if signature_type in ["vulnerable", "both"]:
            # Simulate ECDSA signature (simplified)
            ecdsa_key = await qrng.generate_key(256, "ECDSA")
            ecdsa_sig = hashlib.sha256(tx_bytes + str(ecdsa_key.data).encode()).hexdigest()
            
            signatures["vulnerable"] = {
                "signature": ecdsa_sig,
                "algorithm": "ECDSA-256",
                "quantum_safe": False,
                "vulnerability": {
                    "status": "Can be forged after private key extraction",
                    "attack_time": "8 hours with quantum computer",
                    "consequence": "Attacker can steal all funds"
                }
            }
            
            # Add to vulnerable blockchain
            vulnerable_blockchain.add_transaction({
                **transaction,
                "signature": ecdsa_sig,
                "algorithm": "ECDSA-256"
            })
        
        # Quantum-safe signature (Dilithium)
        if signature_type in ["quantum-safe", "both"]:
            # Generate Dilithium signature
            dilithium_key = await pqc.generate_dilithium_keypair("DILITHIUM3")
            dilithium_sig = await pqc.sign_message(tx_bytes, dilithium_key.private_key, "DILITHIUM3")
            
            signatures["quantum_safe"] = {
                "signature": base64.b64encode(dilithium_sig[:128]).decode() + "...",
                "algorithm": "DILITHIUM3",
                "quantum_safe": True,
                "security": {
                    "status": "Cannot be forged even with quantum computer",
                    "protection": "Based on lattice problems unsolvable by Shor's algorithm",
                    "future_proof": "Secure for 30+ years"
                }
            }
            
            # Add to quantum-safe blockchain
            quantum_safe_blockchain.add_transaction({
                **transaction,
                "signature": base64.b64encode(dilithium_sig[:64]).decode(),
                "algorithm": "DILITHIUM3"
            })
        
        return BaseResponse(
            status=ResponseStatus.SUCCESS,
            request_id=f"tx_{int(time.time()*1000000)}",
            data={
                "transaction": transaction,
                "signatures": signatures
            },
            metadata={
                "demonstration": "Shows how quantum-safe signatures protect blockchain"
            }
        )
    except Exception as e:
        logger.error(f"Transaction signing error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/simulate-attack", response_model=BaseResponse)
async def simulate_shor_attack(
    target: str = Form("RSA-2048", description="Algorithm to attack"),
    show_timeline: bool = Form(True)
):
    """
    Simulate Shor's algorithm quantum attack on blockchain
    
    Demonstrates:
    1. How quantum computers break RSA/ECDSA
    2. Timeline of the attack
    3. Why post-quantum algorithms survive
    """
    try:
        pqc = get_pqc()
        
        # Get threat assessment
        threat = pqc.assess_quantum_threat(target)
        
        attack_simulation = {
            "target_algorithm": target,
            "attack_phases": [],
            "result": {}
        }
        
        # Simulate attack phases
        if "RSA" in target or "ECDSA" in target:
            # Vulnerable algorithm - attack succeeds
            attack_simulation["attack_phases"] = [
                {
                    "phase": 1,
                    "name": "Quantum Superposition",
                    "description": "Create superposition of all possible factors",
                    "time": "1 microsecond",
                    "qubits_used": threat.get("qubits_to_break", 4096)
                },
                {
                    "phase": 2,
                    "name": "Quantum Fourier Transform",
                    "description": "Apply QFT to find period",
                    "time": "100 microseconds",
                    "quantum_gates": "~1 million"
                },
                {
                    "phase": 3,
                    "name": "Period Finding",
                    "description": "Extract period using quantum measurement",
                    "time": "1 millisecond",
                    "success_probability": "75%"
                },
                {
                    "phase": 4,
                    "name": "Classical Post-Processing",
                    "description": "Use period to factor N = p × q",
                    "time": "1 second",
                    "result": "PRIVATE KEY EXTRACTED"
                }
            ]
            
            attack_simulation["result"] = {
                "status": "ATTACK SUCCESSFUL",
                "private_key_extracted": True,
                "time_taken": threat.get("time_to_break", "8 hours"),
                "impact": {
                    "blockchain": "All funds can be stolen",
                    "signatures": "Can forge any transaction",
                    "identity": "Complete impersonation possible"
                },
                "real_world_example": {
                    "bitcoin": "1.3 trillion USD at risk",
                    "ethereum": "500 billion USD at risk",
                    "traditional_banking": "All online banking compromised"
                }
            }
            
        elif any(pqc_algo in target for pqc_algo in ["KYBER", "DILITHIUM", "FALCON"]):
            # Quantum-safe algorithm - attack fails
            attack_simulation["attack_phases"] = [
                {
                    "phase": 1,
                    "name": "Attempted Quantum Attack",
                    "description": "Try to apply Shor's algorithm",
                    "time": "N/A",
                    "result": "ALGORITHM NOT APPLICABLE"
                },
                {
                    "phase": 2,
                    "name": "Alternative Attack Attempts",
                    "description": "Try Grover's algorithm",
                    "time": "2^128 operations still required",
                    "result": "COMPUTATIONALLY INFEASIBLE"
                }
            ]
            
            attack_simulation["result"] = {
                "status": "ATTACK FAILED",
                "private_key_extracted": False,
                "reason": "Lattice problems not solvable by Shor's algorithm",
                "security": {
                    "current": "Secure against classical computers",
                    "future": "Secure against quantum computers",
                    "time_to_break": "Billions of years even with quantum computer"
                }
            }
        
        # Timeline projection
        timeline = {}
        if show_timeline:
            timeline = {
                "2024": "Current - RSA/ECDSA widely used",
                "2025": "IBM announces 1000+ qubit quantum computer",
                "2027": "First RSA-1024 key potentially broken",
                "2030": "RSA-2048 vulnerable (4096 logical qubits available)",
                "2035": "All classical crypto broken",
                "2040": "Only quantum-safe algorithms survive"
            }
        
        return BaseResponse(
            status=ResponseStatus.SUCCESS,
            request_id=f"attack_{int(time.time()*1000000)}",
            data={
                "simulation": attack_simulation,
                "threat_assessment": threat,
                "timeline": timeline,
                "protection": {
                    "immediate_action": "Migrate to quantum-safe algorithms",
                    "recommended": "DILITHIUM for signatures, KYBER for encryption",
                    "hybrid_approach": "Use both classical and PQC during transition"
                }
            }
        )
    except Exception as e:
        logger.error(f"Attack simulation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/verify-quantum-safe", response_model=BaseResponse)
async def verify_quantum_safe(
    message: str = Form(...),
    signature: str = Form(...),
    public_key: str = Form(...),
    algorithm: str = Form("DILITHIUM3")
):
    """
    Verify a quantum-safe signature
    
    Demonstrates that quantum-safe signatures:
    - Cannot be forged even with quantum computers
    - Provide long-term security
    - Work efficiently on classical hardware
    """
    try:
        pqc = get_pqc()
        
        # Decode inputs
        message_bytes = message.encode()
        signature_bytes = base64.b64decode(signature)
        public_key_bytes = base64.b64decode(public_key)
        
        # Verify signature
        is_valid = await pqc.verify_signature(
            message_bytes,
            signature_bytes,
            public_key_bytes,
            algorithm
        )
        
        return BaseResponse(
            status=ResponseStatus.SUCCESS,
            request_id=f"verify_{int(time.time()*1000000)}",
            data={
                "valid": is_valid,
                "algorithm": algorithm,
                "quantum_safe": True,
                "security_properties": {
                    "unforgeable": "Even with quantum computer",
                    "binding": "Signature uniquely tied to message",
                    "non_repudiation": "Signer cannot deny signing",
                    "future_proof": "Secure for 30+ years"
                }
            }
        )
    except Exception as e:
        logger.error(f"Verification error: {str(e)}")
        raise HTTPException(status_code=400, detail="Verification failed")


@router.get("/compare-blockchains")
async def compare_blockchains():
    """
    Compare vulnerable vs quantum-safe blockchain
    
    Shows side-by-side comparison of:
    - Security levels
    - Attack resistance
    - Performance metrics
    - Migration urgency
    """
    try:
        vulnerable_stats = {
            "chain_length": len(vulnerable_blockchain.chain),
            "pending_transactions": len(vulnerable_blockchain.pending_transactions),
            "total_wallets": len(vulnerable_blockchain.wallets),
            "signature_algorithm": "ECDSA-256",
            "quantum_resistant": False,
            "vulnerability": {
                "shor_attack": "VULNERABLE",
                "time_to_break": "8 hours",
                "qubits_needed": 2330,
                "risk_level": "CRITICAL"
            },
            "market_impact": {
                "bitcoin": "$1.3 trillion at risk",
                "ethereum": "$500 billion at risk",
                "defi": "$100 billion at risk"
            }
        }
        
        quantum_safe_stats = {
            "chain_length": len(quantum_safe_blockchain.chain),
            "pending_transactions": len(quantum_safe_blockchain.pending_transactions),
            "total_wallets": len(quantum_safe_blockchain.wallets),
            "signature_algorithm": "DILITHIUM3",
            "quantum_resistant": True,
            "security": {
                "shor_attack": "IMMUNE",
                "time_to_break": "Computationally infeasible",
                "protection_level": "NIST Level 3",
                "future_proof_years": 30
            },
            "advantages": {
                "long_term_security": "Protected for decades",
                "regulatory_compliance": "Meets future standards",
                "investor_confidence": "Quantum-proof assets"
            }
        }
        
        return {
            "vulnerable_blockchain": vulnerable_stats,
            "quantum_safe_blockchain": quantum_safe_stats,
            "recommendation": {
                "urgency": "HIGH",
                "action": "Begin migration to quantum-safe signatures immediately",
                "timeline": {
                    "2024": "Start pilot programs",
                    "2025": "Deploy hybrid mode",
                    "2026": "50% quantum-safe",
                    "2027": "Full quantum resistance"
                }
            },
            "demo_message": "This demonstrates why blockchain needs quantum-safe cryptography NOW"
        }
    except Exception as e:
        logger.error(f"Comparison error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/mine-block")
async def mine_block(
    blockchain_type: str = Form("both", description="vulnerable, quantum-safe, or both"),
    miner_address: str = Form("miner_001")
):
    """
    Mine a new block on the blockchain
    
    Demonstrates blockchain operation with different signature types
    """
    try:
        results = {}
        
        if blockchain_type in ["vulnerable", "both"]:
            # Mine on vulnerable blockchain
            start_time = time.time()
            vulnerable_blockchain.mine_pending_transactions(miner_address)
            mining_time = (time.time() - start_time) * 1000
            
            latest_block = vulnerable_blockchain.get_latest_block()
            results["vulnerable"] = {
                "block_index": latest_block.index,
                "block_hash": latest_block.hash,
                "transactions": len(latest_block.transactions),
                "mining_time_ms": mining_time,
                "signature_type": "ECDSA-256",
                "quantum_vulnerable": True
            }
        
        if blockchain_type in ["quantum-safe", "both"]:
            # Mine on quantum-safe blockchain
            start_time = time.time()
            quantum_safe_blockchain.mine_pending_transactions(f"qs_{miner_address}")
            mining_time = (time.time() - start_time) * 1000
            
            latest_block = quantum_safe_blockchain.get_latest_block()
            results["quantum_safe"] = {
                "block_index": latest_block.index,
                "block_hash": latest_block.hash,
                "transactions": len(latest_block.transactions),
                "mining_time_ms": mining_time,
                "signature_type": "DILITHIUM3",
                "quantum_resistant": True
            }
        
        return BaseResponse(
            status=ResponseStatus.SUCCESS,
            request_id=f"mine_{int(time.time()*1000000)}",
            data=results,
            metadata={
                "demonstration": "Shows both vulnerable and quantum-safe blockchain mining"
            }
        )
    except Exception as e:
        logger.error(f"Mining error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))