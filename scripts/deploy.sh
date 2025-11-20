#!/bin/bash

# SELMai Deployment Script
# This script automates the deployment process

set -e  # Exit on error

echo "🚀 Starting SELMai deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f "$(dirname "$0")/../.env" ]; then
    echo -e "${RED}❌ Error: .env file not found!${NC}"
    echo "Please copy .env.example to .env and configure it:"
    echo "  cp .env.example .env"
    echo "  nano .env"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker is not running!${NC}"
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Error: docker compose is not available!${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Prerequisites check passed"

# Pull latest changes (if in git repo)
if [ -d "$(dirname "$0")/../.git" ]; then
    echo "📥 Pulling latest changes from git..."
    cd "$(dirname "$0")/.."
    git pull
    echo -e "${GREEN}✓${NC} Git pull completed"
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker compose -f "$(dirname "$0")/../docker-compose.prod.yml" down

# Build images
echo "🔨 Building Docker images..."
docker compose -f "$(dirname "$0")/../docker-compose.prod.yml" build --no-cache

# Start services
echo "🚀 Starting services..."
docker compose -f "$(dirname "$0")/../docker-compose.prod.yml" up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service health
echo "🏥 Checking service health..."
SERVICES=("db" "backend" "frontend" "nginx")
ALL_HEALTHY=true

for service in "${SERVICES[@]}"; do
    HEALTH=$(docker inspect --format='{{.State.Health.Status}}' selmai-${service}-1 2>/dev/null || echo "no-health-check")
    
    if [ "$HEALTH" = "healthy" ] || [ "$HEALTH" = "no-health-check" ]; then
        echo -e "${GREEN}✓${NC} $service is healthy"
    else
        echo -e "${RED}✗${NC} $service is not healthy (status: $HEALTH)"
        ALL_HEALTHY=false
    fi
done

# Show running containers
echo ""
echo "📊 Running containers:"
docker compose -f "$(dirname "$0")/../docker-compose.prod.yml" ps

if [ "$ALL_HEALTHY" = true ]; then
    echo ""
    echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
    echo ""
    echo "🌐 Your application should be accessible at:"
    echo "   - Frontend: http://localhost:8080 (or https://localhost:8443)"
    echo "   - API: http://localhost:8080/api (or https://localhost:8443/api)"
    echo ""
    echo "📝 To view logs:"
    echo "   docker compose -f ../docker-compose.prod.yml logs -f"
else
    echo ""
    echo -e "${YELLOW}⚠️  Some services are not healthy. Check logs:${NC}"
    echo "   docker compose -f ../docker-compose.prod.yml logs"
fi
