@echo off
setlocal enabledelayedexpansion
title NER LogiSense - Launcher

set "ROOT=%~dp0"
set "VENV_DIR=%ROOT%.venv"
set "VENV_PY=%VENV_DIR%\Scripts\python.exe"
set "BACKEND_DIR=%ROOT%backend"
set "AUTH_DIR=%ROOT%backend\auth-service"
set "FRONTEND_DIR=%ROOT%apps\web-dashboard"

echo ============================================
echo   NER LogiSense - Starting Full Stack
echo ============================================
echo.

where python >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python was not found on PATH. Install Python 3.10+ and try again.
    pause
    exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js was not found on PATH. Install Node.js and try again.
    pause
    exit /b 1
)

if not exist "%VENV_PY%" (
    echo [Setup] Creating Python virtual environment...
    python -m venv "%VENV_DIR%"
    if errorlevel 1 (
        echo [ERROR] Failed to create the virtual environment.
        pause
        exit /b 1
    )
)

echo [Setup] Checking Python dependencies ^(skips instantly if already installed^)...
"%VENV_PY%" -m pip install --quiet --disable-pip-version-check -r "%ROOT%ml\requirements.txt"
"%VENV_PY%" -m pip install --quiet --disable-pip-version-check -r "%BACKEND_DIR%\requirements.txt"

if not exist "%ROOT%data\ner_landslide_sensor_dataset.xlsx" (
    echo [Setup] Generating the dummy sensor dataset...
    pushd "%ROOT%data"
    "%VENV_PY%" generate_dataset.py
    popd
)

if not exist "%ROOT%ml\model_bundle.joblib" (
    echo [Setup] Training the landslide risk ML model...
    pushd "%ROOT%ml"
    "%VENV_PY%" train_model.py
    popd
)

if not exist "%AUTH_DIR%\node_modules" (
    echo [Setup] Installing auth-service dependencies - this can take a minute...
    pushd "%AUTH_DIR%"
    call npm install
    popd
)

if not exist "%FRONTEND_DIR%\node_modules" (
    echo [Setup] Installing frontend dependencies - this can take a minute...
    pushd "%FRONTEND_DIR%"
    call npm install
    popd
)

echo.
echo [Start] Launching backend      -^> http://localhost:8000
REM --host 0.0.0.0 makes this reachable from phones on the same WiFi (not
REM just this PC) -- required for testing the mobile app on a real device.
start "NER LogiSense - Backend" cmd /k "cd /d "%BACKEND_DIR%" && "%VENV_PY%" -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo [Start] Launching auth-service -^> http://localhost:3000
REM Identity/session/user-directory + Admin account lifecycle (provision,
REM suspend, reactivate, deactivate, role/district change). This is the
REM authoritative login backend for the Admin Console -- the FastAPI gateway
REM above owns the operational/simulation data (sensors, routes, SOS, etc.)
REM and only carries a small in-memory demo/fallback login of its own.
start "NER LogiSense - Auth Service" cmd /k "cd /d "%AUTH_DIR%" && npm run dev"

echo [Start] Launching frontend     -^> http://localhost:5173
start "NER LogiSense - Frontend" cmd /k "cd /d "%FRONTEND_DIR%" && npm run dev"

echo [Start] Waiting for the frontend to come online...
set /a attempts=0
:waitloop
set /a attempts+=1
powershell -NoProfile -Command "try { Invoke-WebRequest -UseBasicParsing -Uri http://localhost:5173 -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if not errorlevel 1 goto ready
if !attempts! GEQ 45 (
    echo [WARN] Frontend did not respond in time - opening the browser anyway.
    goto ready
)
timeout /t 1 /nobreak >nul
goto waitloop

:ready
echo [Start] Opening the app in your default browser...
start "" "http://localhost:5173"

echo.
echo ============================================
echo   NER LogiSense is running
echo     Frontend      : http://localhost:5173
echo     Backend       : http://localhost:8000/docs
echo     Auth Service  : http://localhost:3000
echo.
echo   Close the three new terminal windows
echo   (Backend / Auth Service / Frontend) to stop the servers.
echo ============================================
echo.
pause
endlocal
