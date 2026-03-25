#!/usr/bin/env python3
"""
QCrypt RNG - Test API Endpoints
Script to test all API endpoints
"""

import asyncio
import json
from typing import Dict, Any
import sys
from pathlib import Path

# Add project root to path
sys.path.append(str(Path(__file__).parent))

try:
    import httpx
    from rich.console import Console
    from rich.table import Table
    from rich.progress import Progress, SpinnerColumn, TextColumn
    from rich.panel import Panel
except ImportError:
    print("Installing required packages...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "httpx", "rich"])
    import httpx
    from rich.console import Console
    from rich.table import Table
    from rich.progress import Progress, SpinnerColumn, TextColumn
    from rich.panel import Panel

console = Console()

# API Base URL
BASE_URL = "http://localhost:8000"
API_V2 = f"{BASE_URL}/api/v2"


async def test_root():
    """Test root endpoint"""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/")
        return response.status_code == 200, response.json()


async def test_health():
    """Test health endpoint"""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/health")
        return response.status_code == 200, response.json()


async def test_generate_bytes():
    """Test byte generation endpoint"""
    async with httpx.AsyncClient() as client:
        payload = {
            "length": 32,
            "format": "hex",
            "quantum_bits": 8
        }
        response = await client.post(f"{API_V2}/generate/bytes", json=payload)
        return response.status_code == 200, response.json()


async def test_generate_key():
    """Test key generation endpoint"""
    async with httpx.AsyncClient() as client:
        payload = {
            "algorithm": "AES",
            "key_size": 256,
            "format": "hex"
        }
        response = await client.post(f"{API_V2}/generate/key", json=payload)
        return response.status_code == 200, response.json()


async def test_generate_token():
    """Test token generation endpoint"""
    async with httpx.AsyncClient() as client:
        payload = {
            "length": 32,
            "url_safe": True,
            "expires_in": 3600
        }
        response = await client.post(f"{API_V2}/generate/token", json=payload)
        return response.status_code == 200, response.json()


async def test_generate_uuid():
    """Test UUID generation endpoint"""
    async with httpx.AsyncClient() as client:
        payload = {
            "version": 4,
            "count": 1,
            "format": "standard"
        }
        response = await client.post(f"{API_V2}/generate/uuid", json=payload)
        return response.status_code == 200, response.json()


async def test_generate_password():
    """Test password generation endpoint"""
    async with httpx.AsyncClient() as client:
        payload = {
            "length": 16,
            "include_uppercase": True,
            "include_lowercase": True,
            "include_numbers": True,
            "include_symbols": True,
            "exclude_ambiguous": True
        }
        response = await client.post(f"{API_V2}/generate/password", json=payload)
        return response.status_code == 200, response.json()


async def test_entropy_status():
    """Test entropy status endpoint"""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{API_V2}/quantum/entropy")
        return response.status_code == 200, response.json()


async def test_system_stats():
    """Test system statistics endpoint"""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{API_V2}/quantum/stats")
        return response.status_code == 200, response.json()


async def test_batch_generate():
    """Test batch generation endpoint"""
    async with httpx.AsyncClient() as client:
        payload = {
            "requests": [
                {"length": 16, "format": "hex", "quantum_bits": 8},
                {"length": 32, "format": "base64", "quantum_bits": 12},
                {"length": 8, "format": "array", "quantum_bits": 4}
            ],
            "parallel": True
        }
        response = await client.post(f"{API_V2}/generate/batch", json=payload)
        return response.status_code == 200, response.json()


async def run_all_tests():
    """Run all API tests"""
    console.print(Panel.fit(
        "[bold cyan]QCrypt RNG API Test Suite[/bold cyan]\n"
        "[yellow]Testing all API endpoints...[/yellow]",
        border_style="bold blue"
    ))
    
    # Define all tests
    tests = [
        ("Root Endpoint", test_root),
        ("Health Check", test_health),
        ("Generate Bytes", test_generate_bytes),
        ("Generate Key", test_generate_key),
        ("Generate Token", test_generate_token),
        ("Generate UUID", test_generate_uuid),
        ("Generate Password", test_generate_password),
        ("Entropy Status", test_entropy_status),
        ("System Stats", test_system_stats),
        ("Batch Generate", test_batch_generate)
    ]
    
    # Results table
    table = Table(title="API Test Results", show_header=True)
    table.add_column("Endpoint", style="cyan", width=20)
    table.add_column("Status", style="green", width=10)
    table.add_column("Response Time", style="yellow", width=12)
    table.add_column("Sample Response", style="white", width=50)
    
    failed_tests = []
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
        transient=True
    ) as progress:
        for test_name, test_func in tests:
            task = progress.add_task(f"[cyan]Testing {test_name}...", total=None)
            
            try:
                import time
                start = time.time()
                success, response = await test_func()
                elapsed = (time.time() - start) * 1000
                
                if success:
                    status = "[green]✓ Pass[/green]"
                    # Format sample response
                    if isinstance(response, dict):
                        if "data" in response:
                            sample = str(response["data"])[:47] + "..."
                        else:
                            sample = str(response)[:47] + "..."
                    else:
                        sample = str(response)[:47] + "..."
                else:
                    status = "[red]✗ Fail[/red]"
                    sample = f"[red]{response}[/red]"
                    failed_tests.append(test_name)
                
                table.add_row(
                    test_name,
                    status,
                    f"{elapsed:.0f}ms",
                    sample
                )
                
            except Exception as e:
                table.add_row(
                    test_name,
                    "[red]✗ Error[/red]",
                    "N/A",
                    f"[red]{str(e)[:47]}...[/red]"
                )
                failed_tests.append(test_name)
            
            progress.update(task, completed=True)
    
    console.print(table)
    
    # Summary
    total_tests = len(tests)
    passed_tests = total_tests - len(failed_tests)
    
    if failed_tests:
        console.print(f"\n[red]⚠ {len(failed_tests)} test(s) failed:[/red]")
        for test in failed_tests:
            console.print(f"  [red]✗[/red] {test}")
    else:
        console.print("\n[bold green]✅ All tests passed![/bold green]")
    
    console.print(f"\n[cyan]Test Summary:[/cyan] {passed_tests}/{total_tests} passed")
    
    return len(failed_tests) == 0


