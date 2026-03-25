"""
QCrypt RNG - Oracle Fulfillment Service

Handles on-chain fulfillment of oracle requests across multiple blockchains.
"""

from typing import Dict, Any, Optional, List
from dataclasses import dataclass, field
import asyncio
import time
import hashlib
from enum import Enum

from .base import ChainConfig, TransactionStatus, TransactionReceipt
from . import get_chain_adapter, get_supported_chains
from app.quantum.qrng import get_quantum_rng
from app.quantum.commitment import compute_commitment_hex
from app.utils.logging import logger


class FulfillmentStatus(Enum):
    """Oracle request fulfillment status"""
    PENDING = "pending"
    COMMIT_SUBMITTED = "commit_submitted"
    COMMIT_CONFIRMED = "commit_confirmed"
    REVEAL_SUBMITTED = "reveal_submitted"
    REVEAL_CONFIRMED = "reveal_confirmed"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class OracleRequest:
    """Oracle request details"""
    request_id: str
    chain: str
    contract_address: str
    num_bytes: int
    num_qubits: int
    status: FulfillmentStatus = FulfillmentStatus.PENDING
    commitment: Optional[str] = None
    randomness: Optional[str] = None
    commit_tx_hash: Optional[str] = None
    reveal_tx_hash: Optional[str] = None
    created_at: float = field(default_factory=time.time)
    updated_at: float = field(default_factory=time.time)
    error: Optional[str] = None


