param([Parameter(Mandatory = $true)][string]$Path)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { throw 'The export CSV file was not found.' }
$exportFile = (Resolve-Path -LiteralPath $Path).Path
& (Join-Path $PSScriptRoot 'Start-Snapbuy.ps1') -SetupOnly
& node 'scripts\import-supabase.mjs' --file $exportFile
if ($LASTEXITCODE -ne 0) { throw 'File import stopped. Read the error above.' }
Write-Host 'Import complete. Run npm run dev to start Snapbuy.'