async def test_single_endpoint():
    """Interactive endpoint testing"""
    console.print("\n[cyan]Available endpoints:[/cyan]")
    console.print("1. Generate Bytes")
    console.print("2. Generate Key")
    console.print("3. Generate Token")
    console.print("4. Generate UUID")
    console.print("5. Generate Password")
    console.print("6. Entropy Status")
    console.print("7. System Stats")
    console.print("8. Health Check")
    
    choice = input("\nSelect endpoint to test (1-8): ")
    
    async with httpx.AsyncClient() as client:
        try:
            if choice == "1":
                length = int(input("Enter byte length (1-1024): ") or "32")
                format_type = input("Enter format (hex/base64/array/raw): ") or "hex"
                response = await client.post(f"{API_V2}/generate/bytes", json={
                    "length": length,
                    "format": format_type,
                    "quantum_bits": 8
                })
            elif choice == "2":
                response = await client.post(f"{API_V2}/generate/key", json={
                    "algorithm": "AES",
                    "key_size": 256
                })
            elif choice == "3":
                response = await client.post(f"{API_V2}/generate/token", json={
                    "length": 32,
                    "url_safe": True
                })
            elif choice == "4":
                response = await client.post(f"{API_V2}/generate/uuid", json={
                    "version": 4,
                    "count": 1
                })
            elif choice == "5":
                response = await client.post(f"{API_V2}/generate/password", json={
                    "length": 16,
                    "include_uppercase": True,
                    "include_lowercase": True,
                    "include_numbers": True,
                    "include_symbols": True
                })
            elif choice == "6":
                response = await client.get(f"{API_V2}/quantum/entropy")
            elif choice == "7":
                response = await client.get(f"{API_V2}/quantum/stats")
            elif choice == "8":
                response = await client.get(f"{BASE_URL}/health")
            else:
                console.print("[red]Invalid choice[/red]")
                return
            
            # Display response
            console.print(f"\n[green]Status Code:[/green] {response.status_code}")
            console.print(f"[cyan]Response:[/cyan]")
            console.print(json.dumps(response.json(), indent=2))
            
        except Exception as e:
            console.print(f"[red]Error:[/red] {str(e)}")


async def main():
    """Main test function"""
    import sys
    
    # Check if API is running
    console.print("[yellow]Checking if API is running...[/yellow]")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/", timeout=2.0)
            console.print("[green]✓ API is running[/green]\n")
    except:
        console.print("[red]✗ API is not running![/red]")
        console.print("\nPlease start the API server first:")
        console.print("[cyan]python run_api.py[/cyan]")
        sys.exit(1)
    
    if len(sys.argv) > 1 and sys.argv[1] == "--interactive":
        while True:
            await test_single_endpoint()
            if input("\nTest another endpoint? (y/n): ").lower() != 'y':
                break
    else:
        success = await run_all_tests()
        sys.exit(0 if success else 1)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        console.print("\n[yellow]Tests interrupted[/yellow]")
    except Exception as e:
        console.print(f"[red]Error: {str(e)}[/red]")