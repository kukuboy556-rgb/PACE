param(
  [string]$DbUrl = $env:DATABASE_URL,
  [string]$BackupDir = ".\backups"
)

if (-not $DbUrl) {
  Write-Error "DATABASE_URL not set"
  exit 1
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$filename = "pace_backup_$timestamp.sql"
$outFile = Join-Path $BackupDir $filename

if (-not (Test-Path $BackupDir)) {
  New-Item -ItemType Directory -Path $BackupDir -Force
}

$pgDump = Get-Command pg_dump -ErrorAction SilentlyContinue
if (-not $pgDump) {
  Write-Error "pg_dump not found. Install PostgreSQL tools."
  exit 1
}

pg_dump $DbUrl --no-owner --no-acl -f $outFile
if ($LASTEXITCODE -eq 0) {
  Write-Host "Backup saved: $outFile"
  $compressed = "$outFile.gz"
  if (Get-Command gzip -ErrorAction SilentlyContinue) {
    gzip -f $outFile
    Write-Host "Compressed: $compressed"
  }
} else {
  Write-Error "Backup failed"
  exit 1
}
