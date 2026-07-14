# Creates EcoSphere PostgreSQL role + database, then runs migrate/seed.
# Usage: .\scripts\setup-db.ps1 -PostgresPassword "YOUR_POSTGRES_PASSWORD"

param(
  [Parameter(Mandatory = $true)]
  [string]$PostgresPassword
)

$ErrorActionPreference = 'Stop'
$psql = 'C:\Program Files\PostgreSQL\17\bin\psql.exe'
$createdb = 'C:\Program Files\PostgreSQL\17\bin\createdb.exe'
$root = Split-Path $PSScriptRoot -Parent

if (-not (Test-Path $psql)) {
  throw 'PostgreSQL 17 not found. Install it first or update the path in this script.'
}

$env:PGPASSWORD = $PostgresPassword

Write-Host 'Creating ecosphere role...'
& $psql -U postgres -h localhost -d postgres -v ON_ERROR_STOP=1 -c @"
DO `$`$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'ecosphere') THEN
    CREATE ROLE ecosphere LOGIN PASSWORD 'ecosphere_secret';
  END IF;
END `$`$;
"@

$dbExists = & $psql -U postgres -h localhost -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = 'ecosphere'"
if ($dbExists.Trim() -ne '1') {
  Write-Host 'Creating ecosphere database...'
  & $createdb -U postgres -h localhost -O ecosphere ecosphere
}

Write-Host 'Running migrations and seed...'
Push-Location $root
pnpm db:migrate
pnpm db:seed
Pop-Location

Write-Host 'Done. Start backend: pnpm dev:api'
Write-Host 'Login: employee@greentech.io / Password123!'
