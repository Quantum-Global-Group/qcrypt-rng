"""
QCrypt RNG - Blockchain Chain Adapters

Provides adapters for different blockchain networks for oracle fulfillment:
- Ethereum
- Polygon
- Binance Smart Chain (BSC)
- Avalanche
- Fantom
"""

from .base import ChainAdapter, ChainConfig, TransactionStatus
from .ethereum import EthereumAdapter
from .polygon import PolygonAdapter
from .bsc import BSCAdapter
from .avalanche import AvalancheAdapter
from .fantom import FantomAdapter

__all__ = [
    "ChainAdapter",
    "ChainConfig",
    "TransactionStatus",
    "EthereumAdapter",
    "PolygonAdapter",
    "BSCAdapter",
    "AvalancheAdapter",
    "FantomAdapter",
    "get_chain_adapter",
    "get_supported_chains"
]


def get_chain_adapter(chain_name: str, config: ChainConfig) -> ChainAdapter:
    """
    Get a chain adapter by name

    Args:
        chain_name: Name of the blockchain (ethereum, polygon, bsc, avalanche, fantom)
        config: Chain configuration

    Returns:
        ChainAdapter instance
    """
    adapters = {
        "ethereum": EthereumAdapter,
        "polygon": PolygonAdapter,
        "bsc": BSCAdapter,
        "avalanche": AvalancheAdapter,
        "fantom": FantomAdapter,
    }

    chain_lower = chain_name.lower()
    if chain_lower not in adapters:
        raise ValueError(f"Unsupported chain: {chain_name}. Supported: {list(adapters.keys())}")

    return adapters[chain_lower](config)


def get_supported_chains() -> dict:
    """Get list of supported blockchain networks"""
    return {
        "ethereum": {
            "name": "Ethereum Mainnet",
            "chain_id": 1,
            "currency": "ETH",
            "explorer": "https://etherscan.io",
            "rpc": "https://mainnet.infura.io/v3/",
            "features": ["commit", "reveal", "batch_requests"]
        },
        "polygon": {
            "name": "Polygon",
            "chain_id": 137,
            "currency": "MATIC",
            "explorer": "https://polygonscan.com",
            "rpc": "https://polygon-rpc.com",
            "features": ["commit", "reveal", "batch_requests", "low_fees"]
        },
        "bsc": {
            "name": "Binance Smart Chain",
            "chain_id": 56,
            "currency": "BNB",
            "explorer": "https://bscscan.com",
            "rpc": "https://bsc-dataseed.binance.org",
            "features": ["commit", "reveal", "batch_requests", "low_fees"]
        },
        "avalanche": {
            "name": "Avalanche C-Chain",
            "chain_id": 43114,
            "currency": "AVAX",
            "explorer": "https://snowtrace.io",
            "rpc": "https://api.avax.network/ext/bc/C/rpc",
            "features": ["commit", "reveal", "batch_requests", "fast_finality"]
        },
        "fantom": {
            "name": "Fantom Opera",
            "chain_id": 250,
            "currency": "FTM",
            "explorer": "https://ftmscan.com",
            "rpc": "https://rpc.ftm.tools",
            "features": ["commit", "reveal", "batch_requests", "low_fees"]
        }
    }
