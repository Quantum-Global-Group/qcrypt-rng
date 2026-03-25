"""
QCrypt RNG - Avalanche C-Chain Adapter

Provides Avalanche C-Chain support for oracle fulfillment.
"""

from typing import Optional
from .base import ChainConfig
from .ethereum import EthereumAdapter


class AvalancheAdapter(EthereumAdapter):
    """
    Avalanche C-Chain adapter

    Avalanche C-Chain is Ethereum-compatible with very fast finality.
    """

    # Avalanche-specific RPC endpoints
    AVALANCHE_RPC_URLS = [
        "https://api.avax.network/ext/bc/C/rpc",
        "https://avalanche-c-chain.publicnode.com"
    ]

    def __init__(self, config: Optional[ChainConfig] = None):
        if config is None:
            config = ChainConfig(
                rpc_url=self.AVALANCHE_RPC_URLS[0],
                chain_id=43114,
                explorer_url="https://snowtrace.io",
                currency_symbol="AVAX",
                confirmations_required=3  # Avalanche has very fast finality (~1-2 seconds)
            )
        super().__init__(config)

    async def get_gas_price(self) -> int:
        """Get current gas price in wei (AVAX)"""
        gas_price = await super().get_gas_price()
        # Avalanche has a fixed minimum gas price
        return max(gas_price, 25_000_000_000)  # 25 gwei minimum
