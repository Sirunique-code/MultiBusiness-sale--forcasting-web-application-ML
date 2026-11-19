@echo off
title Multi-Business Sales Forecasting Platform Launcher
echo ===================================================
echo Starting Multi-Business Sales Forecasting Platform
echo ===================================================
echo.

echo 1. Launching Flask Backend API on http://localhost:5000 ...
start "Backend Flask Server" cmd /k "cd /d %~dp0backend && .venv\Scripts\python.exe run.py"

echo.
echo 2. Launching Next.js Frontend App on http://localhost:3000 ...
start "Frontend Next.js App" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ===================================================
echo Servers starting in background windows!
echo - Frontend: http://localhost:3000
echo - Backend:  http://localhost:5000
echo ===================================================
echo.
pause
