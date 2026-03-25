"""
QCrypt RNG - Base Chain Adapter

Defines the abstract base class for blockchain chain adapters.
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from enum import Enum
import time


class TransactionStatus(Enum):
    """Transaction status enumeration"""
    PENDING = "pending"
    SUBMITTED = "submitted"
    CONFIRMED = "confirmed"
    FAILED = "failed"
    REVERTED = "reverted"


@dataclass
class ChainConfig:
    """Chain configuration"""
    rpc_url: str
    chain_id: int
    explorer_url: str
    currency_symbol: str
    private_key: Optional[str] = None  # In production, use secure key management
    gas_price_gwei: Optional[int] = None
    gas_limit: Optional[int] = None
    confirmations_required: int = 3


@dataclass
class TransactionReceipt:
    """Transaction receipt"""
    tx_hash: str
    status: TransactionStatus
    block_number: Optional[int] = None
    confirmations: int = 0
    gas_used: Optional[int] = None
    timestamp: float = 0
    error: Optional[str] = None


class ChainAdapter(ABC):
    """
    Abstract base class for blockchain chain adapters

    Provides a unified interface for interacting with different blockchain networks.
    """

    def __init__(self, config: ChainConfig):
        self.config = config
        self._web3 = None
        self._account = None

    @property
    def web3(self):
        """Get Web3 instance (lazy initialization)"""
        if self._web3 is None:
            self._web3 = self._init_web3()
        return self._web3

    @abstractmethod
    def _init_web3(self):
        """Initialize Web3 connection"""
        pass

    @property
    def account(self):
        """Get account (lazy initialization)"""
        if self._account is None and self.config.private_key:
            self._account = self._init_account()
        return self._account

    @abstractmethod
    def _init_account(self):
        """Initialize account from private key"""
        pass

    @abstractmethod
    async def get_gas_price(self) -> int:
        """Get current gas price in wei"""
        pass

    @abstractmethod
    async def estimate_gas(self, to_address: str, data: str, value: int = 0) -> int:
        """Estimate gas for a transaction"""
        pass

    @abstractmethod
    async def submit_transaction(
        self,
        to_address: str,
        data: str,
        value: int = 0,
        gas_limit: Optional[int] = None
    ) -> str:
        """
        Submit a transaction

        Args:
            to_address: Recipient address
            data: Transaction data (hex)
            value: Value to send in wei
            gas_limit: Gas limit (optional, will estimate if not provided)

        Returns:
            Transaction hash
        """
        pass

    @abstractmethod
    async def get_transaction_status(self, tx_hash: str) -> TransactionReceipt:
        """Get transaction status"""
        pass

    @abstractmethod
    async def wait_for_confirmation(
        self,
        tx_hash: str,
        confirmations: Optional[int] = None
    ) -> TransactionReceipt:
        """
        Wait for transaction confirmation

        Args:
            tx_hash: Transaction hash
            confirmations: Number of confirmations to wait for

        Returns:
            Transaction receipt
        """
        pass

    @abstractmethod
    async def commit_randomness(
        self,
        contract_address: str,
        request_id: str,
        commitment: str
    ) -> str:
        """
        Commit randomness to the oracle contract

        Args:
            contract_address: Oracle contract address
            request_id: Request ID
            commitment: Commitment hash (hex)

        Returns:
            Transaction hash
        """
        pass

    @abstractmethod
    async def reveal_randomness(
        self,
        contract_address: str,
        request_id: str,
        randomness: str
    ) -> str:
        """
        Reveal randomness to the oracle contract

        Args:
            contract_address: Oracle contract address
            request_id: Request ID
            randomness: Randomness value (hex)

        Returns:
            Transaction hash
        """
        pass

    @abstractmethod
    async def get_contract_balance(self, contract_address: str) -> int:
        """Get contract balance in wei"""
        pass

    @abstractmethod
    async def get_block_number(self) -> int:
        """Get current block number"""
        pass

    def get_explorer_url(self, tx_hash: str) -> str:
        """Get explorer URL for transaction"""
        return f"{self.config.explorer_url}/tx/{tx_hash}"

    def get_address_url(self, address: str) -> str:
        """Get explorer URL for address"""
        return f"{self.config.explorer_url}/address/{address}"

    async def get_chain_info(self) -> Dict[str, Any]:
        """Get chain information"""
        try:
            block_number = await self.get_block_number()
            gas_price = await self.get_gas_price()

            return {
                "chain_id": self.config.chain_id,
                "chain_name": self.__class__.__name__.replace("Adapter", ""),
                "rpc_url": self.config.rpc_url,
                "explorer_url": self.config.explorer_url,
                "currency": self.config.currency_symbol,
                "current_block": block_number,
                "gas_price_gwei": gas_price / 1e9,
                "confirmations_required": self.config.confirmations_required
            }
        except Exception as e:
            return {
                "chain_id": self.config.chain_id,
                "error": str(e)
            }
