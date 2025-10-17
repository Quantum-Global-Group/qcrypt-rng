"""
QCrypt RNG API - Response Models
Pydantic models for API responses
"""

from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional, Union
from datetime import datetime
from enum import Enum


class ResponseStatus(str, Enum):
    """Response status types"""
    SUCCESS = "success"
    ERROR = "error"
    WARNING = "warning"


class BaseResponse(BaseModel):
    """Base response model"""
    status: ResponseStatus = Field(..., description="Response status")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")
    request_id: str = Field(..., description="Unique request identifier")
    data: Optional[Union[Dict[str, Any], List[Any], str]] = Field(None, description="Response data")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Response metadata")
    data: Optional[Union[Dict[str, Any], List[Any], str]] = Field(None, description="Response data")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Response metadata")


class GenerateBytesResponse(BaseResponse):
    """Response model for byte generation"""
    status: ResponseStatus = ResponseStatus.SUCCESS
    data: Dict[str, Any] = Field(..., description="Generated data")
    metadata: Dict[str, Any] = Field(..., description="Generation metadata")
    
    class Config:
        schema_extra = {
            "example": {
                "status": "success",
                "timestamp": "2024-01-01T00:00:00Z",
                "request_id": "req_123456789_abcdef",
                "data": {
                    "bytes": "a3f2b8c9d1e7f4a2b6c0d5e9f3a7b1c5d9e3f7a1b5c9d3e7f1a5b9c3d7e1f5",
                    "format": "hex",
                    "length": 32,
                    "entropy_bits": 256
                },
                "metadata": {
                    "generation_time_ms": 15.23,
                    "quantum_backend": "qrisp_simulator",
                    "qubits_used": 8,
                    "measurement_count": 4
                }
            }
        }


class GenerateKeyResponse(BaseResponse):
    """Response model for key generation"""
    status: ResponseStatus = ResponseStatus.SUCCESS
    data: Dict[str, Any] = Field(..., description="Generated key data")
    metadata: Dict[str, Any] = Field(..., description="Generation metadata")
    
    class Config:
        schema_extra = {
            "example": {
                "status": "success",
                "timestamp": "2024-01-01T00:00:00Z",
                "request_id": "req_123456789_abcdef",
                "data": {
                    "key": "0x7f3a2b1c8d9e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9",
                    "algorithm": "AES",
                    "key_size_bits": 256,
                    "format": "hex"
                },
                "metadata": {
                    "generation_time_ms": 18.45,
                    "quantum_backend": "qrisp_simulator",
                    "entropy_source": "quantum_superposition"
                }
            }
        }


class GenerateTokenResponse(BaseResponse):
    """Response model for token generation"""
    status: ResponseStatus = ResponseStatus.SUCCESS
    data: Dict[str, Any] = Field(..., description="Generated token data")
    metadata: Dict[str, Any] = Field(..., description="Generation metadata")
    
    class Config:
        schema_extra = {
            "example": {
                "status": "success",
                "timestamp": "2024-01-01T00:00:00Z",
                "request_id": "req_123456789_abcdef",
                "data": {
                    "token": "Kg2mP5vL3nQ8rT6uY9wX0aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0uV",
                    "token_type": "Bearer",
                    "expires_in": 3600,
                    "expires_at": "2024-01-01T01:00:00Z"
                },
                "metadata": {
                    "generation_time_ms": 12.67,
                    "quantum_backend": "qrisp_simulator",
                    "url_safe": True
                }
            }
        }


class GenerateUUIDResponse(BaseResponse):
    """Response model for UUID generation"""
    status: ResponseStatus = ResponseStatus.SUCCESS
    data: Union[str, List[str]] = Field(..., description="Generated UUID(s)")
    metadata: Dict[str, Any] = Field(..., description="Generation metadata")
    
    class Config:
        schema_extra = {
            "example": {
                "status": "success",
                "timestamp": "2024-01-01T00:00:00Z",
                "request_id": "req_123456789_abcdef",
                "data": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
                "metadata": {
                    "generation_time_ms": 10.34,
                    "quantum_backend": "qrisp_simulator",
                    "version": 4,
                    "format": "standard"
                }
            }
        }


