#!/usr/bin/env python3
"""
Simple HTTP server to serve the Quantum Randomness Oracle UI
"""

import http.server
import socketserver
import os
import threading
from pathlib import Path

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def run_server():
    """Run the HTTP server"""
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"🌍 Quantum Randomness Oracle UI running at: http://localhost:{PORT}/quantum_oracle_ui.html")
        print("Press Ctrl+C to stop the server")
        httpd.serve_forever()

if __name__ == "__main__":
    print("🚀 Starting Quantum Randomness Oracle UI Server...")
    print(f"📁 Serving from directory: {DIRECTORY}")
    run_server()