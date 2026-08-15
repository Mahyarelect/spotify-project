$ErrorActionPreference = "Stop"

# One-click launcher for spotify-project on Windows.
# Put this file in the ROOT of the cloned repository, next to package.json.

$Root = $PSScriptRoot
$Backend = Join-Path $Root "backend"
$Venv = Join-Path $Root ".venv"
$VenvPython = Join-Path $Venv "Scripts\python.exe"
$StateDir = Join-Path $Root ".launcher-state"

$DbContainer = "spotify-postgres"
$DbPort = 5433
$BackendPort = 9000
$FrontendPort = 5173

function Write-Step($Message) {
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Require-Command($Name, $HelpText) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        Write-Host ""
        Write-Host "ERROR: '$Name' was not found." -ForegroundColor Red
        Write-Host $HelpText -ForegroundColor Yellow
        exit 1
    }
}

function Test-TcpPort($Port) {
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $result = $client.BeginConnect("127.0.0.1", $Port, $null, $null)
        $ok = $result.AsyncWaitHandle.WaitOne(250)
        if ($ok -and $client.Connected) {
            $client.EndConnect($result)
            $client.Close()
            return $true
        }
        $client.Close()
        return $false
    }
    catch {
        return $false
    }
}

function Ensure-Docker {
    Require-Command "docker" "Install/start Docker Desktop first."

    try {
        docker info *> $null
        return
    }
    catch {
        $dockerDesktop = Join-Path $env:ProgramFiles "Docker\Docker\Docker Desktop.exe"
        if (Test-Path $dockerDesktop) {
            Write-Step "Starting Docker Desktop"
            Start-Process $dockerDesktop | Out-Null

            for ($i = 0; $i -lt 60; $i++) {
                Start-Sleep -Seconds 2
                try {
                    docker info *> $null
                    Write-Host "Docker Desktop is ready." -ForegroundColor Green
                    return
                }
                catch {}
            }
        }

        Write-Host ""
        Write-Host "ERROR: Docker Desktop is installed but the Docker engine is not available." -ForegroundColor Red
        Write-Host "Start Docker Desktop, then run this launcher again." -ForegroundColor Yellow
        exit 1
    }
}

function Ensure-Postgres {
    Write-Step "Checking PostgreSQL Docker container"

    $exists = docker container inspect $DbContainer 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Creating $DbContainer on localhost:$DbPort ..."
        docker run --name $DbContainer `
            -e POSTGRES_DB=spotify `
            -e POSTGRES_USER=spotify `
            -e POSTGRES_PASSWORD=spotify `
            -p "${DbPort}:5432" `
            -v spotify_pgdata:/var/lib/postgresql/data `
            -d postgres:16

        if ($LASTEXITCODE -ne 0) {
            throw "Could not create the PostgreSQL container."
        }
    }
    else {
        $running = docker inspect -f "{{.State.Running}}" $DbContainer
        if ($running -ne "true") {
            Write-Host "Starting existing $DbContainer ..."
            docker start $DbContainer | Out-Null
        }
        else {
            Write-Host "$DbContainer is already running." -ForegroundColor Green
        }
    }

    Write-Host "Checking PostgreSQL readiness..."
    for ($i = 0; $i -lt 30; $i++) {
        docker exec $DbContainer pg_isready -U spotify -d spotify *> $null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "PostgreSQL is ready on localhost:$DbPort." -ForegroundColor Green
            return
        }
        Start-Sleep -Seconds 1
    }

    throw "PostgreSQL did not become ready."
}

function Ensure-BackendEnv {
    $example = Join-Path $Backend ".env.example"
    $envFile = Join-Path $Backend ".env"

    if (-not (Test-Path $envFile)) {
        Write-Step "Creating backend .env"
        Copy-Item $example $envFile
    }

    # This machine already uses 5432 for the Odoo PostgreSQL container.
    # Ensure the Spotify project connects to its own container on 5433.
    $content = Get-Content $envFile -Raw
    $updated = $content.Replace(
        "postgresql://spotify:spotify@localhost:5432/spotify",
        "postgresql://spotify:spotify@localhost:5433/spotify"
    )
    if ($updated -ne $content) {
        Set-Content -Path $envFile -Value $updated -Encoding UTF8
        Write-Host "Updated backend DATABASE_URL to localhost:5433." -ForegroundColor Green
    }
}

function Ensure-FrontendConfig {
    $example = Join-Path $Root ".env.example"
    $localEnv = Join-Path $Root ".env.local"

    if ((Test-Path $example) -and (-not (Test-Path $localEnv))) {
        Write-Step "Creating frontend .env.local"
        Copy-Item $example $localEnv
    }

    # Ports 7969-8068 are excluded on this Windows machine, so Django uses 9000.
    $viteConfig = Join-Path $Root "vite.config.ts"
    if (Test-Path $viteConfig) {
        $content = Get-Content $viteConfig -Raw
        $updated = $content.Replace("http://127.0.0.1:8000", "http://127.0.0.1:9000")
        if ($updated -ne $content) {
            Set-Content -Path $viteConfig -Value $updated -Encoding UTF8
            Write-Host "Updated Vite API proxy to Django port 9000." -ForegroundColor Green
        }
    }
}

