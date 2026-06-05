# PowerShell script to build frontend and copy to backend static folder
# Usage: Run in PowerShell from repository root or via script path.

$ErrorActionPreference = 'Stop'

# Resolve directories
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Resolve-Path (Join-Path $scriptDir '..')
$frontendDir = Join-Path $rootDir 'frontend'
$backendStaticDir = Join-Path $rootDir 'backend\src\main\resources\static'

# Check npm availability
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm not found. Install Node.js/npm or run this script in an environment with npm available."
    exit 1
}

# Build frontend
Push-Location $frontendDir
npm run build
Pop-Location

# Replace backend static directory with frontend build
if (Test-Path $backendStaticDir) {
    Remove-Item $backendStaticDir -Recurse -Force
}
New-Item -ItemType Directory -Path $backendStaticDir -Force | Out-Null

# Copy dist contents into backend static
$distPath = Join-Path $frontendDir 'dist\*'
Copy-Item $distPath $backendStaticDir -Recurse -Force

Write-Host "Frontend built and copied to $backendStaticDir"