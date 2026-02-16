"""
QCrypt RNG - Hardware Interface Endpoints
API endpoints for managing quantum hardware connections
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List
import asyncio

from app.quantum.hardware_interface import (
    get_quantum_hardware_manager,
    QuantumDeviceType,
    PhotonicQRNG,
    SuperconductingQRNG,
    SimulatedQRNG
)
from app.api.v2.models.responses import ResponseStatus
from app.utils.logging import logger


router = APIRouter(prefix="/hardware")


@router.get("/devices", tags=["Quantum Hardware"])
async def list_quantum_devices() -> Dict[str, Any]:
    """
    List all connected quantum hardware devices
    
    Returns information about all quantum devices currently connected to the system.
    """
    try:
        manager = get_quantum_hardware_manager()
        statuses = await manager.get_device_status()
        
        return {
            "status": ResponseStatus.SUCCESS,
            "devices": statuses,
            "active_device": manager.active_device_id,
            "total_devices": len(statuses)
        }
    except Exception as e:
        logger.error(f"Error listing quantum devices: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/connect/{device_type}", tags=["Quantum Hardware"])
async def connect_quantum_device(
    device_type: str,
    device_address: str = None,
    device_id: str = None
) -> Dict[str, Any]:
    """
    Connect to a quantum hardware device
    
    Connect to a real quantum hardware device of the specified type.
    Supported types: photonic, superconducting, simulator
    """
    try:
        manager = get_quantum_hardware_manager()
        
        if device_id is None:
            device_id = f"{device_type}_{int(asyncio.get_event_loop().time())}"
        
        # Create device based on type
        if device_type.lower() == "photonic":
            device = PhotonicQRNG(device_address or "default_usb")
        elif device_type.lower() == "superconducting":
            device = SuperconductingQRNG(device_address or "default_ethernet")
        elif device_type.lower() == "simulator":
            device = SimulatedQRNG()
        else:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported device type: {device_type}. Supported: photonic, superconducting, simulator"
            )
        
        # Add device to manager
        success = await manager.add_device(device_id, device)
        
        if not success:
            raise HTTPException(status_code=400, detail="Failed to connect to device")
        
        # Get device status
        status = await manager.get_device_status(device_id)
        
        return {
            "status": ResponseStatus.SUCCESS,
            "device_id": device_id,
            "device_type": device_type,
            "connection_status": "connected",
            "device_info": status
        }
    except Exception as e:
        logger.error(f"Error connecting quantum device: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/disconnect/{device_id}", tags=["Quantum Hardware"])
async def disconnect_quantum_device(device_id: str) -> Dict[str, Any]:
    """
    Disconnect from a quantum hardware device
    
    Safely disconnect from the specified quantum hardware device.
    """
    try:
        manager = get_quantum_hardware_manager()
        
        success = await manager.remove_device(device_id)
        
        if not success:
            raise HTTPException(status_code=404, detail=f"Device {device_id} not found")
        
        return {
            "status": ResponseStatus.SUCCESS,
            "message": f"Successfully disconnected device {device_id}",
            "device_id": device_id
        }
    except Exception as e:
        logger.error(f"Error disconnecting quantum device: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/calibrate/{device_id}", tags=["Quantum Hardware"])
async def calibrate_quantum_device(device_id: str) -> Dict[str, Any]:
    """
    Calibrate a quantum hardware device
    
    Perform calibration on the specified quantum hardware device.
    """
    try:
        manager = get_quantum_hardware_manager()
        
        success = await manager.calibrate_device(device_id)
        
        if not success:
            raise HTTPException(status_code=404, detail=f"Device {device_id} not found")
        
        # Get updated status
        status = await manager.get_device_status(device_id)
        
        return {
            "status": ResponseStatus.SUCCESS,
            "message": f"Successfully calibrated device {device_id}",
            "device_id": device_id,
            "device_status": status
        }
    except Exception as e:
        logger.error(f"Error calibrating quantum device: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/performance/{device_id}", tags=["Quantum Hardware"])
async def get_device_performance(device_id: str) -> Dict[str, Any]:
    """
    Get performance metrics for a quantum hardware device
    
    Retrieve performance metrics including generation rate, error rates, etc.
    """
    try:
        manager = get_quantum_hardware_manager()
        
        status = await manager.get_device_status(device_id)
        
        if device_id not in status:
            raise HTTPException(status_code=404, detail=f"Device {device_id} not found")
        
        device_status = status[device_id]
        
        return {
            "status": ResponseStatus.SUCCESS,
            "device_id": device_id,
            "performance_metrics": {
                "generation_rate_bps": device_status.get("generation_rate_bps", 0),
                "error_rate": device_status.get("error_rate", 0),
                "uptime_seconds": device_status.get("uptime_seconds", 0),
                "temperature": device_status.get("temperature", "N/A"),
                "confidence_level": device_status.get("confidence", 0.95)
            }
        }
    except Exception as e:
        logger.error(f"Error getting device performance: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/benchmark", tags=["Quantum Hardware"])
async def benchmark_all_devices() -> Dict[str, Any]:
    """
    Benchmark all connected quantum hardware devices
    
    Compare performance of all connected devices for quality assessment.
    """
    try:
        manager = get_quantum_hardware_manager()
        
        statuses = await manager.get_device_status()
        
        benchmarks = {}
        for device_id, status in statuses.items():
            benchmarks[device_id] = {
                "generation_rate_bps": status.get("generation_rate_bps", 0),
                "error_rate": status.get("error_rate", 0),
                "confidence": status.get("confidence", 0.95),
                "device_type": status.get("device_type", "unknown"),
                "is_real_hardware": status.get("is_real_hardware", True)
            }
        
        return {
            "status": ResponseStatus.SUCCESS,
            "benchmarks": benchmarks,
            "total_devices": len(benchmarks)
        }
    except Exception as e:
        logger.error(f"Error benchmarking devices: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")