#!/usr/bin/env python3
"""
QCrypt RNG - Run FastAPI Server
Starts the API server with automatic port detection.
"""

import sys
import socket
from pathlib import Path

# Add project root to path
sys.path.append(str(Path(__file__).parent))

DEFAULT_PORT = 8000


def is_port_in_use(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex(("127.0.0.1", port)) == 0


def find_available_port(preferred: int, max_tries: int = 20) -> int:
    port = preferred
    for _ in range(max_tries):
        if not is_port_in_use(port):
            return port
        port += 1
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("", 0))
        return s.getsockname()[1]


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

    port = find_available_port(DEFAULT_PORT)

    if port != DEFAULT_PORT:
        print(f"\n  ⚠  Port {DEFAULT_PORT} is already in use — using port {port} instead\n")

    print(f"""
╔══════════════════════════════════════════════════════════════╗
║            QCrypt RNG API Server Starting...                 ║
╚══════════════════════════════════════════════════════════════╝
    """)

    print(f"  API Documentation: http://localhost:{port}/docs")
    print(f"  ReDoc:             http://localhost:{port}/redoc")
    print(f"  API Info:          http://localhost:{port}/")
    print(f"\n  Press CTRL+C to stop the server\n")

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info",
    )
