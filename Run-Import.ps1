param([switch]$ImportOnly)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
New-Item -ItemType Directory -Path '.local' -Force | Out-Null
$transcript = Join-Path $PSScriptRoot '.local\setup-output.log'
Start-Transcript -LiteralPath $transcript -Append | Out-Null
$failed = $false
try {
    Write-Host 'Step 1 of 3: Starting local PostgreSQL and preparing tables...'
    & (Join-Path $PSScriptRoot 'Start-Snapbuy.ps1') -SetupOnly
    # Child scripts can return a nonzero exit code without a terminating error.
    if ($LASTEXITCODE -ne 0) { throw 'Database setup stopped.' }
    Write-Host 'Step 2 of 3: Reading Supabase and verifying imported records...'
    Write-Host 'Using Windows trusted certificates; TLS certificate checks remain enabled.'
    $savedExtraCA = $env:NODE_EXTRA_CA_CERTS
    try {
        $certificateFile = Join-Path $PSScriptRoot '.local\supabase-ca.crt'
        if (Test-Path -LiteralPath $certificateFile) {
            Write-Host 'Also using the Supabase CA certificate from .local\supabase-ca.crt.'
            $env:NODE_EXTRA_CA_CERTS = $certificateFile
        }
        & node --use-system-ca 'scripts\import-supabase.mjs'
        $importExit = $LASTEXITCODE
    } finally {
        $env:NODE_EXTRA_CA_CERTS = $savedExtraCA
    }
    if ($importExit -ne 0) { throw 'The Supabase import stopped. Read the message above.' }
    if ($ImportOnly) {
        Write-Host 'Import finished. Run npm run dev to start Snapbuy.'
    } else {
        Write-Host 'Step 3 of 3: Starting Snapbuy at http://localhost:3000 ...'
        & (Join-Path $PSScriptRoot 'Start-Snapbuy.ps1')
    }
} catch {
    $failed = $true
    Write-Host ''
    Write-Host ('Setup stopped: ' + $_.Exception.Message) -ForegroundColor Red
    Write-Host 'Codex can read the saved log in .local\setup-output.log.'
} finally {
    Stop-Transcript | Out-Null
}
if ($failed) { exit 1 }
