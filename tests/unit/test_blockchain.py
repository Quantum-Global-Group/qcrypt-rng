"""
Unit tests for Blockchain Chain Adapters and Oracle Fulfillment Service

Tests for Ethereum, Polygon, BSC, Avalanche, Fantom adapters and oracle service.
"""

import pytest
import asyncio
from unittest.mock import Mock, patch, MagicMock, AsyncMock
import sys
from pathlib import Path
import time

sys.path.append(str(Path(__file__).parent.parent.parent))

from app.blockchain.base import (
    ChainAdapter,
    ChainConfig,
    TransactionStatus,
    TransactionReceipt
)
from app.blockchain.ethereum import EthereumAdapter
from app.blockchain.polygon import PolygonAdapter
from app.blockchain.bsc import BSCAdapter
from app.blockchain.avalanche import AvalancheAdapter
from app.blockchain.fantom import FantomAdapter
from app.blockchain.oracle_service import (
    OracleFulfillmentService,
    OracleRequest,
    FulfillmentStatus,
    get_oracle_fulfillment_service
)


class TestChainConfig:
    """Test ChainConfig dataclass"""

    def test_chain_config_creation(self):
        """Test creating chain config"""
        config = ChainConfig(
            rpc_url="https://example.com/rpc",
            chain_id=1,
            explorer_url="https://explorer.com",
            currency_symbol="ETH",
            private_key="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
            gas_price_gwei=20,
            confirmations_required=6
        )

        assert config.rpc_url == "https://example.com/rpc"
        assert config.chain_id == 1
        assert config.explorer_url == "https://explorer.com"
        assert config.currency_symbol == "ETH"
        assert config.gas_price_gwei == 20
        assert config.confirmations_required == 6

    def test_chain_config_defaults(self):
        """Test chain config default values"""
        config = ChainConfig(
            rpc_url="https://example.com/rpc",
            chain_id=1,
            explorer_url="https://explorer.com",
            currency_symbol="ETH"
        )

        assert config.private_key is None
        assert config.gas_price_gwei is None
        assert config.gas_limit is None
        assert config.confirmations_required == 3


class TestTransactionStatus:
    """Test TransactionStatus enum"""

    def test_transaction_status_values(self):
        """Test transaction status values"""
        assert TransactionStatus.PENDING.value == "pending"
        assert TransactionStatus.SUBMITTED.value == "submitted"
        assert TransactionStatus.CONFIRMED.value == "confirmed"
        assert TransactionStatus.FAILED.value == "failed"
        assert TransactionStatus.REVERTED.value == "reverted"


class TestTransactionReceipt:
    """Test TransactionReceipt dataclass"""

    def test_receipt_creation(self):
        """Test creating transaction receipt"""
        receipt = TransactionReceipt(
            tx_hash="0xabc123...",
            status=TransactionStatus.CONFIRMED,
            block_number=12345678,
            confirmations=6,
            gas_used=21000,
            timestamp=time.time()
        )

        assert receipt.tx_hash == "0xabc123..."
        assert receipt.status == TransactionStatus.CONFIRMED
        assert receipt.block_number == 12345678
        assert receipt.confirmations == 6


