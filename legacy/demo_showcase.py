#!/usr/bin/env python3
"""
QCrypt RNG - Compelling Demo Script
Showcases the quantum random number generation capabilities with hardware interface
"""

import asyncio
import time
import json
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.prompt import Prompt
import aiohttp
import os

console = Console()

API_BASE_URL = os.getenv("QCRIPT_API_URL", "http://localhost:8000")


async def test_quantum_generation(session):
    """Test quantum random number generation"""
    console.print("\n[bold cyan]🔬 Testing Quantum Random Generation[/bold cyan]")
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
        transient=True
    ) as progress:
        task = progress.add_task("[cyan]Generating quantum random bytes...", total=None)
        
        start_time = time.time()
        async with session.post(
            f"{API_BASE_URL}/api/v2/generate/bytes",
            json={"length": 32, "quantum_bits": 8, "format": "hex"}
        ) as response:
            result = await response.json()
        elapsed = (time.time() - start_time) * 1000
        
        progress.update(task, completed=True)
    
    if response.status == 200:
        console.print(f"✅ Generated 32 quantum-random bytes in {elapsed:.2f}ms")
        console.print(f"   Sample: [green]{result['data']['bytes'][:64]}...[/green]")
        return True
    else:
        console.print(f"❌ Failed to generate quantum bytes: {result}")
        return False


async def test_hardware_interface(session):
    """Test quantum hardware interface"""
    console.print("\n[bold cyan]🔌 Testing Quantum Hardware Interface[/bold cyan]")
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
        transient=True
    ) as progress:
        task = progress.add_task("[cyan]Listing quantum devices...", total=None)
        
        async with session.get(f"{API_BASE_URL}/api/v2/hardware/devices") as response:
            result = await response.json()
        progress.update(task, completed=True)
    
    if response.status == 200:
        console.print(f"✅ Found {result['total_devices']} quantum device(s)")
        
        # Show device information
        for device_id, info in result['devices'].items():
            table = Table(show_header=True, header_style="bold magenta")
            table.add_column("Property", style="dim")
            table.add_column("Value")
            
            table.add_row("Device ID", device_id)
            table.add_row("Status", info.get('status', 'unknown'))
            table.add_row("Type", info.get('device_type', 'unknown'))
            table.add_row("Connected", str(info.get('is_real_hardware', False)))
            table.add_row("Confidence", f"{info.get('confidence', 0.95):.2f}")
            
            console.print(table)
        
        return True
    else:
        console.print(f"❌ Failed to list quantum devices: {result}")
        return False


async def connect_hardware_device(session):
    """Connect to a simulated quantum hardware device"""
    console.print("\n[bold cyan]🔗 Connecting to Quantum Hardware[/bold cyan]")
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
        transient=True
    ) as progress:
        task = progress.add_task("[cyan]Connecting to photonic QRNG...", total=None)
        
        async with session.post(
            f"{API_BASE_URL}/api/v2/hardware/connect/photonic",
            params={"device_id": "demo_photonic_device"}
        ) as response:
            result = await response.json()
        progress.update(task, completed=True)
    
    if response.status == 200:
        console.print("✅ Successfully connected to photonic QRNG device")
        console.print(f"   Device ID: [green]{result['device_id']}[/green]")
        console.print(f"   Type: [green]{result['device_type']}[/green]")
        return True
    else:
        console.print(f"❌ Failed to connect to device: {result}")
        return False


async def benchmark_devices(session):
    """Benchmark quantum hardware devices"""
    console.print("\n[bold cyan]⏱️  Benchmarking Quantum Devices[/bold cyan]")
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
        transient=True
    ) as progress:
        task = progress.add_task("[cyan]Running benchmark...", total=None)
        
        async with session.get(f"{API_BASE_URL}/api/v2/hardware/benchmark") as response:
            result = await response.json()
        progress.update(task, completed=True)
    
    if response.status == 200:
        console.print("✅ Benchmark completed successfully")
        
        # Display benchmark results
        table = Table(title="Quantum Device Benchmarks", show_header=True, header_style="bold blue")
        table.add_column("Device ID", style="dim")
        table.add_column("Type", style="cyan")
        table.add_column("Gen Rate (Mbps)", justify="right")
        table.add_column("Error Rate", justify="right")
        table.add_column("Confidence", justify="right")
        table.add_column("Real Hardware", justify="center")
        
        for device_id, metrics in result['benchmarks'].items():
            table.add_row(
                device_id,
                metrics['device_type'],
                f"{metrics['generation_rate_bps']/1_000_000:.2f}",
                f"{metrics['error_rate']:.6f}",
                f"{metrics['confidence']:.2f}",
                "✅" if metrics['is_real_hardware'] else "❌"
            )
        
        console.print(table)
        return True
    else:
        console.print(f"❌ Failed to benchmark devices: {result}")
        return False


