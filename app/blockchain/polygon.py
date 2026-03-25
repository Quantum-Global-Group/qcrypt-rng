"""
QCrypt RNG - Polygon Chain Adapter

Provides Polygon network support for oracle fulfillment.
"""

from typing import Optional
from .base import ChainConfig, TransactionReceipt, TransactionStatus
from .ethereum import EthereumAdapter


class PolygonAdapter(EthereumAdapter):
    """
    Polygon chain adapter

    Polygon is an Ethereum-compatible sidechain with lower fees and faster transactions.
    """

    # Polygon-specific RPC endpoints
    POLYGON_RPC_URLS = [
        "https://polygon-rpc.com",
        "https://rpc-mainnet.matic.network",
        "https://matic-mainnet.chainstacklabs.com"
    ]

    def __init__(self, config: Optional[ChainConfig] = None):
        if config is None:
            config = ChainConfig(
                rpc_url=self.POLYGON_RPC_URLS[0],
                chain_id=137,
                explorer_url="https://polygonscan.com",
                currency_symbol="MATIC",
                confirmations_required=10  # Polygon has faster block times
            )
        super().__init__(config)

    async def get_gas_price(self) -> int:
        """Get current gas price in wei (MATIC)"""
        gas_price = await super().get_gas_price()
        # Polygon gas prices are typically much lower
        # Ensure minimum gas price
        return max(gas_price, 30_000_000_000)  # 30 gwei minimum

    async def commit_randomness(
        self,
        contract_address: str,
        request_id: str,
        commitment: str
    ) -> str:
        """Commit randomness to the oracle contract on Polygon"""
        return await super().commit_randomness(contract_address, request_id, commitment)

    async def reveal_randomness(
        self,
        contract_address: str,
        request_id: str,
        randomness: str
    ) -> str:
        """Reveal randomness to the oracle contract on Polygon"""
        return await super().reveal_randomness(contract_address, request_id, randomness)