@pytest.mark.asyncio
class TestEthereumAdapter:
    """Tests for EthereumAdapter"""

    @pytest.fixture
    def eth_config(self):
        """Create Ethereum config"""
        return ChainConfig(
            rpc_url="https://mainnet.infura.io/v3/test",
            chain_id=1,
            explorer_url="https://etherscan.io",
            currency_symbol="ETH",
            private_key="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
            confirmations_required=3
        )

    @pytest.fixture
    def eth_adapter(self, eth_config):
        """Create Ethereum adapter"""
        with patch('app.blockchain.ethereum.WEB3_AVAILABLE', False):
            adapter = EthereumAdapter(eth_config)
            return adapter

    async def test_adapter_initialization(self, eth_adapter):
        """Test adapter initialization"""
        assert eth_adapter.config.chain_id == 1
        assert eth_adapter.config.currency_symbol == "ETH"

    async def test_get_gas_price_no_web3(self, eth_adapter):
        """Test gas price without web3"""
        gas_price = await eth_adapter.get_gas_price()
        assert gas_price == 20_000_000_000  # 20 gwei default

    async def test_estimate_gas_no_web3(self, eth_adapter):
        """Test gas estimation without web3"""
        gas = await eth_adapter.estimate_gas(
            "0x1234567890123456789012345678901234567890",
            "0x"
        )
        assert gas == 21000  # Base transaction gas

    async def test_submit_transaction_no_web3(self, eth_adapter):
        """Test transaction submission without web3"""
        tx_hash = await eth_adapter.submit_transaction(
            "0x1234567890123456789012345678901234567890",
            "0x",
            0
        )

        assert tx_hash.startswith("0x")
        assert len(tx_hash) == 66  # 0x + 64 hex chars

    async def test_get_transaction_status_no_web3(self, eth_adapter):
        """Test transaction status without web3"""
        receipt = await eth_adapter.get_transaction_status("0xabc123...")

        assert receipt.tx_hash == "0xabc123..."
        assert receipt.status == TransactionStatus.CONFIRMED

    async def test_get_block_number_no_web3(self, eth_adapter):
        """Test block number without web3"""
        block = await eth_adapter.get_block_number()
        assert block == 0

    async def test_get_contract_balance_no_web3(self, eth_adapter):
        """Test contract balance without web3"""
        balance = await eth_adapter.get_contract_balance(
            "0x1234567890123456789012345678901234567890"
        )
        assert balance == 0

    async def test_get_explorer_url(self, eth_adapter):
        """Test explorer URL generation"""
        url = eth_adapter.get_explorer_url("0xabc123...")
        assert url == "https://etherscan.io/tx/0xabc123..."

    async def test_get_address_url(self, eth_adapter):
        """Test address URL generation"""
        url = eth_adapter.get_address_url("0x1234567890...")
        assert url == "https://etherscan.io/address/0x1234567890..."

    async def test_get_chain_info(self, eth_adapter):
        """Test chain info"""
        info = await eth_adapter.get_chain_info()

        assert info["chain_id"] == 1
        assert info["chain_name"] == "Ethereum"
        assert info["currency"] == "ETH"

    async def test_commit_randomness_no_web3(self, eth_adapter):
        """Test commit randomness without web3"""
        tx_hash = await eth_adapter.commit_randomness(
            "0x1234567890123456789012345678901234567890",
            "0xreq123",
            "0xcommit123"
        )

        assert tx_hash.startswith("0x")
        assert len(tx_hash) == 66

    async def test_reveal_randomness_no_web3(self, eth_adapter):
        """Test reveal randomness without web3"""
        tx_hash = await eth_adapter.reveal_randomness(
            "0x1234567890123456789012345678901234567890",
            "0xreq123",
            "0x1234567890abcdef"
        )

        assert tx_hash.startswith("0x")


@pytest.mark.asyncio
class TestPolygonAdapter:
    """Tests for PolygonAdapter"""

    @pytest.fixture
    def polygon_adapter(self):
        """Create Polygon adapter"""
        with patch('app.blockchain.ethereum.WEB3_AVAILABLE', False):
            return PolygonAdapter()

    async def test_polygon_config(self, polygon_adapter):
        """Test Polygon configuration"""
        assert polygon_adapter.config.chain_id == 137
        assert polygon_adapter.config.currency_symbol == "MATIC"
        assert polygon_adapter.config.explorer_url == "https://polygonscan.com"

    async def test_polygon_gas_price(self, polygon_adapter):
        """Test Polygon gas price"""
        gas_price = await polygon_adapter.get_gas_price()
        assert gas_price >= 30_000_000_000  # 30 gwei minimum


@pytest.mark.asyncio
class TestBSCAdapter:
    """Tests for BSCAdapter"""

    @pytest.fixture
    def bsc_adapter(self):
        """Create BSC adapter"""
        with patch('app.blockchain.ethereum.WEB3_AVAILABLE', False):
            return BSCAdapter()

    async def test_bsc_config(self, bsc_adapter):
        """Test BSC configuration"""
        assert bsc_adapter.config.chain_id == 56
        assert bsc_adapter.config.currency_symbol == "BNB"
        assert bsc_adapter.config.explorer_url == "https://bscscan.com"

    async def test_bsc_gas_price(self, bsc_adapter):
        """Test BSC gas price"""
        gas_price = await bsc_adapter.get_gas_price()
        assert gas_price >= 3_000_000_000  # 3 gwei minimum


@pytest.mark.asyncio
class TestAvalancheAdapter:
    """Tests for AvalancheAdapter"""

    @pytest.fixture
    def avax_adapter(self):
        """Create Avalanche adapter"""
        with patch('app.blockchain.ethereum.WEB3_AVAILABLE', False):
            return AvalancheAdapter()

    async def test_avalanche_config(self, avax_adapter):
        """Test Avalanche configuration"""
        assert avax_adapter.config.chain_id == 43114
        assert avax_adapter.config.currency_symbol == "AVAX"
        assert avax_adapter.config.explorer_url == "https://snowtrace.io"
        assert avax_adapter.config.confirmations_required == 3  # Fast finality


