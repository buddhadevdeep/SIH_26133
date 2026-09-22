# SIH HealthConnect Unified PowerShell Launcher
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "    Starting SIH HealthConnect Full Stack App     " -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Start M2 AI / ML Backend
Write-Host "[1/3] Starting M2 AI/ML FastAPI Server (Port 8000)..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d `"$Root\M2`" && python -m uvicorn backend.app:app --host 127.0.0.1 --port 8000 --reload" -WindowStyle Normal

# 2. Start Node.js Backend
Write-Host "[2/3] Starting Node.js Express Backend (Port 5001)..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d `"$Root\backend`" && npm run dev" -WindowStyle Normal

# 3. Start Frontend
Write-Host "[3/3] Starting React Vite Frontend (Port 5173)..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d `"$Root\frontEnd`" && npm run dev" -WindowStyle Normal

Write-Host "All 3 services have been launched in separate terminal windows." -ForegroundColor Green
Write-Host "Frontend:    http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend:     http://localhost:5001/api/v1 (Health: http://localhost:5001/health)" -ForegroundColor Cyan
Write-Host "M2 AI/ML:    http://localhost:8000 (Swagger: http://localhost:8000/docs)" -ForegroundColor Cyan
