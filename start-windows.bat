@echo off
echo ==========================================
echo HireMatch AI - Local Startup (No Docker)
echo ==========================================
echo.

if not exist ".env" (
    echo Error: .env file not found. Please copy .env.example to .env and configure your database.
    exit /b 1
)

echo Loading environment variables from .env...
for /f "usebackq tokens=1* delims==" %%a in (".env") do (
    set "line=%%a"
    if not "!line:~0,1!"=="#" (
        if not "%%a"=="" set "%%a=%%b"
    )
)

echo Starting AI Service (Python FastAPI)...
start cmd /k "cd ai-service && venv\Scripts\python.exe main.py"

echo Starting Backend Service (Spring Boot)...
start cmd /k "cd backend && apache-maven-3.9.6\bin\mvn.cmd spring-boot:run -Dspring-boot.run.profiles=local"

echo Starting Frontend (React / Vite)...
start cmd /k "cd frontend && npm run dev"

echo.
echo All services are starting up!
echo - Frontend: http://localhost:5173
echo - Backend:  http://localhost:8080/api/v1/swagger-ui.html
echo - AI API:   http://localhost:8000/docs
echo.
echo Note: Ensure your .env has a valid PostgreSQL database URL with the pgvector extension!
echo (e.g. from Neon.tech or Supabase)
