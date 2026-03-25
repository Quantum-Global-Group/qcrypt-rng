#!/usr/bin/env python3
"""
QCrypt RNG - Unified Startup Script
Starts the API server and Next.js frontend with automatic port detection.
"""

import sys
import os
import socket
import signal
import subprocess
import time
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
VENV_PYTHON = PROJECT_ROOT / ".venv" / "bin" / "python"
FRONTEND_DIR = PROJECT_ROOT / "quantum-oracle-ui"

# Default ports
API_DEFAULT_PORT = 8000
UI_DEFAULT_PORT = 3000

# Colour helpers (ANSI)
BOLD = "\033[1m"
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
DIM = "\033[2m"
RESET = "\033[0m"


# ── Port utilities ──────────────────────────────────────────────────────────

def is_port_in_use(port: int) -> bool:
    """Check whether a TCP port is already bound."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex(("127.0.0.1", port)) == 0


def find_available_port(preferred: int, max_tries: int = 20) -> int:
    """Return *preferred* if free, otherwise scan upward until a free port is found."""
    port = preferred
    for _ in range(max_tries):
        if not is_port_in_use(port):
            return port
        port += 1
    # Last-resort: ask the OS for an ephemeral port
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("", 0))
        return s.getsockname()[1]


def get_pid_on_port(port: int) -> str | None:
    """Best-effort attempt to find the PID listening on *port*."""
    try:
        out = subprocess.check_output(
            ["ss", "-tlnp"], stderr=subprocess.DEVNULL, text=True
        )
        for line in out.splitlines():
            if f":{port}" in line:
                # extract pid from  pid=XXXX
                for part in line.split(","):
                    if "pid=" in part:
                        return part.split("pid=")[1].split(",")[0].rstrip(")")
    except Exception:
        pass
    return None


# ── Banner ──────────────────────────────────────────────────────────────────

def print_banner():
    print(f"""
{BOLD}{CYAN}╔══════════════════════════════════════════════════════════════╗
║        QCrypt RNG  —  Unified Startup                        ║
╚══════════════════════════════════════════════════════════════╝{RESET}
""")


def print_service_info(name: str, port: int, preferred: int, url: str):
    if port == preferred:
        status = f"{GREEN}port {port}{RESET}"
    else:
        status = f"{YELLOW}port {port}{RESET} {DIM}({preferred} was in use){RESET}"
    print(f"  {BOLD}{name}{RESET}  {status}")
    print(f"    {DIM}{url}{RESET}")


# ── Process management ──────────────────────────────────────────────────────

children: list[subprocess.Popen] = []


def cleanup(sig=None, frame=None):
    print(f"\n{YELLOW}Shutting down services...{RESET}")
    for proc in children:
        try:
            os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
        except (ProcessLookupError, OSError):
            pass
    for proc in children:
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
    print(f"{GREEN}All services stopped.{RESET}")
    sys.exit(0)


signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)


# ── Service starters ────────────────────────────────────────────────────────

def start_api(port: int) -> subprocess.Popen:
    python = str(VENV_PYTHON) if VENV_PYTHON.exists() else sys.executable
    env = {**os.environ, "API_PORT": str(port)}
    proc = subprocess.Popen(
        [
            python, "-m", "uvicorn", "app.main:app",
            "--host", "0.0.0.0",
            "--port", str(port),
            "--reload",
            "--log-level", "info",
        ],
        cwd=str(PROJECT_ROOT),
        env=env,
        preexec_fn=os.setsid,
    )
    return proc


def clear_next_lock():
    """Remove the .next/dev/lock file and kill any orphaned next dev process."""
    lock = FRONTEND_DIR / ".next" / "dev" / "lock"
    if lock.exists():
        print(f"  {YELLOW}Removing stale Next.js lock file{RESET}")
        try:
            lock.unlink()
        except OSError:
            pass

    # Kill any lingering `next dev` process
    try:
        out = subprocess.check_output(["pgrep", "-f", "next dev"], text=True, stderr=subprocess.DEVNULL)
        for pid in out.strip().splitlines():
            pid = pid.strip()
            if pid:
                print(f"  {YELLOW}Killing orphaned next dev process (pid {pid}){RESET}")
                try:
                    os.kill(int(pid), signal.SIGTERM)
                except (ProcessLookupError, OSError):
                    pass
        time.sleep(1)
    except (subprocess.CalledProcessError, FileNotFoundError):
        pass


def resolve_frontend_port(preferred: int) -> int:
    """Use the frontend's own find-port.js for consistent port resolution."""
    find_port_script = FRONTEND_DIR / "find-port.js"
    if find_port_script.exists():
        try:
            result = subprocess.check_output(
                ["node", str(find_port_script), str(preferred)],
                text=True, timeout=5,
            )
            return int(result.strip())
        except Exception:
            pass
    return find_available_port(preferred)


