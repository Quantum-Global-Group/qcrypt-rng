from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from enum import Enum


class ResponseStatus(str, Enum):
    SUCCESS = "success"
    ERROR = "error"


class BaseResponse(BaseModel):
    """Base response model for all API endpoints"""
    status: ResponseStatus
    request_id: str
    data: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None


class ErrorResponse(BaseModel):
    """Error response model"""
    error: str
    message: str
    request_id: Optional[str] = None


class GenerateBytesResponse(BaseResponse):
    """Response model for byte generation endpoint"""
    pass


class GenerateKeyResponse(BaseResponse):
    """Response model for key generation endpoint"""
    pass


class GenerateTokenResponse(BaseResponse):
    """Response model for token generation endpoint"""
    pass


class GenerateUUIDResponse(BaseResponse):
    """Response model for UUID generation endpoint"""
    pass


class GeneratePasswordResponse(BaseResponse):
    """Response model for password generation endpoint"""
    pass


class BatchGenerateResponse(BaseResponse):
    """Response model for batch generation endpoint"""
    pass


class EntropyStatusResponse(BaseResponse):
    """Response model for entropy status endpoint"""
    pass


class SystemStatsResponse(BaseResponse):
    """Response model for system stats endpoint"""
    pass


class HealthResponse(BaseModel):
    """Response model for health check endpoint"""
    status: str
    version: str
    backend: str
    backend_status: str
    checks: dict