@pytest.mark.asyncio
class TestFantomAdapter:
    """Tests for FantomAdapter"""

    @pytest.fixture
    def ftm_adapter(self):
        """Create Fantom adapter"""
        with patch('app.blockchain.ethereum.WEB3_AVAILABLE', False):
            return FantomAdapter()

    async def test_fantom_config(self, ftm_adapter):
        """Test Fantom configuration"""
        assert ftm_adapter.config.chain_id == 250
        assert ftm_adapter.config.currency_symbol == "FTM"
        assert ftm_adapter.config.explorer_url == "https://ftmscan.com"


class TestChainAdapterFunctions:
    """Test chain adapter helper functions"""

    def test_get_chain_adapter_ethereum(self):
        """Test getting Ethereum adapter"""
        from app.blockchain import get_chain_adapter

        config = ChainConfig(
            rpc_url="https://example.com",
            chain_id=1,
            explorer_url="https://etherscan.io",
            currency_symbol="ETH"
        )

        adapter = get_chain_adapter("ethereum", config)
        assert isinstance(adapter, EthereumAdapter)

    def test_get_chain_adapter_polygon(self):
        """Test getting Polygon adapter"""
        from app.blockchain import get_chain_adapter

        config = ChainConfig(
            rpc_url="https://polygon-rpc.com",
            chain_id=137,
            explorer_url="https://polygonscan.com",
            currency_symbol="MATIC"
        )

        adapter = get_chain_adapter("polygon", config)
        assert isinstance(adapter, PolygonAdapter)

    def test_get_chain_adapter_invalid(self):
        """Test getting invalid adapter"""
        from app.blockchain import get_chain_adapter

        config = ChainConfig(
            rpc_url="https://example.com",
            chain_id=1,
            explorer_url="https://example.com",
            currency_symbol="ETH"
        )

        with pytest.raises(ValueError, match="Unsupported chain"):
            get_chain_adapter("invalid_chain", config)

    def test_get_supported_chains(self):
        """Test getting supported chains"""
        from app.blockchain import get_supported_chains

        chains = get_supported_chains()

        assert "ethereum" in chains
        assert "polygon" in chains
        assert "bsc" in chains
        assert "avalanche" in chains
        assert "fantom" in chains

        assert chains["ethereum"]["chain_id"] == 1
        assert chains["polygon"]["chain_id"] == 137
        assert chains["bsc"]["chain_id"] == 56


@pytest.mark.asyncio
class TestOracleFulfillmentService:
    """Tests for OracleFulfillmentService"""

    @pytest.fixture
    def oracle_service(self):
        """Create oracle service"""
        return OracleFulfillmentService()

    async def test_service_creation(self, oracle_service):
        """Test service creation"""
        assert oracle_service.requests == {}
        assert oracle_service.chain_adapters == {}

    async def test_configure_chain(self, oracle_service):
        """Test chain configuration"""
        config = ChainConfig(
            rpc_url="https://example.com",
            chain_id=1,
            explorer_url="https://etherscan.io",
            currency_symbol="ETH"
        )

        result = oracle_service.configure_chain("ethereum", config)
        assert result is True
        assert "ethereum" in oracle_service.chain_adapters

    async def test_create_request(self, oracle_service):
        """Test creating oracle request"""
        request = await oracle_service.create_request(
            chain="ethereum",
            contract_address="0x1234567890123456789012345678901234567890",
            num_bytes=32,
            num_qubits=16
        )

        assert request.request_id.startswith("oracle_ethereum_")
        assert request.chain == "ethereum"
        assert request.num_bytes == 32
        assert request.num_qubits == 16
        assert request.status == FulfillmentStatus.PENDING

    async def test_get_request_status(self, oracle_service):
        """Test getting request status"""
        request = await oracle_service.create_request(
            chain="ethereum",
            contract_address="0x1234567890123456789012345678901234567890",
            num_bytes=32
        )

        status = oracle_service.get_request_status(request.request_id)

        assert status is not None
        assert status["request_id"] == request.request_id
        assert status["chain"] == "ethereum"
        assert status["status"] == "pending"

    async def test_get_request_status_not_found(self, oracle_service):
        """Test getting non-existent request status"""
        status = oracle_service.get_request_status("non_existent_id")
        assert status is None

    async def test_get_all_requests(self, oracle_service):
        """Test getting all requests"""
        # Create multiple requests
        await oracle_service.create_request("ethereum", "0x1234", 32)
        await oracle_service.create_request("ethereum", "0x1234", 32)
        await oracle_service.create_request("ethereum", "0x1234", 32)

        requests = oracle_service.get_all_requests()

        assert len(requests) == 3

    async def test_get_supported_chains(self, oracle_service):
        """Test getting supported chains"""
        chains = oracle_service.get_supported_chains()

        assert len(chains) == 5
        assert "ethereum" in chains
        assert "polygon" in chains

    async def test_fulfill_request_no_adapter(self, oracle_service):
        """Test fulfillment without adapter configured"""
        request = await oracle_service.create_request(
            chain="ethereum",
            contract_address="0x1234",
            num_bytes=32
        )

        result = await oracle_service.fulfill_request(request.request_id)

        assert result is False
        assert request.status == FulfillmentStatus.FAILED
        assert request.error is not None

    async def test_singleton_pattern(self):
        """Test singleton pattern"""
        service1 = get_oracle_fulfillment_service()
        service2 = get_oracle_fulfillment_service()

        assert service1 is service2


