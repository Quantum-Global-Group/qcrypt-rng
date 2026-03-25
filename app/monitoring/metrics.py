"""
QCrypt RNG - Monitoring and Observability Module

Provides Prometheus metrics for:
- Oracle fulfillment (latency, success/failure, per-chain)
- PQC operations (key generation, sign/verify, KEM)
- Quantum randomness generation
- Entropy quality
- Hardware status
- API performance
"""

from prometheus_client import (
    Counter,
    Histogram,
    Gauge,
    Summary,
    CollectorRegistry,
    generate_latest,
    CONTENT_TYPE_LATEST,
    start_http_server,
    multiprocess,
    CollectorRegistry
)
from prometheus_client.multiprocess import MultiProcessCollector
import time
import os
from typing import Optional, Dict, Any
from functools import wraps
import asyncio


# ============================================================================
# Metric Definitions
# ============================================================================

# Registry
registry = CollectorRegistry()

# ----------------------------------------------------------------------------
# Oracle Fulfillment Metrics
# ----------------------------------------------------------------------------

oracle_requests_total = Counter(
    'qcrypt_oracle_requests_total',
    'Total number of oracle requests',
    ['chain', 'status'],
    registry=registry
)

oracle_fulfillment_duration = Histogram(
    'qcrypt_oracle_fulfillment_duration_seconds',
    'Time spent fulfilling oracle requests',
    ['chain', 'status'],
    buckets=(0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0, float('inf')),
    registry=registry
)

oracle_commit_duration = Histogram(
    'qcrypt_oracle_commit_duration_seconds',
    'Time spent in commit phase',
    ['chain'],
    buckets=(0.1, 0.5, 1.0, 2.0, 5.0, 10.0, float('inf')),
    registry=registry
)

oracle_reveal_duration = Histogram(
    'qcrypt_oracle_reveal_duration_seconds',
    'Time spent in reveal phase',
    ['chain'],
    buckets=(0.1, 0.5, 1.0, 2.0, 5.0, 10.0, float('inf')),
    registry=registry
)

oracle_transactions_total = Counter(
    'qcrypt_oracle_transactions_total',
    'Total number of blockchain transactions',
    ['chain', 'type', 'status'],
    registry=registry
)

oracle_gas_used = Histogram(
    'qcrypt_oracle_gas_used',
    'Gas used for oracle transactions',
    ['chain', 'type'],
    buckets=(10000, 50000, 100000, 200000, 500000, 1000000, float('inf')),
    registry=registry
)

oracle_active_requests = Gauge(
    'qcrypt_oracle_active_requests',
    'Number of active oracle requests',
    ['chain'],
    registry=registry
)

# ----------------------------------------------------------------------------
# PQC Operation Metrics
# ----------------------------------------------------------------------------

pqc_operations_total = Counter(
    'qcrypt_pqc_operations_total',
    'Total number of PQC operations',
    ['algorithm', 'operation', 'status'],
    registry=registry
)

pqc_operation_duration = Histogram(
    'qcrypt_pqc_operation_duration_seconds',
    'Time spent on PQC operations',
    ['algorithm', 'operation'],
    buckets=(0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0, float('inf')),
    registry=registry
)

pqc_key_sizes = Histogram(
    'qcrypt_pqc_key_size_bytes',
    'Size of generated PQC keys',
    ['algorithm', 'key_type'],
    buckets=(64, 128, 256, 512, 1024, 2048, 4096, 8192, float('inf')),
    registry=registry
)

pqc_signature_sizes = Histogram(
    'qcrypt_pqc_signature_size_bytes',
    'Size of PQC signatures',
    ['algorithm'],
    buckets=(256, 512, 1024, 2048, 4096, 8192, 16384, float('inf')),
    registry=registry
)

pqc_kem_ciphertext_sizes = Histogram(
    'qcrypt_pqc_kem_ciphertext_size_bytes',
    'Size of KEM ciphertexts',
    ['algorithm'],
    buckets=(256, 512, 768, 1024, 1568, 2048, float('inf')),
    registry=registry
)

pqc_kem_shared_secret_sizes = Histogram(
    'qcrypt_pqc_kem_shared_secret_size_bytes',
    'Size of KEM shared secrets',
    ['algorithm'],
    buckets=(16, 32, 64, 128, 256, float('inf')),
    registry=registry
)

