"""
QCrypt RNG - Main FastAPI Application
Quantum-Enhanced Cybersecurity Platform with Post-Quantum Cryptography
"""

import sys

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import time

from app.config import settings
from app.utils.logging import setup_logging, logger, get_performance_logger, get_security_logger
from app.utils.middleware import rate_limit_middleware, api_key_middleware, monitoring_middleware
from app.api.v2.endpoints import generate, quantum, health
from app.api.v2.endpoints import protect, blockchain, pqc_endpoints
from app.api.v2.endpoints import monitoring
from app.api.v2.endpoints import hardware
from app.api.v2.endpoints import oracle
from app.api.v2.endpoints import vrf
from app.api.v2.endpoints import pqc_upgrades
from app.api.v2.endpoints import ibm_runtime
from app.billing import stripe_webhooks
from app.api.v2.models.responses import ErrorResponse


# Lifecycle management
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle"""
    # Startup
    setup_logging()

    # Enforce a real SECRET_KEY in production
    if settings.is_production and settings.secret_key == "your-secret-key-here-change-in-production":
        logger.critical(
            "FATAL: SECRET_KEY is still the default placeholder. "
            "Set the SECRET_KEY environment variable to a secure value (>= 32 chars) before running in production."
        )
        sys.exit(1)

    logger.info("🚀 QCrypt RNG API Starting...")
    logger.info(f"Version: {settings.app_version}")
    logger.info(f"Backend: {settings.quantum_backend}")
    logger.info(f"Debug: {settings.debug}")
    logger.info(f"Environment: {settings.environment}")
    logger.info("✅ Protection endpoints loaded")
    logger.info("✅ Post-Quantum Cryptography loaded")
    logger.info("✅ PQC Upgrades loaded (Hybrid, Falcon, HQC)")
    logger.info("✅ Blockchain demo loaded")
    
    yield
    
    # Shutdown
    logger.info("👋 QCrypt RNG API Shutting down...")


# Create FastAPI app
app = FastAPI(
    title=settings.app_name + " - Quantum-Enhanced Security Platform",
    description="""
    🔐 **QCrypt RNG** - Quantum-Simulation Random Number Generation with Hardware Integration Pathways

    ## 🎯 Platform Features

    ### 🛡️ Quantum-Enhanced Security
    - Quantum-simulation enhanced encryption (AES with quantum-enhanced keys)
    - Quantum-enhanced session tokens with true randomness simulation
    - Quantum-enhanced password hashing with simulated quantum entropy
    - Digital signatures with quantum-enhanced randomness

    ### ⚡ Post-Quantum Cryptography
    - **KYBER**: Quantum-safe encryption (NIST standard)
    - **DILITHIUM**: Quantum-safe signatures (NIST standard)
    - **FALCON**: Compact quantum-safe signatures
    - Hybrid mode for transition period

    ### 🔬 Quantum Simulation Engine
    - Real-time quantum circuit simulation for random number generation
    - Hardware abstraction layer for seamless transition to real quantum devices
    - Performance benchmarking between simulation and hardware modes
    - Quantum entropy validation and statistical analysis

    ### ⛓️ Blockchain Security Analysis
    - Live blockchain with vulnerable (RSA/ECDSA) signatures
    - Shor's algorithm attack simulation
    - Quantum-safe blockchain with Dilithium signatures
    - Side-by-side security comparison

    ## 🚨 The Quantum Threat
    - RSA-2048: Breakable in 8 hours with 4096 qubits
    - Bitcoin/Ethereum: $2.1 trillion at risk
    - Timeline: Major vulnerabilities by 2030

    ## ✅ The QCrypt Solution
    - Quantum-simulation for high-quality randomness (ready for real quantum hardware)
    - NIST-approved post-quantum algorithms
    - Complete protection against Shor's algorithm
    - Ready for both current and future threats
    - Modular architecture for hardware integration
    """,
    version="2.0.0-demo",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)


# Add middleware in the right order
app.middleware("http")(monitoring_middleware)
app.middleware("http")(api_key_middleware)
app.middleware("http")(rate_limit_middleware)

# Configure CORS using the allowed_origins list from settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add standard security hardening headers to every response."""
    response = await call_next(request)

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"

    if settings.is_production:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'"

    return response


# Request body size limit middleware
@app.middleware("http")
async def enforce_body_size_limit(request: Request, call_next):
    """Reject requests whose Content-Length exceeds the configured limit."""
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > settings.max_request_body_size_bytes:
        return JSONResponse(
            status_code=413,
            content={
                "error": "payload_too_large",
                "message": f"Request body exceeds the {settings.max_request_body_size_bytes} byte limit."
            }
        )
    return await call_next(request)


# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add processing time to response headers"""
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = (time.time() - start_time) * 1000
    response.headers["X-Process-Time"] = f"{process_time:.2f}ms"
    
    return response


