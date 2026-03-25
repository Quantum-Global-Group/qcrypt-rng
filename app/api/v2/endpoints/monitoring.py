"""
QCrypt RNG API - Monitoring Endpoints

Provides Prometheus metrics and system health endpoints.
"""

from fastapi import APIRouter, Response, Request, HTTPException
from typing import Dict, Any, Optional
import time
import psutil
import os

from app.api.v2.models.responses import BaseResponse, ResponseStatus
from app.utils.logging import logger
from app.monitoring import (
    get_metrics,
    get_metrics_content_type,
    QRNGMetrics,
    HardwareMetrics,
    EntropyMetrics,
    APIMetrics,
    setup_system_info,
    OracleMetrics
)
from app.quantum.qrng import get_quantum_rng
from app.quantum.hardware_interface import get_quantum_hardware_manager
from app.config import settings

router = APIRouter()


@router.get("/metrics")
async def prometheus_metrics():
    """
    Prometheus metrics endpoint

    Returns metrics in Prometheus exposition format.
    Scrape this endpoint with Prometheus to collect metrics.

    **Metrics included:**
    - Oracle fulfillment (requests, duration, transactions)
    - PQC operations (key gen, sign, verify, KEM)
    - QRNG generation (bytes, duration, entropy)
    - Hardware status (device status, temperature, error rate)
    - Entropy quality (Shannon, min-entropy, chi-square)
    - API performance (requests, duration, sizes)
    - System info (version, environment, backend)
    """
    # Update dynamic metrics before returning
    try:
        # Update QRNG metrics
        qrng = get_quantum_rng()
        stats = qrng.get_statistics()
        QRNGMetrics.update_entropy_bits(
            stats.get('backend', 'simulator'),
            len(qrng.entropy_pool)
        )

        # Update entropy quality metrics
        entropy_analysis = qrng.analyze_entropy()
        EntropyMetrics.update_shannon_entropy(
            'qrng_pool',
            entropy_analysis.shannon_entropy
        )
        EntropyMetrics.update_min_entropy(
            'qrng_pool',
            entropy_analysis.min_entropy
        )
        EntropyMetrics.update_quality_status(
            'qrng_pool',
            entropy_analysis.health_status in ['excellent', 'good']
        )

        # Update hardware metrics
        hw_manager = get_quantum_hardware_manager()
        if hw_manager.devices:
            statuses = await hw_manager.get_device_status()
            for device_id, status in statuses.items():
                vendor = status.get('vendor', 'unknown')
                device_type = status.get('device_type', 'unknown')
                is_operational = status.get('status') == 'operational'
                
                HardwareMetrics.update_device_status(
                    device_id, device_type, vendor,
                    1 if is_operational else 0
                )
                
                if 'generation_rate_bps' in status:
                    HardwareMetrics.update_generation_rate(
                        device_id, device_type,
                        status['generation_rate_bps']
                    )
                
                if 'error_rate' in status:
                    HardwareMetrics.update_error_rate(
                        device_id, device_type,
                        status['error_rate']
                    )
                
                if 'temperature' in status and status['temperature'] != 'N/A':
                    HardwareMetrics.update_temperature(
                        device_id, device_type,
                        float(status['temperature'])
                    )
                
                if 'uptime_seconds' in status:
                    HardwareMetrics.update_uptime(
                        device_id, device_type,
                        status['uptime_seconds']
                    )

    except Exception as e:
        logger.error(f"Error updating metrics: {e}")

    # Return metrics in Prometheus format
    return Response(
        content=get_metrics(),
        media_type=get_metrics_content_type()
    )


