# Multi-Business Sales Forecasting Platform PowerShell Launcher
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host " Starting Multi-Business Sales Forecasting Platform" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

$rootDir = $PSScriptRoot

Write-Host "1. Launching Flask Backend API (http://localhost:5000)..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList "/k cd /d `"$rootDir\backend`" && .venv\Scripts\python.exe run.py"

Write-Host "2. Launching Next.js Frontend App (http://localhost:3000)..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList "/k cd /d `"$rootDir`" && npm run dev"

Write-Host ""
Write-Host "Both servers launched!" -ForegroundColor Green
Write-Host "-> Frontend Web App: http://localhost:3000" -ForegroundColor Cyan
Write-Host "-> Backend API:     http://localhost:5000" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
