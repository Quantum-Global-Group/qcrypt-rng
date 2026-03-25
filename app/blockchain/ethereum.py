"""
QCrypt RNG - Ethereum Chain Adapter

Provides Ethereum mainnet and testnet support for oracle fulfillment.
"""

from typing import Optional, Dict, Any
import asyncio
import time

try:
    from web3 import Web3
    from eth_account import Account
    WEB3_AVAILABLE = True
except ImportError:
    Web3 = None
    Account = None
    WEB3_AVAILABLE = False

from .base import ChainAdapter, ChainConfig, TransactionStatus, TransactionReceipt


class EthereumAdapter(ChainAdapter):
    """Ethereum chain adapter"""

    # Oracle contract ABI (minimal for commit/reveal)
    ORACLE_ABI = [
        {
            "inputs": [
                {"name": "requestId", "type": "bytes32"},
                {"name": "commitment", "type": "bytes32"}
            ],
            "name": "commit",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {"name": "requestId", "type": "bytes32"},
                {"name": "randomness", "type": "uint256"}
            ],
            "name": "reveal",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {"name": "requestId", "type": "bytes32"}
            ],
            "name": "getRequestStatus",
            "outputs": [
                {"name": "committed", "type": "bool"},
                {"name": "revealed", "type": "bool"},
                {"name": "commitment", "type": "bytes32"}
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ]

    def _init_web3(self):
        """Initialize Web3 connection"""
        if not WEB3_AVAILABLE:
            raise ImportError("web3.py not installed. Install with: pip install web3")

        w3 = Web3(Web3.HTTPProvider(self.config.rpc_url))

        # Enable ENS
        w3.ens = None  # Will be auto-initialized in web3.py

        return w3

    def _init_account(self):
        """Initialize account from private key"""
        if not self.config.private_key:
            raise ValueError("Private key not configured")

        account = Account.from_key(self.config.private_key)
        return account

    async def get_gas_price(self) -> int:
        """Get current gas price in wei"""
        if not WEB3_AVAILABLE:
            # Return simulated gas price
            return 20_000_000_000  # 20 gwei

        gas_price = self.web3.eth.gas_price
        return gas_price

    async def estimate_gas(self, to_address: str, data: str, value: int = 0) -> int:
        """Estimate gas for a transaction"""
        if not WEB3_AVAILABLE:
            return 21000  # Base transaction gas

        try:
            gas_estimate = self.web3.eth.estimate_gas({
                'from': self.account.address,
                'to': to_address,
                'data': data,
                'value': value
            })
            # Add 20% buffer for safety
            return int(gas_estimate * 1.2)
        except Exception:
            # Return default gas limit
            return 100000

    async def submit_transaction(
        self,
        to_address: str,
        data: str,
        value: int = 0,
        gas_limit: Optional[int] = None
    ) -> str:
        """Submit a transaction"""
        if not WEB3_AVAILABLE:
            # Return simulated tx hash
            import hashlib
            tx_data = f"{to_address}{data}{value}{time.time()}".encode()
            return "0x" + hashlib.sha256(tx_data).hexdigest()

        if not self.account:
            raise ValueError("Account not configured")

        # Get nonce
        nonce = self.web3.eth.get_transaction_count(self.account.address, 'pending')

        # Get gas price and limit
        gas_price = await self.get_gas_price()
        if self.config.gas_price_gwei:
            gas_price = self.web3.to_wei(self.config.gas_price_gwei, 'gwei')

        if gas_limit is None:
            gas_limit = await self.estimate_gas(to_address, data, value)
        elif self.config.gas_limit:
            gas_limit = self.config.gas_limit

        # Build transaction
        tx = {
            'from': self.account.address,
            'to': to_address,
            'value': value,
            'data': data,
            'gas': gas_limit,
            'gasPrice': gas_price,
            'nonce': nonce,
            'chainId': self.config.chain_id
        }

        # Sign and send transaction
        signed_tx = self.account.sign_transaction(tx)
        tx_hash = self.web3.eth.send_raw_transaction(signed_tx.raw_transaction)

        return self.web3.to_hex(tx_hash)

    async def get_transaction_status(self, tx_hash: str) -> TransactionReceipt:
        """Get transaction status"""
        if not WEB3_AVAILABLE:
            return TransactionReceipt(
                tx_hash=tx_hash,
                status=TransactionStatus.CONFIRMED,
                timestamp=time.time()
            )

        try:
            tx_hash_bytes = self.web3.to_bytes(hexstr=tx_hash)
            tx_receipt = self.web3.eth.get_transaction_receipt(tx_hash_bytes)

            if tx_receipt is None:
                return TransactionReceipt(
                    tx_hash=tx_hash,
                    status=TransactionStatus.PENDING,
                    timestamp=time.time()
                )

            current_block = self.web3.eth.block_number
            confirmations = current_block - tx_receipt.blockNumber if tx_receipt.blockNumber else 0

            status = TransactionStatus.CONFIRMED if tx_receipt.status == 1 else TransactionStatus.FAILED

            return TransactionReceipt(
                tx_hash=tx_hash,
                status=status,
                block_number=tx_receipt.blockNumber,
                confirmations=confirmations,
                gas_used=tx_receipt.gasUsed,
                timestamp=time.time()
            )
        except Exception as e:
            return TransactionReceipt(
                tx_hash=tx_hash,
                status=TransactionStatus.FAILED,
                error=str(e),
                timestamp=time.time()
            )

    async def wait_for_confirmation(
        self,
        tx_hash: str,
        confirmations: Optional[int] = None
    ) -> TransactionReceipt:
        """Wait for transaction confirmation"""
        target_confirmations = confirmations or self.config.confirmations_required

        while True:
            receipt = await self.get_transaction_status(tx_hash)

            if receipt.status == TransactionStatus.FAILED:
                return receipt

            if receipt.status == TransactionStatus.CONFIRMED and receipt.confirmations >= target_confirmations:
                return receipt

            # Wait before checking again
            await asyncio.sleep(2)

    async def commit_randomness(
        self,
        contract_address: str,
        request_id: str,
        commitment: str
    ) -> str:
        """Commit randomness to the oracle contract"""
        if not WEB3_AVAILABLE:
            # Simulated commit
            import hashlib
            tx_data = f"{contract_address}{request_id}{commitment}{time.time()}".encode()
            return "0x" + hashlib.sha256(tx_data).hexdigest()

        # Create contract instance
        contract = self.web3.eth.contract(
            address=self.web3.to_checksum_address(contract_address),
            abi=self.ORACLE_ABI
        )

        # Encode function call
        request_id_bytes = self.web3.to_bytes(hexstr=request_id) if request_id.startswith('0x') else self.web3.to_bytes(text=request_id)
        commitment_bytes = self.web3.to_bytes(hexstr=commitment) if commitment.startswith('0x') else self.web3.to_bytes(hexstr=commitment)

        data = contract.functions.commit(request_id_bytes, commitment_bytes).build_transaction({
            'from': self.account.address,
            'gas': 0,  # Will be estimated
            'gasPrice': await self.get_gas_price(),
            'nonce': self.web3.eth.get_transaction_count(self.account.address, 'pending'),
            'chainId': self.config.chain_id
        })

        return await self.submit_transaction(
            contract_address,
            data['data'],
            0,
            data['gas']
        )

    async def reveal_randomness(
        self,
        contract_address: str,
        request_id: str,
        randomness: str
    ) -> str:
        """Reveal randomness to the oracle contract"""
        if not WEB3_AVAILABLE:
            # Simulated reveal
            import hashlib
            tx_data = f"{contract_address}{request_id}{randomness}{time.time()}".encode()
            return "0x" + hashlib.sha256(tx_data).hexdigest()

        # Create contract instance
        contract = self.web3.eth.contract(
            address=self.web3.to_checksum_address(contract_address),
            abi=self.ORACLE_ABI
        )

        # Encode function call
        request_id_bytes = self.web3.to_bytes(hexstr=request_id) if request_id.startswith('0x') else self.web3.to_bytes(text=request_id)
        randomness_int = int(randomness, 16) if randomness.startswith('0x') else int(randomness, 16)

        data = contract.functions.reveal(request_id_bytes, randomness_int).build_transaction({
            'from': self.account.address,
            'gas': 0,
            'gasPrice': await self.get_gas_price(),
            'nonce': self.web3.eth.get_transaction_count(self.account.address, 'pending'),
            'chainId': self.config.chain_id
        })

        return await self.submit_transaction(
            contract_address,
            data['data'],
            0,
            data['gas']
        )

    async def get_contract_balance(self, contract_address: str) -> int:
        """Get contract balance in wei"""
        if not WEB3_AVAILABLE:
            return 0

        address = self.web3.to_checksum_address(contract_address)
        balance = self.web3.eth.get_balance(address)
        return balance

    async def get_block_number(self) -> int:
        """Get current block number"""
        if not WEB3_AVAILABLE:
            return 0

        return self.web3.eth.block_number
