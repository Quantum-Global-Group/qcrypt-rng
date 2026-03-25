# QCrypt RNG — Monitoring & Observability Guide

**Version:** 1.0
**Date:** 2026-03-06

---

## Overview

QCrypt RNG provides comprehensive monitoring and observability features using Prometheus metrics. The system exposes metrics for:

- Oracle fulfillment operations
- Post-quantum cryptography operations
- Quantum randomness generation
- Hardware device status
- Entropy quality
- API performance
- System resources

---

## Prometheus Metrics Endpoint

**Endpoint:** `GET /api/v2/monitoring/metrics`

**Content-Type:** `text/plain; version=0.0.4; charset=utf-8`

Returns metrics in Prometheus exposition format.

### Example Scrape Configuration

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'qcrypt-rng'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/api/v2/monitoring/metrics'
    scrape_interval: 15s
```

---

## Metric Categories

### 1. Oracle Fulfillment Metrics

| Metric Name | Type | Labels | Description |
|-------------|------|--------|-------------|
| `qcrypt_oracle_requests_total` | Counter | `chain`, `status` | Total oracle requests |
| `qcrypt_oracle_fulfillment_duration_seconds` | Histogram | `chain`, `status` | Fulfillment duration |
| `qcrypt_oracle_commit_duration_seconds` | Histogram | `chain` | Commit phase duration |
| `qcrypt_oracle_reveal_duration_seconds` | Histogram | `chain` | Reveal phase duration |
| `qcrypt_oracle_transactions_total` | Counter | `chain`, `type`, `status` | Blockchain transactions |
| `qcrypt_oracle_gas_used` | Histogram | `chain`, `type` | Gas used for transactions |
| `qcrypt_oracle_active_requests` | Gauge | `chain` | Active requests count |

**Example Query:**
```promql
# Oracle fulfillment success rate
rate(qcrypt_oracle_requests_total{status="success"}[5m]) 
/ 
rate(qcrypt_oracle_requests_total[5m])

# Average fulfillment duration by chain
histogram_quantile(0.95, rate(qcrypt_oracle_fulfillment_duration_seconds_bucket[5m]))
```

### 2. PQC Operation Metrics

| Metric Name | Type | Labels | Description |
|-------------|------|--------|-------------|
| `qcrypt_pqc_operations_total` | Counter | `algorithm`, `operation`, `status` | PQC operations count |
| `qcrypt_pqc_operation_duration_seconds` | Histogram | `algorithm`, `operation` | Operation duration |
| `qcrypt_pqc_key_size_bytes` | Histogram | `algorithm`, `key_type` | Generated key sizes |
| `qcrypt_pqc_signature_size_bytes` | Histogram | `algorithm` | Signature sizes |
| `qcrypt_pqc_kem_ciphertext_size_bytes` | Histogram | `algorithm` | KEM ciphertext sizes |
| `qcrypt_pqc_kem_shared_secret_size_bytes` | Histogram | `algorithm` | Shared secret sizes |

**Supported Algorithms:**
- DILITHIUM2, DILITHIUM3, DILITHIUM5
- FALCON512, FALCON1024
- SPHINCS+-SHA2-128f
- KYBER512, KYBER768, KYBER1024
- NTRU-HPS-2048-509, NTRU-HPS-2048-677
- SABER-LIGHTSABER, SABER-SABER, SABER-FIRESABER

**Example Query:**
```promql
# PQC operation success rate by algorithm
sum(rate(qcrypt_pqc_operations_total{status="success"}[5m])) by (algorithm)
/
sum(rate(qcrypt_pqc_operations_total[5m])) by (algorithm)

