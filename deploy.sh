#!/bin/bash

# QCrypt RNG Deployment Script
# Automates the deployment of QCrypt RNG to Kubernetes

set -e  # Exit on any error

echo "🚀 Starting QCrypt RNG deployment..."

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed. Please install kubectl first."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Build the Docker image
echo "🐳 Building Docker image..."
docker build -t qcrypt-rng:latest .

# Create namespace
echo "🌐 Creating namespace..."
kubectl apply -f k8s/namespace.yaml

# Create secrets
echo "🔒 Creating secrets..."
kubectl apply -f k8s/secrets.yaml

# Deploy PostgreSQL
echo "🐘 Deploying PostgreSQL..."
kubectl apply -f k8s/postgres-pvc.yaml
kubectl apply -f k8s/postgres-deployment.yaml

# Deploy Redis
echo ".Redis Deploying Redis..."
kubectl apply -f k8s/redis-deployment.yaml

# Wait for databases to be ready
echo "⏳ Waiting for databases to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n qcrypt-rng --timeout=120s
kubectl wait --for=condition=ready pod -l app=redis -n qcrypt-rng --timeout=120s

# Deploy API
echo "📡 Deploying API..."
kubectl apply -f k8s/api-deployment.yaml

# Deploy Dashboard
echo "📊 Deploying Dashboard..."
kubectl apply -f k8s/dashboard-deployment.yaml

# Wait for deployments to be ready
echo "⏳ Waiting for deployments to be ready..."
kubectl wait --for=condition=ready pod -l app=qcrypt-api -n qcrypt-rng --timeout=180s
kubectl wait --for=condition=ready pod -l app=qcrypt-dashboard -n qcrypt-rng --timeout=180s

# Get external IPs
echo "🔍 Getting service endpoints..."
API_IP=$(kubectl get svc qcrypt-api-service -n qcrypt-rng -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
DASHBOARD_IP=$(kubectl get svc qcrypt-dashboard-service -n qcrypt-rng -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

echo ""
echo "🎉 QCrypt RNG deployment completed successfully!"
echo ""
echo "🔗 API Endpoint: http://$API_IP"
echo "🔗 Dashboard: http://$DASHBOARD_IP"
echo ""
echo "📝 Next steps:"
echo "   1. Configure your DNS to point to the external IPs"
echo "   2. Set up SSL certificates for HTTPS"
echo "   3. Configure API keys for production use"
echo "   4. Set up monitoring and alerting"
echo ""

# Show deployment status
echo "📋 Deployment status:"
kubectl get pods -n qcrypt-rng