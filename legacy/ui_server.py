#!/usr/bin/env python3
"""
Simple HTTP server to serve the Quantum Randomness Oracle UI
"""

import http.server
import socketserver
import threading
from pathlib import Path

PORT = 8080
# Serve static HTML from legacy/static (next to this file)
_LEGACY_ROOT = Path(__file__).resolve().parent
STATIC_DIR = _LEGACY_ROOT / "static"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(STATIC_DIR), **kwargs)

def run_server():
    """Run the HTTP server"""
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"🌍 Quantum Randomness Oracle UI running at: http://localhost:{PORT}/quantum_oracle_ui.html")
        print("Press Ctrl+C to stop the server")
        httpd.serve_forever()

if __name__ == "__main__":
    print("🚀 Starting Quantum Randomness Oracle UI Server...")
    print(f"📁 Serving from directory: {STATIC_DIR}")
    run_server()