# ----------------------------------------------------------------------------
# Quantum Randomness Generation Metrics
# ----------------------------------------------------------------------------

qrng_bytes_generated_total = Counter(
    'qcrypt_qrng_bytes_generated_total',
    'Total bytes of quantum randomness generated',
    ['backend', 'format'],
    registry=registry
)

qrng_generation_duration = Histogram(
    'qcrypt_qrng_generation_duration_seconds',
    'Time spent generating quantum randomness',
    ['backend'],
    buckets=(0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0, float('inf')),
    registry=registry
)

qrng_entropy_bits = Gauge(
    'qcrypt_qrng_entropy_bits',
    'Current entropy bits in pool',
    ['backend'],
    registry=registry
)

qrng_quality_score = Gauge(
    'qcrypt_qrng_quality_score',
    'Quality score of quantum randomness (0-1)',
    ['backend'],
    registry=registry
)

# ----------------------------------------------------------------------------
# Hardware Metrics
# ----------------------------------------------------------------------------

hardware_device_status = Gauge(
    'qcrypt_hardware_device_status',
    'Status of quantum hardware devices (1=operational, 0=disconnected, -1=error)',
    ['device_id', 'device_type', 'vendor'],
    registry=registry
)

hardware_generation_rate = Gauge(
    'qcrypt_hardware_generation_rate_bps',
    'Random bit generation rate (bits per second)',
    ['device_id', 'device_type'],
    registry=registry
)

hardware_error_rate = Gauge(
    'qcrypt_hardware_error_rate',
    'Error rate of quantum hardware device',
    ['device_id', 'device_type'],
    registry=registry
)

hardware_temperature = Gauge(
    'qcrypt_hardware_temperature_celsius',
    'Temperature of quantum hardware device',
    ['device_id', 'device_type'],
    registry=registry
)

hardware_uptime = Gauge(
    'qcrypt_hardware_uptime_seconds',
    'Uptime of quantum hardware device',
    ['device_id', 'device_type'],
    registry=registry
)

# ----------------------------------------------------------------------------
# Entropy Quality Metrics
# ----------------------------------------------------------------------------

entropy_shannon_entropy = Gauge(
    'qcrypt_entropy_shannon_entropy',
    'Shannon entropy estimate (bits per byte)',
    ['source'],
    registry=registry
)

entropy_min_entropy = Gauge(
    'qcrypt_entropy_min_entropy',
    'Min-entropy estimate (bits per byte)',
    ['source'],
    registry=registry
)

entropy_chi_square = Gauge(
    'qcrypt_entropy_chi_square',
    'Chi-square statistic for uniformity test',
    ['source'],
    registry=registry
)

entropy_quality_status = Gauge(
    'qcrypt_entropy_quality_status',
    'Overall entropy quality status (1=GOOD, 0=POOR)',
    ['source'],
    registry=registry
)

# ----------------------------------------------------------------------------
# API Performance Metrics
# ----------------------------------------------------------------------------

api_requests_total = Counter(
    'qcrypt_api_requests_total',
    'Total API requests',
    ['endpoint', 'method', 'status'],
    registry=registry
)

api_request_duration = Histogram(
    'qcrypt_api_request_duration_seconds',
    'API request duration',
    ['endpoint', 'method'],
    buckets=(0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, float('inf')),
    registry=registry
)

api_request_size = Histogram(
    'qcrypt_api_request_size_bytes',
    'Size of API requests',
    ['endpoint'],
    buckets=(100, 500, 1000, 5000, 10000, 100000, float('inf')),
    registry=registry
)

api_response_size = Histogram(
    'qcrypt_api_response_size_bytes',
    'Size of API responses',
    ['endpoint'],
    buckets=(100, 500, 1000, 5000, 10000, 100000, 1000000, float('inf')),
    registry=registry
)

api_active_connections = Gauge(
    'qcrypt_api_active_connections',
    'Number of active API connections',
    registry=registry
)

# ----------------------------------------------------------------------------
# System Metrics
# ----------------------------------------------------------------------------

system_info = Gauge(
    'qcrypt_system_info',
    'System information',
    ['version', 'environment', 'quantum_backend'],
    registry=registry
)

