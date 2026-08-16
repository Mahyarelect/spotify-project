param(
    [switch]$SkipMusic,
    [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$venvPython = Join-Path $projectRoot ".venv\Scripts\python.exe"
$backendEnv = Join-Path $projectRoot "backend\.env"
$backendEnvExample = Join-Path $projectRoot "backend\.env.example"
$samplesDirectory = Join-Path $projectRoot "backend\music_samples"
$sampleMarker = Join-Path $samplesDirectory "Carefree.mp3"
$sampleCommit = "1b1628b"

Set-Location $projectRoot

foreach ($command in @("docker", "git", "node", "npm", "py")) {
    if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
        throw "Required command '$command' was not found in PATH."
    }
}

Write-Host "Starting local PostgreSQL and Redis..."
docker compose -p spotify-local -f compose.yaml -f compose.local.yaml up -d database redis

if (-not (Test-Path $venvPython)) {
    Write-Host "Creating Python 3.12 virtual environment..."
    py -3.12 -m venv .venv
}

if (-not $SkipInstall) {
    Write-Host "Installing backend and frontend dependencies..."
    & $venvPython -m pip install --upgrade pip
    & $venvPython -m pip install -r backend\requirements.txt
    npm ci
}

if (-not (Test-Path $backendEnv)) {
    Copy-Item -LiteralPath $backendEnvExample -Destination $backendEnv
    Write-Host "Created backend\.env from backend\.env.example."
}

if (-not $SkipMusic -and -not (Test-Path $sampleMarker)) {
    Write-Host "Restoring the repository's sample MP3 files from Git history..."
    $archive = Join-Path ([System.IO.Path]::GetTempPath()) "spotify-music-samples-$PID.zip"
    try {
        git cat-file -e "$sampleCommit^{commit}"
        git archive --format=zip --output=$archive $sampleCommit backend/music_samples
        Expand-Archive -LiteralPath $archive -DestinationPath $projectRoot -Force
    }
    finally {
        if (Test-Path $archive) {
            Remove-Item -LiteralPath $archive -Force
        }
    }
}

Write-Host "Waiting for PostgreSQL..."
$databaseReady = $false
for ($attempt = 1; $attempt -le 30; $attempt++) {
    docker compose -p spotify-local -f compose.yaml -f compose.local.yaml exec -T database pg_isready -U spotify -d spotify | Out-Null
    if ($LASTEXITCODE -eq 0) {
        $databaseReady = $true
        break
    }
    Start-Sleep -Seconds 1
}
if (-not $databaseReady) {
    throw "PostgreSQL did not become ready. Run docker compose logs database."
}

Write-Host "Applying migrations and seeding development data..."
& $venvPython backend\manage.py migrate
& $venvPython backend\manage.py seed_demo_data
if (-not $SkipMusic) {
    & $venvPython backend\manage.py seed_music
}
& $venvPython backend\manage.py check

Write-Host ""
Write-Host "Local setup is ready. Start two terminals:"
Write-Host "  .\scripts\run-local-backend.ps1"
Write-Host "  .\scripts\run-local-frontend.ps1"
Write-Host "Then open http://localhost:5173"
