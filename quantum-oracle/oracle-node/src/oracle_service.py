"""
Quantum Randomness Oracle Node
Main implementation of the quantum randomness oracle service
"""

import asyncio
import json
import logging
import time
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, asdict
from web3 import Web3
from web3.middleware import geth_poa_middleware
import eth_account
from eth_account.messages import encode_defunct
import hashlib
import os

from app.quantum.qrng import get_quantum_rng
from app.quantum.hardware_interface import get_quantum_hardware_manager
from app.quantum.commitment import compute_commitment, compute_commitment_hex


@dataclass
class RandomnessRequest:
    """Represents a randomness request from blockchain"""
    request_id: int
    requester: str
    fee_paid: int
    block_number: int
    timestamp: float
    fulfilled: bool = False
    committed: bool = False
    commit_block: int = 0
    randomness: Optional[int] = None
    randomness_bytes: Optional[bytes] = None
    commitment: Optional[str] = None


class QuantumRandomnessOracleNode:
    """Quantum-powered randomness oracle node for blockchain networks"""
    
    def __init__(self, config_path: str = None):
        # Load configuration
        self.config = self._load_config(config_path)
        
        # Initialize blockchain connection
        self.web3 = Web3(Web3.HTTPProvider(self.config['blockchain_rpc_url']))
        if self.config.get('is_poa_network', False):
            self.web3.middleware_onion.inject(geth_poa_middleware, layer=0)
        
        # Initialize account
        self.account = eth_account.Account.from_key(self.config['private_key'])
        
        # Initialize quantum components
        self.qrng = get_quantum_rng()
        self.hw_manager = get_quantum_hardware_manager()
        
        # Contract setup
        self.oracle_contract = self._setup_contract()
        
        # Active requests tracking
        self.pending_requests: Dict[int, RandomnessRequest] = {}
        self.fulfilled_requests: Dict[int, RandomnessRequest] = {}
        
        # Oracle configuration
        self.fulfillment_gas_limit = self.config.get('fulfillment_gas_limit', 200000)
        self.commit_reveal_delay = self.config.get('commit_reveal_delay', 2)
        self.polling_interval = self.config.get('polling_interval', 15)  # seconds
        
        # Setup logging
        self.logger = self._setup_logging()
        
    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """Load configuration from file or environment"""
        if config_path and os.path.exists(config_path):
            with open(config_path, 'r') as f:
                config = json.load(f)
        else:
            # Load from environment variables
            config = {
                'blockchain_rpc_url': os.getenv('BLOCKCHAIN_RPC_URL', 'http://localhost:8545'),
                'contract_address': os.getenv('ORACLE_CONTRACT_ADDRESS'),
                'private_key': os.getenv('ORACLE_PRIVATE_KEY'),
                'is_poa_network': os.getenv('IS_POA_NETWORK', 'false').lower() == 'true',
                'fulfillment_gas_limit': int(os.getenv('FULFILLMENT_GAS_LIMIT', '200000')),
                'commit_reveal_delay': int(os.getenv('COMMIT_REVEAL_DELAY', '2')),
                'polling_interval': int(os.getenv('POLLING_INTERVAL', '15')),
                'quantum_backend': os.getenv('QUANTUM_BACKEND', 'qrisp_simulator')
            }
        
        # Validate required config
        required_keys = ['blockchain_rpc_url', 'contract_address', 'private_key']
        for key in required_keys:
            if not config.get(key):
                raise ValueError(f"Missing required config: {key}")
                
        return config
    
    def _setup_contract(self):
        """Setup the smart contract instance"""
        contract_abi = [
            {
                "inputs": [
                    {"name": "_fee", "type": "uint256"},
                    {"name": "_oracleNode", "type": "address"}
                ],
                "stateMutability": "nonpayable",
                "type": "constructor"
            },
            {
                "anonymous": False,
                "inputs": [
                    {"indexed": True, "name": "requestId", "type": "uint256"},
                    {"indexed": True, "name": "requester", "type": "address"},
                    {"indexed": False, "name": "feePaid", "type": "uint256"}
                ],
                "name": "RandomnessRequested",
                "type": "event"
            },
            {
                "anonymous": False,
                "inputs": [
                    {"indexed": True, "name": "requestId", "type": "uint256"},
                    {"indexed": False, "name": "commitment", "type": "bytes32"}
                ],
                "name": "CommitmentSubmitted",
                "type": "event"
            },
            {
                "anonymous": False,
                "inputs": [
                    {"indexed": True, "name": "requestId", "type": "uint256"},
                    {"indexed": False, "name": "randomness", "type": "uint256"},
                    {"indexed": False, "name": "entropyBits", "type": "uint256"}
                ],
                "name": "RandomnessFulfilled",
                "type": "event"
            },
            {
                "inputs": [],
                "name": "requestRandomness",
                "outputs": [{"name": "requestId", "type": "uint256"}],
                "stateMutability": "payable",
                "type": "function"
            },
            {
                "inputs": [
                    {"name": "requestId", "type": "uint256"},
                    {"name": "commitment", "type": "bytes32"}
                ],
                "name": "submitCommitment",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [
                    {"name": "requestId", "type": "uint256"},
                    {"name": "randomness", "type": "uint256"}
                ],
                "name": "fulfillRandomness",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ]
        
        return self.web3.eth.contract(
            address=self.config['contract_address'],
            abi=contract_abi
        )
    
    def _setup_logging(self):
        """Setup logging configuration"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        return logging.getLogger(__name__)
    
    async def start_service(self):
        """Start the oracle service to listen for requests and provide randomness"""
        self.logger.info("Starting Quantum Randomness Oracle Service...")
        self.logger.info(f"Connected to blockchain: {self.config['blockchain_rpc_url']}")
        self.logger.info(f"Contract address: {self.config['contract_address']}")
        self.logger.info(f"Oracle node address: {self.account.address}")
        
        while True:
            try:
                # Check for new requests
                await self.process_new_requests()
                
                # Fulfill eligible requests
                await self.fulfill_requests()
                
                # Wait before next cycle
                await asyncio.sleep(self.polling_interval)
                
            except Exception as e:
                self.logger.error(f"Oracle service error: {e}", exc_info=True)
                await asyncio.sleep(30)  # Wait longer on error
    
    async def process_new_requests(self):
        """Monitor blockchain for new randomness requests"""
        try:
            # Get the latest block number
            latest_block = self.web3.eth.block_number
            self.logger.info(f"Checking for new requests up to block {latest_block}")
            
            # Create filter for RandomnessRequested events
            event_filter = self.oracle_contract.events.RandomnessRequested.create_filter(
                fromBlock=latest_block - 10  # Look back 10 blocks
            )
            
            # Get new events
            events = event_filter.get_new_entries()
            
            for event in events:
                request_id = event['args']['requestId']
                requester = event['args']['requester']
                fee_paid = event['args']['feePaid']
                
                # Create request object
                request = RandomnessRequest(
                    request_id=request_id,
                    requester=requester,
                    fee_paid=fee_paid,
                    block_number=event['blockNumber'],
                    timestamp=time.time()
                )
                
                # Add to pending requests
                self.pending_requests[request_id] = request
                self.logger.info(f"New randomness request detected: {request_id} from {requester}")
            
            # Remove old filter to prevent memory leaks
            event_filter.stop_thread()
            
        except Exception as e:
            self.logger.error(f"Error processing new requests: {e}", exc_info=True)
    
    async def fulfill_requests(self):
        """Two-phase commit-reveal: commit then reveal quantum randomness."""
        current_block = self.web3.eth.block_number

        for req_id, request in list(self.pending_requests.items()):
            try:
                if request.fulfilled:
                    continue

                # Phase 1 -- generate randomness and submit commitment
                if not request.committed:
                    self.logger.info(f"Generating quantum randomness for request {req_id}")
                    quantum_result = await self.qrng.generate_bytes(32, 16, "raw")
                    randomness_bytes = quantum_result.data
                    randomness_int = int.from_bytes(randomness_bytes, "big")
                    commitment_hex = compute_commitment_hex(randomness_bytes)

                    success = await self._submit_commitment(req_id, commitment_hex)
                    if success:
                        request.committed = True
                        request.commit_block = current_block
                        request.randomness = randomness_int
                        request.randomness_bytes = randomness_bytes
                        request.commitment = commitment_hex
                        self.logger.info(f"Commitment submitted for request {req_id}")
                    else:
                        self.logger.warning(f"Commitment submission failed for request {req_id}, will retry")
                    continue

                # Phase 2 -- reveal after COMMIT_REVEAL_DELAY blocks
                if current_block < request.commit_block + self.commit_reveal_delay:
                    continue

                success = await self._reveal_randomness(req_id, request.randomness)
                if success:
                    request.fulfilled = True
                    self.fulfilled_requests[req_id] = self.pending_requests.pop(req_id)
                    self.logger.info(f"Successfully fulfilled request {req_id}")
                else:
                    self.logger.warning(f"Reveal failed for request {req_id}, will retry")

            except Exception as e:
                self.logger.error(f"Error fulfilling request {req_id}: {e}", exc_info=True)

    # ------------------------------------------------------------------
    # Blockchain transaction helpers
    # ------------------------------------------------------------------

    async def _send_contract_tx(self, contract_fn) -> bool:
        """Build, sign, send a contract call and return success."""
        try:
            nonce = self.web3.eth.get_transaction_count(self.account.address)

            try:
                gas_estimate = contract_fn.estimate_gas({"from": self.account.address})
            except Exception as e:
                self.logger.error(f"Gas estimation failed: {e}")
                gas_estimate = self.fulfillment_gas_limit

            gas_limit = min(int(gas_estimate * 1.2), self.fulfillment_gas_limit)

            transaction = contract_fn.build_transaction({
                "from": self.account.address,
                "nonce": nonce,
                "gas": gas_limit,
                "gasPrice": self.web3.eth.gas_price,
            })

            signed_txn = self.web3.eth.account.sign_transaction(
                transaction, self.config["private_key"]
            )
            tx_hash = self.web3.eth.send_raw_transaction(signed_txn.rawTransaction)
            receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash)

            if receipt.status == 1:
                self.logger.info(f"TX success: {tx_hash.hex()}")
                return True
            else:
                self.logger.error(f"TX reverted: {tx_hash.hex()}")
                return False
        except Exception as e:
            self.logger.error(f"TX error: {e}", exc_info=True)
            return False

    async def _submit_commitment(self, request_id: int, commitment_hex: str) -> bool:
        """Phase 1: submit keccak256 commitment on-chain."""
        fn = self.oracle_contract.functions.submitCommitment(
            request_id,
            bytes.fromhex(commitment_hex[2:]),  # strip 0x prefix
        )
        return await self._send_contract_tx(fn)

    async def _reveal_randomness(self, request_id: int, randomness: int) -> bool:
        """Phase 2: reveal the randomness preimage on-chain."""
        fn = self.oracle_contract.functions.fulfillRandomness(
            request_id,
            randomness,
        )
        return await self._send_contract_tx(fn)
    
    async def get_quantum_randomness(self, num_bytes: int = 32) -> bytes:
        """Generate quantum randomness using quantum hardware"""
        quantum_result = await self.qrng.generate_bytes(num_bytes, 16, "raw")
        return quantum_result.data
    
    async def benchmark_performance(self) -> Dict[str, Any]:
        """Benchmark quantum randomness generation performance"""
        start_time = time.time()
        
        # Generate 100 samples of 32-byte randomness
        tasks = [self.qrng.generate_bytes(32, 16, "raw") for _ in range(100)]
        results = await asyncio.gather(*tasks)
        
        end_time = time.time()
        total_time = end_time - start_time
        throughput = len(results) / total_time
        
        # Calculate entropy quality
        total_entropy_bits = sum(r.entropy_bits for r in results)
        avg_entropy_bits = total_entropy_bits / len(results)
        
        return {
            "samples_generated": len(results),
            "total_time_seconds": round(total_time, 3),
            "throughput_samples_per_second": round(throughput, 2),
            "average_entropy_bits_per_sample": avg_entropy_bits,
            "total_entropy_bits_generated": total_entropy_bits,
            "generation_time_per_sample_ms": round((total_time / len(results)) * 1000, 2)
        }
    
    def get_stats(self) -> Dict[str, Any]:
        """Get current oracle statistics"""
        return {
            "pending_requests": len(self.pending_requests),
            "fulfilled_requests": len(self.fulfilled_requests),
            "total_processed": len(self.fulfilled_requests),
            "contract_balance": str(self.web3.eth.get_balance(self.config['contract_address'])),
            "current_block": self.web3.eth.block_number,
            "oracle_address": self.account.address
        }


# Example usage and testing
async def main():
    """Example usage of the Quantum Randomness Oracle"""
    print("Quantum Randomness Oracle Node Demo")
    print("=" * 50)
    
    # Create a minimal config for demo purposes
    # In real usage, this would come from a config file or environment
    config = {
        'blockchain_rpc_url': 'http://localhost:8545',  # This would be a real RPC URL
        'contract_address': '0x0000000000000000000000000000000000000000',  # Real contract address
        'private_key': '0x0000000000000000000000000000000000000000000000000000000000000000',  # Real private key
        'is_poa_network': False,
        'fulfillment_gas_limit': 200000,
        'commit_reveal_delay': 2,
        'polling_interval': 15
    }
    
    # Save config for demo
    with open('/tmp/oracle_demo_config.json', 'w') as f:
        json.dump(config, f)
    
    try:
        # Initialize oracle
        oracle = QuantumRandomnessOracleNode('/tmp/oracle_demo_config.json')
        
        # Benchmark performance
        print("\nBenchmarking Quantum Randomness Generation...")
        benchmark = await oracle.benchmark_performance()
        
        print(f"Samples generated: {benchmark['samples_generated']}")
        print(f"Total time: {benchmark['total_time_seconds']}s")
        print(f"Throughput: {benchmark['throughput_samples_per_second']} samples/sec")
        print(f"Avg entropy: {benchmark['average_entropy_bits_per_sample']} bits/sample")
        print(f"Generation time: {benchmark['generation_time_per_sample_ms']} ms/sample")
        
        # Generate sample randomness
        print("\nGenerating sample quantum randomness...")
        randomness = await oracle.get_quantum_randomness(32)
        print(f"Quantum randomness (32 bytes): 0x{randomness.hex()}")
        
        # Show stats
        stats = oracle.get_stats()
        print(f"\nOracle Stats: {stats}")
        
    except Exception as e:
        print(f"Demo error (expected in test environment): {e}")
        print("This is expected since we don't have a real blockchain connection")


if __name__ == "__main__":
    asyncio.run(main())