# 🎲 QCrypt RNG - Quantum Random Number Generation

**Enterprise-grade quantum random number generation API with blockchain security and post-quantum cryptography capabilities.**

## 🌟 Overview

QCrypt RNG is a comprehensive quantum random number generation system that provides cryptographically secure randomness using quantum mechanics principles. The system includes advanced features for blockchain security analysis and post-quantum cryptography implementations.

## ✨ Key Features

### 🔢 Quantum Random Number Generation
- **Random Bytes**: Generate cryptographically secure random data
- **Cryptographic Keys**: Create AES, RSA, and ECDSA keys
- **Session Tokens**: Generate secure authentication tokens
- **Quantum UUIDs**: Create unique identifiers with quantum entropy
- **Secure Passwords**: Generate strong passwords with customizable parameters

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

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- pip package manager

### Installation

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

### Access Points
- **API Server**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Dashboard**: http://localhost:8501

## 🏗️ Architecture

The system is built with a modular architecture:

- **FastAPI Backend**: High-performance API server
- **Streamlit Dashboard**: Interactive web interface
- **Quantum Engine**: Core quantum random generation
- **Security Modules**: Blockchain and PQC implementations
- **Comprehensive Testing**: Unit and integration tests

## 🔧 Technology Stack

- **Backend**: FastAPI, Uvicorn
- **Frontend**: Streamlit
- **Quantum**: QRisp, NumPy, SciPy
- **Cryptography**: Cryptography, PyCryptodome
- **Testing**: Pytest, HTTPx
- **Monitoring**: Loguru, Prometheus

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

## 🛡️ Security Features

- **Quantum Entropy**: True randomness from quantum mechanics
- **NIST Compliance**: Post-quantum cryptographic standards
- **Audit Logging**: Comprehensive security event tracking
- **Rate Limiting**: Protection against abuse and attacks
- **Input Validation**: Robust parameter checking and sanitization

## 📈 Performance

- **High Throughput**: Optimized for enterprise-scale operations
- **Low Latency**: Sub-millisecond response times
- **Scalable**: Horizontal scaling capabilities
- **Monitoring**: Real-time performance metrics

## 🔍 API Endpoints

### Core Generation
- `POST /api/v2/generate/bytes` - Generate random bytes
- `POST /api/v2/generate/key` - Create cryptographic keys
- `POST /api/v2/generate/token` - Generate session tokens
- `POST /api/v2/generate/uuid` - Create quantum UUIDs
- `POST /api/v2/generate/password` - Generate secure passwords

### Blockchain Security
- `POST /api/v2/blockchain/create-wallet` - Create blockchain wallets
- `POST /api/v2/blockchain/simulate-attack` - Simulate quantum attacks
- `GET /api/v2/blockchain/compare-blockchains` - Compare security levels

### Post-Quantum Cryptography
- `POST /api/v2/pqc/generate` - Generate PQC key pairs
- `POST /api/v2/pqc/threat-assessment` - Assess quantum threats

## 📚 Documentation

- **[Commands Guide](commands.md)** - Complete command reference
- **[Directory Guide](directory-guide.md)** - Project structure explanation
- **[API Documentation](http://localhost:8000/docs)** - Interactive API docs

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines and code of conduct.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: Check the guides in this repository
- **Issues**: Report bugs and request features via GitHub Issues
- **Community**: Join our discussions and get help

## 🔮 Future Roadmap

- **Quantum Hardware Integration**: Direct quantum device support
- **Advanced Analytics**: Enhanced security metrics and reporting
- **Cloud Deployment**: Kubernetes and Docker support
- **Mobile SDKs**: iOS and Android development kits
- **Enterprise Features**: Advanced monitoring and management tools

---

**Built with ❤️ for the quantum future**
