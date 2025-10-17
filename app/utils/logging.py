"""
QCrypt RNG Logging Configuration
Centralized logging setup with structured logging support
"""

import sys
import os
from typing import Optional
from pathlib import Path
from loguru import logger
from app.config import settings

# Remove default handler
logger.remove()

# Create logs directory if it doesn't exist
log_dir = Path("logs")
log_dir.mkdir(exist_ok=True)


def setup_logging():
    """Configure application logging"""
    
    # Console logging with color
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level=settings.log_level,
        colorize=True,
        backtrace=True,
        diagnose=settings.debug
    )
    
    # File logging for all logs
    logger.add(
        "logs/qcrypt_{time:YYYY-MM-DD}.log",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        level="DEBUG",
        rotation="00:00",  # Daily rotation
        retention="30 days",
        compression="zip",
        backtrace=True,
        diagnose=True
    )
    
    # Separate error log
    logger.add(
        "logs/errors_{time:YYYY-MM-DD}.log",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        level="ERROR",
        rotation="00:00",
        retention="90 days",
        compression="zip",
        backtrace=True,
        diagnose=True
    )
    
    # JSON logging for production (machine-readable)
    if not settings.debug:
        logger.add(
            "logs/qcrypt_json_{time:YYYY-MM-DD}.log",
            format="{message}",
            level="INFO",
            rotation="00:00",
            retention="30 days",
            compression="zip",
            serialize=True  # JSON format
        )
    
    # Performance logging
    logger.add(
        "logs/performance_{time:YYYY-MM-DD}.log",
        format="{time:YYYY-MM-DD HH:mm:ss} | PERF | {message}",
        level="INFO",
        filter=lambda record: "performance" in record["extra"],
        rotation="00:00",
        retention="7 days"
    )
    
    # Security audit log
    logger.add(
        "logs/security_{time:YYYY-MM-DD}.log",
        format="{time:YYYY-MM-DD HH:mm:ss} | SECURITY | {message}",
        level="INFO",
        filter=lambda record: "security" in record["extra"],
        rotation="00:00",
        retention="365 days",  # Keep for compliance
        compression="zip"
    )
    
    logger.info("Logging system initialized")
    logger.info(f"Log level: {settings.log_level}")
    logger.info(f"Debug mode: {settings.debug}")


# Specialized loggers
def get_performance_logger():
    """Get logger for performance metrics"""
    return logger.bind(performance=True)


def get_security_logger():
    """Get logger for security events"""
    return logger.bind(security=True)


def get_quantum_logger():
    """Get logger for quantum operations"""
    return logger.bind(quantum=True)


# Decorators for logging
def log_execution_time(func):
    """Decorator to log function execution time"""
    import functools
    import time
    
    @functools.wraps(func)
    async def async_wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = await func(*args, **kwargs)
            execution_time = (time.time() - start_time) * 1000
            get_performance_logger().info(
                f"{func.__name__} executed in {execution_time:.2f}ms"
            )
            return result
        except Exception as e:
            execution_time = (time.time() - start_time) * 1000
            logger.error(
                f"{func.__name__} failed after {execution_time:.2f}ms: {str(e)}"
            )
            raise
    
    @functools.wraps(func)
    def sync_wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            execution_time = (time.time() - start_time) * 1000
            get_performance_logger().info(
                f"{func.__name__} executed in {execution_time:.2f}ms"
            )
            return result
        except Exception as e:
            execution_time = (time.time() - start_time) * 1000
            logger.error(
                f"{func.__name__} failed after {execution_time:.2f}ms: {str(e)}"
            )
            raise
    
    # Return appropriate wrapper based on function type
    import asyncio
    if asyncio.iscoroutinefunction(func):
        return async_wrapper
    else:
        return sync_wrapper


def log_api_request(endpoint: str, method: str, user_id: Optional[str] = None):
    """Log API request for audit trail"""
    get_security_logger().info(
        f"API Request | Method: {method} | Endpoint: {endpoint} | User: {user_id or 'anonymous'}"
    )


def log_quantum_generation(bytes_generated: int, qubits: int, backend: str, time_ms: float):
    """Log quantum generation event"""
    get_quantum_logger().info(
        f"Quantum Generation | Bytes: {bytes_generated} | Qubits: {qubits} | "
        f"Backend: {backend} | Time: {time_ms:.2f}ms"
    )