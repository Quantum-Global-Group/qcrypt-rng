# 🎲 QCrypt RNG - Quantum-Enhanced Random Number Generation

**Enterprise-grade quantum-simulation random number generation API with post-quantum cryptography capabilities and real hardware integration pathways.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-green.svg)](https://fastapi.tiangolo.com/)

## 🌟 Overview

QCrypt RNG is a comprehensive quantum-enhanced random number generation system designed for enterprise applications requiring cryptographically secure randomness. Our platform combines quantum simulation techniques with a hardware abstraction layer that enables seamless transition to real quantum hardware devices.

### Why Quantum-Enhanced Randomness?

Traditional pseudo-random number generators rely on deterministic algorithms that can be predictable to sophisticated attackers. Quantum-enhanced randomness leverages the inherent unpredictability of quantum mechanical processes to generate truly random numbers that are impossible to predict, even with unlimited computational power.

### Hardware-Ready Architecture

Our unique hardware abstraction layer means you can start with our quantum-simulation engine today and seamlessly upgrade to real quantum hardware (ID Quantique, QuintessenceLabs, etc.) when it becomes available in your infrastructure.

## ✨ Key Features

### 🔢 Quantum-Enhanced Random Number Generation
- **Random Bytes**: Generate cryptographically secure random data using quantum simulation
- **Cryptographic Keys**: Create AES, RSA, and ECDSA keys with quantum-enhanced entropy
- **Session Tokens**: Generate secure authentication tokens with quantum randomness
- **Quantum UUIDs**: Create unique identifiers with quantum-enhanced entropy
- **Secure Passwords**: Generate strong passwords with quantum-enhanced randomness

### 🔬 Quantum Hardware Interface
- **Modular Architecture**: Designed for easy integration with real quantum hardware
- **Hardware Abstraction Layer**: Switch between simulation and real quantum devices
- **API Compatibility**: Same API for both simulation and hardware modes
- **Performance Benchmarking**: Compare simulation vs hardware performance
- **Device Management**: Connect/disconnect and calibrate quantum hardware devices

### ⛓️ Blockchain Security Analysis
- **Quantum Threat Simulation**: Analyze vulnerability to quantum attacks
- **Wallet Creation**: Generate both vulnerable and quantum-safe wallets
- **Attack Timeline**: Visualize quantum computing threat progression
- **Security Comparison**: Compare classical vs quantum-resistant algorithms

### 🔮 Post-Quantum Cryptography
- **NIST-Standardized Algorithms**: DILITHIUM and KYBER implementations
- **Quantum-Safe Key Generation**: Create future-proof cryptographic keys
- **Threat Assessment**: Evaluate quantum resistance of existing algorithms
- **Migration Guidance**: Recommendations for quantum-safe transitions

### 🏢 Enterprise Features
- **Rate Limiting**: Tier-based rate limiting (Free, Pro, Enterprise)
- **Usage Tracking**: Comprehensive usage analytics and billing support
- **API Key Management**: Secure API key authentication
- **Monitoring & Analytics**: Real-time metrics and performance insights
- **Production Deployment**: Docker and Kubernetes ready

### 🛡️ Security Features
- **Quantum-Enhanced Entropy**: High-quality randomness from quantum simulation
- **Real Hardware Ready**: Pathways to true quantum randomness from quantum devices
- **NIST Compliance**: Post-quantum cryptographic standards
- **Audit Logging**: Comprehensive security event tracking
- **Rate Limiting**: Protection against abuse and attacks
- **Input Validation**: Robust parameter checking and sanitization
- **API Key Authentication**: Secure access control
- **FIPS Mode**: Government compliance support

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- pip package manager
- Docker (for containerized deployment)

### Development Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd qcrypt-rng
   ```

2. **Install dependencies**
   ```bash
   make install
   # or
   pip install -r requirements.txt
   ```

3. **Start the API server**
   ```bash
   python run_api.py
   ```

4. **Launch the dashboard**
   ```bash
   streamlit run dashboard.py
   ```

### Production Deployment

For production deployment, see our [Production Guide](PRODUCTION.md):

1. **Containerized Deployment (Recommended)**
   ```bash
   # Using Docker Compose
   docker-compose up -d

   # Or using Kubernetes
   ./deploy.sh
   ```

### Access Points
- **API Server**: http://localhost:8000 (Dev) | https://api.yourdomain.com (Prod)
- **API Documentation**: http://localhost:8000/docs
- **Dashboard**: http://localhost:8501 (Dev) | https://dashboard.yourdomain.com (Prod)
- **Monitoring**: http://localhost:8000/api/v2/monitoring/metrics
- **Hardware Interface**: http://localhost:8000/api/v2/hardware/devices

## 🏗️ Architecture

The system is built with a modular, hardware-agnostic architecture:

- **FastAPI Backend**: High-performance API server with middleware
- **Streamlit Dashboard**: Interactive web interface
- **Quantum Engine**: Core quantum-simulation random generation with hardware abstraction
- **Security Modules**: Blockchain and PQC implementations
- **Hardware Integration Layer**: Pluggable interfaces for real quantum devices
- **Enterprise Features**: Rate limiting, usage tracking, monitoring
- **Comprehensive Testing**: Unit and integration tests

## 🔧 Technology Stack

- **Backend**: FastAPI, Uvicorn
- **Frontend**: Streamlit
- **Quantum**: QRisp, liboqs-python
- **Cryptography**: Cryptography, PyCryptodome
- **Database**: PostgreSQL, Redis, SQLite (for usage tracking)
- **Testing**: Pytest, HTTPx
- **Monitoring**: Loguru, Custom metrics
- **Containerization**: Docker, Kubernetes

## 📊 Use Cases

### Enterprise Applications
- **Financial Services**: Secure trading systems, payment processing
- **Healthcare**: Patient data encryption, secure communications
- **Government**: National security, classified communications
- **Blockchain**: Cryptocurrency wallets, smart contracts

### Development & Research
- **Cryptographic Research**: Algorithm testing and validation
- **Security Auditing**: Vulnerability assessment and penetration testing
- **Educational**: Quantum computing and cryptography learning
- **Prototyping**: Rapid development of secure applications

## 📈 Performance

- **High Throughput**: Optimized for enterprise-scale operations
- **Low Latency**: Sub-millisecond response times
- **Scalable**: Horizontal scaling capabilities
- **Monitoring**: Real-time performance metrics
- **Analytics**: Detailed usage and performance insights

## 🔍 API Endpoints

### Core Generation
- `POST /api/v2/generate/bytes` - Generate random bytes
- `POST /api/v2/generate/key` - Create cryptographic keys
- `POST /api/v2/generate/token` - Generate session tokens
- `POST /api/v2/generate/uuid` - Create quantum UUIDs
- `POST /api/v2/generate/password` - Generate secure passwords

### Quantum Hardware Interface
- `GET /api/v2/hardware/devices` - List connected quantum devices
- `POST /api/v2/hardware/connect/{device_type}` - Connect to quantum hardware
- `DELETE /api/v2/hardware/disconnect/{device_id}` - Disconnect quantum hardware
- `POST /api/v2/hardware/calibrate/{device_id}` - Calibrate quantum device
- `GET /api/v2/hardware/performance/{device_id}` - Get performance metrics
- `GET /api/v2/hardware/benchmark` - Benchmark all devices

### Blockchain Security
- `POST /api/v2/blockchain/create-wallet` - Create blockchain wallets
- `POST /api/v2/blockchain/simulate-attack` - Simulate quantum attacks
- `GET /api/v2/blockchain/compare-blockchains` - Compare security levels

### Post-Quantum Cryptography
- `POST /api/v2/pqc/generate` - Generate PQC key pairs
- `POST /api/v2/pqc/sign` - Sign with PQC algorithms
- `POST /api/v2/pqc/verify` - Verify PQC signatures
- `POST /api/v2/pqc/assess-threat` - Assess quantum threats

### Monitoring & Analytics
- `GET /api/v2/monitoring/metrics` - System metrics
- `GET /api/v2/monitoring/analytics/overview` - Performance overview
- `GET /api/v2/monitoring/analytics/api-performance` - API performance
- `GET /api/v2/monitoring/analytics/quantum-performance` - Quantum performance
- `GET /api/v2/monitoring/analytics/pqc-performance` - PQC performance

## 🎯 Business Value

### Competitive Advantages
- **Future-Proof**: Ready for real quantum hardware integration
- **Regulatory Compliant**: Meets NIST and government security standards
- **Enterprise Scalable**: Built for high-volume production environments
- **Cost Effective**: Start with simulation, upgrade to hardware as needed

### ROI Justification
- **Reduced Risk**: Mitigate quantum computing threats to cryptographic systems
- **Compliance**: Meet emerging quantum-resistant security requirements
- **Competitive Edge**: Early adoption of quantum-enhanced security
- **Operational Efficiency**: Automated key generation and management

## 📚 Documentation

- **[Production Guide](PRODUCTION.md)** - Complete production deployment instructions
- **[Commands Guide](commands.md)** - Complete command reference
- **[Directory Guide](directory-guide.md)** - Project structure explanation
- **[API Documentation](http://localhost:8000/docs)** - Interactive API docs
- **[Python SDK](client_sdk/python/README.md)** - Python client SDK

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines and code of conduct.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: Check the guides in this repository
- **Issues**: Report bugs and request features via GitHub Issues
- **Community**: Join our discussions and get help

## 🔮 Future Roadmap

- **Quantum Hardware Integration**: Direct integration with real quantum devices (ID Quantique, QuintessenceLabs, etc.)
- **Advanced Analytics**: Enhanced security metrics and quantum entropy validation
- **Mobile SDKs**: iOS and Android development kits
- **Additional PQC Algorithms**: More NIST-standardized algorithms
- **Enhanced Monitoring**: Advanced observability features
- **Quantum Key Distribution (QKD) Integration**: Full quantum security stack

---

**Built with ❤️ for the quantum future**

[Learn More About Quantum Security](https://www.idquantique.com/quantum-random-number-generation/) | 
[Post-Quantum Cryptography Standards](https://csrc.nist.gov/projects/post-quantum-cryptography) |
[Commercial Quantum Solutions](https://quintessencelabs.com/)