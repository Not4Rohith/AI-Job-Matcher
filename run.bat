@echo off
echo Starting Backend and Frontend together...

start "HireMatch Backend" cmd /k "cd /d %~dp0backend && apache-maven-3.9.6\bin\mvn.cmd spring-boot:run -Dspring-boot.run.profiles=local"
start "HireMatch Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
start "HireMatch AI Service" cmd /k "cd /d %~dp0ai-service && venv\Scripts\python.exe main.py"

echo.
echo ========================================================
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8080
echo AI API:   http://localhost:8000
echo ========================================================
