#!/bin/bash

# SELMai Deployment Script
# This script automates the deployment process

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting SELMai deployment...${NC}"

# Ensure we are in the project root
# This allows the script to be run from anywhere
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)
echo "📂 Working directory: $PROJECT_ROOT"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Error: .env file not found!${NC}"
    echo "Please copy .env.example to .env and configure it:"
    echo "  cp .env.example .env"
    echo "  nano .env"
    exit 1
fi

# Check if Docker is running
#if ! docker info > /dev/null 2>&1; then
#    echo -e "${RED}❌ Error: Docker is not running!${NC}"
#    exit 1
#fi

# Check if Docker Compose (v2) is available
if ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Error: 'docker compose' (v2) is not available!${NC}"
    echo "Please install Docker Compose v2 plugin."
    exit 1
fi

echo -e "${GREEN}✓${NC} Prerequisites check passed"

# Pull latest changes (if in git repo)
if [ -d ".git" ]; then
    echo "📥 Pulling latest changes from git..."
    git pull
    echo -e "${GREEN}✓${NC} Git pull completed"
fi

# Build and Start services
# --remove-orphans: Remove containers for services not defined in the Compose file
# --build: Build images before starting containers
echo "🚀 Building and starting services..."
docker compose -f docker-compose.prod.yml up -d --build --remove-orphans

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy (this may take up to 60 seconds)..."
SERVICES=("db" "backend" "frontend")
MAX_WAIT=60
ELAPSED=0
ALL_HEALTHY=false

while [ $ELAPSED -lt $MAX_WAIT ]; do
    sleep 5
    ELAPSED=$((ELAPSED + 5))
    ALL_HEALTHY=true
    
    echo -n "🏥 Checking service health (${ELAPSED}s)... "
    
    for service in "${SERVICES[@]}"; do
        # Get container ID for the service using docker compose ps
        CONTAINER_ID=$(docker compose -f docker-compose.prod.yml ps -q $service)
        
        if [ -z "$CONTAINER_ID" ]; then
            echo -e "${RED}✗${NC} Service $service is not running"
            ALL_HEALTHY=false
            break
        fi

        HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_ID" 2>/dev/null || echo "no-health-check")
        
        if [ "$HEALTH" != "healthy" ] && [ "$HEALTH" != "no-health-check" ]; then
            ALL_HEALTHY=false
            break
        fi
    done
    
    if [ "$ALL_HEALTHY" = true ]; then
        echo -e "${GREEN}All services healthy!${NC}"
        break
    else
        echo "waiting..."
    fi
done

# Final health check report
echo ""
echo "📊 Final health status:"
for service in "${SERVICES[@]}"; do
    CONTAINER_ID=$(docker compose -f docker-compose.prod.yml ps -q $service)
    
    if [ -z "$CONTAINER_ID" ]; then
         echo -e "${RED}✗${NC} Service $service is not running"
         continue
    fi

    HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_ID" 2>/dev/null || echo "no-health-check")
    
    if [ "$HEALTH" = "healthy" ] || [ "$HEALTH" = "no-health-check" ]; then
        echo -e "${GREEN}✓${NC} $service is healthy"
    else
        echo -e "${RED}✗${NC} $service is not healthy (status: $HEALTH)"
    fi
done

# Show running containers
echo ""
echo "📊 Running containers:"
docker compose -f docker-compose.prod.yml ps

if [ "$ALL_HEALTHY" = true ]; then
    echo ""
    echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
    echo ""
    echo "🌐 Your application should be accessible at:"
    echo "   - Site web: https://selmai.fr (port 443)"
    echo "   - Application SELMai: https://selmai.fr:3000"
    echo "   - API: https://selmai.fr:3000/api"
    echo ""
    echo "📝 To view logs:"
    echo "   docker compose -f docker-compose.prod.yml logs -f"
else
    echo ""
    echo -e "${YELLOW}⚠️  Some services are not healthy. Check logs:${NC}"
    echo "   docker compose -f docker-compose.prod.yml logs"
    exit 1
fi