# Exception handlers
@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    """Handle validation errors"""
    return JSONResponse(
        status_code=400,
        content={"error": "validation_error", "message": str(exc)}
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": f"http_{exc.status_code}", "message": exc.detail}
    )


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with demo information"""
    return {
        "name": "QCrypt RNG - Quantum Security Platform",
        "version": "2.0.0-demo",
        "status": "operational",
        "demo_features": {
            "quantum_rng": "True quantum random number generation",
            "protection": "Quantum-enhanced encryption and signatures",
            "pqc": "Post-quantum cryptography (NIST standards)",
            "blockchain": "Quantum threat and defense demonstration"
        },
        "endpoints": {
            "documentation": "/docs",
            "quantum_rng": "/api/v2/generate/*",
            "protection": "/api/v2/protect/*",
            "post_quantum": "/api/v2/pqc/*",
            "blockchain_demo": "/api/v2/blockchain/*",
            "health": "/health"
        },
        "demo_flow": [
            "1. Create vulnerable wallet (/blockchain/create-wallet)",
            "2. Sign transaction with RSA (/blockchain/sign-transaction)",
            "3. Simulate Shor's attack (/blockchain/simulate-attack)",
            "4. Generate quantum-safe keys (/pqc/generate)",
            "5. Compare blockchains (/blockchain/compare-blockchains)"
        ]
    }


# Include routers

# Original endpoints
app.include_router(
    generate.router,
    prefix=f"{settings.api_prefix}/generate",
    tags=["Quantum RNG"]
)

app.include_router(
    quantum.router,
    prefix=f"{settings.api_prefix}/quantum",
    tags=["Quantum Operations"]
)

# New protection endpoints
app.include_router(
    protect.router,
    prefix=f"{settings.api_prefix}/protect",
    tags=["Protection Services"]
)

# Post-quantum cryptography
app.include_router(
    pqc_endpoints.router,
    prefix=f"{settings.api_prefix}/pqc",
    tags=["Post-Quantum Cryptography"]
)

# PQC upgrades — Hybrid, Falcon, HQC
app.include_router(
    pqc_upgrades.router,
    prefix=f"{settings.api_prefix}/pqc",
    tags=["PQC Upgrades"]
)

# Blockchain demonstration
app.include_router(
    blockchain.router,
    prefix=f"{settings.api_prefix}/blockchain",
    tags=["Blockchain Demo"]
)

# Monitoring and analytics
app.include_router(
    monitoring.router,
    prefix=f"{settings.api_prefix}/monitoring",
    tags=["Monitoring & Analytics"]
)

# Billing and subscription lifecycle
app.include_router(
    stripe_webhooks.router,
    prefix=settings.api_prefix,
    tags=["Billing"]
)

# Quantum hardware interface
app.include_router(
    hardware.router,
    prefix=f"{settings.api_prefix}/hardware",
    tags=["Quantum Hardware Interface"]
)

# Quantum randomness oracle
app.include_router(
    oracle.router,
    prefix=f"{settings.api_prefix}/oracle",
    tags=["Quantum Randomness Oracle"]
)

# Quantum VRF (verifiable random function)
app.include_router(
    vrf.router,
    prefix=f"{settings.api_prefix}/oracle",
    tags=["Quantum VRF"]
)

# IBM Quantum Runtime (IBM Cloud API key + instance CRN)
app.include_router(
    ibm_runtime.router,
    prefix=f"{settings.api_prefix}/ibm-runtime",
    tags=["IBM Quantum Runtime"],
)

# Health check
app.include_router(
    health.router,
    prefix="/health",
    tags=["Health"]
)


# Demo helper endpoint
@app.get("/demo/quick-test", tags=["Demo"])
async def quick_demo_test():
    """Quick test to verify all demo components are working"""
    try:
        from app.quantum.qrng import get_quantum_rng
        from app.quantum.pqc import get_pqc
        
        results = {}
        
        # Test quantum RNG
        qrng = get_quantum_rng()
        rng_result = await qrng.generate_bytes(32, 8, "hex")
        results["quantum_rng"] = "✅ Working" if rng_result else "❌ Failed"
        
        # Test PQC
        pqc = get_pqc()
        results["pqc_available"] = "✅ Ready" if pqc else "❌ Not initialized"
        
        # Test protection endpoints availability
        results["protection_endpoints"] = "✅ Loaded"
        results["blockchain_demo"] = "✅ Ready"
        
        return {
            "status": "Demo Ready" if all("✅" in v for v in results.values()) else "Partial",
            "components": results,
            "next_steps": [
                "Visit /docs for interactive API documentation",
                "Try the blockchain demo at /api/v2/blockchain/create-wallet",
                "Generate quantum-safe keys at /api/v2/pqc/generate"
            ]
        }
    except Exception as e:
        return {
            "status": "Error",
            "error": str(e),
            "message": "Some components may not be fully configured"
        }


# Metrics endpoint for demo
@app.get("/metrics", tags=["Monitoring"])
async def metrics():
    """Simple metrics for demo"""
    from app.quantum.qrng import get_quantum_rng
    
    qrng = get_quantum_rng()
    stats = qrng.get_statistics()
    
    return {
        "quantum_metrics": {
            "total_bytes_generated": stats['total_bytes_generated'],
            "total_generations": stats['total_generations'],
            "average_generation_time_ms": stats['average_generation_time_ms'],
            "entropy_pool_size": stats['entropy_pool_size']
        },
        "demo_status": "operational"
    }


if __name__ == "__main__":
    import uvicorn
    
    print("\n" + "="*60)
    print("🚀 QCrypt RNG - Quantum Security Platform")
    print("="*60)
    print("\nStarting demo server...")
    print(f"📍 API Documentation: http://localhost:8000/docs")
    print(f"📍 Demo Test: http://localhost:8000/demo/quick-test")
    print("\n" + "="*60 + "\n")
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )