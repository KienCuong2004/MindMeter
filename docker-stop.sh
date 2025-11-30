#!/bin/bash

# MindMeter Docker Stop Script

set -e

MODE=${1:-dev}

if [ "$MODE" == "prod" ]; then
    echo "Stopping production environment..."
    docker-compose -f docker-compose.prod.yml down
    echo "✅ Production services stopped!"
else
    echo "Stopping development environment..."
    docker-compose down
    echo "✅ Development services stopped!"
fi

echo ""
echo "Use 'docker-compose down -v' to remove volumes (WARNING: deletes data)"

