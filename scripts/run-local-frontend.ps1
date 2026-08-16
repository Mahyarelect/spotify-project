$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot

if (-not (Test-Path (Join-Path $projectRoot "node_modules"))) {
    throw "Frontend dependencies are missing. Run .\scripts\setup-local.ps1 first."
}

Set-Location $projectRoot
npm run dev
