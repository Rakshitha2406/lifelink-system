@echo off
echo =========================================================================
echo  LifeLink - Smart Emergency Blood Availability & Matching System
echo  Backend Server Starter (Python + MySQL / SQLite)
echo =========================================================================
echo.

cd /d "%~dp0"

IF EXIST .venv\Scripts\python.exe (
    echo [✓] Using existing virtual environment in .venv
    .venv\Scripts\python.exe app.py
) ELSE (
    echo [!] .venv not found. Running with system python...
    python app.py
)

pause
