"""
QCrypt RNG API - Quantum Randomness Oracle Endpoint
API endpoint for interacting with the quantum randomness oracle for blockchain applications
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Form
from typing import Dict, Any, Optional
from pydantic import BaseModel
import time
import asyncio

from app.quantum.qrng import get_quantum_rng
from app.quantum.hardware_interface import get_quantum_hardware_manager
from app.quantum.commitment import compute_commitment_hex
from app.api.v2.models.responses import BaseResponse, ResponseStatus
from app.utils.logging import logger
from app.blockchain.oracle_service import get_oracle_fulfillment_service, FulfillmentStatus
from app.blockchain.base import ChainConfig
from app.monitoring import OracleMetrics, QRNGMetrics

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
            data=items,
            metadata=meta,
        )
    except Exception as e:
        logger.error(f"Batch oracle request error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch request failed: {e}")


# ============================================================================
# On-Chain Fulfillment Endpoints
# ============================================================================

@router.post("/fulfillment/configure-chain", response_model=BaseResponse)
async def configure_blockchain_chain(
    chain: str = Form(..., description="Blockchain name: ethereum, polygon, bsc, avalanche, fantom"),
    rpc_url: str = Form(..., description="RPC endpoint URL"),
    private_key: str = Form(..., description="Oracle operator private key"),
    explorer_url: str = Form(..., description="Block explorer URL"),
    chain_id: int = Form(..., description="Chain ID"),
    currency_symbol: str = Form(..., description="Native currency symbol"),
    gas_price_gwei: Optional[int] = Form(None, description="Gas price in gwei"),
    confirmations_required: int = Form(3, description="Number of confirmations to wait")
):
    """
    Configure a blockchain chain for oracle fulfillment

    Sets up the chain adapter with the provided configuration.
    The private key is used to sign transactions for commit/reveal operations.

    **Security Note:** Store private keys securely. In production, use a hardware wallet
    or secure key management service (AWS KMS, Azure Key Vault, etc.).
    """
    try:
        service = get_oracle_fulfillment_service()

        config = ChainConfig(
            rpc_url=rpc_url,
            chain_id=chain_id,
            explorer_url=explorer_url,
            currency_symbol=currency_symbol,
            private_key=private_key,
            gas_price_gwei=gas_price_gwei,
            confirmations_required=confirmations_required
        )

        success = service.configure_chain(chain, config)

        if not success:
            raise HTTPException(status_code=400, detail=f"Failed to configure chain: {chain}")

        return BaseResponse(
            status=ResponseStatus.SUCCESS,
            request_id=f"config_{int(time.time()*1000000)}",
            data={
                "chain": chain,
                "configured": True,
                "rpc_url": rpc_url,
                "chain_id": chain_id,
                "explorer_url": explorer_url
            },
            metadata={
                "message": f"Successfully configured {chain} chain adapter",
                "warning": "Ensure private key is stored securely and never committed to version control"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chain configuration error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/fulfillment/request", response_model=BaseResponse)
async def create_onchain_oracle_request(
    chain: str = Form(..., description="Target blockchain"),
    contract_address: str = Form(..., description="Oracle contract address"),
    num_bytes: int = Form(32, description="Number of random bytes"),
    num_qubits: int = Form(16, description="Number of qubits"),
    async_fulfillment: bool = Form(True, description="Process fulfillment asynchronously")
):
    """
    Create an oracle request with on-chain fulfillment

    This endpoint creates a new oracle request and optionally triggers
    asynchronous fulfillment (commit + reveal) on the specified blockchain.

    **Process:**
    1. Create oracle request
    2. Generate quantum randomness
    3. Create commitment (keccak256)
    4. Submit commit transaction
    5. Wait for confirmation
    6. Submit reveal transaction
    7. Wait for confirmation

    **Fulfillment Status:**
    - PENDING: Request created
    - COMMIT_SUBMITTED: Commit transaction sent
    - COMMIT_CONFIRMED: Commit confirmed on-chain
    - REVEAL_SUBMITTED: Reveal transaction sent
    - REVEAL_CONFIRMED: Reveal confirmed on-chain
    - COMPLETED: Fulfillment complete
    - FAILED: Fulfillment failed
    """
    try:
        service = get_oracle_fulfillment_service()
        start_time = time.time()

        # Create request
        request = await service.create_request(
            chain=chain,
            contract_address=contract_address,
            num_bytes=num_bytes,
            num_qubits=num_qubits
        )

        # Record request metric
        OracleMetrics.record_request(chain, "success")

        if async_fulfillment:
            # Process asynchronously (non-blocking)
            asyncio.create_task(service.fulfill_request(request.request_id))
            fulfillment_status = "processing_async"
        else:
            # Process synchronously (blocking)
            success = await service.fulfill_request(request.request_id)
            fulfillment_status = "completed" if success else "failed"
            
            # Record fulfillment metric
            duration = time.time() - start_time
            OracleMetrics.record_fulfillment(chain, fulfillment_status, duration)

        status_data = service.get_request_status(request.request_id)

        return BaseResponse(
            status=ResponseStatus.SUCCESS,
            request_id=f"onchain_{int(time.time()*1000000)}",
            data={
                "request_id": request.request_id,
                "chain": chain,
                "contract_address": contract_address,
                "fulfillment_status": fulfillment_status,
                "status": status_data
            },
            metadata={
                "message": f"Oracle request created for {chain}",
                "async": async_fulfillment,
                "next_step": "Use /oracle/fulfillment/status/{request_id} to check status" if async_fulfillment else None
            }
        )
    except Exception as e:
        logger.error(f"On-chain request error: {str(e)}")
        # Record error metric
        OracleMetrics.record_request(chain, "error")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/fulfillment/status/{request_id}", response_model=BaseResponse)
async def get_fulfillment_status(request_id: str):
    """
    Get the status of an on-chain oracle request

    Returns detailed information about the fulfillment process including:
    - Current status
    - Commitment hash
    - Randomness value (after reveal)
    - Transaction hashes
    - Explorer URLs
    """
    try:
        service = get_oracle_fulfillment_service()

        status = service.get_request_status(request_id)

        if status is None:
            raise HTTPException(status_code=404, detail=f"Request not found: {request_id}")

        return BaseResponse(
            status=ResponseStatus.SUCCESS,
            request_id=request_id,
            data=status,
            metadata={
                "chain_info": await service.get_chain_info(status["chain"]) if status["chain"] else None
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Fulfillment status error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/fulfillment/requests", response_model=BaseResponse)
async def list_all_fulfillment_requests():
    """
    List all oracle fulfillment requests

    Returns a list of all oracle requests with their current status.
    """
    try:
        service = get_oracle_fulfillment_service()

        requests = service.get_all_requests()

        return BaseResponse(
            status=ResponseStatus.SUCCESS,
            request_id=f"list_{int(time.time()*1000000)}",
            data={
                "requests": requests,
                "total_count": len(requests),
                "by_status": {
                    status.value: sum(1 for r in requests if r["status"] == status.value)
                    for status in FulfillmentStatus
                }
            },
            metadata={
                "supported_chains": service.get_supported_chains()
            }
        )
    except Exception as e:
        logger.error(f"List requests error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/fulfillment/chains", response_model=BaseResponse)
async def list_supported_chains():
    """
    List all supported blockchain networks

    Returns information about each supported chain including:
    - Chain ID
    - Explorer URL
    - RPC endpoint
    - Supported features
    """
    try:
        service = get_oracle_fulfillment_service()

        chains = service.get_supported_chains()

        return BaseResponse(
            status=ResponseStatus.SUCCESS,
            request_id=f"chains_{int(time.time()*1000000)}",
            data=chains,
            metadata={
                "total_chains": len(chains),
                "message": "Configure chains using /oracle/fulfillment/configure-chain"
            }
        )
    except Exception as e:
        logger.error(f"List chains error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/fulfillment/retry/{request_id}", response_model=BaseResponse)
async def retry_fulfillment(request_id: str):
    """
    Retry fulfillment of a failed oracle request

    If a request failed during commit or reveal, this endpoint
    attempts to retry the fulfillment process.

    Note: Only requests in FAILED status can be retried.
    """
    try:
        service = get_oracle_fulfillment_service()

        status = service.get_request_status(request_id)
        if status is None:
            raise HTTPException(status_code=404, detail=f"Request not found: {request_id}")

        if status["status"] != "failed":
            raise HTTPException(
                status_code=400,
                detail=f"Cannot retry request in {status['status']} status. Only failed requests can be retried."
            )

        # Reset status and retry
        request = service.requests[request_id]
        request.status = FulfillmentStatus.PENDING
        request.error = None

        # Retry fulfillment
        success = await service.fulfill_request(request_id)

        return BaseResponse(
            status=ResponseStatus.SUCCESS if success else ResponseStatus.ERROR,
            request_id=f"retry_{int(time.time()*1000000)}",
            data={
                "request_id": request_id,
                "retry_successful": success,
                "new_status": service.get_request_status(request_id)
            },
            metadata={
                "message": "Fulfillment retry completed"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Retry fulfillment error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))