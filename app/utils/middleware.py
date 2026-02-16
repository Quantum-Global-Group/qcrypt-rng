"""
QCrypt RNG - API Middleware
Enterprise-grade middleware for rate limiting, authentication, and monitoring
"""

from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
import hashlib
import hmac as _hmac
import time
import asyncio
from typing import Callable, Awaitable, Optional, Set

from app.utils.rate_limiting import rate_limiter
from app.config import settings
from app.utils.logging import logger, get_security_logger

_security_log = get_security_logger()


# ---------------------------------------------------------------------------
# API key allow-list (loaded once at import time from settings)
# ---------------------------------------------------------------------------
def _load_valid_api_keys() -> Optional[Set[str]]:
    """Parse VALID_API_KEYS from settings into a frozen set.

    Returns None when no allow-list is configured (fall back to
    length-based validation).
    """
    raw = settings.valid_api_keys
    if not raw:
        return None
    keys = {k.strip() for k in raw.split(",") if k.strip()}
    return keys if keys else None


_VALID_API_KEYS: Optional[Set[str]] = _load_valid_api_keys()


def _constant_time_key_check(candidate: str, valid_keys: Set[str]) -> bool:
    """Check membership with constant-time comparison per key."""
    candidate_bytes = candidate.encode("utf-8")
    found = False
    for key in valid_keys:
        if _hmac.compare_digest(candidate_bytes, key.encode("utf-8")):
            found = True
    return found


def _mask_api_key(api_key: str) -> str:
    """Return a safe prefix hash for audit logs (never log the raw key)."""
    return hashlib.sha256(api_key.encode("utf-8")).hexdigest()[:12]


async def rate_limit_middleware(
    request: Request, 
    call_next: Callable[[Request], Awaitable[any]]
):
    """
    Rate limiting middleware that checks usage against tier limits
    """
    if not settings.enable_usage_tracking:
        return await call_next(request)
    
    # Extract API key from header
    api_key = request.headers.get(settings.api_key_header, "")
    
    # Skip rate limiting for certain endpoints or if API key is not required
    if not settings.require_api_key and not api_key:
        return await call_next(request)
    
    # Check rate limit
    is_allowed, remaining, reset_time = await rate_limiter.check_limit(
        api_key, 
        request.url.path
    )
    
    if not is_allowed:
        client_ip = request.client.host if request.client else "unknown"
        _security_log.warning(
            f"rate_limit_exceeded | IP: {client_ip} | "
            f"Path: {request.method} {request.url.path} | "
            f"Key: {_mask_api_key(api_key) if api_key else 'none'} | "
            f"Reset: {reset_time}s"
        )
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "error": "rate_limit_exceeded",
                "message": f"Rate limit exceeded. Try again in {reset_time} seconds.",
                "remaining_requests": 0,
                "reset_time": reset_time
            }
        )
    
    # Record start time for response time tracking
    start_time = time.time()
    
    try:
        response = await call_next(request)
        
        # Calculate response time
        response_time = time.time() - start_time
        
        # Record usage
        await rate_limiter.record_usage(
            api_key=api_key,
            endpoint=request.url.path,
            method=request.method,
            response_time=response_time,
            bytes_processed=int(response.headers.get("content-length", 0)),
            success=response.status_code < 400
        )
        
        # Increment usage counters
        content_length = int(response.headers.get("content-length", 0))
        await rate_limiter.increment_usage(api_key, content_length)
        
        # Add rate limit headers to response
        response.headers["X-RateLimit-Remaining"] = str(remaining - 1)
        response.headers["X-RateLimit-Reset"] = str(reset_time)
        response.headers["X-Response-Time"] = f"{response_time:.3f}s"
        
        return response
        
    except Exception as e:
        # Calculate response time even for errors
        response_time = time.time() - start_time
        
        # Record error in usage tracking
        await rate_limiter.record_usage(
            api_key=api_key,
            endpoint=request.url.path,
            method=request.method,
            response_time=response_time,
            bytes_processed=0,
            success=False
        )
        
        # Increment usage counters even for errors (failed requests still count)
        await rate_limiter.increment_usage(api_key, 0)
        
        raise


async def api_key_middleware(
    request: Request, 
    call_next: Callable[[Request], Awaitable[any]]
):
    """
    API key validation middleware.

    When VALID_API_KEYS is configured, the key is checked against that
    allow-list using constant-time comparison.  Otherwise falls back to
    a minimum-length check so existing setups keep working.
    """
    if not settings.require_api_key:
        return await call_next(request)

    client_ip = request.client.host if request.client else "unknown"
    api_key = request.headers.get(settings.api_key_header)

    if not api_key:
        _security_log.warning(
            f"api_key_missing | IP: {client_ip} | "
            f"Path: {request.method} {request.url.path}"
        )
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"error": "api_key_required", "message": f"API key required in {settings.api_key_header} header"}
        )

    # Validate against the allow-list when configured
    if _VALID_API_KEYS is not None:
        if not _constant_time_key_check(api_key, _VALID_API_KEYS):
            _security_log.warning(
                f"api_key_invalid | IP: {client_ip} | "
                f"Path: {request.method} {request.url.path} | "
                f"KeyHash: {_mask_api_key(api_key)}"
            )
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"error": "invalid_api_key", "message": "Invalid API key"}
            )
    else:
        # Fallback: basic length validation
        if len(api_key) < 10:
            _security_log.warning(
                f"api_key_invalid | IP: {client_ip} | "
                f"Path: {request.method} {request.url.path} | "
                f"Reason: key too short"
            )
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"error": "invalid_api_key", "message": "Invalid API key format"}
            )

    # Add API key to request state for later use
    request.state.api_key = api_key

    return await call_next(request)


async def monitoring_middleware(
    request: Request, 
    call_next: Callable[[Request], Awaitable[any]]
):
    """
    Monitoring and analytics middleware
    """
    start_time = time.time()
    
    # Log incoming request
    if settings.enable_detailed_logging:
        logger.info(f"Request: {request.method} {request.url.path} - IP: {request.client.host}")
    
    try:
        response = await call_next(request)
        
        # Calculate processing time
        process_time = time.time() - start_time
        
        # Add timing header
        response.headers["X-Process-Time"] = f"{process_time*1000:.2f}ms"
        
        # Log response if detailed logging is enabled
        if settings.enable_detailed_logging:
            logger.info(f"Response: {response.status_code} - Time: {process_time*1000:.2f}ms")
        
        return response
        
    except Exception as e:
        process_time = time.time() - start_time
        
        # Log error
        logger.error(f"Error in {request.method} {request.url.path}: {str(e)} - Time: {process_time*1000:.2f}ms")
        
        # Re-raise the exception to be handled by FastAPI's exception handlers
        raise