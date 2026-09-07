@echo off
title NER LogiSense — Standalone Simulation Controller
color 0A
cls
echo ======================================================================
echo   NER LOGISENSE — HACKATHON DEMO SIMULATION CONTROLLER
echo ======================================================================
echo.

IF EXIST ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
) ELSE IF EXIST "backend\.venv\Scripts\activate.bat" (
    call backend\.venv\Scripts\activate.bat
)

python backend\sim_cli.py

pause