@router.get("/health/detailed", response_model=BaseResponse)
async def detailed_health_check():
    """
    Detailed health check with component status

    Returns detailed information about all system components:
    - API server status
    - Quantum backend status
    - Hardware devices
    - Entropy quality
    - Database connection (if configured)
    - Redis connection (if configured)
    """
    import sys
    
    health_data = {
        "status": "healthy",
        "timestamp": time.time(),
        "version": settings.app_version,
        "environment": settings.environment,
        "components": {}
    }

    # API Server
    health_data["components"]["api"] = {
        "status": "healthy",
        "uptime_seconds": time.time() - start_time if (start_time := getattr(detailed_health_check, 'start_time', time.time())) else 0
    }
    detailed_health_check.start_time = start_time

    # Quantum Backend
    try:
        qrng = get_quantum_rng()
        stats = qrng.get_statistics()
        health_data["components"]["quantum_backend"] = {
            "status": "healthy",
            "backend": stats.get("backend", "unknown"),
            "total_bytes_generated": stats.get("total_bytes_generated", 0),
            "entropy_pool_size": len(qrng.entropy_pool)
        }
    except Exception as e:
        health_data["components"]["quantum_backend"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health_data["status"] = "degraded"

    # Hardware Devices
    try:
        hw_manager = get_quantum_hardware_manager()
        devices = hw_manager.get_available_devices()
        device_statuses = []
        
        if devices:
            statuses = await hw_manager.get_device_status()
            for device_id in devices:
                status = statuses.get(device_id, {})
                device_statuses.append({
                    "device_id": device_id,
                    "status": status.get("status", "unknown"),
                    "type": status.get("device_type", "unknown")
                })
        
        health_data["components"]["hardware"] = {
            "status": "healthy" if devices else "no_devices",
            "device_count": len(devices),
            "devices": device_statuses
        }
    except Exception as e:
        health_data["components"]["hardware"] = {
            "status": "unhealthy",
            "error": str(e)
        }

    # Entropy Quality
    try:
        qrng = get_quantum_rng()
        analysis = qrng.analyze_entropy()
        health_data["components"]["entropy"] = {
            "status": "healthy" if analysis.health_status in ["excellent", "good"] else "degraded",
            "shannon_entropy": analysis.shannon_entropy,
            "min_entropy": analysis.min_entropy,
            "health_status": analysis.health_status
        }
        if analysis.health_status == "poor":
            health_data["status"] = "degraded"
    except Exception as e:
        health_data["components"]["entropy"] = {
            "status": "unknown",
            "error": str(e)
        }

    # System Resources
    try:
        cpu_percent = psutil.cpu_percent(interval=0.1)
        memory = psutil.virtual_memory()
        health_data["components"]["system"] = {
            "status": "healthy" if cpu_percent < 90 and memory.percent < 90 else "warning",
            "cpu_percent": cpu_percent,
            "memory_percent": memory.percent,
            "memory_available_mb": memory.available // (1024 * 1024)
        }
        if cpu_percent >= 90 or memory.percent >= 90:
            health_data["status"] = "degraded"
    except Exception as e:
        health_data["components"]["system"] = {
            "status": "unknown",
            "error": str(e)
        }

    # Determine overall status
    component_statuses = [
        c.get("status") for c in health_data["components"].values()
    ]
    if "unhealthy" in component_statuses:
        health_data["status"] = "unhealthy"
    elif "degraded" in component_statuses or "warning" in component_statuses:
        health_data["status"] = "degraded"

    return BaseResponse(
        status=ResponseStatus.SUCCESS if health_data["status"] == "healthy" else ResponseStatus.ERROR,
        request_id=f"health_{int(time.time()*1000000)}",
        data=health_data
    )


@router.get("/status", response_model=BaseResponse)
async def system_status():
    """
    Quick system status check

    Returns a lightweight status response for load balancers
    and orchestration systems.
    """
    return BaseResponse(
        status=ResponseStatus.SUCCESS,
        request_id=f"status_{int(time.time()*1000000)}",
        data={
            "status": "operational",
            "version": settings.app_version,
            "environment": settings.environment,
            "timestamp": time.time()
        }
    )


@router.get("/metrics/summary", response_model=BaseResponse)
async def metrics_summary():
    """
    Human-readable metrics summary

    Returns a summary of key metrics in JSON format.
    """
    qrng = get_quantum_rng()
    stats = qrng.get_statistics()
    entropy_analysis = qrng.analyze_entropy()
    
    hw_manager = get_quantum_hardware_manager()
    devices = hw_manager.get_available_devices()

    summary = {
        "quantum_generation": {
            "total_bytes": stats.get("total_bytes_generated", 0),
            "total_generations": stats.get("total_generations", 0),
            "avg_generation_time_ms": stats.get("average_generation_time_ms", 0),
            "backend": stats.get("backend", "simulator")
        },
        "entropy": {
            "pool_size": len(qrng.entropy_pool),
            "shannon_entropy": entropy_analysis.shannon_entropy,
            "min_entropy": entropy_analysis.min_entropy,
            "health_status": entropy_analysis.health_status
        },
        "hardware": {
            "device_count": len(devices),
            "devices": devices
        },
        "system": {
            "cpu_percent": psutil.cpu_percent(interval=0.1),
            "memory_percent": psutil.virtual_memory().percent,
            "uptime_seconds": time.time() - getattr(system_status, 'start_time', time.time())
        }
    }
    system_status.start_time = getattr(system_status, 'start_time', time.time())

    return BaseResponse(
        status=ResponseStatus.SUCCESS,
        request_id=f"metrics_summary_{int(time.time()*1000000)}",
        data=summary
    )


@router.post("/metrics/record/pqc")
async def record_pqc_metric(
    algorithm: str,
    operation: str,
    status: str = "success",
    duration_seconds: float = 0,
    key_size_bytes: int = 0
):
    """
    Record a PQC operation metric

    Allows external components to record PQC metrics.
    """
    PQCMetrics.record_operation(algorithm, operation, status, duration_seconds)
    
    if key_size_bytes > 0:
        key_type = "public" if "public" in operation.lower() else "private"
        PQCMetrics.record_key_size(algorithm, key_type, key_size_bytes)

    return BaseResponse(
        status=ResponseStatus.SUCCESS,
        request_id=f"metric_{int(time.time()*1000000)}",
        data={"recorded": True}
    )


@router.post("/metrics/record/oracle")
async def record_oracle_metric(
    chain: str,
    event_type: str,
    status: str = "success",
    duration_seconds: float = 0,
    gas_used: int = 0
):
    """
    Record an oracle event metric

    Allows external components to record oracle metrics.
    """
    if event_type == "request":
        OracleMetrics.record_request(chain, status)
    elif event_type == "fulfillment":
        OracleMetrics.record_fulfillment(chain, status, duration_seconds)
    elif event_type == "commit":
        OracleMetrics.record_commit(chain, duration_seconds)
    elif event_type == "reveal":
        OracleMetrics.record_reveal(chain, duration_seconds)
    elif event_type == "transaction":
        OracleMetrics.record_transaction(chain, "fulfillment", status, gas_used)

    return BaseResponse(
        status=ResponseStatus.SUCCESS,
        request_id=f"metric_{int(time.time()*1000000)}",
        data={"recorded": True}
    )


@router.get("/entropy/quality", response_model=BaseResponse)
async def entropy_quality_checks(device_id: Optional[str] = None):
    """
    Run entropy quality checks on quantum hardware

    Performs NIST SP 800-90B entropy estimation and statistical tests:
    - Shannon entropy
    - Min-entropy
    - Chi-square uniformity test
    - Overall quality assessment

    **Parameters:**
    - `device_id`: Optional device ID to test. Uses active device if not specified.

    **Quality Thresholds:**
    - Shannon entropy: > 7.9 bits/byte (excellent), > 7.5 (good), < 7.0 (poor)
    - Min-entropy: > 7.0 bits/byte (acceptable)
    - Chi-square: < 293.25 (pass uniformity test)
    """
    try:
        hw_manager = get_quantum_hardware_manager()

        # Run entropy quality checks
        quality_result = await hw_manager.run_entropy_quality_checks(device_id)

        # Update entropy metrics
        EntropyMetrics.update_shannon_entropy(
            quality_result.get('device_id', 'hardware'),
            quality_result.get('shannon_entropy', 0)
        )
        EntropyMetrics.update_min_entropy(
            quality_result.get('device_id', 'hardware'),
            quality_result.get('min_entropy', 0)
        )
        EntropyMetrics.update_quality_status(
            quality_result.get('device_id', 'hardware'),
            quality_result.get('overall_quality') == 'GOOD'
        )

        return BaseResponse(
            status=ResponseStatus.SUCCESS,
            request_id=f"entropy_quality_{int(time.time()*1000000)}",
            data=quality_result,
            metadata={
                "metrics_updated": True,
                "prometheus_endpoint": "/api/v2/monitoring/metrics"
            }
        )
    except ValueError as e:
        logger.error(f"Entropy quality check error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Entropy quality check error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/entropy/history", response_model=BaseResponse)
async def entropy_quality_history(limit: int = 100):
    """
    Get recent entropy quality check history

    Returns the last N entropy quality check results.
    """
    try:
        # For now, return current entropy analysis from QRNG
        qrng = get_quantum_rng()
        entropy_analysis = qrng.analyze_entropy()

        return BaseResponse(
            status=ResponseStatus.SUCCESS,
            request_id=f"entropy_history_{int(time.time()*1000000)}",
            data={
                "current": {
                    "shannon_entropy": entropy_analysis.shannon_entropy,
                    "min_entropy": entropy_analysis.min_entropy,
                    "chi_square_p_value": getattr(entropy_analysis, 'chi_square_p_value', None),
                    "autocorrelation": getattr(entropy_analysis, 'autocorrelation', None),
                    "bit_balance": getattr(entropy_analysis, 'bit_balance', None),
                    "health_status": entropy_analysis.health_status,
                    "pool_size": len(qrng.entropy_pool)
                },
                "history": [],
                "note": "Historical data requires persistent storage configuration"
            }
        )
    except Exception as e:
        logger.error(f"Entropy history error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