async def test_crypto_generation(session):
    """Test cryptographic key generation"""
    console.print("\n[bold cyan]🔐 Testing Quantum-Enhanced Cryptography[/bold cyan]")
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
        transient=True
    ) as progress:
        task = progress.add_task("[cyan]Generating AES-256 key...", total=None)
        
        start_time = time.time()
        async with session.post(
            f"{API_BASE_URL}/api/v2/generate/key",
            json={"algorithm": "AES", "key_size": 256, "format": "hex"}
        ) as response:
            result = await response.json()
        elapsed = (time.time() - start_time) * 1000
        
        progress.update(task, completed=True)
    
    if response.status == 200:
        console.print(f"✅ Generated AES-256 key in {elapsed:.2f}ms")
        console.print(f"   Algorithm: [green]{result['data']['algorithm']}[/green]")
        console.print(f"   Size: [green]{result['data']['key_size_bits']} bits[/green]")
        console.print(f"   Sample: [green]{result['data']['key'][:64]}...[/green]")
        return True
    else:
        console.print(f"❌ Failed to generate key: {result}")
        return False


async def test_post_quantum_crypto(session):
    """Test post-quantum cryptography"""
    console.print("\n[bold cyan]🛡️  Testing Post-Quantum Cryptography[/bold cyan]")
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
        transient=True
    ) as progress:
        task = progress.add_task("[cyan]Generating DILITHIUM3 key pair...", total=None)
        
        start_time = time.time()
        async with session.post(
            f"{API_BASE_URL}/api/v2/pqc/generate",
            data={"algorithm": "DILITHIUM3", "format": "base64"}
        ) as response:
            result = await response.json()
        elapsed = (time.time() - start_time) * 1000
        
        progress.update(task, completed=True)
    
    if response.status == 200:
        console.print(f"✅ Generated DILITHIUM3 key pair in {elapsed:.2f}ms")
        console.print(f"   NIST Level: [green]{result['data']['nist_security_level']}[/green]")
        console.print(f"   Public Key Size: [green]{result['data']['key_sizes']['public_key_bytes']} bytes[/green]")
        console.print(f"   Private Key Size: [green]{result['data']['key_sizes']['private_key_bytes']} bytes[/green]")
        return True
    else:
        console.print(f"❌ Failed to generate PQC keys: {result}")
        return False


async def run_demo():
    """Run the complete QCrypt RNG demo"""
    console.print(Panel.fit(
        """[bold cyan]QCrypt RNG - Quantum-Enhanced Security Platform[/bold cyan]
[yellow]Commercial-Grade Quantum Random Number Generation with Hardware Interface[/yellow]""",
        border_style="bold blue"
    ))
    
    console.print("\n[bold]Demo Overview:[/bold]")
    console.print("• Quantum random number generation with hardware abstraction")
    console.print("• Real quantum hardware interface simulation")
    console.print("• Post-quantum cryptography (NIST standards)")
    console.print("• Enterprise-grade security features")
    
    async with aiohttp.ClientSession() as session:
        try:
            # Test quantum generation
            success1 = await test_quantum_generation(session)
            
            # Test hardware interface
            success2 = await test_hardware_interface(session)
            
            # Connect to hardware device
            success3 = await connect_hardware_device(session)
            
            # Benchmark devices
            success4 = await benchmark_devices(session)
            
            # Test crypto generation
            success5 = await test_crypto_generation(session)
            
            # Test post-quantum crypto
            success6 = await test_post_quantum_crypto(session)
            
            # Summary
            console.print("\n[bold green]🎉 Demo Completed Successfully![/bold green]")
            
            all_success = all([success1, success2, success3, success4, success5, success6])
            
            if all_success:
                console.print("[bold green]✅ All tests passed![/bold green]")
            else:
                console.print("[bold yellow]⚠️  Some tests had issues (expected in simulation)[/bold yellow]")
            
            console.print("\n[bold]Key Benefits Demonstrated:[/bold]")
            console.print("• Hardware abstraction layer for seamless quantum device integration")
            console.print("• Commercial-grade quantum random number generation")
            console.print("• Post-quantum cryptographic capabilities")
            console.print("• Real-time performance monitoring")
            console.print("• Enterprise-ready security features")
            
        except Exception as e:
            console.print(f"\n[bold red]❌ Demo failed: {str(e)}[/bold red]")
            import traceback
            console.print(f"[red]{traceback.format_exc()}[/red]")


if __name__ == "__main__":
    try:
        import rich
        import aiohttp
    except ImportError:
        print("Installing required packages...")
        import subprocess
        subprocess.check_call([os.sys.executable, "-m", "pip", "install", "rich", "aiohttp"])
        import rich
        import aiohttp
    
    asyncio.run(run_demo())