# 📁 QCrypt RNG - Directory Guide

Complete guide to the project structure, explaining the purpose of each directory and file in the QCrypt RNG project.

## 📋 Table of Contents

- [Root Directory](#root-directory)
- [App Directory](#app-directory)
- [Tests Directory](#tests-directory)
- [Logs Directory](#logs-directory)
- [Configuration Files](#configuration-files)
- [Scripts and Entry Points](#scripts-and-entry-points)
- [Documentation Files](#documentation-files)

## 🏠 Root Directory

The root directory contains the main project files and entry points.

### Core Files

| File | Purpose | Description |
|------|--------|-------------|
| `README.md` | Project overview | Main project documentation with features, installation, and usage |
| `commands.md` | Command reference | Complete guide to all available commands and scripts |
| `directory-guide.md` | Structure guide | This file - explains the project structure |
| `requirements.txt` | Dependencies | Python package dependencies with versions |
| `Makefile` | Build automation | Common commands for installation, testing, and cleanup |

### Entry Point Scripts

| File | Purpose | Description |
|------|--------|-------------|
| `run_api.py` | API server launcher | Starts the FastAPI server with proper configuration |
| `dashboard.py` | Dashboard application | Streamlit-based web interface for the QCrypt RNG system |
| `test_api.py` | API testing | Tests API endpoints and functionality |
| `test_demo.py` | Demo testing | Tests demonstration features and examples |
| `test_qrng.py` | Core testing | Tests quantum random number generation functionality |

## 📦 App Directory (`/app`)

The main application code is organized in the `app` directory with a modular structure.

### Structure Overview
```
app/
├── __init__.py          # Package initialization
├── main.py             # FastAPI application entry point
├── config.py           # Configuration settings and environment variables
├── api/                # API routes and endpoints
├── quantum/            # Quantum computing and RNG implementations
└── utils/              # Utility functions and helpers
```

### Core Application Files

| File | Purpose | Description |
|------|--------|-------------|
| `__init__.py` | Package marker | Makes `app` a Python package |
| `main.py` | FastAPI app | Main FastAPI application with routes and middleware |
| `config.py` | Configuration | Settings, environment variables, and configuration management |

### API Directory (`/app/api`)

Contains API route definitions and endpoint implementations.

| Directory | Purpose | Description |
|-----------|---------|-------------|
| `__init__.py` | Package marker | Makes `api` a Python package |
| `v2/` | API version 2 | Current API version with all endpoints |

**API v2 Structure:**
- Route definitions for all endpoints
- Request/response models
- Authentication and authorization
- Rate limiting and security middleware

### Quantum Directory (`/app/quantum`)

Core quantum computing and random number generation implementations.

| File | Purpose | Description |
|------|--------|-------------|
| `__init__.py` | Package marker | Makes `quantum` a Python package |
| `qrng.py` | Quantum RNG | Quantum random number generation algorithms |
| `pqc.py` | Post-quantum crypto | Post-quantum cryptographic implementations |

**Quantum Module Features:**
- Quantum random number generation using QRisp
- Cryptographic key generation (AES, RSA, ECDSA)
- Session token generation
- UUID generation with quantum entropy
- Secure password generation
- Post-quantum cryptographic algorithms (DILITHIUM, KYBER)

### Utils Directory (`/app/utils`)

Utility functions and helper modules.

| File | Purpose | Description |
|------|--------|-------------|
| `__init__.py` | Package marker | Makes `utils` a Python package |
| `logging.py` | Logging utilities | Centralized logging configuration and utilities |

**Utils Features:**
- Structured logging with Loguru
- Performance monitoring
- Security event logging
- Error handling and reporting

## 🧪 Tests Directory (`/tests`)

Comprehensive testing suite for the application.

### Structure Overview
```
tests/
├── __init__.py          # Package initialization
└── unit/                # Unit tests
    ├── __init__.py      # Package marker
    └── test_quantum.py  # Quantum module tests
```

### Test Files

| File | Purpose | Description |
|------|--------|-------------|
| `__init__.py` | Package marker | Makes `tests` a Python package |
| `unit/test_quantum.py` | Quantum tests | Unit tests for quantum RNG and PQC functionality |

**Testing Coverage:**
- Unit tests for all quantum functions
- API endpoint testing
- Integration tests
- Performance benchmarks
- Security validation tests

## 📊 Logs Directory (`/logs`)

Application logs and monitoring data.

### Log Files

| File Pattern | Purpose | Description |
|-------------|---------|-------------|
| `qcrypt_YYYY-MM-DD.log` | General logs | Main application logs with info, debug, and trace messages |
| `errors_YYYY-MM-DD.log` | Error logs | Error and exception logs for debugging |
| `performance_YYYY-MM-DD.log` | Performance logs | Performance metrics and timing data |
| `security_YYYY-MM-DD.log` | Security logs | Security events, authentication, and access logs |

**Log Management:**
- Daily log rotation
- Structured JSON logging
- Log level configuration
- Performance monitoring
- Security event tracking

## ⚙️ Configuration Files

### Requirements and Dependencies

| File | Purpose | Description |
|------|--------|-------------|
| `requirements.txt` | Python dependencies | All required Python packages with versions |

**Key Dependencies:**
- **FastAPI**: Web framework for the API
- **Streamlit**: Dashboard web interface
- **QRisp**: Quantum computing framework
- **Cryptography**: Cryptographic operations
- **NumPy/SciPy**: Scientific computing
- **Pytest**: Testing framework
- **Loguru**: Advanced logging

### Build and Automation

| File | Purpose | Description |
|------|--------|-------------|
| `Makefile` | Build automation | Common commands for development workflow |

**Makefile Commands:**
- `make install`: Install dependencies
- `make test`: Run test suite
- `make run`: Run demo/test script
- `make clean`: Clean cache and temporary files

## 🚀 Scripts and Entry Points

### Server Scripts

| Script | Purpose | Description |
|--------|---------|-------------|
| `run_api.py` | API server | Starts FastAPI server with uvicorn |
| `dashboard.py` | Web dashboard | Streamlit-based user interface |

### Testing Scripts

| Script | Purpose | Description |
|--------|---------|-------------|
| `test_api.py` | API testing | Tests API endpoints and responses |
| `test_demo.py` | Demo testing | Tests demonstration features |
| `test_qrng.py` | Core testing | Tests quantum RNG functionality |

## 📚 Documentation Files

### Project Documentation

| File | Purpose | Description |
|------|--------|-------------|
| `README.md` | Project overview | Main documentation with features and setup |
| `commands.md` | Command reference | Complete command and script reference |
| `directory-guide.md` | Structure guide | This file - project structure explanation |

## 🔧 Development Workflow

### Typical Development Structure

1. **Core Logic**: `/app/quantum/` - Implement quantum algorithms
2. **API Layer**: `/app/api/v2/` - Define REST endpoints
3. **Configuration**: `/app/config.py` - Manage settings
4. **Testing**: `/tests/unit/` - Write unit tests
5. **Documentation**: Root level - Update guides and README

### File Naming Conventions

- **Python files**: snake_case (e.g., `quantum_rng.py`)
- **Configuration**: lowercase (e.g., `config.py`)
- **Tests**: `test_` prefix (e.g., `test_quantum.py`)
- **Logs**: descriptive with date (e.g., `qcrypt_2024-01-15.log`)

## 🏗️ Architecture Patterns

### Modular Design
- **Separation of Concerns**: Each directory has a specific purpose
- **API Versioning**: `/app/api/v2/` allows for future API versions
- **Configuration Management**: Centralized settings in `config.py`
- **Logging Strategy**: Structured logging with multiple log files

### Scalability Considerations
- **Horizontal Scaling**: Stateless API design
- **Performance Monitoring**: Dedicated performance logs
- **Security Tracking**: Separate security event logging
- **Error Handling**: Comprehensive error logging and reporting

## 🔍 Key Directories Summary

| Directory | Primary Purpose | Key Files |
|-----------|----------------|-----------|
| `/app` | Core application code | `main.py`, `config.py` |
| `/app/api` | API routes and endpoints | Version-specific route definitions |
| `/app/quantum` | Quantum computing logic | `qrng.py`, `pqc.py` |
| `/app/utils` | Utility functions | `logging.py` |
| `/tests` | Test suite | Unit and integration tests |
| `/logs` | Application logs | Daily rotated log files |
| Root | Entry points and config | Scripts, requirements, documentation |

## 💡 Best Practices

### Code Organization
- Keep related functionality together
- Use clear, descriptive file names
- Maintain consistent directory structure
- Document complex algorithms and functions

### Testing Strategy
- Unit tests for individual functions
- Integration tests for API endpoints
- Performance tests for critical paths
- Security tests for cryptographic functions

### Logging Strategy
- Use appropriate log levels
- Include relevant context in log messages
- Rotate logs regularly to manage disk space
- Monitor logs for errors and performance issues

---

**This directory structure supports a scalable, maintainable quantum random number generation system with comprehensive testing, monitoring, and documentation.**