# 95th percentile key generation time
histogram_quantile(0.95, rate(qcrypt_pqc_operation_duration_seconds_bucket{operation="generate_keypair"}[5m]))
```

### 3. Quantum Randomness Generation Metrics

| Metric Name | Type | Labels | Description |
|-------------|------|--------|-------------|
| `qcrypt_qrng_bytes_generated_total` | Counter | `backend`, `format` | Total bytes generated |
| `qcrypt_qrng_generation_duration_seconds` | Histogram | `backend` | Generation duration |
| `qcrypt_qrng_entropy_bits` | Gauge | `backend` | Entropy pool size |
| `qcrypt_qrng_quality_score` | Gauge | `backend` | Quality score (0-1) |

**Example Query:**
```promql
# Bytes generated per second by backend
rate(qcrypt_qrng_bytes_generated_total[5m])

# Entropy pool health
qcrypt_qrng_entropy_bits > 100
```

### 4. Hardware Device Metrics

| Metric Name | Type | Labels | Description |
|-------------|------|--------|-------------|
| `qcrypt_hardware_device_status` | Gauge | `device_id`, `device_type`, `vendor` | Device status (1=up, 0=down) |
| `qcrypt_hardware_generation_rate_bps` | Gauge | `device_id`, `device_type` | Generation rate (bps) |
| `qcrypt_hardware_error_rate` | Gauge | `device_id`, `device_type` | Error rate |
| `qcrypt_hardware_temperature_celsius` | Gauge | `device_id`, `device_type` | Device temperature |
| `qcrypt_hardware_uptime_seconds` | Gauge | `device_id`, `device_type` | Device uptime |

**Supported Vendors:**
- ID Quantique (Quantis)
- QuintessenceLabs (qStream)
- Generic photonic/superconducting devices

**Example Query:**
```promql
# Hardware device availability
qcrypt_hardware_device_status{vendor="ID Quantique"}

# Average generation rate by vendor
avg(qcrypt_hardware_generation_rate_bps) by (vendor)
```

### 5. Entropy Quality Metrics

| Metric Name | Type | Labels | Description |
|-------------|------|--------|-------------|
| `qcrypt_entropy_shannon_entropy` | Gauge | `source` | Shannon entropy (bits/byte) |
| `qcrypt_entropy_min_entropy` | Gauge | `source` | Min-entropy (bits/byte) |
| `qcrypt_entropy_chi_square` | Gauge | `source` | Chi-square statistic |
| `qcrypt_entropy_quality_status` | Gauge | `source` | Quality status (1=good, 0=poor) |

**Quality Thresholds:**
- Shannon entropy: > 7.9 bits/byte (excellent), > 7.5 (good), < 7.0 (poor)
- Min-entropy: > 7.0 bits/byte (acceptable)
- Chi-square: < 293.25 (pass uniformity test)

**Example Query:**
```promql
# Entropy quality alerts
qcrypt_entropy_shannon_entropy < 7.5
qcrypt_entropy_min_entropy < 7.0
qcrypt_entropy_quality_status == 0
```

### 6. API Performance Metrics

| Metric Name | Type | Labels | Description |
|-------------|------|--------|-------------|
| `qcrypt_api_requests_total` | Counter | `endpoint`, `method`, `status` | API request count |
| `qcrypt_api_request_duration_seconds` | Histogram | `endpoint`, `method` | Request duration |
| `qcrypt_api_request_size_bytes` | Histogram | `endpoint` | Request size |
| `qcrypt_api_response_size_bytes` | Histogram | `endpoint` | Response size |
| `qcrypt_api_active_connections` | Gauge | - | Active connections |

**Example Query:**
```promql
# API error rate
sum(rate(qcrypt_api_requests_total{status="error"}[5m]))
/
sum(rate(qcrypt_api_requests_total[5m]))

