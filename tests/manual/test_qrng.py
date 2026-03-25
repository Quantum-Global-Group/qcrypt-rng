#!/usr/bin/env python3
"""
QCrypt RNG - Test Script for Quantum Random Number Generator
Run this script to test the core functionality
"""

import asyncio
import sys
from pathlib import Path
import time
from rich.console import Console
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.panel import Panel
from rich.layout import Layout

# Add project root to path (tests/manual -> repo root)
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from app.quantum.qrng import QuantumRNG, get_quantum_rng
from app.utils.logging import setup_logging, logger
from app.config import settings

# Initialize rich console
console = Console()


async def test_quantum_generation():
    """Test basic quantum random number generation"""
    console.print("\n[bold cyan]Testing Quantum Random Number Generation[/bold cyan]")
    
    qrng = get_quantum_rng()
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
        transient=True
    ) as progress:
        # Test different formats
        tests = [
            ("Hex format (32 bytes)", 32, 8, "hex"),
            ("Base64 format (64 bytes)", 64, 12, "base64"),
            ("Array format (16 bytes)", 16, 8, "array"),
            ("Raw format (128 bytes)", 128, 16, "raw")
        ]
        
        results = []
        
        for desc, num_bytes, qubits, format_type in tests:
            task = progress.add_task(f"[cyan]{desc}...", total=None)
            
            start = time.time()
            result = await qrng.generate_bytes(num_bytes, qubits, format_type)
            elapsed = (time.time() - start) * 1000
            
            progress.update(task, completed=True)
            
            # Store results
            results.append({
                "Description": desc,
                "Bytes": num_bytes,
                "Qubits": qubits,
                "Format": format_type,
                "Time (ms)": f"{result.generation_time_ms:.2f}",
                "Sample": str(result.data)[:50] + "..." if len(str(result.data)) > 50 else str(result.data)
            })
    
    # Display results table
    table = Table(title="Quantum Generation Results", show_header=True)
    table.add_column("Test", style="cyan")
    table.add_column("Bytes", style="yellow")
    table.add_column("Qubits", style="green")
    table.add_column("Time", style="magenta")
    table.add_column("Sample Output", style="white")
    
    for r in results:
        table.add_row(
            r["Description"],
            str(r["Bytes"]),
            str(r["Qubits"]),
            r["Time (ms)"],
            r["Sample"]
        )
    
    console.print(table)


async def test_cryptographic_functions():
    """Test cryptographic key and token generation"""
    console.print("\n[bold cyan]Testing Cryptographic Functions[/bold cyan]")
    
    qrng = get_quantum_rng()
    
    # Test key generation
    console.print("\n[yellow]Generating AES-256 key...[/yellow]")
    key_result = await qrng.generate_key(256, "AES")
    console.print(f"✓ AES-256 Key: [green]{key_result.data['key'][:64]}...[/green]")
    
    # Test token generation
    console.print("\n[yellow]Generating session token...[/yellow]")
    token_result = await qrng.generate_token(32, url_safe=True)
    console.print(f"✓ Session Token: [green]{token_result.data}[/green]")
    
    # Test UUID generation
    console.print("\n[yellow]Generating quantum UUID...[/yellow]")
    uuid_result = await qrng.generate_uuid(4)
    console.print(f"✓ UUID v4: [green]{uuid_result.data}[/green]")