class OracleFulfillmentService:
    """
    Oracle Fulfillment Service

    Manages the lifecycle of oracle requests from creation to on-chain fulfillment.
    """

    def __init__(self):
        self.requests: Dict[str, OracleRequest] = {}
        self.chain_adapters: Dict[str, Any] = {}
        self.qrng = get_quantum_rng()
        self._processing = False

    def configure_chain(self, chain_name: str, config: ChainConfig) -> bool:
        """
        Configure a chain adapter

        Args:
            chain_name: Blockchain name (ethereum, polygon, bsc, avalanche, fantom)
            config: Chain configuration

        Returns:
            True if successful
        """
        try:
            adapter = get_chain_adapter(chain_name, config)
            self.chain_adapters[chain_name.lower()] = adapter
            logger.info(f"Configured chain adapter for {chain_name}")
            return True
        except Exception as e:
            logger.error(f"Failed to configure chain adapter for {chain_name}: {e}")
            return False

    async def create_request(
        self,
        chain: str,
        contract_address: str,
        num_bytes: int = 32,
        num_qubits: int = 16
    ) -> OracleRequest:
        """
        Create a new oracle request

        Args:
            chain: Target blockchain
            contract_address: Oracle contract address
            num_bytes: Number of random bytes to generate
            num_qubits: Number of qubits to measure

        Returns:
            OracleRequest object
        """
        request_id = f"oracle_{chain}_{int(time.time() * 1000000)}"

        request = OracleRequest(
            request_id=request_id,
            chain=chain.lower(),
            contract_address=contract_address,
            num_bytes=num_bytes,
            num_qubits=num_qubits
        )

        self.requests[request_id] = request
        logger.info(f"Created oracle request: {request_id} on {chain}")

        return request

    async def fulfill_request(self, request_id: str) -> bool:
        """
        Fulfill an oracle request (commit and reveal)

        Args:
            request_id: Request ID to fulfill

        Returns:
            True if successful
        """
        if request_id not in self.requests:
            logger.error(f"Request not found: {request_id}")
            return False

        request = self.requests[request_id]
        chain = request.chain

        if chain not in self.chain_adapters:
            request.error = f"Chain adapter not configured for {chain}"
            request.status = FulfillmentStatus.FAILED
            logger.error(request.error)
            return False

        adapter = self.chain_adapters[chain]

        try:
            # Step 1: Generate quantum randomness
            logger.info(f"Generating quantum randomness for {request_id}")
            quantum_result = await self.qrng.generate_bytes(
                request.num_bytes,
                request.num_qubits,
                "raw"
            )

            randomness_hex = "0x" + quantum_result.data.hex()
            request.randomness = randomness_hex

            # Step 2: Create commitment
            commitment = compute_commitment_hex(quantum_result.data)
            request.commitment = commitment
            logger.info(f"Created commitment for {request_id}: {commitment[:16]}...")

            # Step 3: Submit commit transaction
            logger.info(f"Submitting commit transaction for {request_id}")
            commit_tx_hash = await adapter.commit_randomness(
                request.contract_address,
                request.request_id,
                commitment
            )
            request.commit_tx_hash = commit_tx_hash
            request.status = FulfillmentStatus.COMMIT_SUBMITTED
            request.updated_at = time.time()
            logger.info(f"Commit transaction submitted: {commit_tx_hash}")

            # Step 4: Wait for commit confirmation
            logger.info(f"Waiting for commit confirmation for {request_id}")
            commit_receipt = await adapter.wait_for_confirmation(commit_tx_hash)

            if commit_receipt.status != TransactionStatus.CONFIRMED:
                raise Exception(f"Commit transaction failed: {commit_receipt.error}")

            request.status = FulfillmentStatus.COMMIT_CONFIRMED
            request.updated_at = time.time()
            logger.info(f"Commit confirmed for {request_id}")

            # Step 5: Submit reveal transaction
            logger.info(f"Submitting reveal transaction for {request_id}")
            reveal_tx_hash = await adapter.reveal_randomness(
                request.contract_address,
                request.request_id,
                randomness_hex
            )
            request.reveal_tx_hash = reveal_tx_hash
            request.status = FulfillmentStatus.REVEAL_SUBMITTED
            request.updated_at = time.time()
            logger.info(f"Reveal transaction submitted: {reveal_tx_hash}")

            # Step 6: Wait for reveal confirmation
            logger.info(f"Waiting for reveal confirmation for {request_id}")
            reveal_receipt = await adapter.wait_for_confirmation(reveal_tx_hash)

            if reveal_receipt.status != TransactionStatus.CONFIRMED:
                raise Exception(f"Reveal transaction failed: {reveal_receipt.error}")

            request.status = FulfillmentStatus.REVEAL_CONFIRMED
            request.updated_at = time.time()

            # Step 7: Mark as completed
            request.status = FulfillmentStatus.COMPLETED
            request.updated_at = time.time()
            logger.info(f"Oracle request completed: {request_id}")

            return True

        except Exception as e:
            request.error = str(e)
            request.status = FulfillmentStatus.FAILED
            request.updated_at = time.time()
            logger.error(f"Failed to fulfill oracle request {request_id}: {e}")
            return False

    async def fulfill_request_async(self, request_id: str) -> None:
        """
        Fulfill an oracle request asynchronously (non-blocking)

        Args:
            request_id: Request ID to fulfill
        """
        asyncio.create_task(self.fulfill_request(request_id))

    def get_request_status(self, request_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the status of an oracle request

        Args:
            request_id: Request ID

        Returns:
            Request status dictionary
        """
        if request_id not in self.requests:
            return None

        request = self.requests[request_id]
        adapter = self.chain_adapters.get(request.chain)

        status_data = {
            "request_id": request.request_id,
            "chain": request.chain,
            "contract_address": request.contract_address,
            "status": request.status.value,
            "num_bytes": request.num_bytes,
            "num_qubits": request.num_qubits,
            "commitment": request.commitment,
            "randomness": request.randomness,
            "commit_tx_hash": request.commit_tx_hash,
            "reveal_tx_hash": request.reveal_tx_hash,
            "created_at": request.created_at,
            "updated_at": request.updated_at,
            "error": request.error
        }

        if adapter:
            status_data["explorer_urls"] = {
                "commit": adapter.get_explorer_url(request.commit_tx_hash) if request.commit_tx_hash else None,
                "reveal": adapter.get_explorer_url(request.reveal_tx_hash) if request.reveal_tx_hash else None
            }

        return status_data

    def get_all_requests(self) -> List[Dict[str, Any]]:
        """Get all oracle requests"""
        return [
            self.get_request_status(request_id)
            for request_id in self.requests
        ]

    async def get_chain_info(self, chain_name: str) -> Optional[Dict[str, Any]]:
        """
        Get information about a configured chain

        Args:
            chain_name: Blockchain name

        Returns:
            Chain information dictionary
        """
        adapter = self.chain_adapters.get(chain_name.lower())
        if not adapter:
            return None

        return await adapter.get_chain_info()

    def get_supported_chains(self) -> Dict[str, Any]:
        """Get list of supported chains"""
        return get_supported_chains()


# Global service instance
_oracle_service: Optional[OracleFulfillmentService] = None


def get_oracle_fulfillment_service() -> OracleFulfillmentService:
    """Get the global oracle fulfillment service instance"""
    global _oracle_service
    if _oracle_service is None:
        _oracle_service = OracleFulfillmentService()
    return _oracle_service
