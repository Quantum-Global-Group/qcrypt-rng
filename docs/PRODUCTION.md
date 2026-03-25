# QCrypt RNG - Production Deployment Guide

This guide provides instructions for deploying QCrypt RNG in a production environment.

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Deployment Options](#deployment-options)
- [Security Considerations](#security-considerations)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Troubleshooting](#troubleshooting)

## Architecture Overview

QCrypt RNG consists of the following components:

- **API Server**: FastAPI application serving quantum random number generation endpoints
- **Dashboard**: Next.js 16 web interface for visualization and management (served via Nginx)
- **Database**: PostgreSQL for persistent data storage
- **Cache**: Redis for session management and caching
- **Quantum Backend**: Either simulated or connected to real quantum computers
- **Web Server**: Nginx reverse proxy serving both API and dashboard on a single port

## Prerequisites

Before deploying QCrypt RNG in production, ensure you have:

- **Kubernetes cluster** (v1.20+) or **Docker Compose** environment
- **Domain name** for your deployment
- **SSL certificate** for HTTPS
- **PostgreSQL database** (managed or self-hosted)
- **Redis instance** (managed or self-hosted)
- **Quantum computing access** (optional, for real quantum backends)

## Environment Configuration

### Required Environment Variables

#### API Server
```bash
# Application settings
ENVIRONMENT=production
DEBUG=false
APP_NAME="QCrypt RNG Production"
APP_VERSION="2.0.0"

# API configuration
API_HOST=0.0.0.0
API_PORT=8000
ALLOWED_ORIGINS=https://yourdomain.com,https://dashboard.yourdomain.com

# Security configuration
SECRET_KEY=your-very-long-secret-key-here-at-least-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Database configuration
DATABASE_URL=postgresql://user:password@host:port/database

# Cache configuration
REDIS_URL=redis://host:port/0

# Quantum backend configuration
QUANTUM_BACKEND=ibm_quantum  # or qrisp_simulator, iqm_quantum, rigetti
IBM_QUANTUM_TOKEN=your_ibm_quantum_token  # if using IBM backend

# Rate limiting
RATE_LIMIT_REQUESTS=1000
RATE_LIMIT_PERIOD=3600

# Tier limits
FREE_TIER_MAX_BYTES=256
FREE_TIER_MAX_REQUESTS=100
PRO_TIER_MAX_BYTES=1024
PRO_TIER_MAX_REQUESTS=1000
ENTERPRISE_TIER_MAX_BYTES=10240
ENTERPRISE_TIER_MAX_REQUESTS=10000

# API key configuration
REQUIRE_API_KEY=true
API_KEY_HEADER=X-API-Key
# Comma-separated list of accepted API keys (in-memory allow-list).
# For large-scale deployments, replace with a database or Redis lookup.
VALID_API_KEYS=key-aaaa1111bbbb2222,key-cccc3333dddd4444

# Request body size limit (bytes). Default 1 MB.
MAX_REQUEST_BODY_SIZE_BYTES=1048576

# Stripe billing (optional; leave unset for free-only deployments)
# STRIPE_SECRET_KEY=sk_live_...
# STRIPE_WEBHOOK_SECRET=whsec_...
# STRIPE_PRICE_ID_PRO=price_...
# STRIPE_PRICE_ID_ENTERPRISE=price_...

# Monitoring
LOG_LEVEL=INFO
ENABLE_DETAILED_LOGGING=true
ENABLE_AUDIT_LOGGING=true
AUDIT_LOG_RETENTION_DAYS=365
FIPS_MODE=false
```

#### Billing

When Stripe variables are set, the billing router (`/api/v2/stripe/webhook`) processes subscription lifecycle events and updates the API key tier in the rate-limits database automatically.  Without Stripe, tiers can be set via the admin endpoint `POST /api/v2/billing/keys/register` or by inserting rows directly into the `rate_limits` SQLite table.

#### Dashboard

The dashboard is built with Next.js 16 and served via Nginx alongside the FastAPI backend.

```bash
# Build the dashboard (run from quantum-oracle-ui/)
cd quantum-oracle-ui
npm install
npm run build

# Environment variables for dashboard
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api/v2
API_BASE_URL=https://api.yourdomain.com

# Production server command
npm run start
```

**Single Docker Deployment:**
The `Dockerfile` builds both the FastAPI backend and Next.js frontend, served via Nginx on port 7860 (for Hugging Face Spaces) or configurable ports. The Nginx configuration (`nginx.spaces.conf`) routes:
- `/api/*` → FastAPI backend
- `/` → Next.js dashboard

## Deployment Options

### Option 1: Kubernetes Deployment

1. **Prepare your Kubernetes cluster** with sufficient resources
2. **Update the Kubernetes manifests** in the `k8s/` directory with your specific configurations
3. **Set up secrets** for sensitive information:

```bash
kubectl create secret generic postgres-secret \
  --from-literal=password=your_secure_password \
  -n qcrypt-rng
```

4. **Deploy using the provided script**:

```bash
./deploy.sh
```

### Option 2: Docker Compose Deployment

For development and testing, you can use Docker Compose to run separate services:

```bash
docker-compose up -d
```

### Option 3: Single Docker Image (Recommended for Production)

Build and run the unified Docker image that includes Nginx, FastAPI, and Next.js:

```bash
# Build the image
docker build -t qcrypt-rng .

# Run the container
docker run -d -p 7860:7860 \
  -e ENVIRONMENT=production \
  -e SECRET_KEY=your-secure-key \
  -e DATABASE_URL=postgresql://... \
  qcrypt-rng
```

Access the application at `http://localhost:7860`:
- Dashboard: `http://localhost:7860/`
- API Docs: `http://localhost:7860/docs`

### Option 4: Manual Deployment

1. **Set up your infrastructure** (database, cache, load balancer)
2. **Configure environment variables** as shown above
3. **Deploy the API server** using your preferred method (PM2, systemd, etc.)
4. **Build and deploy the Next.js dashboard**:

```bash
# Build the dashboard
cd quantum-oracle-ui
npm install
npm run build

# Start with production environment
API_BASE_URL=https://api.yourdomain.com npm run start
```

5. **Configure Nginx** to proxy requests:
   - `/api/*` → FastAPI backend (port 8000)
   - `/` → Next.js dashboard (port 3000)

## Security Considerations

### API Security
- Always use HTTPS in production.
- **CORS** is restricted to the origins listed in `ALLOWED_ORIGINS`. Never use `*` with credentials in production.
- **Security headers** are added automatically to every response:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: geolocation=(), camera=(), microphone=()`
  - In production (`ENVIRONMENT=production`): `Strict-Transport-Security` and `Content-Security-Policy` are also set.
- **Request body size limit** is enforced (default 1 MB, configurable via `MAX_REQUEST_BODY_SIZE_BYTES`). Requests exceeding the limit receive HTTP 413.
- **SECRET_KEY** must be set to a real value (>= 32 characters) in production. The application will refuse to start if the default placeholder is detected when `ENVIRONMENT=production`.

### API Key Management
- Set `REQUIRE_API_KEY=true` in production.
- Supply accepted keys via `VALID_API_KEYS` (comma-separated). Keys are validated using constant-time comparison. The raw key is never logged; only a SHA-256 prefix hash appears in audit logs.
- For large-scale deployments, replace the in-memory allow-list with a database or Redis lookup in `api_key_middleware`.
- Enable rate limiting to prevent abuse.
- Regularly rotate secrets and API keys.

### Audit Logging
- Security events (invalid/missing API keys, rate-limit violations) are written to `logs/security_<date>.log` via the dedicated security logger.
- Audit logs are retained for 365 days by default (`AUDIT_LOG_RETENTION_DAYS`).
- Sensitive values (API keys, randomness) are never included in logs.

### Data Protection
- Encrypt sensitive data in transit and at rest.
- Implement proper backup strategies.
- Follow the principle of least privilege.
- Regular security audits and penetration testing.

### Quantum Backend Security
- Secure access to quantum computers.
- Implement proper authentication and authorization.
- Monitor quantum backend access logs.
- Regular updates and patches.

## Monitoring and Maintenance

### Key Metrics to Monitor
- API response times
- Error rates
- Quantum generation performance
- Database performance
- Cache hit ratios
- Resource utilization

### Logging
- Enable detailed logging in production
- Implement log aggregation and analysis
- Set up alerts for critical issues
- Regular log rotation and archival

### Maintenance Tasks
- Regular security updates
- Database maintenance and optimization
- Quantum backend calibration
- Performance tuning

## Troubleshooting

### Common Issues

#### API Server Not Starting
- Check environment variables
- Verify database connectivity
- Review logs for specific error messages

#### Slow Quantum Generation
- Check quantum backend configuration
- Verify sufficient qubit allocation
- Review performance metrics

#### Dashboard Not Connecting to API
- Verify API_BASE_URL configuration
- Check network connectivity between services
- Review CORS settings

### Getting Help
- Check the logs in the `logs/` directory
- Review the API documentation at `/docs`
- Contact support at [support@qcrypt.example.com](mailto:support@qcrypt.example.com)
- Open an issue in our [GitHub repository](https://github.com/quantumGlobalGroup/qcrypt-rng)

## Upgrading

To upgrade to a new version:

1. **Backup your data** (database, configuration files)
2. **Review release notes** for breaking changes
3. **Test in staging environment** first
4. **Deploy to production** following your standard procedures
5. **Monitor closely** after deployment

---

For additional support or questions, please reach out to our team.