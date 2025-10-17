#!/usr/bin/env python3
"""
QCrypt RNG - Run FastAPI Server
Quick script to start the API server
"""

import sys
import os
from pathlib import Path

# Add project root to path
sys.path.append(str(Path(__file__).parent))

if __name__ == "__main__":
    try:
        import uvicorn
    except ImportError:
        print("Installing uvicorn...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "uvicorn[standard]"])
        import uvicorn
    
    try:
        import fastapi
    except ImportError:
        print("Installing FastAPI...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "fastapi"])
    
    print("""
╔══════════════════════════════════════════════════════════════╗
║            🚀 QCrypt RNG API Server Starting...              ║
╚══════════════════════════════════════════════════════════════╝
    """)
    
    print("📍 API Documentation will be available at:")
    print("   http://localhost:8000/docs - Swagger UI")
    print("   http://localhost:8000/redoc - ReDoc")
    print("   http://localhost:8000/ - API Info")
    print("\n⌨️  Press CTRL+C to stop the server\n")
    
    # Run the server
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )