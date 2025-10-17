"""
QCrypt RNG API - Health Check Endpoints
API endpoints for health monitoring
"""

from fastapi import APIRouter, HTTPException
from app.quantum.qrng import get_quantum_rng
from app.api.v2.models.responses import HealthResponse
from app.config import settings
from app.utils.logging import logger

router = APIRouter()


@router.get("", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """
    Health check endpoint
    
    Returns the health status of the API and its dependencies.
    Used for monitoring and load balancer health checks.
    """
    try:
        checks = {}
        overall_status = "healthy"
        
        # Check API
        checks["api"] = True
        
        # Check quantum backend
        try:
            qrng = get_quantum_rng()
            stats = qrng.get_statistics()
            checks["quantum_backend"] = stats["backend_status"] == "operational"
            if not checks["quantum_backend"]:
                overall_status = "degraded"
        except Exception as e:
            logger.error(f"Quantum backend check failed: {str(e)}")
            checks["quantum_backend"] = False
            overall_status = "degraded"
        
        # Check entropy pool
        try:
            analysis = qrng.analyze_entropy()
            checks["entropy_pool"] = analysis.health_status in ["excellent", "good"]
            if not checks["entropy_pool"]:
                overall_status = "degraded"
        except Exception:
            checks["entropy_pool"] = False
        
        # Check database (placeholder - would check real DB in production)
        checks["database"] = True
        
        # Check cache (placeholder - would check Redis in production)
        checks["cache"] = True
        
        # If any critical component is down, mark as unhealthy
        if not checks["api"] or not checks["quantum_backend"]:
            overall_status = "unhealthy"
        
        return HealthResponse(
            status=overall_status,
            version=settings.app_version,
            backend=settings.quantum_backend,
            backend_status=stats["backend_status"] if 'stats' in locals() else "unknown",
            checks=checks
        )
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}", exc_info=True)
        return HealthResponse(
            status="unhealthy",
            version=settings.app_version,
            backend=settings.quantum_backend,
            backend_status="error",
            checks={
                "api": False,
                "quantum_backend": False,
                "entropy_pool": False,
                "database": False,
                "cache": False
            }
        )


@router.get("/live")
async def liveness_probe():
    """
    Kubernetes liveness probe
    
    Simple endpoint that returns 200 if the service is alive.
    Does not check dependencies.
    """
    return {"status": "alive"}


@router.get("/ready")
async def readiness_probe():
    """
    Kubernetes readiness probe
    
    Returns 200 if the service is ready to accept traffic.
    Checks that critical dependencies are available.
    """
    try:
        # Check quantum backend is available
        qrng = get_quantum_rng()
        stats = qrng.get_statistics()
        
        if stats["backend_status"] != "operational":
            raise HTTPException(status_code=503, detail="Quantum backend not operational")
        
        return {"status": "ready"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Readiness check failed: {str(e)}")
        raise HTTPException(status_code=503, detail="Service not ready")