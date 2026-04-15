"""
QCrypt RNG Configuration Management
Handles all application settings and environment variables
"""

from typing import Optional, List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator
from functools import lru_cache
import os
import secrets
from pathlib import Path

# Get project root directory
PROJECT_ROOT = Path(__file__).parent.parent


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Application Info
    app_name: str = Field(default="QCrypt RNG", env="APP_NAME")
    app_version: str = Field(default="2.0.0", env="APP_VERSION")
    debug: bool = Field(default=True, env="DEBUG")
    environment: str = Field(default="development", env="ENVIRONMENT")

    # API Configuration
    api_host: str = Field(default="0.0.0.0", env="API_HOST")
    api_port: int = Field(default=9878, env="API_PORT")
    api_prefix: str = Field(default="/api/v2", env="API_PREFIX")
    # Include quantum-oracle-ui dev origin (find-port.js base → 3980) or browser health checks fail CORS → UI shows "Offline".
    # Older ports kept so existing .env / bookmarks still work.
    allowed_origins: List[str] = Field(
        default=[
            "http://localhost:3000",
            "http://localhost:3040",
            "http://127.0.0.1:3040",
            "http://localhost:3180",
            "http://127.0.0.1:3180",
            "http://localhost:3980",
            "http://127.0.0.1:3980",
            "http://localhost:8501",
        ],
        env="ALLOWED_ORIGINS"
    )

    # Quantum Backend Configuration
    quantum_backend: str = Field(
        default="qrisp_simulator",
        env="QUANTUM_BACKEND",
        description="Options: qrisp_simulator, hardware_photonic, hardware_superconducting, ibm_quantum, iqm_quantum, rigetti"
    )
    ibm_quantum_token: Optional[str] = Field(default=None, env="IBM_QUANTUM_TOKEN")
    iqm_server_url: Optional[str] = Field(default=None, env="IQM_SERVER_URL")
    rigetti_api_key: Optional[str] = Field(default=None, env="RIGETTI_API_KEY")

    # Quantum RNG Settings
    default_qubits: int = Field(default=8, env="DEFAULT_QUBITS")
    max_qubits: int = Field(default=16, env="MAX_QUBITS")
    entropy_pool_size: int = Field(default=1000, env="ENTROPY_POOL_SIZE")
    min_entropy_threshold: float = Field(default=0.95, env="MIN_ENTROPY_THRESHOLD")

    # Security Configuration
    secret_key: str = Field(
        default="your-secret-key-here-change-in-production",
        env="SECRET_KEY"
    )
    algorithm: str = Field(default="HS256", env="ALGORITHM")
    access_token_expire_minutes: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")

    # Database Configuration
    database_url: str = Field(
        default="postgresql://user:password@localhost:5432/qcrypt_db",
        env="DATABASE_URL"
    )
    redis_url: str = Field(
        default="redis://localhost:6379/0",
        env="REDIS_URL"
    )

    # Rate Limiting and Usage Tracking
    rate_limit_requests: int = Field(default=100, env="RATE_LIMIT_REQUESTS")
    rate_limit_period: int = Field(default=60, env="RATE_LIMIT_PERIOD")
    enable_usage_tracking: bool = Field(default=True, env="ENABLE_USAGE_TRACKING")
    usage_database_url: str = Field(
        default="sqlite:///usage.db",
        env="USAGE_DATABASE_URL"
    )

    # Free Tier Limits
    free_tier_max_bytes: int = Field(default=256, env="FREE_TIER_MAX_BYTES")
    free_tier_max_requests: int = Field(default=10, env="FREE_TIER_MAX_REQUESTS")

    # Pro Tier Limits
    pro_tier_max_bytes: int = Field(default=1024, env="PRO_TIER_MAX_BYTES")
    pro_tier_max_requests: int = Field(default=100, env="PRO_TIER_MAX_REQUESTS")

    # Enterprise Tier Limits
    enterprise_tier_max_bytes: int = Field(default=10240, env="ENTERPRISE_TIER_MAX_BYTES")
    enterprise_tier_max_requests: int = Field(default=1000, env="ENTERPRISE_TIER_MAX_REQUESTS")

    # API Key Configuration
    require_api_key: bool = Field(default=False, env="REQUIRE_API_KEY")
    api_key_header: str = Field(default="X-API-Key", env="API_KEY_HEADER")
    valid_api_keys: Optional[str] = Field(
        default=None,
        env="VALID_API_KEYS",
        description="Comma-separated list of valid API keys. If unset, any key with length >= 10 is accepted."
    )

    # Request body size limit (bytes); default 1 MB
    max_request_body_size_bytes: int = Field(
        default=1_048_576,
        env="MAX_REQUEST_BODY_SIZE_BYTES"
    )

    # Monitoring Configuration
    prometheus_port: int = Field(default=9090, env="PROMETHEUS_PORT")
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    log_file: str = Field(default="logs/qcrypt.log", env="LOG_FILE")
    enable_detailed_logging: bool = Field(default=False, env="ENABLE_DETAILED_LOGGING")

    # Oracle Contract Addresses (Testnets)
    oracle_contract_sepolia: Optional[str] = Field(default=None, env="ORACLE_CONTRACT_SEPOLIA")
    oracle_contract_polygon_amoy: Optional[str] = Field(default=None, env="ORACLE_CONTRACT_POLYGON_AMOY")
    oracle_contract_bsc_testnet: Optional[str] = Field(default=None, env="ORACLE_CONTRACT_BSC_TESTNET")
    oracle_contract_avalanche_fuji: Optional[str] = Field(default=None, env="ORACLE_CONTRACT_AVALANCHE_FUJI")
    oracle_contract_fantom_testnet: Optional[str] = Field(default=None, env="ORACLE_CONTRACT_FANTOM_TESTNET")

    # Testnet RPC Configuration
    testnet_rpc_sepolia: str = Field(default="https://rpc.sepolia.org", env="TESTNET_RPC_SEPOLIA")
    testnet_rpc_polygon_amoy: str = Field(default="https://rpc.amoy.polygon.technology", env="TESTNET_RPC_POLYGON_AMOY")
    testnet_rpc_bsc_testnet: str = Field(default="https://data-seed-prebsc-1-s1.binance.org:8545", env="TESTNET_RPC_BSC_TESTNET")
    testnet_rpc_avalanche_fuji: str = Field(default="https://api.avax-test.network/ext/bc/C/rpc", env="TESTNET_RPC_AVALANCHE_FUJI")
    testnet_rpc_fantom_testnet: str = Field(default="https://rpc.testnet.fantom.network", env="TESTNET_RPC_FANTOM_TESTNET")

    # Testnet Chain IDs
    testnet_chain_id_sepolia: int = Field(default=11155111, env="TESTNET_CHAIN_ID_SEPOLIA")
    testnet_chain_id_polygon_amoy: int = Field(default=80002, env="TESTNET_CHAIN_ID_POLYGON_AMOY")
    testnet_chain_id_bsc_testnet: int = Field(default=97, env="TESTNET_CHAIN_ID_BSC_TESTNET")
    testnet_chain_id_avalanche_fuji: int = Field(default=43113, env="TESTNET_CHAIN_ID_AVALANCHE_FUJI")
    testnet_chain_id_fantom_testnet: int = Field(default=4002, env="TESTNET_CHAIN_ID_FANTOM_TESTNET")

    # Testnet Explorer URLs
    testnet_explorer_sepolia: str = Field(default="https://sepolia.etherscan.io", env="TESTNET_EXPLORER_SEPOLIA")
    testnet_explorer_polygon_amoy: str = Field(default="https://amoy.polygonscan.com", env="TESTNET_EXPLORER_POLYGON_AMOY")
    testnet_explorer_bsc_testnet: str = Field(default="https://testnet.bscscan.com", env="TESTNET_EXPLORER_BSC_TESTNET")
    testnet_explorer_avalanche_fuji: str = Field(default="https://testnet.snowtrace.io", env="TESTNET_EXPLORER_AVALANCHE_FUJI")
    testnet_explorer_fantom_testnet: str = Field(default="https://testnet.ftmscan.com", env="TESTNET_EXPLORER_FANTOM_TESTNET")

    # Stripe Billing
    stripe_secret_key: Optional[str] = Field(default=None, env="STRIPE_SECRET_KEY")
    stripe_webhook_secret: Optional[str] = Field(default=None, env="STRIPE_WEBHOOK_SECRET")
    stripe_price_id_pro: Optional[str] = Field(default=None, env="STRIPE_PRICE_ID_PRO")
    stripe_price_id_enterprise: Optional[str] = Field(default=None, env="STRIPE_PRICE_ID_ENTERPRISE")

    # Performance Settings
    max_workers: int = Field(default=4, env="MAX_WORKERS")
    connection_pool_size: int = Field(default=20, env="CONNECTION_POOL_SIZE")
    request_timeout: int = Field(default=30, env="REQUEST_TIMEOUT")

    # Audit and Compliance
    enable_audit_logging: bool = Field(default=True, env="ENABLE_AUDIT_LOGGING")
    audit_log_retention_days: int = Field(default=90, env="AUDIT_LOG_RETENTION_DAYS")
    fips_mode: bool = Field(default=False, env="FIPS_MODE")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )

    @field_validator("allowed_origins", mode='before')
    def parse_cors_origins(cls, v):
        """Parse CORS origins from comma-separated string"""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    @field_validator("secret_key", mode='before')
    @classmethod
    def validate_secret_key(cls, v):
        """Ensure secret key is secure in production"""
        if v == "your-secret-key-here-change-in-production":
            # For this validator, we'll just return the value and handle the check elsewhere
            # since we can't access other fields directly in a 'before' validator
            return v
        elif len(v) < 32:
            raise ValueError("Secret key must be at least 32 characters")
        return v

    @field_validator("quantum_backend", mode='before')
    @classmethod
    def validate_quantum_backend(cls, v):
        """Validate quantum backend configuration"""
        valid_backends = ["qrisp_simulator", "ibm_quantum", "iqm_quantum", "rigetti", "ionq", "amazon_braket"]
        if v not in valid_backends:
            raise ValueError(f"Invalid quantum backend. Must be one of: {valid_backends}")
        return v

    @property
    def quantum_backend_config(self) -> dict:
        """Get configuration for the selected quantum backend"""
        configs = {
            "qrisp_simulator": {
                "backend_name": "qrisp_simulator",
                "shots": 1024,
                "optimization_level": 3
            },
            "ibm_quantum": {
                "backend_name": "ibmq_qasm_simulator",
                "token": self.ibm_quantum_token,
                "hub": "ibm-q",
                "group": "open",
                "project": "main",
                "shots": 1024
            },
            "iqm_quantum": {
                "backend_name": "iqm_simulator",
                "server_url": self.iqm_server_url,
                "shots": 1024
            },
            "rigetti": {
                "backend_name": "rigetti_simulator",
                "api_key": self.rigetti_api_key,
                "shots": 1024
            },
            "ionq": {
                "backend_name": "ionq_simulator",
                "token": getattr(self, 'ionq_token', None),
                "shots": 1024
            },
            "amazon_braket": {
                "backend_name": "braket_simulator",
                "aws_access_key_id": getattr(self, 'aws_access_key_id', None),
                "aws_secret_access_key": getattr(self, 'aws_secret_access_key', None),
                "region": getattr(self, 'aws_region', 'us-east-1'),
                "shots": 1024
            }
        }
        return configs.get(self.quantum_backend, configs["qrisp_simulator"])

    def get_tier_limits(self, tier: str) -> dict:
        """Get rate limits for a specific tier"""
        tier_configs = {
            "free": {
                "max_bytes": self.free_tier_max_bytes,
                "max_requests": self.free_tier_max_requests,
                "rate_limit_period": self.rate_limit_period,
                "max_qubits": 8
            },
            "pro": {
                "max_bytes": self.pro_tier_max_bytes,
                "max_requests": self.pro_tier_max_requests,
                "rate_limit_period": self.rate_limit_period,
                "max_qubits": 12
            },
            "enterprise": {
                "max_bytes": self.enterprise_tier_max_bytes,
                "max_requests": self.enterprise_tier_max_requests,
                "rate_limit_period": self.rate_limit_period,
                "max_qubits": self.max_qubits
            }
        }
        return tier_configs.get(tier, tier_configs["free"])

    @property
    def is_production(self) -> bool:
        """Check if running in production environment"""
        return self.environment.lower() == "production"

    @property
    def is_development(self) -> bool:
        """Check if running in development environment"""
        return self.environment.lower() == "development"

    @property
    def testnet_oracle_config(self) -> dict:
        """Get testnet oracle configuration"""
        return {
            "sepolia": {
                "contract_address": self.oracle_contract_sepolia,
                "rpc_url": self.testnet_rpc_sepolia,
                "chain_id": self.testnet_chain_id_sepolia,
                "explorer_url": self.testnet_explorer_sepolia,
                "currency_symbol": "SepoliaETH"
            },
            "polygon_amoy": {
                "contract_address": self.oracle_contract_polygon_amoy,
                "rpc_url": self.testnet_rpc_polygon_amoy,
                "chain_id": self.testnet_chain_id_polygon_amoy,
                "explorer_url": self.testnet_explorer_polygon_amoy,
                "currency_symbol": "MATIC"
            },
            "bsc_testnet": {
                "contract_address": self.oracle_contract_bsc_testnet,
                "rpc_url": self.testnet_rpc_bsc_testnet,
                "chain_id": self.testnet_chain_id_bsc_testnet,
                "explorer_url": self.testnet_explorer_bsc_testnet,
                "currency_symbol": "tBNB"
            },
            "avalanche_fuji": {
                "contract_address": self.oracle_contract_avalanche_fuji,
                "rpc_url": self.testnet_rpc_avalanche_fuji,
                "chain_id": self.testnet_chain_id_avalanche_fuji,
                "explorer_url": self.testnet_explorer_avalanche_fuji,
                "currency_symbol": "AVAX"
            },
            "fantom_testnet": {
                "contract_address": self.oracle_contract_fantom_testnet,
                "rpc_url": self.testnet_rpc_fantom_testnet,
                "chain_id": self.testnet_chain_id_fantom_testnet,
                "explorer_url": self.testnet_explorer_fantom_testnet,
                "currency_symbol": "FTM"
            }
        }

    def get_testnet_oracle_config(self, network: str) -> dict:
        """Get configuration for a specific testnet"""
        config = self.testnet_oracle_config.get(network.lower())
        if not config:
            raise ValueError(f"Unknown testnet: {network}")
        if not config["contract_address"]:
            raise ValueError(f"Contract address not configured for {network}")
        return config

    def generate_secure_secret_key(self) -> str:
        """Generate a secure secret key for production use"""
        return secrets.token_urlsafe(32)


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


# Create global settings instance
settings = get_settings()

# Export commonly used settings
DEBUG = settings.debug
SECRET_KEY = settings.secret_key
DATABASE_URL = settings.database_url
REDIS_URL = settings.redis_url