system_memory_usage = Gauge(
    'qcrypt_system_memory_usage_bytes',
    'System memory usage',
    registry=registry
)

system_cpu_usage = Gauge(
    'qcrypt_system_cpu_usage_percent',
    'System CPU usage percentage',
    registry=registry
)


# ============================================================================
# Metric Recording Functions
# ============================================================================

class OracleMetrics:
    """Helper class for recording oracle metrics"""

    @staticmethod
    def record_request(chain: str, status: str = 'success'):
        """Record an oracle request"""
        oracle_requests_total.labels(chain=chain, status=status).inc()

    @staticmethod
    def record_fulfillment(chain: str, status: str, duration: float):
        """Record fulfillment duration"""
        oracle_fulfillment_duration.labels(chain=chain, status=status).observe(duration)

    @staticmethod
    def record_commit(chain: str, duration: float):
        """Record commit phase duration"""
        oracle_commit_duration.labels(chain=chain).observe(duration)

    @staticmethod
    def record_reveal(chain: str, duration: float):
        """Record reveal phase duration"""
        oracle_reveal_duration.labels(chain=chain).observe(duration)

    @staticmethod
    def record_transaction(chain: str, tx_type: str, status: str, gas_used: Optional[int] = None):
        """Record a blockchain transaction"""
        oracle_transactions_total.labels(chain=chain, type=tx_type, status=status).inc()
        if gas_used:
            oracle_gas_used.labels(chain=chain, type=tx_type).observe(gas_used)

    @staticmethod
    def update_active_requests(chain: str, count: int):
        """Update active requests gauge"""
        oracle_active_requests.labels(chain=chain).set(count)


class PQCMetrics:
    """Helper class for recording PQC metrics"""

    @staticmethod
    def record_operation(algorithm: str, operation: str, status: str, duration: float):
        """Record a PQC operation"""
        pqc_operations_total.labels(algorithm=algorithm, operation=operation, status=status).inc()
        pqc_operation_duration.labels(algorithm=algorithm, operation=operation).observe(duration)

    @staticmethod
    def record_key_size(algorithm: str, key_type: str, size_bytes: int):
        """Record key size"""
        pqc_key_sizes.labels(algorithm=algorithm, key_type=key_type).observe(size_bytes)

    @staticmethod
    def record_signature_size(algorithm: str, size_bytes: int):
        """Record signature size"""
        pqc_signature_sizes.labels(algorithm=algorithm).observe(size_bytes)

    @staticmethod
    def record_kem_ciphertext_size(algorithm: str, size_bytes: int):
        """Record KEM ciphertext size"""
        pqc_kem_ciphertext_sizes.labels(algorithm=algorithm).observe(size_bytes)

    @staticmethod
    def record_kem_shared_secret_size(algorithm: str, size_bytes: int):
        """Record KEM shared secret size"""
        pqc_kem_shared_secret_sizes.labels(algorithm=algorithm).observe(size_bytes)


class QRNGMetrics:
    """Helper class for recording QRNG metrics"""

    @staticmethod
    def record_bytes_generated(backend: str, format: str, count: int):
        """Record bytes generated"""
        qrng_bytes_generated_total.labels(backend=backend, format=format).inc(count)

    @staticmethod
    def record_generation_duration(backend: str, duration: float):
        """Record generation duration"""
        qrng_generation_duration.labels(backend=backend).observe(duration)

    @staticmethod
    def update_entropy_bits(backend: str, bits: int):
        """Update entropy bits gauge"""
        qrng_entropy_bits.labels(backend=backend).set(bits)

    @staticmethod
    def update_quality_score(backend: str, score: float):
        """Update quality score"""
        qrng_quality_score.labels(backend=backend).set(score)