@pytest.mark.asyncio
class TestOracleFulfillmentWorkflow:
    """Integration tests for oracle fulfillment workflow"""

    @pytest.fixture
    def configured_service(self):
        """Create configured oracle service"""
        service = OracleFulfillmentService()

        config = ChainConfig(
            rpc_url="https://example.com",
            chain_id=1,
            explorer_url="https://etherscan.io",
            currency_symbol="ETH"
        )

        # Configure with mocked adapter
        with patch('app.blockchain.ethereum.WEB3_AVAILABLE', False):
            service.configure_chain("ethereum", config)

        return service

    async def test_request_lifecycle(self, configured_service):
        """Test complete request lifecycle"""
        # Create request
        request = await configured_service.create_request(
            chain="ethereum",
            contract_address="0x1234567890123456789012345678901234567890",
            num_bytes=32,
            num_qubits=16
        )

        # Check initial status
        status = configured_service.get_request_status(request.request_id)
        assert status["status"] == "pending"

        # Try to fulfill (will fail without real adapter)
        result = await configured_service.fulfill_request(request.request_id)

        # Should fail because web3 is not available
        assert result is False

        # Check final status
        status = configured_service.get_request_status(request.request_id)
        assert status["status"] == "failed"


class TestFulfillmentStatus:
    """Test FulfillmentStatus enum"""

    def test_status_values(self):
        """Test status values"""
        assert FulfillmentStatus.PENDING.value == "pending"
        assert FulfillmentStatus.COMMIT_SUBMITTED.value == "commit_submitted"
        assert FulfillmentStatus.COMMIT_CONFIRMED.value == "commit_confirmed"
        assert FulfillmentStatus.REVEAL_SUBMITTED.value == "reveal_submitted"
        assert FulfillmentStatus.REVEAL_CONFIRMED.value == "reveal_confirmed"
        assert FulfillmentStatus.COMPLETED.value == "completed"
        assert FulfillmentStatus.FAILED.value == "failed"


class TestOracleRequest:
    """Test OracleRequest dataclass"""

    def test_request_creation(self):
        """Test creating oracle request"""
        request = OracleRequest(
            request_id="test_123",
            chain="ethereum",
            contract_address="0x1234",
            num_bytes=32,
            num_qubits=16
        )

        assert request.request_id == "test_123"
        assert request.chain == "ethereum"
        assert request.num_bytes == 32
        assert request.num_qubits == 16
        assert request.status == FulfillmentStatus.PENDING
        assert request.commitment is None
        assert request.randomness is None

    def test_request_with_values(self):
        """Test creating request with values"""
        request = OracleRequest(
            request_id="test_123",
            chain="ethereum",
            contract_address="0x1234",
            num_bytes=32,
            num_qubits=16,
            status=FulfillmentStatus.COMPLETED,
            commitment="0xabc123",
            randomness="0x456def",
            commit_tx_hash="0xcommit",
            reveal_tx_hash="0xreveal"
        )

        assert request.status == FulfillmentStatus.COMPLETED
        assert request.commitment == "0xabc123"
        assert request.randomness == "0x456def"
        assert request.commit_tx_hash == "0xcommit"
        assert request.reveal_tx_hash == "0xreveal"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
