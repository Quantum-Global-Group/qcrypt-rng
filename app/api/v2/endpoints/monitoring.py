"""
QCrypt RNG API - Monitoring and Analytics Endpoints
Endpoints for metrics, monitoring, and analytics
"""

from fastapi import APIRouter
from typing import Dict, Any
from datetime import datetime

from app.utils.monitoring import analytics_service
from app.api.v2.models.responses import BaseResponse, ResponseStatus
from app.utils.logging import logger

router = APIRouter()


@router.get("/metrics", response_model=BaseResponse)
async def get_metrics():
    """
    Get system metrics and performance data
    
    Returns various system metrics including:
    - API performance metrics
    - Quantum generation statistics
    - Post-quantum cryptography operations
    - System resource usage
    """
    try:
        # Get API performance summary
        api_summary = analytics_service.get_api_performance_summary(window_minutes=60)
        
        # Get quantum performance summary
        quantum_summary = analytics_service.get_quantum_performance_summary(window_minutes=60)
        
        # Get PQC performance summary
        pqc_summary = analytics_service.get_pqc_performance_summary(window_minutes=60)
        
        return BaseResponse(
            status=ResponseStatus.SUCCESS,
            request_id=f"metrics_{int(datetime.utcnow().timestamp()*1000000)}",
            data={
                "api_performance": api_summary,
                "quantum_performance": quantum_summary,
                "pqc_performance": pqc_summary,
                "timestamp": datetime.utcnow().isoformat()
            },
            metadata={
                "metric_collection_enabled": True,
                "data_retention_hours": 24,
                "aggregation_window_minutes": 60
            }
        )
    except Exception as e:
        logger.error(f"Metrics retrieval error: {str(e)}")
        raise


@router.get("/analytics/overview", response_model=BaseResponse)
async def get_analytics_overview():
    """
    Get analytics overview with key performance indicators
    
    Provides a high-level view of system performance and usage
    """
    try:
        # Get all summaries
        api_summary = analytics_service.get_api_performance_summary(window_minutes=60)
        quantum_summary = analytics_service.get_quantum_performance_summary(window_minutes=60)
        pqc_summary = analytics_service.get_pqc_performance_summary(window_minutes=60)
        
        # Calculate KPIs
        total_calls = api_summary["call_volume"].get("GET_success", 0) + api_summary["call_volume"].get("POST_success", 0)
        avg_response_time = api_summary["response_time"].get("avg", 0) * 1000  # Convert to ms
        success_rate = (api_summary["call_volume"].get("GET_success", 0) + api_summary["call_volume"].get("POST_success", 0)) / max(
            total_calls + api_summary["call_volume"].get("GET_failure", 0) + api_summary["call_volume"].get("POST_failure", 0), 1
        )
        
        kpis = {
            "total_api_calls": total_calls,
            "avg_response_time_ms": round(avg_response_time, 2),
            "success_rate_percent": round(success_rate * 100, 2),
            "quantum_generations": quantum_summary["summary"]["total_generations"],
            "avg_quantum_generation_time_ms": round(quantum_summary["summary"]["avg_generation_time_ms"], 2),
            "pqc_operations": pqc_summary["summary"]["total_operations"],
            "avg_pqc_operation_time_ms": round(pqc_summary["summary"]["avg_operation_time_ms"], 2)
        }
        
        return BaseResponse(
            status=ResponseStatus.SUCCESS,
            request_id=f"analytics_{int(datetime.utcnow().timestamp()*1000000)}",
            data={
                "kpis": kpis,
                "api_performance": api_summary,
                "quantum_performance": quantum_summary,
                "pqc_performance": pqc_summary,
                "timestamp": datetime.utcnow().isoformat()
            },
            metadata={
                "analytics_enabled": True,
                "reporting_period": "last_60_minutes"
            }
        )
    except Exception as e:
        logger.error(f"Analytics overview error: {str(e)}")
        raise


@router.get("/analytics/api-performance", response_model=BaseResponse)
async def get_api_performance_analytics(minutes: int = 60):
    """
    Get detailed API performance analytics
    
    Args:
        minutes: Time window in minutes to analyze (default: 60)
    """
    try:
        summary = analytics_service.get_api_performance_summary(window_minutes=minutes)
        
        return BaseResponse(
            status=ResponseStatus.SUCCESS,
            request_id=f"api_analytics_{int(datetime.utcnow().timestamp()*1000000)}",
            data=summary,
            metadata={
                "analytics_type": "api_performance",
                "time_window_minutes": minutes
            }
        )
    except Exception as e:
        logger.error(f"API performance analytics error: {str(e)}")
        raise


@router.get("/analytics/quantum-performance", response_model=BaseResponse)
async def get_quantum_performance_analytics(minutes: int = 60):
    """
    Get detailed quantum performance analytics
    
    Args:
        minutes: Time window in minutes to analyze (default: 60)
    """
    try:
        summary = analytics_service.get_quantum_performance_summary(window_minutes=minutes)
        
        return BaseResponse(
            status=ResponseStatus.SUCCESS,
            request_id=f"quantum_analytics_{int(datetime.utcnow().timestamp()*1000000)}",
            data=summary,
            metadata={
                "analytics_type": "quantum_performance",
                "time_window_minutes": minutes
            }
        )
    except Exception as e:
        logger.error(f"Quantum performance analytics error: {str(e)}")
        raise


@router.get("/analytics/pqc-performance", response_model=BaseResponse)
async def get_pqc_performance_analytics(minutes: int = 60):
    """
    Get detailed post-quantum cryptography performance analytics
    
    Args:
        minutes: Time window in minutes to analyze (default: 60)
    """
    try:
        summary = analytics_service.get_pqc_performance_summary(window_minutes=minutes)
        
        return BaseResponse(
            status=ResponseStatus.SUCCESS,
            request_id=f"pqc_analytics_{int(datetime.utcnow().timestamp()*1000000)}",
            data=summary,
            metadata={
                "analytics_type": "pqc_performance",
                "time_window_minutes": minutes
            }
        )
    except Exception as e:
        logger.error(f"PQC performance analytics error: {str(e)}")
        raise