@echo off
setlocal enabledelayedexpansion
for /f "usebackq tokens=1* delims==" %%a in ("..\.env") do (
    set "k=%%a"
    if not "!k:~0,1!"=="#" (
        if not "%%a"=="" set "%%a=%%b"
    )
)
echo Starting Spring Boot...
apache-maven-3.9.6\bin\mvn.cmd spring-boot:run