def start_frontend(port: int, api_port: int) -> subprocess.Popen:
    clear_next_lock()
    npm = "npm"
    env = {
        **os.environ,
        "PORT": str(port),
        "NEXT_PUBLIC_API_BASE_URL": f"http://localhost:{api_port}/api/v2",
    }
    proc = subprocess.Popen(
        [npm, "run", "dev", "--", "--port", str(port)],
        cwd=str(FRONTEND_DIR),
        env=env,
        preexec_fn=os.setsid,
    )
    return proc


def wait_for_port(port: int, label: str, timeout: int = 30):
    """Block until *port* accepts connections or *timeout* seconds elapse."""
    start = time.time()
    while time.time() - start < timeout:
        if is_port_in_use(port):
            return True
        time.sleep(0.5)
    print(f"  {RED}Timed out waiting for {label} on port {port}{RESET}")
    return False


# ── Main ────────────────────────────────────────────────────────────────────

def main():
    print_banner()

    # ── Resolve ports ───────────────────────────────────────────────────────
    print(f"{BOLD}Checking ports...{RESET}\n")

    api_port = find_available_port(API_DEFAULT_PORT)
    if api_port != API_DEFAULT_PORT:
        pid = get_pid_on_port(API_DEFAULT_PORT)
        extra = f" (pid {pid})" if pid else ""
        print(f"  {YELLOW}Port {API_DEFAULT_PORT} in use{extra} — API will use {api_port}{RESET}")
    else:
        print(f"  {GREEN}Port {api_port} available for API{RESET}")

    ui_port = resolve_frontend_port(UI_DEFAULT_PORT)
    if ui_port != UI_DEFAULT_PORT:
        pid = get_pid_on_port(UI_DEFAULT_PORT)
        extra = f" (pid {pid})" if pid else ""
        print(f"  {YELLOW}Port {UI_DEFAULT_PORT} in use{extra} — UI will use {ui_port}{RESET}")
    else:
        print(f"  {GREEN}Port {ui_port} available for UI{RESET}")

    # ── Start services ──────────────────────────────────────────────────────
    print(f"\n{BOLD}Starting services...{RESET}\n")

    api_proc = start_api(api_port)
    children.append(api_proc)
    print(f"  {DIM}API server starting...{RESET}")

    has_frontend = FRONTEND_DIR.exists() and (FRONTEND_DIR / "package.json").exists()
    ui_proc = None
    if has_frontend:
        ui_proc = start_frontend(ui_port, api_port)
        children.append(ui_proc)
        print(f"  {DIM}Next.js frontend starting...{RESET}")
    else:
        print(f"  {YELLOW}No frontend found at {FRONTEND_DIR} — skipping{RESET}")

    # ── Wait for readiness ──────────────────────────────────────────────────
    print(f"\n{DIM}Waiting for services to become ready...{RESET}\n")

    api_ready = wait_for_port(api_port, "API", timeout=30)
    ui_ready = True
    if has_frontend:
        ui_ready = wait_for_port(ui_port, "UI", timeout=45)

    # ── Summary ─────────────────────────────────────────────────────────────
    print(f"\n{BOLD}{CYAN}{'═' * 60}{RESET}")
    print(f"{BOLD}  Services running:{RESET}\n")

    if api_ready:
        print_service_info("API Server", api_port, API_DEFAULT_PORT,
                           f"http://localhost:{api_port}")
        print(f"    {DIM}Docs:  http://localhost:{api_port}/docs{RESET}")
        print(f"    {DIM}ReDoc: http://localhost:{api_port}/redoc{RESET}")
    else:
        print(f"  {RED}API Server  FAILED TO START{RESET}")

    print()

    if has_frontend:
        if ui_ready:
            print_service_info("Frontend", ui_port, UI_DEFAULT_PORT,
                               f"http://localhost:{ui_port}")
        else:
            print(f"  {RED}Frontend    FAILED TO START{RESET}")

    print(f"\n{BOLD}{CYAN}{'═' * 60}{RESET}")
    print(f"\n  {DIM}Press Ctrl+C to stop all services{RESET}\n")

    # ── Keep alive ──────────────────────────────────────────────────────────
    try:
        while True:
            # Check if children are still alive
            for proc in children:
                ret = proc.poll()
                if ret is not None:
                    print(f"\n  {RED}Process {proc.pid} exited with code {ret}{RESET}")
            time.sleep(2)
    except KeyboardInterrupt:
        cleanup()


if __name__ == "__main__":
    main()
