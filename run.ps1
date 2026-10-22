Write-Host "Starting Backend, Frontend, and AI Service..." -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\backend'; .\apache-maven-3.9.6\bin\mvn.cmd spring-boot:run '-Dspring-boot.run.profiles=local'"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\frontend'; npm.cmd run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\ai-service'; .\venv\Scripts\python.exe main.py"

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "Backend:  http://localhost:8080" -ForegroundColor Green
Write-Host "AI API:   http://localhost:8000" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
