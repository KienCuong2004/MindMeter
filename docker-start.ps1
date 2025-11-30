# MindMeter Docker Quick Start Script (PowerShell)

param(
    [string]$Mode = "dev"
)

Write-Host "=== MindMeter Docker Setup ===" -ForegroundColor Cyan

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file from example..." -ForegroundColor Yellow
    Copy-Item "docker-compose.env.example" ".env"
    Write-Host "⚠️  Please edit .env file with your configuration before continuing!" -ForegroundColor Red
    exit 1
}

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Docker is not running. Please start Docker and try again." -ForegroundColor Red
    exit 1
}

if ($Mode -eq "prod") {
    Write-Host "Starting production environment..." -ForegroundColor Green
    docker-compose -f docker-compose.prod.yml up -d --build
    Write-Host "✅ Production services started!" -ForegroundColor Green
    Write-Host "📊 Monitor logs: docker-compose -f docker-compose.prod.yml logs -f" -ForegroundColor Cyan
} else {
    Write-Host "Starting development environment..." -ForegroundColor Green
    docker-compose up -d --build
    Write-Host "✅ Development services started!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "🔧 Backend: http://localhost:8080" -ForegroundColor Cyan
    Write-Host "🗄️  MySQL: localhost:3306" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📊 Monitor logs: docker-compose logs -f" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Use 'docker-compose ps' to check service status" -ForegroundColor Yellow
Write-Host "Use 'docker-compose logs -f [service]' to view logs" -ForegroundColor Yellow

