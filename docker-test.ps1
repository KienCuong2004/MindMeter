# MindMeter Docker Test Script
# Tests Docker setup without actually starting services

Write-Host "=== MindMeter Docker Setup Test ===" -ForegroundColor Cyan
Write-Host ""

$errors = @()
$warnings = @()

# Test 1: Check Docker is running
Write-Host "[1/8] Checking Docker..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "  ✓ Docker is running" -ForegroundColor Green
} catch {
    $errors += "Docker is not running"
    Write-Host "  ✗ Docker is not running" -ForegroundColor Red
}

# Test 2: Validate docker-compose.yml
Write-Host "[2/8] Validating docker-compose.yml..." -ForegroundColor Yellow
try {
    docker-compose config | Out-Null
    Write-Host "  ✓ docker-compose.yml is valid" -ForegroundColor Green
} catch {
    $errors += "docker-compose.yml has syntax errors"
    Write-Host "  ✗ docker-compose.yml has errors" -ForegroundColor Red
}

# Test 3: Check required files exist
Write-Host "[3/8] Checking required files..." -ForegroundColor Yellow
$requiredFiles = @(
    "backend/Dockerfile",
    "frontend/Dockerfile",
    "backend/pom.xml",
    "frontend/package.json",
    "frontend/nginx.conf",
    "database/MindMeter.sql"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        $errors += "Missing file: $file"
        Write-Host "  ✗ $file (missing)" -ForegroundColor Red
        $allFilesExist = $false
    }
}

# Test 4: Check .dockerignore files
Write-Host "[4/8] Checking .dockerignore files..." -ForegroundColor Yellow
if (Test-Path "backend/.dockerignore") {
    Write-Host "  ✓ backend/.dockerignore exists" -ForegroundColor Green
} else {
    $warnings += "backend/.dockerignore not found (optional)"
    Write-Host "  ⚠ backend/.dockerignore not found" -ForegroundColor Yellow
}

if (Test-Path "frontend/.dockerignore") {
    Write-Host "  ✓ frontend/.dockerignore exists" -ForegroundColor Green
} else {
    $warnings += "frontend/.dockerignore not found (optional)"
    Write-Host "  ⚠ frontend/.dockerignore not found" -ForegroundColor Yellow
}

# Test 5: Validate Dockerfile syntax (basic check)
Write-Host "[5/8] Validating Dockerfile syntax..." -ForegroundColor Yellow
$dockerfiles = @("backend/Dockerfile", "frontend/Dockerfile")
foreach ($df in $dockerfiles) {
    if (Test-Path $df) {
        $content = Get-Content $df -Raw
        if ($content -match "FROM " -and $content -match "WORKDIR ") {
            Write-Host "  ✓ $df syntax looks valid" -ForegroundColor Green
        } else {
            $warnings += "$df may have syntax issues"
            Write-Host "  ⚠ $df may have issues" -ForegroundColor Yellow
        }
    }
}

# Test 6: Check nginx configuration
Write-Host "[6/8] Checking nginx configuration..." -ForegroundColor Yellow
if (Test-Path "frontend/nginx.conf") {
    $nginxContent = Get-Content "frontend/nginx.conf" -Raw
    if ($nginxContent -match "server\s*{" -and $nginxContent -match "listen\s+80") {
        Write-Host "  ✓ frontend/nginx.conf looks valid" -ForegroundColor Green
    } else {
        $warnings += "frontend/nginx.conf may have issues"
        Write-Host "  ⚠ frontend/nginx.conf may have issues" -ForegroundColor Yellow
    }
} else {
    $errors += "frontend/nginx.conf is missing"
    Write-Host "  ✗ frontend/nginx.conf is missing" -ForegroundColor Red
}

# Test 7: Check environment example file
Write-Host "[7/8] Checking environment files..." -ForegroundColor Yellow
if (Test-Path "docker-compose.env.example") {
    Write-Host "  ✓ docker-compose.env.example exists" -ForegroundColor Green
} else {
    $warnings += "docker-compose.env.example not found"
    Write-Host "  ⚠ docker-compose.env.example not found" -ForegroundColor Yellow
}

# Test 8: Check port conflicts
Write-Host "[8/8] Checking for port conflicts..." -ForegroundColor Yellow
$ports = @(3306, 8080, 3000)
$portConflicts = @()
foreach ($port in $ports) {
    $listening = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($listening) {
        $portConflicts += $port
        Write-Host "  ⚠ Port $port is already in use" -ForegroundColor Yellow
    } else {
        Write-Host "  ✓ Port $port is available" -ForegroundColor Green
    }
}

if ($portConflicts.Count -gt 0) {
    $warnings += "Some ports are in use: $($portConflicts -join ', ')"
}

# Summary
Write-Host ""
Write-Host "=== Test Summary ===" -ForegroundColor Cyan
if ($errors.Count -eq 0) {
    Write-Host "✓ All critical tests passed!" -ForegroundColor Green
    if ($warnings.Count -gt 0) {
        Write-Host ""
        Write-Host "Warnings:" -ForegroundColor Yellow
        foreach ($warning in $warnings) {
            Write-Host "  ⚠ $warning" -ForegroundColor Yellow
        }
    }
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Copy docker-compose.env.example to .env" -ForegroundColor White
    Write-Host "  2. Edit .env with your configuration" -ForegroundColor White
    Write-Host "  3. Run: docker-compose up -d" -ForegroundColor White
    exit 0
} else {
    Write-Host "✗ Found $($errors.Count) error(s):" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "  ✗ $error" -ForegroundColor Red
    }
    if ($warnings.Count -gt 0) {
        Write-Host ""
        Write-Host "Warnings:" -ForegroundColor Yellow
        foreach ($warning in $warnings) {
            Write-Host "  ⚠ $warning" -ForegroundColor Yellow
        }
    }
    exit 1
}

