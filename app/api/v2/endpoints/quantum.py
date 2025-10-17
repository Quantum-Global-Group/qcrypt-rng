"""
QCrypt RNG API - Quantum Endpoints
API endpoints for quantum backend operations and analysis
"""

from fastapi import APIRouter, HTTPException
from app.quantum.qrng import get_quantum_rng
from app.api.v2.models.responses import (
    EntropyStatusResponse,
    SystemStatsResponse,
    ResponseStatus
)
from app.utils.logging import logger
from app.config import settings
import time

router = APIRouter()


@router.get("/entropy", response_model=EntropyStatusResponse)
async def get_entropy_status() -> EntropyStatusResponse:
    """
    Get entropy pool status
    
    Returns comprehensive entropy analysis including:
    - Shannon entropy
    - Min entropy
    - Statistical tests (Chi-square, autocorrelation)
    - Bit balance
    - Overall health status
    """
    try:
        qrng = get_quantum_rng()
        analysis = qrng.analyze_entropy()
        
        return EntropyStatusResponse(
            status=ResponseStatus.SUCCESS,
            request_id=f"req_{int(time.time()*1000000)}",
            data={
                "shannon_entropy": round(analysis.shannon_entropy, 4),
                "min_entropy": round(analysis.min_entropy, 4),
                "chi_square_p_value": round(analysis.chi_square_p_value, 4),
                "autocorrelation": round(analysis.autocorrelation, 4),
                "bit_balance": round(analysis.bit_balance, 4),
                "health_status": analysis.health_status,
                "pool_size": analysis.pool_size,
                "passed_tests": analysis.passed_tests
            }
        )
    except Exception as e:
        logger.error(f"Error getting entropy status: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/stats", response_model=SystemStatsResponse)
async def get_system_stats() -> SystemStatsResponse:
    """
    Get system statistics
    
    Returns operational metrics including:
    - Total bytes generated
    - Generation count
    - Average generation time
    - Backend status
    """
    try:
        qrng = get_quantum_rng()
        stats = qrng.get_statistics()
        
        # Calculate uptime (simplified - would track actual start time in production)
        import os
        uptime = time.time() - os.path.getmtime(__file__)
        
        return SystemStatsResponse(
            status=ResponseStatus.SUCCESS,
            request_id=f"req_{int(time.time()*1000000)}",
            data={
                "total_bytes_generated": stats["total_bytes_generated"],
                "total_generations": stats["total_generations"],
                "average_generation_time_ms": round(stats["average_generation_time_ms"], 2),
                "entropy_pool_size": stats["entropy_pool_size"],
                "backend": stats["backend"],
                "backend_status": stats["backend_status"],
                "uptime_seconds": int(uptime),
                "api_version": settings.app_version
            }
        )
    except Exception as e:
        logger.error(f"Error getting system stats: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/reseed")
async def reseed_entropy_pool():
    """
    Reseed entropy pool
    
    Forces regeneration of the entropy pool with fresh quantum measurements.
    This operation may take several seconds.
    """
    try:
        qrng = get_quantum_rng()
        
        # Clear existing pool
        qrng.entropy_pool = []
        
        # Generate fresh entropy
        for _ in range(100):
            await qrng.generate_bytes(32, 16, "hex")
        
        return {
            "status": "success",
            "message": "Entropy pool reseeded",
            "new_pool_size": len(qrng.entropy_pool)
        }
    except Exception as e:
        logger.error(f"Error reseeding entropy pool: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/backend")
async def get_backend_info():
    """
    Get quantum backend information
    
    Returns details about the current quantum backend configuration
    """
    try:
        return {
            "backend": settings.quantum_backend,
            "configuration": settings.quantum_backend_config,
            "available_backends": ["qrisp_simulator", "ibm_quantum", "iqm_quantum", "rigetti"],
            "max_qubits": settings.max_qubits,
            "default_qubits": settings.default_qubits,
            "features": {
                "superposition": True,
                "entanglement": True,
                "measurement": True,
                "post_processing": True,
                "entropy_validation": True
            }
        }
    except Exception as e:
        logger.error(f"Error getting backend info: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")