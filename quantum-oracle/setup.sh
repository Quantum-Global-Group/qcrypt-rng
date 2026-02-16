#!/bin/bash
# Quantum Randomness Oracle Setup Script

set -e  # Exit on any error

echo "==========================================="
echo "Quantum Randomness Oracle Setup"
echo "==========================================="

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+."
    exit 1
fi

if ! command -v pip3 &> /dev/null; then
    echo "❌ pip is not installed. Please install pip."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version is too old. Please install Node.js 16+."
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1)
if [ "$PYTHON_VERSION" -lt 3 ] || [ "$(python3 --version | cut -d' ' -f2 | cut -d'.' -f2)" -lt 8 ]; then
    echo "❌ Python version is too old. Please install Python 3.8+."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Setup contracts
echo ""
echo "Setting up contracts..."
cd contracts

if [ ! -f "package-lock.json" ]; then
    echo "Installing contract dependencies..."
    npm install
else
    echo "Contract dependencies already installed"
fi

# Check if hardhat is available
if ! npx hardhat --version &> /dev/null; then
    echo "❌ Hardhat is not available. Installing..."
    npm install --save-dev @nomicfoundation/hardhat-toolbox
fi

echo "✅ Contracts setup complete"

# Setup oracle node
echo ""
echo "Setting up oracle node..."
cd ../oracle-node

if [ ! -f "requirements.lock" ]; then
    echo "Installing oracle node dependencies..."
    pip3 install -r requirements.txt
    touch requirements.lock  # Mark that dependencies are installed
else
    echo "Oracle node dependencies already installed"
fi

echo "✅ Oracle node setup complete"

# Setup client SDKs
echo ""
echo "Setting up client SDKs..."
cd ../client-sdk/python

# Create a basic setup.py for the Python SDK
cat > setup.py << EOF
from setuptools import setup, find_packages

setup(
    name="quantum-randomness-oracle-client",
    version="1.0.0",
    packages=find_packages(),
    install_requires=[
        "web3>=6.0.0",
        "eth-account>=0.10.0"
    ],
    author="Quantum Blockchain Labs",
    description="Python client for Quantum Randomness Oracle",
    license="MIT",
    python_requires=">=3.8",
)
EOF

echo "✅ Client SDK setup complete"

# Final instructions
echo ""
echo "==========================================="
echo "Setup Complete!"
echo "==========================================="
echo ""
echo "Next steps:"
echo "1. Configure your environment:"
echo "   - Edit contracts/.env with your Infura/RPC details"
echo "   - Edit oracle-node/config/default_config.json with your settings"
echo ""
echo "2. Deploy the smart contract:"
echo "   cd contracts && npx hardhat run scripts/deploy.js --network sepolia"
echo ""
echo "3. Run the oracle node:"
echo "   cd oracle-node && python3 src/main.py --config config/default_config.json"
echo ""
echo "4. For local development:"
echo "   - Start a local node: npx hardhat node"
echo "   - Deploy to local: npx hardhat run scripts/deploy.js --network localhost"
echo ""
echo "For more information, see the README.md file."
echo ""

exit 0