async def test_entropy_analysis():
    """Test entropy analysis and statistics"""
    console.print("\n[bold cyan]Testing Entropy Analysis[/bold cyan]")
    
    qrng = get_quantum_rng()
    
    # Generate some data to populate entropy pool
    console.print("\n[yellow]Generating data for entropy analysis...[/yellow]")
    
    with Progress(console=console, transient=True) as progress:
        task = progress.add_task("[cyan]Populating entropy pool...", total=10)
        
        for i in range(10):
            await qrng.generate_bytes(32, 8, "hex")
            progress.update(task, advance=1)
    
    # Analyze entropy
    analysis = qrng.analyze_entropy()
    
    # Display entropy analysis
    entropy_table = Table(title="Entropy Analysis", show_header=True)
    entropy_table.add_column("Metric", style="cyan")
    entropy_table.add_column("Value", style="yellow")
    entropy_table.add_column("Status", style="green")
    
    entropy_table.add_row(
        "Shannon Entropy",
        f"{analysis.shannon_entropy:.4f}",
        "✓ Pass" if analysis.passed_tests.get("shannon_entropy", False) else "✗ Fail"
    )
    entropy_table.add_row(
        "Chi-Square p-value",
        f"{analysis.chi_square_p_value:.4f}",
        "✓ Pass" if analysis.passed_tests.get("chi_square", False) else "✗ Fail"
    )
    entropy_table.add_row(
        "Autocorrelation",
        f"{analysis.autocorrelation:.4f}",
        "✓ Pass" if analysis.passed_tests.get("autocorrelation", False) else "✗ Fail"
    )
    entropy_table.add_row(
        "Bit Balance",
        f"{analysis.bit_balance:.4f}",
        "✓ Pass" if analysis.passed_tests.get("bit_balance", False) else "✗ Fail"
    )
    entropy_table.add_row(
        "Health Status",
        analysis.health_status.upper(),
        "✓" if analysis.health_status in ["excellent", "good"] else "⚠"
    )
    entropy_table.add_row(
        "Pool Size",
        str(analysis.pool_size),
        "✓" if analysis.pool_size > 100 else "⚠ Need more data"
    )
    
    console.print(entropy_table)


async def test_performance():
    """Test performance with different configurations"""
    console.print("\n[bold cyan]Performance Testing[/bold cyan]")
    
    qrng = get_quantum_rng()
    
    # Test different sizes
    sizes = [32, 128, 512, 1024]
    qubit_configs = [4, 8, 12, 16]
    
    perf_table = Table(title="Performance Benchmarks", show_header=True)
    perf_table.add_column("Bytes", style="cyan")
    perf_table.add_column("Qubits", style="yellow")
    perf_table.add_column("Time (ms)", style="green")
    perf_table.add_column("Throughput (KB/s)", style="magenta")
    
    for size in sizes:
        for qubits in qubit_configs:
            if qubits > settings.max_qubits:
                continue
            
            start = time.time()
            result = await qrng.generate_bytes(size, qubits, "hex")
            elapsed = (time.time() - start) * 1000
            
            throughput = (size / 1024) / (elapsed / 1000) if elapsed > 0 else 0
            
            perf_table.add_row(
                str(size),
                str(qubits),
                f"{elapsed:.2f}",
                f"{throughput:.2f}"
            )
    
    console.print(perf_table)
    
    # Get overall statistics
    stats = qrng.get_statistics()
    
    stats_panel = Panel(
        f"""
[bold]Overall Statistics[/bold]
─────────────────────────────
Total Bytes Generated: {stats['total_bytes_generated']}
Total Generations: {stats['total_generations']}
Average Time: {stats['average_generation_time_ms']:.2f}ms
Backend: {stats['backend']}
Backend Status: {stats['backend_status']}
Entropy Pool Size: {stats['entropy_pool_size']}
        """,
        title="System Statistics",
        border_style="blue"
    )
    
    console.print(stats_panel)


async def main():
    """Main test function"""
    console.print(Panel.fit(
        """[bold cyan]QCrypt RNG - Quantum Random Number Generator[/bold cyan]
[yellow]Core Functionality Test Suite[/yellow]""",
        border_style="bold blue"
    ))
    
    # Setup logging
    setup_logging()
    
    # Display configuration
    config_panel = Panel(
        f"""
[bold]Configuration[/bold]
─────────────────────────────
Backend: {settings.quantum_backend}
Max Qubits: {settings.max_qubits}
Default Qubits: {settings.default_qubits}
Entropy Pool Size: {settings.entropy_pool_size}
Debug Mode: {settings.debug}
        """,
        title="Current Settings",
        border_style="green"
    )
    console.print(config_panel)
    
    try:
        # Run all tests
        await test_quantum_generation()
        await test_cryptographic_functions()
        await test_entropy_analysis()
        await test_performance()
        
        console.print("\n[bold green]✓ All tests completed successfully![/bold green]")
        
    except Exception as e:
        console.print(f"\n[bold red]✗ Test failed: {str(e)}[/bold red]")
        logger.error(f"Test failed: {str(e)}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    try:
        # Install rich if not available
        import rich
    except ImportError:
        print("Installing rich for better output...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "rich"])
        import rich
    
    asyncio.run(main())