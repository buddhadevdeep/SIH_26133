@echo off
TITLE SIH HealthConnect Unified Launcher
echo ===================================================
echo     Starting SIH HealthConnect Full Stack App
echo ===================================================
echo.
echo [1/3] Launching M2 AI/ML FastAPI Server (Port 8000)...
start "SIH - M2 AI/ML Service (Port 8000)" cmd /k "cd /d %~dp0M2 && python -m uvicorn backend.app:app --host 127.0.0.1 --port 8000 --reload"

echo [2/3] Launching Node.js Backend Server (Port 5001)...
start "SIH - Backend API (Port 5001)" cmd /k "cd /d %~dp0backend && npm run dev"

echo [3/3] Launching Frontend Web App (Port 5173)...
start "SIH - Frontend Web App (Port 5173)" cmd /k "cd /d %~dp0frontEnd && npm run dev"

echo.
echo ===================================================
echo All 3 services are launching in separate windows!
echo - AI/ML Service: http://localhost:8000 (Docs: /docs)
echo - Backend API:   http://localhost:5001/api/v1
echo - Frontend App:  http://localhost:5173
echo ===================================================
timeout /t 5
