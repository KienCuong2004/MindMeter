#!/bin/bash

# MindMeter Docker Quick Start Script

set -e

echo "=== MindMeter Docker Setup ==="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Creating .env file from example..."
    cp docker-compose.env.example .env
    echo "⚠️  Please edit .env file with your configuration before continuing!"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Parse command line arguments
MODE=${1:-dev}

if [ "$MODE" == "prod" ]; then
    echo "Starting production environment..."
    docker-compose -f docker-compose.prod.yml up -d --build
    echo "✅ Production services started!"
    echo "📊 Monitor logs: docker-compose -f docker-compose.prod.yml logs -f"
else
    echo "Starting development environment..."
    docker-compose up -d --build
    echo "✅ Development services started!"
    echo ""
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔧 Backend: http://localhost:8080"
    echo "🗄️  MySQL: localhost:3306"
    echo ""
    echo "📊 Monitor logs: docker-compose logs -f"
fi

echo ""
echo "Use 'docker-compose ps' to check service status"
echo "Use 'docker-compose logs -f [service]' to view logs"

