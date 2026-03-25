"""
QCrypt RNG - Fantom Opera Adapter

Provides Fantom Opera network support for oracle fulfillment.
"""

from typing import Optional
from .base import ChainConfig
from .ethereum import EthereumAdapter


class FantomAdapter(EthereumAdapter):
    """
    Fantom Opera adapter

    Fantom is an EVM-compatible chain with fast finality and low fees.
    """

    # Fantom-specific RPC endpoints
    FANTOM_RPC_URLS = [
        "https://rpc.ftm.tools",
        "https://fantom-mainnet.publicnode.com"
    ]

    def __init__(self, config: Optional[ChainConfig] = None):
        if config is None:
            config = ChainConfig(
                rpc_url=self.FANTOM_RPC_URLS[0],
                chain_id=250,
                explorer_url="https://ftmscan.com",
                currency_symbol="FTM",
                confirmations_required=10  # Fantom has ~1 second block times
            )
        super().__init__(config)

    async def get_gas_price(self) -> int:
        """Get current gas price in wei (FTM)"""
        gas_price = await super().get_gas_price()
        # Fantom gas prices are typically very low
        return max(gas_price, 10_000_000_000)  # 10 gwei minimum
