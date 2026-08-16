$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$venvDaphne = Join-Path $projectRoot ".venv\Scripts\daphne.exe"

if (-not (Test-Path $venvDaphne)) {
    throw "Local dependencies are missing. Run .\scripts\setup-local.ps1 first."
}

Set-Location (Join-Path $projectRoot "backend")
& $venvDaphne -b 127.0.0.1 -p 9000 config.asgi:application
