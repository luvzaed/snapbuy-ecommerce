param([switch]$SetupOnly)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$pgBin = 'C:\Program Files\PostgreSQL\18\bin'
$data = Join-Path $PSScriptRoot '.local\postgres'
$settingsFile = Join-Path $PSScriptRoot '.local\settings.json'
if (-not (Test-Path "$pgBin\pg_ctl.exe")) { throw 'PostgreSQL 18 is required.' }
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
$savedErrorPreference = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
& "$pgBin\pg_ctl.exe" -D $data status *> $null
$databaseStatus = $LASTEXITCODE
$ErrorActionPreference = $savedErrorPreference
if ($databaseStatus -ne 0) {
    $log = Join-Path $PSScriptRoot '.local\postgres.log'
    $startOutput = Join-Path $PSScriptRoot '.local\postgres-start.log'
    $startError = Join-Path $PSScriptRoot '.local\postgres-start-error.log'
    Write-Host 'Starting PostgreSQL (maximum 30 seconds)...'
    # Start-Process -Wait also waits for the persistent postgres child server.
    # Wait only for pg_ctl itself, which exits once the server is ready.
    $start = Start-Process -FilePath "$pgBin\pg_ctl.exe" -ArgumentList @('-D', ('"' + $data + '"'), '-l', ('"' + $log + '"'), '-t', '20', '-w', 'start') -WindowStyle Hidden -PassThru -RedirectStandardOutput $startOutput -RedirectStandardError $startError
    if (-not $start.WaitForExit(30000)) {
        throw 'The PostgreSQL startup helper did not finish within 30 seconds. No data was deleted. Check .local\postgres.log before trying again.'
    }
    $start.Refresh()
    if ($start.ExitCode -ne 0) {
        Get-Content -LiteralPath $startOutput, $startError -ErrorAction SilentlyContinue | Write-Host
        throw "PostgreSQL could not start. See .local\postgres-start-error.log and .local\postgres.log."
    }
}
Write-Host 'PostgreSQL is running. Preparing application tables...'
& node 'scripts\setup-local-db.mjs'
if ($LASTEXITCODE -ne 0) { throw 'Local database setup failed.' }
if ($SetupOnly) { return }
$env:DATABASE_URL = "postgresql://snapbuy_app:$($settings.appPassword)@127.0.0.1:55432/snapbuy_local?schema=public"
$env:JWT_SECRET = $settings.jwtSecret
$env:VISUAL_SEARCH_URL = 'http://127.0.0.1:8000'
$env:VISUAL_SEARCH_REINDEX_TOKEN = $settings.reindexToken
$env:VISUAL_SEARCH_BIND_HOST = '127.0.0.1'
Write-Host 'Snapbuy will be available at http://localhost:3000. Keep this window open; Ctrl+C stops the website.'
Write-Host 'Login instructions are saved in .local\LOGIN.txt.'
& node 'node_modules\next\dist\bin\next' dev --hostname 127.0.0.1 --port 3000
if ($LASTEXITCODE -ne 0) { throw 'The website server stopped with an error.' }
