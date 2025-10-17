"""
QCrypt RNG API - Generate Endpoints
API endpoints for quantum random generation
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List
import asyncio
from datetime import datetime, timedelta

from app.quantum.qrng import get_quantum_rng
from app.api.v2.models.requests import (
    GenerateBytesRequest,
    GenerateKeyRequest,
    GenerateTokenRequest,
    GenerateUUIDRequest,
    GeneratePasswordRequest,
    BatchGenerateRequest
)
from app.api.v2.models.responses import (
    GenerateBytesResponse,
    GenerateKeyResponse,
    GenerateTokenResponse,
    GenerateUUIDResponse,
    GeneratePasswordResponse,
    BatchGenerateResponse,
    ResponseStatus
)
from app.utils.logging import logger, log_quantum_generation
from app.config import settings


router = APIRouter()


@router.post("/bytes", response_model=GenerateBytesResponse)
async def generate_bytes(request: GenerateBytesRequest) -> GenerateBytesResponse:
    """
    Generate quantum random bytes
    
    This endpoint generates cryptographically secure random bytes using quantum superposition.
    Each byte is generated through quantum measurement of qubits in superposition state.
    
    - **length**: Number of bytes to generate (1-1024, enterprise up to 10240)
    - **format**: Output format (hex, base64, array, raw)
    - **quantum_bits**: Number of qubits to use (1-16, higher = more entropy)
    """
    try:
        qrng = get_quantum_rng()
        
        # Generate quantum random bytes
        result = await qrng.generate_bytes(
            request.length,
            request.quantum_bits,
            request.format.value
        )
        
        # Log generation
        log_quantum_generation(
            bytes_generated=result.length,
            qubits=result.qubits_used,
            backend=result.quantum_backend,
            time_ms=result.generation_time_ms
        )
        
        return GenerateBytesResponse(
            status=ResponseStatus.SUCCESS,
            request_id=result.request_id,
            data={
                "bytes": result.data,
                "format": result.format,
                "length": result.length,
                "entropy_bits": result.entropy_bits
            },
            metadata={
                "generation_time_ms": result.generation_time_ms,
                "quantum_backend": result.quantum_backend,
                "qubits_used": result.qubits_used,
                "measurement_count": result.measurement_count
            }
        )
    except ValueError as e:
        logger.error(f"Validation error in generate_bytes: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating bytes: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/key", response_model=GenerateKeyResponse)
async def generate_key(request: GenerateKeyRequest) -> GenerateKeyResponse:
    """
    Generate cryptographic key
    
    Generate quantum-random cryptographic keys for various algorithms:
    - **AES**: 128, 192, or 256-bit keys
    - **RSA**: 2048, 3072, or 4096-bit keys
    - **ECDSA**: 256, 384, or 521-bit keys
    """
    try:
        qrng = get_quantum_rng()
        
        # Generate cryptographic key
        result = await qrng.generate_key(
            request.key_size,
            request.algorithm.value
        )
        
        # Log generation
        log_quantum_generation(
            bytes_generated=request.key_size // 8,
            qubits=16,  # Keys use maximum qubits
            backend=result.quantum_backend,
            time_ms=result.generation_time_ms
        )
        
        return GenerateKeyResponse(
            status=ResponseStatus.SUCCESS,
            request_id=result.request_id,
            data=result.data,
            metadata={
                "generation_time_ms": result.generation_time_ms,
                "quantum_backend": result.quantum_backend,
                "entropy_source": "quantum_superposition"
            }
        )
    except ValueError as e:
        logger.error(f"Validation error in generate_key: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating key: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/token", response_model=GenerateTokenResponse)
async def generate_token(request: GenerateTokenRequest) -> GenerateTokenResponse:
    """
    Generate session token
    
    Generate secure session tokens with quantum randomness.
    Tokens are URL-safe by default and can include expiration times.
    """
    try:
        qrng = get_quantum_rng()
        
        # Generate token
        result = await qrng.generate_token(
            request.length,
            request.url_safe
        )
        
        # Calculate expiration
        expires_at = None
        if request.expires_in:
            expires_at = datetime.utcnow() + timedelta(seconds=request.expires_in)
        
        # Log generation
        log_quantum_generation(
            bytes_generated=request.length,
            qubits=12,
            backend=result.quantum_backend,
            time_ms=result.generation_time_ms
        )
        
        return GenerateTokenResponse(
            status=ResponseStatus.SUCCESS,
            request_id=result.request_id,
            data={
                "token": result.data,
                "token_type": "Bearer",
                "expires_in": request.expires_in,
                "expires_at": expires_at.isoformat() if expires_at else None
            },
            metadata={
                "generation_time_ms": result.generation_time_ms,
                "quantum_backend": result.quantum_backend,
                "url_safe": request.url_safe
            }
        )
    except ValueError as e:
        logger.error(f"Validation error in generate_token: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating token: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/uuid", response_model=GenerateUUIDResponse)
async def generate_uuid(request: GenerateUUIDRequest) -> GenerateUUIDResponse:
    """
    Generate quantum UUID
    
    Generate RFC4122-compliant UUIDs with quantum randomness.
    Superior to standard UUID v4 due to true quantum entropy source.
    """
    try:
        qrng = get_quantum_rng()
        
        # Generate UUID(s)
        if request.count == 1:
            result = await qrng.generate_uuid(request.version)
            uuid_data = result.data
        else:
            # Generate multiple UUIDs
            tasks = [qrng.generate_uuid(request.version) for _ in range(request.count)]
            results = await asyncio.gather(*tasks)
            uuid_data = [r.data for r in results]
            result = results[0]  # Use first for metadata
        
        # Format based on request
        if request.format == "urn" and isinstance(uuid_data, str):
            uuid_data = f"urn:uuid:{uuid_data}"
        elif request.format == "urn" and isinstance(uuid_data, list):
            uuid_data = [f"urn:uuid:{u}" for u in uuid_data]
        elif request.format == "raw":
            if isinstance(uuid_data, str):
                uuid_data = uuid_data.replace("-", "")
            else:
                uuid_data = [u.replace("-", "") for u in uuid_data]
        
        # Log generation
        log_quantum_generation(
            bytes_generated=16 * request.count,
            qubits=16,
            backend=result.quantum_backend,
            time_ms=result.generation_time_ms * request.count
        )
        
        return GenerateUUIDResponse(
            status=ResponseStatus.SUCCESS,
            request_id=result.request_id,
            data=uuid_data,
            metadata={
                "generation_time_ms": result.generation_time_ms * request.count,
                "quantum_backend": result.quantum_backend,
                "version": request.version,
                "format": request.format,
                "count": request.count
            }
        )
    except ValueError as e:
        logger.error(f"Validation error in generate_uuid: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating UUID: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/password", response_model=GeneratePasswordResponse)
async def generate_password(request: GeneratePasswordRequest) -> GeneratePasswordResponse:
    """
    Generate secure password
    
    Generate cryptographically strong passwords with quantum randomness.
    Supports various character sets and complexity requirements.
    """
    try:
        qrng = get_quantum_rng()
        
        # Build character set
        charset = ""
        if request.include_uppercase:
            charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        if request.include_lowercase:
            charset += "abcdefghijklmnopqrstuvwxyz"
        if request.include_numbers:
            charset += "0123456789"
        if request.include_symbols:
            charset += "!@#$%^&*()_+-=[]{}|;:,.<>?"
        
        if not charset:
            raise ValueError("At least one character set must be enabled")
        
        # Remove ambiguous characters if requested
        if request.exclude_ambiguous:
            ambiguous = "0O1lI"
            charset = ''.join(c for c in charset if c not in ambiguous)
        
        # Generate random bytes for password
        bytes_needed = request.length * 2  # Extra bytes for rejection sampling
        result = await qrng.generate_bytes(bytes_needed, 8, "array")
        
        # Build password
        password = ""
        byte_index = 0
        
        # Add minimum required characters first
        if request.min_uppercase:
            uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            for _ in range(request.min_uppercase):
                idx = result.data[byte_index] % len(uppercase)
                password += uppercase[idx]
                byte_index += 1
        
        if request.min_lowercase:
            lowercase = "abcdefghijklmnopqrstuvwxyz"
            for _ in range(request.min_lowercase):
                idx = result.data[byte_index] % len(lowercase)
                password += lowercase[idx]
                byte_index += 1
        
        if request.min_numbers:
            numbers = "0123456789"
            for _ in range(request.min_numbers):
                idx = result.data[byte_index] % len(numbers)
                password += numbers[idx]
                byte_index += 1
        
        if request.min_symbols:
            symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?"
            for _ in range(request.min_symbols):
                idx = result.data[byte_index] % len(symbols)
                password += symbols[idx]
                byte_index += 1
        
        # Fill remaining length with random characters
        while len(password) < request.length:
            if byte_index >= len(result.data):
                # Need more random bytes
                extra_result = await qrng.generate_bytes(bytes_needed, 8, "array")
                result.data.extend(extra_result.data)
            
            idx = result.data[byte_index] % len(charset)
            password += charset[idx]
            byte_index += 1
        
        # Shuffle password to mix minimum requirements
        password_list = list(password)
        for i in range(len(password_list) - 1, 0, -1):
            if byte_index >= len(result.data):
                extra_result = await qrng.generate_bytes(32, 8, "array")
                result.data.extend(extra_result.data)
            j = result.data[byte_index] % (i + 1)
            byte_index += 1
            password_list[i], password_list[j] = password_list[j], password_list[i]
        
        password = ''.join(password_list)
        
        # Calculate entropy
        import math
        entropy_bits = request.length * math.log2(len(charset)) if charset else 0
        
        # Determine strength
        if entropy_bits >= 128:
            strength = "very_strong"
        elif entropy_bits >= 96:
            strength = "strong"
        elif entropy_bits >= 64:
            strength = "moderate"
        else:
            strength = "weak"
        
        return GeneratePasswordResponse(
            status=ResponseStatus.SUCCESS,
            request_id=result.request_id,
            data={
                "password": password,
                "length": request.length,
                "strength": strength,
                "entropy_bits": round(entropy_bits, 2)
            },
            metadata={
                "generation_time_ms": result.generation_time_ms,
                "quantum_backend": result.quantum_backend,
                "character_set": f"{'uppercase,' if request.include_uppercase else ''}"
                               f"{'lowercase,' if request.include_lowercase else ''}"
                               f"{'numbers,' if request.include_numbers else ''}"
                               f"{'symbols' if request.include_symbols else ''}".rstrip(',')
            }
        )
    except ValueError as e:
        logger.error(f"Validation error in generate_password: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating password: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/batch", response_model=BatchGenerateResponse)
async def batch_generate(request: BatchGenerateRequest) -> BatchGenerateResponse:
    """
    Batch generate random data
    
    Process multiple generation requests in a single API call.
    Supports parallel processing for improved performance.
    """
    try:
        qrng = get_quantum_rng()
        
        import time
        start_time = time.time()
        
        results = []
        
        if request.parallel:
            # Process in parallel
            tasks = []
            for idx, req in enumerate(request.requests):
                task = qrng.generate_bytes(req.length, req.quantum_bits, req.format.value)
                tasks.append((idx, task))
            
            # Gather results
            task_results = await asyncio.gather(*[t[1] for t in tasks], return_exceptions=True)
            
            for idx, result in enumerate(task_results):
                if isinstance(result, Exception):
                    results.append({
                        "index": idx,
                        "status": "error",
                        "error": str(result)
                    })
                else:
                    results.append({
                        "index": idx,
                        "status": "success",
                        "bytes": result.data,
                        "format": result.format,
                        "length": result.length
                    })
        else:
            # Process sequentially
            for idx, req in enumerate(request.requests):
                try:
                    result = await qrng.generate_bytes(req.length, req.quantum_bits, req.format.value)
                    results.append({
                        "index": idx,
                        "status": "success",
                        "bytes": result.data,
                        "format": result.format,
                        "length": result.length
                    })
                except Exception as e:
                    results.append({
                        "index": idx,
                        "status": "error",
                        "error": str(e)
                    })
        
        # Calculate statistics
        successful = sum(1 for r in results if r["status"] == "success")
        failed = len(results) - successful
        total_time = (time.time() - start_time) * 1000
        
        return BatchGenerateResponse(
            status=ResponseStatus.SUCCESS,
            request_id=f"req_batch_{int(time.time()*1000000)}",
            data=results,
            metadata={
                "total_requests": len(request.requests),
                "successful": successful,
                "failed": failed,
                "total_time_ms": round(total_time, 2),
                "parallel": request.parallel
            }
        )
    except Exception as e:
        logger.error(f"Error in batch generation: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")