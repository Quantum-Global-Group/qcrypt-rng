# 🎲 QCrypt RNG - Commands Reference

Complete reference for all commands and scripts available in the QCrypt RNG project.

## 📋 Table of Contents

- [Installation Commands](#installation-commands)
- [Development Commands](#development-commands)
- [Testing Commands](#testing-commands)
- [API Commands](#api-commands)
- [Dashboard Commands](#dashboard-commands)
- [Utility Commands](#utility-commands)
- [Makefile Commands](#makefile-commands)

## 🚀 Installation Commands

### Install Dependencies
```bash
# Using pip directly
pip install -r requirements.txt

# Using Makefile
make install

# Install specific components
pip install fastapi uvicorn[standard]
pip install streamlit
pip install qrisp numpy scipy
pip install cryptography pycryptodome
```

### Verify Installation
```bash
# Check Python version
python --version

# Check installed packages
pip list | grep -E "(fastapi|streamlit|qrisp)"

# Test imports
python -c "import fastapi, streamlit, qrisp; print('All imports successful')"
```

## 🔧 Development Commands

### Start API Server
```bash
# Using the run script (recommended)
python run_api.py

# Using uvicorn directly
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Start Dashboard
```bash
# Launch Streamlit dashboard
streamlit run legacy/streamlit/dashboard.py

# With custom port
streamlit run legacy/streamlit/dashboard.py --server.port 8502

# With custom host
streamlit run legacy/streamlit/dashboard.py --server.address 0.0.0.0
```

### Development Server (Both)
```bash
# Terminal 1: Start API
python run_api.py

# Terminal 2: Start Dashboard
streamlit run legacy/streamlit/dashboard.py
```

## 🧪 Testing Commands

### Run All Tests
```bash
# Using pytest
pytest tests/

# With verbose output
pytest tests/ -v

# With coverage
pytest tests/ --cov=app

# Using Makefile
make test
```

### Run Specific Tests
```bash
# Unit tests only
pytest tests/unit/

# Specific test file
pytest tests/unit/test_quantum.py

# Specific test function
pytest tests/unit/test_quantum.py::test_qrng_generation

# Integration tests
python test_api.py
python test_demo.py
python test_qrng.py
```

### Test API Endpoints
```bash
# Test API connectivity
python test_api.py

# Test quantum RNG functionality
python test_qrng.py

# Test demo features
python test_demo.py
```

## 🌐 API Commands

### Start API Server
```bash
# Development mode (with auto-reload)
python run_api.py

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# Custom configuration
uvicorn app.main:app --host 127.0.0.1 --port 8080 --log-level debug
```

### API Health Check
```bash
# Check if API is running
curl http://localhost:8000/

# Check API documentation
curl http://localhost:8000/docs

# Test endpoint
curl -X POST http://localhost:8000/api/v2/generate/bytes \
  -H "Content-Type: application/json" \
  -d '{"length": 32, "quantum_bits": 8, "format": "hex"}'
```

### API Testing with curl
```bash
# Generate random bytes
curl -X POST http://localhost:8000/api/v2/generate/bytes \
  -H "Content-Type: application/json" \
  -d '{"length": 64, "quantum_bits": 12, "format": "base64"}'

# Generate cryptographic key
curl -X POST http://localhost:8000/api/v2/generate/key \
  -H "Content-Type: application/json" \
  -d '{"algorithm": "AES", "key_size": 256, "format": "hex"}'

# Generate session token
curl -X POST http://localhost:8000/api/v2/generate/token \
  -H "Content-Type: application/json" \
  -d '{"length": 32, "url_safe": true, "expires_in": 3600}'

# Generate UUID
curl -X POST http://localhost:8000/api/v2/generate/uuid \
  -H "Content-Type: application/json" \
  -d '{"version": 4, "count": 5, "format": "standard"}'

# Generate password
curl -X POST http://localhost:8000/api/v2/generate/password \
  -H "Content-Type: application/json" \
  -d '{"length": 16, "include_uppercase": true, "include_lowercase": true, "include_numbers": true, "include_symbols": true}'
```

## 📊 Dashboard Commands

### Start Dashboard
```bash
# Standard dashboard
streamlit run legacy/streamlit/dashboard.py

# Custom configuration
streamlit run legacy/streamlit/dashboard.py --server.port 8502 --server.address 0.0.0.0

# With theme
streamlit run legacy/streamlit/dashboard.py --theme.base "dark"
```

### Dashboard Configuration
```bash
# Create config file
mkdir -p ~/.streamlit
echo "[server]" > ~/.streamlit/config.toml
echo "port = 8501" >> ~/.streamlit/config.toml
echo "address = \"0.0.0.0\"" >> ~/.streamlit/config.toml
```

## 🛠️ Utility Commands

### Code Quality
```bash
# Format code with Black
black app/ tests/ *.py

# Lint with flake8
flake8 app/ tests/ *.py

# Type checking with mypy
mypy app/ --ignore-missing-imports

# Run all quality checks
black app/ tests/ *.py && flake8 app/ tests/ *.py
```

### Log Management
```bash
# View recent logs
tail -f logs/qcrypt_$(date +%Y-%m-%d).log

# View error logs
tail -f logs/errors_$(date +%Y-%m-%d).log

# View performance logs
tail -f logs/performance_$(date +%Y-%m-%d).log

# Clear old logs
find logs/ -name "*.log" -mtime +7 -delete
```

### Environment Setup
```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# or
.venv\Scripts\activate     # Windows

# Install development dependencies
pip install -r requirements.txt
pip install black flake8 mypy pytest-cov

# Set environment variables
export QCYPT_LOG_LEVEL=DEBUG
export QCYPT_API_HOST=0.0.0.0
export QCYPT_API_PORT=8000
```

## 📦 Makefile Commands

### Available Make Commands
```bash
# Show help
make help

# Install dependencies
make install

# Run tests
make test

# Run demo
make run

# Clean cache files
make clean
```

### Makefile Usage Examples
```bash
# Quick setup
make install && make test

# Development workflow
make clean && make install && make test && make run

# Production deployment
make clean && make install && make test
```

## 🔍 Debugging Commands

### Debug API Server
```bash
# Run with debug logging
uvicorn app.main:app --host 0.0.0.0 --port 8000 --log-level debug --reload

# Run with specific log level
LOG_LEVEL=DEBUG python run_api.py
```

### Debug Dashboard
```bash
# Run Streamlit with debug
streamlit run legacy/streamlit/dashboard.py --logger.level debug

# Check Streamlit logs
streamlit run legacy/streamlit/dashboard.py --logger.level debug 2>&1 | tee streamlit.log
```

### Debug Tests
```bash
# Run tests with debug output
pytest tests/ -v -s --tb=short

# Run specific test with debug
pytest tests/unit/test_quantum.py::test_qrng_generation -v -s
```

## 🚀 Production Commands

### Production Deployment
```bash
# Install production dependencies
pip install -r requirements.txt --no-dev

# Run production server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4 --access-log

# Run with gunicorn (alternative)
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Docker Commands (if Dockerfile exists)
```bash
# Build Docker image
docker build -t qcrypt-rng .

# Run Docker container
docker run -p 8000:8000 qcrypt-rng

# Run with environment variables
docker run -p 8000:8000 -e LOG_LEVEL=INFO qcrypt-rng
```

## 📊 Monitoring Commands

### Health Monitoring
```bash
# Check API health
curl -f http://localhost:8000/health || echo "API is down"

# Check dashboard health
curl -f http://localhost:8501/_stcore/health || echo "Dashboard is down"

# Monitor logs
tail -f logs/qcrypt_$(date +%Y-%m-%d).log | grep ERROR
```

### Performance Monitoring
```bash
# Monitor API performance
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8000/api/v2/generate/bytes

# Check system resources
htop
# or
top -p $(pgrep -f "uvicorn\|streamlit")
```

## 🔧 Configuration Commands

### Environment Configuration
```bash
# Set environment variables for development
export DEBUG=true
export SECRET_KEY=dev-secret-key-change-in-production-12345
export LOG_LEVEL=INFO
export API_HOST=0.0.0.0
export API_PORT=8000

# Or create .env file (if not blocked by gitignore)
cat > .env << EOF
DEBUG=true
SECRET_KEY=dev-secret-key-change-in-production-12345
LOG_LEVEL=INFO
API_HOST=0.0.0.0
API_PORT=8000
EOF

# Load environment
source .env
```

### Log Configuration
```bash
# Configure log rotation
sudo logrotate -f /etc/logrotate.d/qcrypt-rng

# Set log permissions
chmod 644 logs/*.log
```

---

## 💡 Tips and Best Practices

### Development Tips
- Always run tests before committing: `make test`
- Use virtual environments to isolate dependencies
- Check logs regularly for errors: `tail -f logs/errors_*.log`
- Use `--reload` flag during development for auto-restart

### Production Tips
- Use multiple workers for better performance
- Set up log rotation to prevent disk space issues
- Monitor system resources during high load
- Use reverse proxy (nginx) for production deployments

### Troubleshooting
- Check API connectivity: `curl http://localhost:8000/`
- Verify dependencies: `pip list | grep -E "(fastapi|streamlit)"`
- Check logs for errors: `grep ERROR logs/*.log`
- Restart services if needed: `pkill -f uvicorn && python run_api.py`

---

**For more detailed information, see the [Directory Guide](directory-guide.md) and [README](../../README.md).**