class HardwareMetrics:
    """Helper class for recording hardware metrics"""

    @staticmethod
    def update_device_status(device_id: str, device_type: str, vendor: str, status: int):
        """Update device status (1=operational, 0=disconnected, -1=error)"""
        hardware_device_status.labels(device_id=device_id, device_type=device_type, vendor=vendor).set(status)

    @staticmethod
    def update_generation_rate(device_id: str, device_type: str, rate_bps: float):
        """Update generation rate"""
        hardware_generation_rate.labels(device_id=device_id, device_type=device_type).set(rate_bps)

    @staticmethod
    def update_error_rate(device_id: str, device_type: str, rate: float):
        """Update error rate"""
        hardware_error_rate.labels(device_id=device_id, device_type=device_type).set(rate)

    @staticmethod
    def update_temperature(device_id: str, device_type: str, temp: float):
        """Update temperature"""
        hardware_temperature.labels(device_id=device_id, device_type=device_type).set(temp)

    @staticmethod
    def update_uptime(device_id: str, device_type: str, uptime: float):
        """Update uptime"""
        hardware_uptime.labels(device_id=device_id, device_type=device_type).set(uptime)


class EntropyMetrics:
    """Helper class for recording entropy quality metrics"""

    @staticmethod
    def update_shannon_entropy(source: str, entropy: float):
        """Update Shannon entropy"""
        entropy_shannon_entropy.labels(source=source).set(entropy)

    @staticmethod
    def update_min_entropy(source: str, entropy: float):
        """Update min-entropy"""
        entropy_min_entropy.labels(source=source).set(entropy)

    @staticmethod
    def update_chi_square(source: str, chi_square: float):
        """Update chi-square statistic"""
        entropy_chi_square.labels(source=source).set(chi_square)

    @staticmethod
    def update_quality_status(source: str, is_good: bool):
        """Update quality status"""
        entropy_quality_status.labels(source=source).set(1 if is_good else 0)


class APIMetrics:
    """Helper class for recording API metrics"""

    @staticmethod
    def record_request(endpoint: str, method: str, status: str, duration: float, 
                      request_size: Optional[int] = None, response_size: Optional[int] = None):
        """Record an API request"""
        api_requests_total.labels(endpoint=endpoint, method=method, status=status).inc()
        api_request_duration.labels(endpoint=endpoint, method=method).observe(duration)
        if request_size:
            api_request_size.labels(endpoint=endpoint).observe(request_size)
        if response_size:
            api_response_size.labels(endpoint=endpoint).observe(response_size)

    @staticmethod
    def update_active_connections(count: int):
        """Update active connections gauge"""
        api_active_connections.set(count)


# ============================================================================
# Decorators
# ============================================================================

def track_pqc_operation(algorithm: str, operation: str):
    """Decorator to track PQC operations"""
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time.time()
            status = 'success'
            try:
                result = await func(*args, **kwargs)
                return result
            except Exception as e:
                status = 'error'
                raise
            finally:
                duration = time.time() - start_time
                PQCMetrics.record_operation(algorithm, operation, status, duration)
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = time.time()
            status = 'success'
            try:
                result = func(*args, **kwargs)
                return result
            except Exception as e:
                status = 'error'
                raise
            finally:
                duration = time.time() - start_time
                PQCMetrics.record_operation(algorithm, operation, status, duration)
        
        # Check if function is async
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    return decorator


def track_api_request(endpoint: str, method: str):
    """Decorator to track API requests"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            status = 'success'
            request_size = kwargs.get('request_size')
            response_size = None
            try:
                result = await func(*args, **kwargs)
                if hasattr(result, 'body'):
                    response_size = len(str(result.body))
                return result
            except Exception as e:
                status = 'error'
                raise
            finally:
                duration = time.time() - start_time
                APIMetrics.record_request(
                    endpoint, method, status, duration,
                    request_size=request_size, response_size=response_size
                )
        return wrapper
    return decorator


# ============================================================================
# Utility Functions
# ============================================================================

def get_metrics() -> str:
    """Get current metrics in Prometheus format"""
    return generate_latest(registry).decode('utf-8')


def get_metrics_content_type() -> str:
    """Get metrics content type"""
    return CONTENT_TYPE_LATEST


def start_metrics_server(port: int = 9090):
    """Start Prometheus metrics HTTP server"""
    start_http_server(port, registry=registry)


def setup_system_info(version: str, environment: str, quantum_backend: str):
    """Set system information metric"""
    system_info.labels(version=version, environment=environment, quantum_backend=quantum_backend).set(1)


def initialize_multiprocess_mode():
    """Initialize multiprocess mode for Prometheus"""
    prometheus_multiproc_dir = os.environ.get('PROMETHEUS_MULTIPROC_DIR')
    if prometheus_multiproc_dir:
        MultiProcessCollector(registry)
