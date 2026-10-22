@echo off
echo ========================================================
echo   HireMatch AI - Share with Teammate (Public Tunnel)
echo ========================================================
echo.
echo Make sure the app is running first (start-windows.bat)
echo.
:loop
echo Starting secure public tunnel on port 5173...
echo.
npx -y localtunnel --port 5173 --subdomain hirematch-ai-app
echo Tunnel closed or reconnecting in 3 seconds...
timeout /t 3 >nul
goto loop