# 99th percentile API latency
histogram_quantile(0.99, rate(qcrypt_api_request_duration_seconds_bucket[5m]))
```

### 7. System Metrics

| Metric Name | Type | Labels | Description |
|-------------|------|--------|-------------|
| `qcrypt_system_info` | Gauge | `version`, `environment`, `quantum_backend` | System information |
| `qcrypt_system_memory_usage_bytes` | Gauge | - | Memory usage |
| `qcrypt_system_cpu_usage_percent` | Gauge | - | CPU usage |

---

## Health Check Endpoints

### Quick Health Check

**Endpoint:** `GET /api/v2/monitoring/status`

**Response:**
```json
{
  "status": "success",
  "request_id": "status_1234567890",
  "data": {
    "status": "operational",
    "version": "2.0.0",
    "environment": "production",
    "timestamp": 1234567890.0
  }
}
```

### Detailed Health Check

**Endpoint:** `GET /api/v2/monitoring/health/detailed`

**Response:**
```json
{
  "status": "success",
  "request_id": "health_1234567890",
  "data": {
    "status": "healthy",
    "timestamp": 1234567890.0,
    "version": "2.0.0",
    "environment": "production",
    "components": {
      "api": {
        "status": "healthy",
        "uptime_seconds": 3600
      },
      "quantum_backend": {
        "status": "healthy",
        "backend": "qrisp_simulator",
        "total_bytes_generated": 1000000,
        "entropy_pool_size": 500
      },
      "hardware": {
        "status": "healthy",
        "device_count": 2,
        "devices": [...]
      },
      "entropy": {
        "status": "healthy",
        "shannon_entropy": 7.95,
        "min_entropy": 7.8,
        "health_status": "excellent"
      },
      "system": {
        "status": "healthy",
        "cpu_percent": 25.5,
        "memory_percent": 45.2,
        "memory_available_mb": 8192
      }
    }
  }
}
```

### Metrics Summary

**Endpoint:** `GET /api/v2/monitoring/metrics/summary`

Returns a human-readable JSON summary of key metrics.

---

## Alerting Rules

### Prometheus Alert Rules

```yaml
# alerting_rules.yml
groups:
  - name: qcrypt_rng
    rules:
      # Oracle fulfillment failures
      - alert: OracleFulfillmentHighFailureRate
        expr: |
          sum(rate(qcrypt_oracle_requests_total{status="error"}[5m])) 
          / 
          sum(rate(qcrypt_oracle_requests_total[5m])) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High oracle fulfillment failure rate"
          description: "Oracle failure rate is {{ $value | humanizePercentage }}"

      # Low entropy quality
      - alert: EntropyQualityPoor
        expr: qcrypt_entropy_shannon_entropy < 7.5
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Low entropy quality detected"
          description: "Shannon entropy is {{ $value }} bits/byte"

      # Hardware device offline
      - alert: HardwareDeviceOffline
        expr: qcrypt_hardware_device_status == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Hardware device offline"
          description: "Device {{ $labels.device_id }} is not operational"

      # High API latency
      - alert: APILatencyHigh
        expr: |
          histogram_quantile(0.95, rate(qcrypt_api_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High API latency"
          description: "95th percentile latency is {{ $value }}s"

      # High CPU usage
      - alert: SystemCPUHigh
        expr: qcrypt_system_cpu_usage_percent > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage"
          description: "CPU usage is {{ $value }}%"

      # High memory usage
      - alert: SystemMemoryHigh
        expr: qcrypt_system_memory_usage_bytes / (1024 * 1024 * 1024) > 7
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage exceeds 7GB"
```

---

## Grafana Dashboard

### Example Dashboard JSON

A sample Grafana dashboard configuration is available in `monitoring/grafana-dashboard.json`.

**Key Panels:**
1. Oracle fulfillment success rate (by chain)
2. PQC operation latency (by algorithm)
3. QRNG bytes generated over time
4. Hardware device status
5. Entropy quality metrics
6. API request rate and latency
7. System resource usage

### Import Dashboard

1. Open Grafana
2. Go to Dashboards → Import
3. Upload `monitoring/grafana-dashboard.json`
4. Select Prometheus data source
5. Click Import

---

## Metric Recording API

### Record PQC Metric

**Endpoint:** `POST /api/v2/monitoring/metrics/record/pqc`

**Parameters:**
- `algorithm` (string): Algorithm name
- `operation` (string): Operation type
- `status` (string): success/error
- `duration_seconds` (float): Operation duration
- `key_size_bytes` (int): Key size (optional)

**Example:**
```bash
curl -X POST "http://localhost:8000/api/v2/monitoring/metrics/record/pqc" \
  -d "algorithm=KYBER768" \
  -d "operation=encapsulate" \
  -d "status=success" \
  -d "duration_seconds=0.015"
```

### Record Oracle Metric

**Endpoint:** `POST /api/v2/monitoring/metrics/record/oracle`

**Parameters:**
- `chain` (string): Blockchain name
- `event_type` (string): request/fulfillment/commit/reveal/transaction
- `status` (string): success/error
- `duration_seconds` (float): Event duration
- `gas_used` (int): Gas used (optional)

**Example:**
```bash
curl -X POST "http://localhost:8000/api/v2/monitoring/metrics/record/oracle" \
  -d "chain=ethereum" \
  -d "event_type=fulfillment" \
  -d "status=success" \
  -d "duration_seconds=2.5"
```

---

## Python SDK Integration

### Recording Metrics in Code

```python
from app.monitoring import (
    OracleMetrics,
    PQCMetrics,
    QRNGMetrics,
    HardwareMetrics,
    EntropyMetrics,
    APIMetrics
)

# Record oracle fulfillment
OracleMetrics.record_fulfillment(
    chain="ethereum",
    status="success",
    duration=2.5
)

# Record PQC operation
PQCMetrics.record_operation(
    algorithm="KYBER768",
    operation="encapsulate",
    status="success",
    duration=0.015
)

# Record QRNG generation
QRNGMetrics.record_bytes_generated(
    backend="qrisp_simulator",
    format="hex",
    count=1024
)

# Update hardware status
HardwareMetrics.update_device_status(
    device_id="idq_usb_0",
    device_type="photonic",
    vendor="ID Quantique",
    status=1  # 1=operational
)

# Update entropy quality
EntropyMetrics.update_shannon_entropy(
    source="qrng_pool",
    entropy=7.95
)

# Record API request
APIMetrics.record_request(
    endpoint="/api/v2/pqc/kem/generate",
    method="POST",
    status="success",
    duration=0.05,
    request_size=256,
    response_size=2048
)
```

### Using Decorators

```python
from app.monitoring import track_pqc_operation, track_api_request

@track_pqc_operation(algorithm="KYBER768", operation="encapsulate")
async def encapsulate_shared_secret(public_key: bytes) -> EncapsulationResult:
    # Your implementation
    pass

@track_api_request(endpoint="/pqc/kem/encapsulate", method="POST")
async def encapsulate_endpoint(request: Request):
    # Your implementation
    pass
```

---

## Best Practices

### 1. Metric Naming
- Use lowercase with underscores
- Include units in metric names (seconds, bytes, etc.)
- Use base units (seconds, not milliseconds)

### 2. Labels
- Keep label cardinality low
- Don't use high-cardinality data (user IDs, timestamps)
- Use consistent label names across metrics

### 3. Alerting
- Set appropriate thresholds based on historical data
- Use rate-based metrics for alerts
- Include runbook links in alert annotations

### 4. Performance
- Metrics endpoint should be fast (< 100ms)
- Use histogram buckets wisely
- Clean up old metrics on shutdown

---

## Troubleshooting

### Metrics Not Showing
1. Check if metrics are being recorded
2. Verify Prometheus scrape configuration
3. Check application logs for errors

### High Cardinality Issues
1. Review label usage
2. Remove dynamic labels (user IDs, request IDs)
3. Aggregate metrics where possible

### Missing Metrics
1. Verify metric registration in `app/monitoring/metrics.py`
2. Check if metric recording code is executed
3. Verify Prometheus is scraping the endpoint

---

## References

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/)
- [Grafana Documentation](https://grafana.com/docs/)
- [OpenMetrics Specification](https://openmetrics.io/)

---

*Last updated: 2026-03-06*
