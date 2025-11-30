# MindMeter Docker Stop Script (PowerShell)

param(
    [string]$Mode = "dev"
)

if ($Mode -eq "prod") {
    Write-Host "Stopping production environment..." -ForegroundColor Yellow
    docker-compose -f docker-compose.prod.yml down
    Write-Host "✅ Production services stopped!" -ForegroundColor Green
} else {
    Write-Host "Stopping development environment..." -ForegroundColor Yellow
    docker-compose down
    Write-Host "✅ Development services stopped!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Use 'docker-compose down -v' to remove volumes (WARNING: deletes data)" -ForegroundColor Yellow

