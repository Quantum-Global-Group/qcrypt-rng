"""
QCrypt RNG API - Quantum Randomness Oracle Endpoint
API endpoint for interacting with the quantum randomness oracle for blockchain applications
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Dict, Any, Optional
from pydantic import BaseModel
import time
import asyncio

from app.quantum.qrng import get_quantum_rng
from app.quantum.hardware_interface import get_quantum_hardware_manager
from app.quantum.commitment import compute_commitment_hex
from app.api.v2.models.responses import BaseResponse, ResponseStatus
from app.utils.logging import logger

router = APIRouter()


class OracleRequest(BaseModel):
    """Request model for quantum randomness oracle"""
    num_bytes: int = 32
    num_qubits: int = 16
    callback_gas_limit: int = 200000
    requester_address: Optional[str] = None
    commitment_required: bool = True
    target_chain: Optional[str] = None
    scheduled_delivery_block: Optional[int] = None


class BatchOracleRequest(BaseModel):
    """Request model for batch oracle randomness"""
    count: int = 5
    num_bytes: int = 32
    num_qubits: int = 16
    commitment_required: bool = True
    scheduled_delivery_block: Optional[int] = None
    target_chain: Optional[str] = None


class OracleResponse(BaseModel):
    """Response model for quantum randomness oracle"""
    request_id: str
    commitment: Optional[str] = None
    estimated_completion_blocks: int = 2
    fee_required: int
    status: str


@router.post("/request", response_model=BaseResponse)
async def request_quantum_randomness(
    request: OracleRequest,
    background_tasks: BackgroundTasks
):
    """
    Request quantum randomness from the oracle for blockchain applications

    This endpoint simulates the process of requesting quantum randomness that would
    be delivered to a blockchain smart contract via the oracle network.
    """
    try:
        qrng = get_quantum_rng()
        hw_manager = get_quantum_hardware_manager()

        # Generate quantum randomness
        quantum_result = await qrng.generate_bytes(
            request.num_bytes,
            request.num_qubits,
            "raw"
        )

        # Create commitment: keccak256(abi.encodePacked(uint256(randomness)))
        commitment = compute_commitment_hex(quantum_result.data)

        # Simulate oracle processing (in real implementation, this would be sent to blockchain)
        request_id = f"oracle_req_{int(time.time()*1000000)}"

        # Log the request for simulation purposes
        logger.info(f"Quantum randomness oracle request: {request_id}")
        logger.info(f"  Bytes: {request.num_bytes}")
        logger.info(f"  Qubits: {request.num_qubits}")
        logger.info(f"  Commitment: {commitment[:16]}...")

        # In a real implementation, this would:
        # 1. Send a transaction to the smart contract to register the request
        # 2. The oracle node would monitor the blockchain for this request
        # 3. Generate the quantum randomness
        # 4. Submit the commitment and later reveal the randomness

        response_data = {
            "request_id": request_id,
            "commitment": commitment if request.commitment_required else None,
            "estimated_completion_blocks": 2,  # Blocks until randomness is revealed
            "fee_required": 10000000000000000,  # 0.01 ETH equivalent in wei
            "status": "registered",
            "simulation_note": "This is a simulation. In production, this would interact with blockchain."
        }

        meta: Dict[str, Any] = {
            "quantum_backend": quantum_result.quantum_backend,
            "generation_time_ms": quantum_result.generation_time_ms,
            "entropy_bits": quantum_result.entropy_bits,
        }
        if request.target_chain:
            meta["target_chain"] = request.target_chain
        if request.scheduled_delivery_block is not None:
            meta["scheduled_delivery_block"] = request.scheduled_delivery_block

        return BaseResponse(
            status=ResponseStatus.SUCCESS,
            request_id=request_id,
            data=response_data,
            metadata=meta,
        )
    except Exception as e:
        logger.error(f"Oracle request error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Oracle request failed: {str(e)}")


@router.get("/status/{request_id}")
async def get_oracle_request_status(request_id: str):
    """
    Get the status of a quantum randomness request

    In a real implementation, this would query the blockchain for the status
    of the randomness request.
    """
    try:
        # Simulate checking request status
        # In real implementation, this would query the blockchain contract
        import random
        status_options = ["pending_commitment", "committed", "fulfilled", "expired"]
        
        # Simulate different statuses based on request ID
        random.seed(request_id)
        status = random.choice(status_options)
        
        response_data = {
            "request_id": request_id,
            "status": status,
            "block_number": 1234567,
            "fulfilled": status == "fulfilled",
            "randomness": None,
            "commitment": "0x" + "a" * 64 if status != "pending_commitment" else None,
            "timestamp": time.time()
        }

        if status == "fulfilled":
            # Generate a random value for simulation
            import secrets
            randomness_value = secrets.randbits(256)
            response_data["randomness"] = hex(randomness_value)
            response_data["entropy_bits"] = 256

        return BaseResponse(
            status=ResponseStatus.SUCCESS,
            request_id=request_id,
            data=response_data
        )
    except Exception as e:
        logger.error(f"Oracle status check error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Status check failed: {str(e)}")


@router.get("/simulate-fulfillment/{request_id}")
async def simulate_oracle_fulfillment(request_id: str):
    """
    Simulate the fulfillment of a quantum randomness request

    This endpoint simulates what happens when the oracle node fulfills a request
    by revealing the quantum randomness to the blockchain.
    """
    try:
        qrng = get_quantum_rng()

        # Generate quantum randomness for the request
        quantum_result = await qrng.generate_bytes(32, 16, "raw")

        # In a real implementation, this would:
        # 1. Generate the randomness using quantum hardware
        # 2. Submit a transaction to the smart contract with the randomness
        # 3. The contract verifies the commitment and updates the request status

        commitment = compute_commitment_hex(quantum_result.data)
        randomness_int = int.from_bytes(quantum_result.data, 'big')

        response_data = {
            "request_id": request_id,
            "status": "fulfilled",
            "randomness": hex(randomness_int),
            "commitment": commitment,
            "entropy_bits": 256,
            "fulfillment_timestamp": time.time(),
            "simulation_note": "This simulates oracle node fulfilling the request on blockchain"
        }

        logger.info(f"Oracle request fulfilled: {request_id}")
        logger.info(f"  Randomness: {hex(randomness_int)[:16]}...")

        return BaseResponse(
            status=ResponseStatus.SUCCESS,
            request_id=request_id,
            data=response_data,
            metadata={
                "quantum_backend": quantum_result.quantum_backend,
                "generation_time_ms": quantum_result.generation_time_ms
            }
        )
    except Exception as e:
        logger.error(f"Oracle fulfillment error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Fulfillment failed: {str(e)}")


@router.get("/network-info")
async def get_oracle_network_info():
    """
    Get information about the quantum randomness oracle network

    Provides details about the oracle network including:
    - Connected quantum hardware
    - Network status
    - Performance metrics
    - Available features
    """
    try:
        hw_manager = get_quantum_hardware_manager()
        qrng = get_quantum_rng()

        # Get hardware status
        hw_statuses = await hw_manager.get_device_status()

        # Get QRNG stats
        qrng_stats = qrng.get_statistics()
        entropy_analysis = qrng.analyze_entropy()

        response_data = {
            "network": {
                "name": "QCrypt Quantum Randomness Oracle Network",
                "status": "operational",
                "nodes_count": 1,  # Simulated
                "active_requests": 0,  # Would track real requests in production
                "uptime_hours": 24 * 7  # Simulated
            },
            "quantum_hardware": {
                "available_devices": hw_manager.get_available_devices(),
                "statuses": hw_statuses,
                "active_device": hw_manager.active_device_id
            },
            "performance": {
                "total_randomness_generated": qrng_stats["total_bytes_generated"],
                "average_generation_time_ms": qrng_stats["average_generation_time_ms"],
                "entropy_quality": {
                    "shannon_entropy": entropy_analysis.shannon_entropy,
                    "min_entropy": entropy_analysis.min_entropy,
                    "health_status": entropy_analysis.health_status
                }
            },
            "features": {
                "commit_reveal_scheme": True,
                "verifiable_quantum_origin": True,
                "multi_chain_support": True,  # Planned
                "hardware_abstraction": True,
                "enterprise_ready": True
            },
            "supported_chains": [
                "Ethereum",
                "Polygon",
                "Binance Smart Chain",
                "Avalanche",
                "Fantom"
            ]
        }

        return BaseResponse(
            status=ResponseStatus.SUCCESS,
            request_id=f"net_info_{int(time.time()*1000000)}",
            data=response_data
        )
    except Exception as e:
        logger.error(f"Oracle network info error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Network info failed: {str(e)}")


@router.get("/benchmark")
async def benchmark_quantum_oracle():
    """
    Benchmark the quantum randomness oracle performance

    Tests the performance of quantum randomness generation and commitment creation
    which are critical for oracle operations.
    """
    try:
        qrng = get_quantum_rng()

        # Benchmark quantum randomness generation
        start_time = time.time()
        num_samples = 10
        total_entropy_bits = 0

        for i in range(num_samples):
            result = await qrng.generate_bytes(32, 16, "raw")
            total_entropy_bits += result.entropy_bits

        generation_time = (time.time() - start_time) * 1000  # Convert to ms
        avg_generation_time = generation_time / num_samples
        avg_entropy_bits = total_entropy_bits / num_samples

        # Benchmark commitment creation (Keccak-256, matching on-chain contract)
        commitment_start = time.time()
        for i in range(num_samples):
            quantum_data = await qrng.generate_bytes(32, 8, "raw")
            commitment = compute_commitment_hex(quantum_data.data)

        commitment_time = (time.time() - commitment_start) * 1000  # Convert to ms
        avg_commitment_time = commitment_time / num_samples

        response_data = {
            "benchmark": {
                "samples_generated": num_samples,
                "total_time_ms": round(generation_time + commitment_time, 2),
                "generation_only_time_ms": round(generation_time, 2),
                "commitment_only_time_ms": round(commitment_time, 2),
                "avg_generation_time_ms": round(avg_generation_time, 2),
                "avg_commitment_time_ms": round(avg_commitment_time, 2),
                "throughput_samples_per_sec": round(num_samples / ((generation_time + commitment_time) / 1000), 2),
                "average_entropy_bits_per_sample": avg_entropy_bits
            },
            "performance_notes": {
                "generation_speed": "Limited by quantum hardware simulation",
                "commitment_speed": "Limited by Keccak-256 computation (Ethereum-compatible)",
                "blockchain_latency": "Additional time needed for blockchain confirmation",
                "real_hardware_speed": "Real quantum hardware would be significantly faster"
            }
        }

        return BaseResponse(
            status=ResponseStatus.SUCCESS,
            request_id=f"bench_{int(time.time()*1000000)}",
            data=response_data
        )
    except Exception as e:
        logger.error(f"Oracle benchmark error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Benchmark failed: {str(e)}")


@router.post("/requests/batch", response_model=BaseResponse)
async def batch_request_quantum_randomness(request: BatchOracleRequest):
    """
    Batch request quantum randomness from the oracle.

    Generates multiple independent randomness requests in a single call,
    each with its own commitment.  Useful for fair mints, lotteries, and
    gaming applications that need N random values at once.
    """
    count = min(max(request.count, 1), 50)
    try:
        qrng = get_quantum_rng()
        items = []
        for _ in range(count):
            result = await qrng.generate_bytes(request.num_bytes, request.num_qubits, "raw")
            commitment = compute_commitment_hex(result.data) if request.commitment_required else None
            req_id = f"oracle_req_{int(time.time() * 1_000_000)}"
            items.append({
                "request_id": req_id,
                "commitment": commitment,
                "estimated_completion_blocks": 2,
                "fee_required": 10000000000000000,
                "status": "registered",
            })

        meta: Dict[str, Any] = {"total_requests": count}
        if request.target_chain:
            meta["target_chain"] = request.target_chain
        if request.scheduled_delivery_block is not None:
            meta["scheduled_delivery_block"] = request.scheduled_delivery_block

        return BaseResponse(
            status=ResponseStatus.SUCCESS,
            request_id=f"batch_{int(time.time() * 1_000_000)}",
            data={"requests": items, "total": count},
            metadata=meta,
        )
    except Exception as e:
        logger.error(f"Batch oracle request error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch request failed: {e}")