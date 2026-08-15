@echo off
setlocal
cd /d "%~dp0"

echo Starting Spotify project...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-spotify-project.ps1"

if errorlevel 1 (
    echo.
    echo The launcher reported an error.
    pause
)
endlocal
