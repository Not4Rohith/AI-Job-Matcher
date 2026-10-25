#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export JAVA_HOME="/usr/lib/jvm/java-17-temurin"

echo "========================================================"
echo "Starting HireMatch AI Services..."
echo "========================================================"

# Trap SIGINT and SIGTERM to clean up background processes
cleanup() {
    echo ""
    echo "Stopping all services..."
    kill $(jobs -p) 2>/dev/null || true
    wait
    echo "All services stopped."
}
trap cleanup SIGINT SIGTERM EXIT

# 1. Start AI Microservice
echo "Starting AI Service on port 8000..."
(
    cd "$DIR/ai-service"
    "$DIR/ai-service/venv/bin/python" main.py
) &
AI_PID=$!

# 2. Start Backend
echo "Starting Backend on port 8080..."
(
    cd "$DIR/backend"
    "$DIR/backend/apache-maven-3.9.6/bin/mvn" spring-boot:run -Dspring-boot.run.profiles=local
) &
BACKEND_PID=$!

# 3. Start Frontend
echo "Starting Frontend on port 5173..."
(
    cd "$DIR/frontend"
    npm run dev
) &
FRONTEND_PID=$!

echo ""
echo "========================================================"
echo "Frontend:   http://localhost:5173"
echo "Backend:    http://localhost:8080"
echo "AI Service: http://localhost:8000"
echo "========================================================"
echo "Press Ctrl+C to stop all services."
echo ""

wait
