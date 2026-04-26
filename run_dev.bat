@echo off
REM GhostGrid Development Server Startup Script
REM This script starts the Django backend with Daphne for WebSocket support

echo ========================================
echo Starting GhostGrid Development Server
echo ========================================

REM Change to the backend directory
cd /d "%~dp0ghostgrid-backend"

REM Check if virtual environment exists and activate it
if exist "venv\Scripts\activate.bat" (
    echo Activating virtual environment...
    call venv\Scripts\activate.bat
) else (
    echo Virtual environment not found. Using system Python.
)

REM Install/update dependencies
echo Installing/Updating dependencies...
pip install -r requirements.txt

REM Start Daphne server using Django management command
echo Starting Daphne server via Django management command...
python manage.py run_daphne

echo Server stopped.
pause