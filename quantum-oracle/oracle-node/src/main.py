#!/usr/bin/env python3
"""
Quantum Randomness Oracle Node - Main Entry Point
"""

import argparse
import asyncio
import signal
import sys
import os
from pathlib import Path

# Add the parent directory to the path so we can import from src
sys.path.insert(0, str(Path(__file__).parent))

from oracle_service import QuantumRandomnessOracleNode


def signal_handler(sig, frame):
    """Handle graceful shutdown"""
    print('\nReceived interrupt signal. Shutting down gracefully...')
    sys.exit(0)


async def main():
    parser = argparse.ArgumentParser(description='Quantum Randomness Oracle Node')
    parser.add_argument('--config', type=str, help='Path to configuration file', 
                       default='config/oracle_config.json')
    parser.add_argument('--demo', action='store_true', help='Run in demo mode')
    
    args = parser.parse_args()
    
    # Register signal handler for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    if args.demo:
        print("Running in demo mode...")
        from oracle_service import main as demo_main
        await demo_main()
    else:
        if not os.path.exists(args.config):
            print(f"Configuration file not found: {args.config}")
            print("Please create a configuration file or use --demo flag")
            sys.exit(1)
        
        try:
            # Initialize and start the oracle service
            oracle_node = QuantumRandomnessOracleNode(args.config)
            
            print("Quantum Randomness Oracle Node starting...")
            print(f"Blockchain: {oracle_node.config['blockchain_rpc_url']}")
            print(f"Contract: {oracle_node.config['contract_address']}")
            print(f"Oracle Address: {oracle_node.account.address}")
            
            # Start the service
            await oracle_node.start_service()
            
        except Exception as e:
            print(f"Error starting oracle node: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())