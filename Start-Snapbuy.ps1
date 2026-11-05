param([switch]$SetupOnly)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$pgBin = 'C:\Program Files\PostgreSQL\18\bin'
$data = Join-Path $PSScriptRoot '.local\postgres'
$settingsFile = Join-Path $PSScriptRoot '.local\settings.json'
if (-not (Test-Path "$pgBin\pg_ctl.exe") -or -not (Test-Path "$pgBin\pg_isready.exe")) { throw 'PostgreSQL 18 is required.' }
if (-not (Test-Path 'node_modules\prisma\build\index.js')) { throw 'Project dependencies are missing. Run npm ci while connected to the internet first.' }
New-Item -ItemType Directory -Path '.local' -Force | Out-Null
if (-not (Test-Path $settingsFile)) {
    if (Test-Path '.env') { throw 'An existing .env was found. Preserve it before setting up this separate offline copy.' }
    function New-LocalSecret {
        $bytes = New-Object byte[] 32
        $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
        try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
        return ([BitConverter]::ToString($bytes)).Replace('-', '').ToLowerInvariant()
    }
    $settings = @{
        port = 55432; database = 'snapbuy_local';
        ownerPassword = (New-LocalSecret); appPassword = (New-LocalSecret);
        jwtSecret = (New-LocalSecret); reindexToken = (New-LocalSecret);
        adminPassword = (New-LocalSecret)
    }
    [IO.File]::WriteAllText($settingsFile, ($settings | ConvertTo-Json))
}
$settings = Get-Content -Raw -LiteralPath $settingsFile | ConvertFrom-Json
Write-Host 'Checking local PostgreSQL...'
if (-not (Test-Path "$data\PG_VERSION")) {
    $pwFile = Join-Path $PSScriptRoot '.local\init-password.txt'
    [IO.File]::WriteAllText($pwFile, $settings.ownerPassword)
    try {
        & "$pgBin\initdb.exe" -D $data -U snapbuy_owner --auth=scram-sha-256 --encoding=UTF8 --locale=C "--pwfile=$pwFile"
        if ($LASTEXITCODE -ne 0) { throw 'Local database initialization failed. See the message above.' }
    } finally { if (Test-Path $pwFile) { Remove-Item -LiteralPath $pwFile } }
    Add-Content -LiteralPath "$data\postgresql.conf" -Value "`nlisten_addresses = '127.0.0.1'`nport = 55432`n"
}
if (-not (Test-Path "$data\global\pg_control")) { throw 'The local database initialization is incomplete. Do not overwrite it; contact Codex to inspect it.' }
function Get-LocalDatabaseReadiness {
    # Process visibility can make pg_ctl status report a live server as stopped.
    # Check loopback readiness; setup below authenticates using our settings.
    $savedErrorPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        & "$pgBin\pg_isready.exe" -h 127.0.0.1 -p $settings.port -U snapbuy_owner -d postgres -t 2 *> $null
        return $LASTEXITCODE
    } finally { $ErrorActionPreference = $savedErrorPreference }
}
$startupTimer = [Diagnostics.Stopwatch]::StartNew()
$databaseReadiness = Get-LocalDatabaseReadiness
if ($databaseReadiness -eq 3) { throw 'The local PostgreSQL connection check could not run. Check the PostgreSQL installation and local port settings.' }
if ($databaseReadiness -eq 2) {
    $log = Join-Path $PSScriptRoot '.local\postgres.log'
    $startOutput = Join-Path $PSScriptRoot '.local\postgres-start.log'
    $startError = Join-Path $PSScriptRoot '.local\postgres-start-error.log'
    Write-Host 'Starting PostgreSQL (maximum 30 seconds)...'
    # Wait only for pg_ctl, not the persistent postgres child server.
    $start = Start-Process -FilePath "$pgBin\pg_ctl.exe" -ArgumentList @('-D', ('"' + $data + '"'), '-l', ('"' + $log + '"'), '-t', '20', '-w', 'start') -WindowStyle Hidden -PassThru -RedirectStandardOutput $startOutput -RedirectStandardError $startError
    [void]$start.WaitForExit(30000)
} elseif ($databaseReadiness -eq 1) {
    Write-Host 'PostgreSQL is already starting or recovering. Waiting for it to accept connections...'
}
while ($databaseReadiness -ne 0 -and $startupTimer.Elapsed.TotalSeconds -lt 30) {
    $databaseReadiness = Get-LocalDatabaseReadiness
    if ($databaseReadiness -eq 3) { throw 'The local PostgreSQL connection check failed. Check the PostgreSQL installation and local port settings.' }
    if ($databaseReadiness -ne 0) { Start-Sleep -Milliseconds 500 }
}
# Verify the connection even if the startup helper reports an error or times out.
$databaseReadiness = Get-LocalDatabaseReadiness
if ($databaseReadiness -ne 0) {
    Get-Content -LiteralPath (Join-Path $PSScriptRoot '.local\postgres-start.log'), (Join-Path $PSScriptRoot '.local\postgres-start-error.log') -ErrorAction SilentlyContinue | Write-Host
    throw 'PostgreSQL is not accepting local connections after 30 seconds. See .local\postgres-start-error.log and .local\postgres.log.'
}
Write-Host 'PostgreSQL is running. Preparing application tables...'
& node 'scripts\setup-local-db.mjs'
if ($LASTEXITCODE -ne 0) { throw 'Local database setup failed.' }
if ($SetupOnly) { return }
# Next.js loads the preserved .env. Do not override customized settings here.
Write-Host 'Snapbuy will be available at http://127.0.0.1:3000. Keep this window open; Ctrl+C stops the website.'
Write-Host 'Login instructions are saved in .local\LOGIN.txt.'
& node 'node_modules\next\dist\bin\next' dev --hostname 127.0.0.1 --port 3000
if ($LASTEXITCODE -ne 0) { throw 'The website server stopped with an error.' }
