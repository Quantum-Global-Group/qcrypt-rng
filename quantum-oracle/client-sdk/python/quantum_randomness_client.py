"""
Quantum Randomness Oracle - Python Client SDK
"""

import asyncio
import json
from typing import Optional, Dict, Any
from dataclasses import dataclass
from web3 import Web3


@dataclass
class RandomnessRequest:
    """Represents a randomness request"""
    request_id: int
    requester: str
    fee_paid: int
    block_number: int
    timestamp: float
    fulfilled: bool = False
    randomness: Optional[int] = None


class QuantumRandomnessClient:
    """Python client for interacting with the Quantum Randomness Oracle"""
    
    def __init__(self, rpc_url: str, contract_address: str, private_key: Optional[str] = None):
        self.web3 = Web3(Web3.HTTPProvider(rpc_url))
        self.contract_address = contract_address
        self.private_key = private_key
        
        # Setup contract
        self.contract = self._setup_contract()
        
        if private_key:
            self.account = self.web3.eth.account.from_key(private_key)
        else:
            self.account = None
    
    def _setup_contract(self):
        """Setup the smart contract instance with a minimal ABI"""
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
                "inputs": [],
                "name": "requestRandomness",
                "outputs": [{"name": "requestId", "type": "uint256"}],
                "stateMutability": "payable",
                "type": "function"
            },
            {
                "inputs": [{"name": "requestId", "type": "uint256"}],
                "name": "getRequest",
                "outputs": [
                    {"name": "requester", "type": "address"},
                    {"name": "fee", "type": "uint256"},
                    {"name": "commitment", "type": "bytes32"},
                    {"name": "blockNumber", "type": "uint256"},
                    {"name": "fulfilled", "type": "bool"},
                    {"name": "randomness", "type": "uint256"},
                    {"name": "timestamp", "type": "uint256"}
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [{"name": "requestId", "type": "uint256"}],
                "name": "isRequestFulfilled",
                "outputs": [{"name": "", "type": "bool"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "fee",
                "outputs": [{"name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            }
        ]
        
        return self.web3.eth.contract(
            address=self.contract_address,
            abi=contract_abi
        )
    
    def get_request_fee(self) -> int:
        """Get the current fee for requesting randomness"""
        return self.contract.functions.fee().call()
    
    def request_randomness_sync(self, value: Optional[int] = None) -> int:
        """Synchronously request randomness from the oracle"""
        if not self.account:
            raise ValueError("Private key required for sending transactions")
        
        fee = self.get_request_fee()
        value = value or fee
        
        # Build transaction
        transaction = self.contract.functions.requestRandomness().build_transaction({
            'from': self.account.address,
            'value': value,
            'nonce': self.web3.eth.get_transaction_count(self.account.address),
            'gasPrice': self.web3.eth.gas_price
        })
        
        # Sign and send transaction
        signed_txn = self.web3.eth.account.sign_transaction(transaction, self.private_key)
        tx_hash = self.web3.eth.send_raw_transaction(signed_txn.rawTransaction)
        
        # Wait for transaction receipt
        receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash)
        
        if receipt.status != 1:
            raise Exception("Transaction failed")
        
        # Parse the requestId from logs
        for log in receipt.logs:
            # This is a simplified parsing - in real implementation, 
            # you'd decode the event properly
            pass
        
        # For now, return a dummy request ID (in real implementation, parse from event logs)
        return 0  # This should be parsed from the event logs
    
    async def request_randomness(self, value: Optional[int] = None) -> int:
        """Request randomness from the oracle"""
        return self.request_randomness_sync(value)
    
    def get_request_status_sync(self, request_id: int) -> Dict[str, Any]:
        """Get the status of a randomness request"""
        request_data = self.contract.functions.getRequest(request_id).call()
        
        return {
            'request_id': request_id,
            'requester': request_data[0],
            'fee_paid': request_data[1],
            'commitment': request_data[2],
            'block_number': request_data[3],
            'fulfilled': request_data[4],
            'randomness': request_data[5] if request_data[4] else None,
            'timestamp': request_data[6]
        }
    
    async def get_request_status(self, request_id: int) -> Dict[str, Any]:
        """Get the status of a randomness request"""
        return self.get_request_status_sync(request_id)
    
    def is_request_fulfilled_sync(self, request_id: int) -> bool:
        """Check if a request is fulfilled"""
        return self.contract.functions.isRequestFulfilled(request_id).call()
    
    async def is_request_fulfilled(self, request_id: int) -> bool:
        """Check if a request is fulfilled"""
        return self.is_request_fulfilled_sync(request_id)
    
    async def wait_for_fulfillment(self, request_id: int, timeout: int = 300) -> Dict[str, Any]:
        """Wait for a request to be fulfilled"""
        import time
        
        start_time = time.time()
        while time.time() - start_time < timeout:
            status = await self.get_request_status(request_id)
            if status['fulfilled']:
                return status
            await asyncio.sleep(5)  # Poll every 5 seconds
        
        raise TimeoutError(f"Request {request_id} not fulfilled within {timeout} seconds")


# Example usage
async def main():
    """Example usage of the Quantum Randomness Client"""
    print("Quantum Randomness Oracle Client Demo")
    print("=" * 40)
    
    # Initialize client (using a test RPC URL and contract address)
    client = QuantumRandomnessClient(
        rpc_url="http://localhost:8545",  # Replace with actual RPC URL
        contract_address="0x0000000000000000000000000000000000000000",  # Replace with actual address
        private_key="0x0000000000000000000000000000000000000000000000000000000000000000"  # Replace with actual private key
    )
    
    try:
        # Get the current request fee
        fee = client.get_request_fee()
        print(f"Current request fee: {client.web3.fromWei(fee, 'ether')} ETH")
        
        # Request randomness (this would require a real contract and funds)
        # request_id = await client.request_randomness()
        # print(f"Requested randomness with ID: {request_id}")
        
        # Check status of a request (replace with actual request ID)
        # status = await client.get_request_status(request_id)
        # print(f"Request status: {status}")
        
        print("Client initialized successfully!")
        
    except Exception as e:
        print(f"Demo error (expected without real contract): {e}")


if __name__ == "__main__":
    asyncio.run(main())