function Ensure-PythonDependencies {
    Require-Command "python" "Install Python 3.12 and make sure 'python' is on PATH."

    if (-not (Test-Path $VenvPython)) {
        Write-Step "Creating Python virtual environment"
        & python -m venv $Venv
        if ($LASTEXITCODE -ne 0) {
            throw "Could not create the Python virtual environment."
        }

        & $VenvPython -m pip install --upgrade pip
        if ($LASTEXITCODE -ne 0) {
            throw "Could not upgrade pip."
        }
    }

    New-Item -ItemType Directory -Force -Path $StateDir | Out-Null

    $requirements = Join-Path $Backend "requirements.txt"
    $hashFile = Join-Path $StateDir "requirements.sha256"
    $currentHash = (Get-FileHash $requirements -Algorithm SHA256).Hash
    $savedHash = if (Test-Path $hashFile) { (Get-Content $hashFile -Raw).Trim() } else { "" }

    if (($currentHash -ne $savedHash) -or -not (Test-Path (Join-Path $Venv "Lib\site-packages\django"))) {
        Write-Step "Installing/updating Python dependencies"
        & $VenvPython -m pip install -r $requirements
        if ($LASTEXITCODE -ne 0) {
            throw "Python dependency installation failed."
        }
        Set-Content $hashFile $currentHash
    }
    else {
        Write-Host "Python dependencies are already installed." -ForegroundColor Green
    }
}

function Ensure-NodeDependencies {
    Require-Command "node" "Install Node.js 22+ and make sure 'node' is on PATH."
    Require-Command "npm" "Install npm and make sure 'npm' is on PATH."

    New-Item -ItemType Directory -Force -Path $StateDir | Out-Null

    $lockFile = Join-Path $Root "package-lock.json"
    $hashFile = Join-Path $StateDir "package-lock.sha256"
    $nodeModules = Join-Path $Root "node_modules"
    $currentHash = (Get-FileHash $lockFile -Algorithm SHA256).Hash
    $savedHash = if (Test-Path $hashFile) { (Get-Content $hashFile -Raw).Trim() } else { "" }

    if ((-not (Test-Path $nodeModules)) -or ($currentHash -ne $savedHash)) {
        Write-Step "Installing/updating frontend dependencies"
        Push-Location $Root
        try {
            & npm ci
            if ($LASTEXITCODE -ne 0) {
                throw "npm ci failed."
            }
        }
        finally {
            Pop-Location
        }
        Set-Content $hashFile $currentHash
    }
    else {
        Write-Host "Frontend dependencies are already installed." -ForegroundColor Green
    }
}

function Prepare-Django {
    Write-Step "Running Django migrations"
    Push-Location $Backend
    try {
        & $VenvPython manage.py migrate
        if ($LASTEXITCODE -ne 0) {
            throw "Django migrations failed."
        }

        Write-Step "Ensuring demo users exist"
        & $VenvPython manage.py seed_demo_data
        if ($LASTEXITCODE -ne 0) {
            throw "seed_demo_data failed."
        }

        $musicSamples = Join-Path $Backend "music_samples"
        $musicMarker = Join-Path $StateDir "music-seeded.txt"
        if ((Test-Path $musicSamples) -and (-not (Test-Path $musicMarker))) {
            $mp3Count = @(Get-ChildItem $musicSamples -Filter "*.mp3" -File -ErrorAction SilentlyContinue).Count
            if ($mp3Count -gt 0) {
                Write-Step "Seeding sample music"
                & $VenvPython manage.py seed_music
                if ($LASTEXITCODE -eq 0) {
                    Set-Content $musicMarker "seeded"
                }
                else {
                    Write-Host "Music seeding failed; continuing without it." -ForegroundColor Yellow
                }
            }
        }
    }
    finally {
        Pop-Location
    }
}

function Start-Services {
    Write-Step "Starting development servers"

    if (Test-TcpPort $BackendPort) {
        Write-Host "Django already appears to be running on port $BackendPort." -ForegroundColor Green
    }
    else {
        $backendCommand = "Set-Location '$Backend'; & '$VenvPython' manage.py runserver 127.0.0.1:$BackendPort"
        Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", $backendCommand
        Write-Host "Started Django at http://127.0.0.1:$BackendPort/" -ForegroundColor Green
    }

    if (Test-TcpPort $FrontendPort) {
        Write-Host "Vite already appears to be running on port $FrontendPort." -ForegroundColor Green
    }
    else {
        $frontendCommand = "Set-Location '$Root'; npm run dev"
        Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", $frontendCommand
        Write-Host "Started Vite at http://localhost:$FrontendPort/" -ForegroundColor Green
    }

    Start-Sleep -Seconds 3
    Start-Process "http://localhost:$FrontendPort/"
}

try {
    if (-not (Test-Path (Join-Path $Root "package.json")) -or -not (Test-Path (Join-Path $Backend "manage.py"))) {
        throw "Put this launcher in the ROOT of spotify-project (next to package.json)."
    }

    Write-Host "Spotify Project - One Click Launcher" -ForegroundColor Green
    Write-Host "Project: $Root"

    Ensure-Docker
    Ensure-Postgres
    Ensure-BackendEnv
    Ensure-FrontendConfig
    Ensure-PythonDependencies
    Ensure-NodeDependencies
    Prepare-Django
    Start-Services

    Write-Host ""
    Write-Host "Project startup complete." -ForegroundColor Green
    Write-Host "Frontend : http://localhost:$FrontendPort/"
    Write-Host "Backend  : http://127.0.0.1:$BackendPort/"
    Write-Host "Postgres : localhost:$DbPort"
    Write-Host ""
    Write-Host "You can close this launcher window. The backend/frontend run in their own PowerShell windows."
}
catch {
    Write-Host ""
    Write-Host "STARTUP FAILED" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to close"
    exit 1
}
