"""
QCrypt RNG - Binance Smart Chain (BSC) Adapter

Provides BSC network support for oracle fulfillment.
"""

from typing import Optional
from .base import ChainConfig
from .ethereum import EthereumAdapter


class BSCAdapter(EthereumAdapter):
    """
    Binance Smart Chain adapter

    BSC is an Ethereum-compatible chain with low fees and fast block times.
    """

    # BSC-specific RPC endpoints
    BSC_RPC_URLS = [
        "https://bsc-dataseed.binance.org",
        "https://bsc-dataseed1.defibit.io",
        "https://bsc-dataseed1.ninicoin.io"
    ]

    def __init__(self, config: Optional[ChainConfig] = None):
        if config is None:
            config = ChainConfig(
                rpc_url=self.BSC_RPC_URLS[0],
                chain_id=56,
                explorer_url="https://bscscan.com",
                currency_symbol="BNB",
                confirmations_required=15  # BSC has 3-second block times
            )
        super().__init__(config)

    async def get_gas_price(self) -> int:
        """Get current gas price in wei (BNB)"""
        gas_price = await super().get_gas_price()
        # BSC gas prices are typically fixed
        return max(gas_price, 3_000_000_000)  # 3 gwei minimum