class GeneratePasswordResponse(BaseResponse):
    """Response model for password generation"""
    status: ResponseStatus = ResponseStatus.SUCCESS
    data: Dict[str, Any] = Field(..., description="Generated password data")
    metadata: Dict[str, Any] = Field(..., description="Generation metadata")
    
    class Config:
        schema_extra = {
            "example": {
                "status": "success",
                "timestamp": "2024-01-01T00:00:00Z",
                "request_id": "req_123456789_abcdef",
                "data": {
                    "password": "Kj8#mN2@pQ9$rT5!",
                    "length": 16,
                    "strength": "very_strong",
                    "entropy_bits": 95.2
                },
                "metadata": {
                    "generation_time_ms": 8.91,
                    "quantum_backend": "qrisp_simulator",
                    "character_set": "uppercase,lowercase,numbers,symbols"
                }
            }
        }


class EntropyStatusResponse(BaseResponse):
    """Response model for entropy status"""
    status: ResponseStatus = ResponseStatus.SUCCESS
    data: Dict[str, Any] = Field(..., description="Entropy analysis data")
    
    class Config:
        schema_extra = {
            "example": {
                "status": "success",
                "timestamp": "2024-01-01T00:00:00Z",
                "request_id": "req_123456789_abcdef",
                "data": {
                    "shannon_entropy": 0.9823,
                    "min_entropy": 0.9512,
                    "chi_square_p_value": 0.8921,
                    "autocorrelation": 0.0234,
                    "bit_balance": 0.5012,
                    "health_status": "excellent",
                    "pool_size": 1000,
                    "passed_tests": {
                        "shannon_entropy": True,
                        "chi_square": True,
                        "autocorrelation": True,
                        "bit_balance": True
                    }
                }
            }
        }


class SystemStatsResponse(BaseResponse):
    """Response model for system statistics"""
    status: ResponseStatus = ResponseStatus.SUCCESS
    data: Dict[str, Any] = Field(..., description="System statistics")
    
    class Config:
        schema_extra = {
            "example": {
                "status": "success",
                "timestamp": "2024-01-01T00:00:00Z",
                "request_id": "req_123456789_abcdef",
                "data": {
                    "total_bytes_generated": 1048576,
                    "total_generations": 32768,
                    "average_generation_time_ms": 15.67,
                    "entropy_pool_size": 1000,
                    "backend": "qrisp_simulator",
                    "backend_status": "operational",
                    "uptime_seconds": 3600,
                    "api_version": "2.0.0"
                }
            }
        }


class HealthResponse(BaseModel):
    """Response model for health check"""
    status: str = Field(..., description="Health status")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Check timestamp")
    version: str = Field(..., description="API version")
    backend: str = Field(..., description="Quantum backend")
    backend_status: str = Field(..., description="Backend status")
    checks: Dict[str, bool] = Field(..., description="Health check results")
    
    class Config:
        schema_extra = {
            "example": {
                "status": "healthy",
                "timestamp": "2024-01-01T00:00:00Z",
                "version": "2.0.0",
                "backend": "qrisp_simulator",
                "backend_status": "operational",
                "checks": {
                    "api": True,
                    "quantum_backend": True,
                    "entropy_pool": True,
                    "database": True,
                    "cache": True
                }
            }
        }


class ErrorResponse(BaseModel):
    """Response model for errors"""
    error: str = Field(..., description="Error code")
    message: str = Field(..., description="Error message")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Error timestamp")
    
    class Config:
        schema_extra = {
            "example": {
                "error": "validation_error",
                "message": "Invalid input parameters",
                "details": {
                    "field": "length",
                    "reason": "Value must be between 1 and 1024"
                },
                "timestamp": "2024-01-01T00:00:00Z"
            }
        }


class BatchGenerateResponse(BaseResponse):
    """Response model for batch generation"""
    status: ResponseStatus = ResponseStatus.SUCCESS
    data: List[Dict[str, Any]] = Field(..., description="Batch generation results")
    metadata: Dict[str, Any] = Field(..., description="Batch metadata")
    
    class Config:
        schema_extra = {
            "example": {
                "status": "success",
                "timestamp": "2024-01-01T00:00:00Z",
                "request_id": "req_batch_123456789",
                "data": [
                    {
                        "index": 0,
                        "status": "success",
                        "bytes": "a3f2b8c9d1e7f4a2...",
                        "format": "hex",
                        "length": 32
                    },
                    {
                        "index": 1,
                        "status": "success",
                        "bytes": "Kg2mP5vL3nQ8rT6u...",
                        "format": "base64",
                        "length": 64
                    }
                ],
                "metadata": {
                    "total_requests": 2,
                    "successful": 2,
                    "failed": 0,
                    "total_time_ms": 35.67,
                    "parallel": True
                }
            }
        }