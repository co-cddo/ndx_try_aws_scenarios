# =============================================================================
# LocalGov IMS -- Container Entrypoint (15-step boot sequence)
#
# IIS starts FIRST with static /health files so ALB health checks pass
# immediately, then database setup, migrations, and seeding run in sequence.
#
# SQL injection safety note:
#   - DB_PASSWORD excludes single quotes via CDK excludeCharacters
#   - CloudFront domains are alphanumeric + dots (no special chars)
#   - GOV.UK Pay API key is alphanumeric
#   - REFERENCE_SALT is alphanumeric (generated secret)
#   - ADMIN_PASSWORD excludes single quotes via CDK excludeCharacters
# =============================================================================

$ErrorActionPreference = "Stop"

Write-Host "============================================="
Write-Host "  LocalGov IMS -- Container Boot Sequence"
Write-Host "============================================="

# =============================================================================
# Step 1/15: Read environment variables
# =============================================================================
Write-Host "=== Step 1/15: Reading environment variables ==="

$dbHost          = $env:DB_HOST
$dbPassword      = $env:DB_PASSWORD
$dbUser          = $env:DB_USER
$referenceSalt   = $env:REFERENCE_SALT
$govukpayApiKey  = $env:GOVUKPAY_API_KEY
$portalUrl       = $env:PORTAL_URL
$adminUrl        = $env:ADMIN_URL
$govukpayUrl     = $env:GOVUKPAY_URL
$adminPassword   = $env:ADMIN_PASSWORD

# Validate required env vars
$requiredVars = @{
    'DB_HOST'          = $dbHost
    'DB_PASSWORD'      = $dbPassword
    'DB_USER'          = $dbUser
    'REFERENCE_SALT'   = $referenceSalt
    'GOVUKPAY_API_KEY' = $govukpayApiKey
    'PORTAL_URL'       = $portalUrl
    'ADMIN_URL'        = $adminUrl
    'GOVUKPAY_URL'     = $govukpayUrl
    'ADMIN_PASSWORD'   = $adminPassword
}

foreach ($var in $requiredVars.GetEnumerator()) {
    if ([string]::IsNullOrWhiteSpace($var.Value)) {
        Write-Error "Required environment variable $($var.Key) is not set"
        exit 1
    }
}
Write-Host "All required environment variables present"

# =============================================================================
# Step 2/15: Start IIS immediately (health checks pass from boot)
# =============================================================================
Write-Host "=== Step 2/15: Starting IIS with health check endpoints ==="
& C:\iis-config.ps1
Start-Service W3SVC
Write-Host "IIS started -- ALB health checks will now pass"

# =============================================================================
# Step 3/15: Wait for SQL Server connectivity
# =============================================================================
Write-Host "=== Step 3/15: Waiting for SQL Server at $dbHost ==="
$maxRetries = 60
for ($i = 1; $i -le $maxRetries; $i++) {
    $result = Test-NetConnection -ComputerName $dbHost -Port 1433 -WarningAction SilentlyContinue
    if ($result.TcpTestSucceeded) {
        Write-Host "SQL Server is reachable (attempt $i)"
        break
    }
    if ($i -eq $maxRetries) {
        Write-Error "SQL Server not reachable after $maxRetries attempts (5 min)"
        exit 1
    }
    Write-Host "Waiting for SQL Server (attempt $i/$maxRetries)..."
    Start-Sleep -Seconds 5
}

# Common sqlcmd args -- all calls use -b (batch abort on error)
$sqlcmdBase = @('-S', $dbHost, '-U', $dbUser, '-P', $dbPassword, '-b')

# =============================================================================
# Step 4/15: Create databases
# =============================================================================
Write-Host "=== Step 4/15: Creating databases ==="

& sqlcmd @sqlcmdBase -Q "IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'IncomeManagement') CREATE DATABASE IncomeManagement"
if ($LASTEXITCODE -ne 0) { Write-Error "Failed to create IncomeManagement database"; exit 1 }
Write-Host "IncomeManagement database ready"

& sqlcmd @sqlcmdBase -Q "IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'IncomeManagement_GovUkPayIntegration') CREATE DATABASE IncomeManagement_GovUkPayIntegration"
if ($LASTEXITCODE -ne 0) { Write-Error "Failed to create GovUkPay database"; exit 1 }
Write-Host "IncomeManagement_GovUkPayIntegration database ready"

# =============================================================================
# Step 5/15: Patch Web.config files (Portal, Admin, API)
# =============================================================================
Write-Host "=== Step 5/15: Patching Web.config files ==="

$connectionString = "Server=$dbHost;Database=IncomeManagement;User Id=$dbUser;Password=$dbPassword;TrustServerCertificate=True"

foreach ($app in @('portal', 'admin', 'api')) {
    $webConfig = "C:\inetpub\$app\Web.config"
    if (Test-Path $webConfig) {
        [xml]$doc = Get-Content $webConfig

        # Update IncomeDb connection string
        $connNode = $doc.configuration.connectionStrings.add | Where-Object { $_.name -eq 'IncomeDb' }
        if ($connNode) {
            $connNode.connectionString = $connectionString
            Write-Host "  [$app] Updated IncomeDb connection string"
        } else {
            Write-Host "  [$app] WARNING: IncomeDb connection string not found"
        }

        # Update appSettings
        $appSettings = $doc.configuration.appSettings.add
        if ($appSettings) {
            foreach ($setting in $appSettings) {
                switch ($setting.key) {
                    'ReferenceSalt'     { $setting.value = $referenceSalt; Write-Host "  [$app] Set ReferenceSalt" }
                    'Environment'       { $setting.value = 'Demo'; Write-Host "  [$app] Set Environment=Demo" }
                    'PortalPaymentsURL' { $setting.value = $portalUrl; Write-Host "  [$app] Set PortalPaymentsURL=$portalUrl" }
                }
            }
        }

        $doc.Save($webConfig)
        Write-Host "  [$app] Web.config saved"
    } else {
        Write-Host "  [$app] WARNING: Web.config not found at $webConfig"
    }
}

# =============================================================================
# Step 6/15: Patch GOV.UK Pay appsettings.json
# =============================================================================
Write-Host "=== Step 6/15: Patching GOV.UK Pay appsettings.json ==="

$govukpayConfig = "C:\govukpay\appsettings.json"
if (Test-Path $govukpayConfig) {
    $config = Get-Content $govukpayConfig -Raw | ConvertFrom-Json

    # Set database connection string
    if (-not $config.ConnectionStrings) {
        $config | Add-Member -NotePropertyName 'ConnectionStrings' -NotePropertyValue ([PSCustomObject]@{})
    }
    $config.ConnectionStrings.ImsGovUkPayDatabase = "Server=$dbHost;Database=IncomeManagement_GovUkPayIntegration;User Id=$dbUser;Password=$dbPassword;TrustServerCertificate=True"

    # Set API and portal URLs
    $config.LocalGovImsApiUrl = "http://localhost:82"
    $config.PaymentPortalUrl = $portalUrl

    $config | ConvertTo-Json -Depth 10 | Set-Content $govukpayConfig
    Write-Host "Patched $govukpayConfig"
    Write-Host "  LocalGovImsApiUrl = http://localhost:82"
    Write-Host "  PaymentPortalUrl  = $portalUrl"
} else {
    Write-Host "WARNING: $govukpayConfig not found"
}

# =============================================================================
# Step 7/15: Recycle IIS app pools to pick up patched configs
# =============================================================================
Write-Host "=== Step 7/15: Recycling IIS app pools ==="

$appcmd = "$env:windir\system32\inetsrv\appcmd.exe"
foreach ($pool in @('IMSPortal', 'IMSAdmin', 'IMSApi')) {
    & $appcmd recycle apppool /apppool.name:$pool
    Write-Host "  Recycled $pool"
}

# =============================================================================
# Step 8/15: Trigger EF6 migration via polling loop
# EF6 MigrateDatabaseToLatestVersion runs automatically on first HTTP request.
# Cold JIT + 28 migrations may take 2-5 minutes.
# =============================================================================
Write-Host "=== Step 8/15: Running EF6 migrations (polling Portal) ==="

$migrationComplete = $false
for ($i = 1; $i -le 40; $i++) {
    try {
        $r = Invoke-WebRequest -Uri http://localhost:80/ -UseBasicParsing -TimeoutSec 30
        if ($r.StatusCode -eq 200) {
            Write-Host "EF6 migration complete (attempt $i)"
            $migrationComplete = $true
            break
        }
    } catch {
        $msg = $_.Exception.Message
        # Truncate long error messages for cleaner CloudWatch logs
        if ($msg.Length -gt 200) { $msg = $msg.Substring(0, 200) + "..." }
        Write-Host "Migration attempt $i/40: $msg"
    }
    Start-Sleep -Seconds 15
}
if (-not $migrationComplete) {
    Write-Error "EF6 migration failed after 10 minutes (40 attempts x 15s)"
    exit 1
}

# =============================================================================
# Step 9/15: Check idempotency marker
# If _SeedComplete table exists, skip seeding (steps 10-12)
# =============================================================================
Write-Host "=== Step 9/15: Checking seed marker ==="

$markerResult = & sqlcmd @sqlcmdBase -d IncomeManagement -Q "SET NOCOUNT ON; SELECT 1 FROM sys.tables WHERE name='_SeedComplete'" -h -1 -W
$alreadySeeded = $markerResult -match "1"

if (-not $alreadySeeded) {
    # =========================================================================
    # Step 10/15: Run custom seed SQL
    # =========================================================================
    Write-Host "=== Step 10/15: Running seed data SQL ==="

    & sqlcmd @sqlcmdBase -d IncomeManagement -i C:\seed-data.sql -v GOVUKPAY_API_KEY="$govukpayApiKey"
    if ($LASTEXITCODE -ne 0) { Write-Error "Seed SQL failed"; exit 1 }
    Write-Host "Seed data loaded successfully"

    # Create idempotency marker
    & sqlcmd @sqlcmdBase -d IncomeManagement -Q "CREATE TABLE dbo._SeedComplete (SeededAt DATETIME DEFAULT GETDATE()); INSERT INTO _SeedComplete DEFAULT VALUES"
    if ($LASTEXITCODE -ne 0) { Write-Error "Failed to create seed marker"; exit 1 }
    Write-Host "Seed marker created"

    # =========================================================================
    # Step 11/15: Update PaymentIntegrations with CloudFront URL
    # DemoData.sql may have created one or more PaymentIntegration rows --
    # update all of them to point at the GOV.UK Pay CloudFront distribution.
    # =========================================================================
    Write-Host "=== Step 11/15: Configuring payment integration URLs ==="

    & sqlcmd @sqlcmdBase -d IncomeManagement -Q "UPDATE PaymentIntegrations SET BaseUri='$govukpayUrl'"
    if ($LASTEXITCODE -ne 0) { Write-Error "Failed to update PaymentIntegrations"; exit 1 }
    Write-Host "Set PaymentIntegrations.BaseUri = $govukpayUrl"

    # =========================================================================
    # Step 12/15: Hash and set admin password
    # hash-password.exe reads from stdin (not CLI arg) to avoid process listing
    # exposure. Sets the same password for ALL seeded ASP.NET Identity users.
    # =========================================================================
    Write-Host "=== Step 12/15: Setting admin password ==="

    $hash = $adminPassword | & C:\tools\hash-password.exe
    if ($LASTEXITCODE -ne 0) { Write-Error "hash-password.exe failed"; exit 1 }

    & sqlcmd @sqlcmdBase -d IncomeManagement -Q "UPDATE AspNetUsers SET PasswordHash='$hash'"
    if ($LASTEXITCODE -ne 0) { Write-Error "Failed to set admin password"; exit 1 }
    Write-Host "Admin password set for all users"

} else {
    Write-Host "Seed data already exists -- skipping steps 10-12"
}

# =============================================================================
# Step 13/15: Run GOV.UK Pay EF Core migrations
# =============================================================================
Write-Host "=== Step 13/15: Running GOV.UK Pay EF Core migrations ==="

$govukpayConnStr = "Server=$dbHost;Database=IncomeManagement_GovUkPayIntegration;User Id=$dbUser;Password=$dbPassword;TrustServerCertificate=True"
& C:\dotnet6\dotnet.exe C:\efmigrate\efmigrate.dll "--connection=$govukpayConnStr"
if ($LASTEXITCODE -ne 0) { Write-Error "GOV.UK Pay EF Core migrations failed"; exit 1 }
Write-Host "GOV.UK Pay EF Core migrations complete"

# =============================================================================
# Step 14/15: Start Kestrel for GOV.UK Pay in background restart loop
# Uses Start-Process -NoNewWindow (NOT Start-Job) so output reaches container
# stdout and appears in CloudWatch. [Kestrel] prefix for log filtering.
# =============================================================================
Write-Host "=== Step 14/15: Starting GOV.UK Pay Kestrel on port 83 ==="

Start-Process powershell -NoNewWindow -ArgumentList '-File', 'C:\start-kestrel.ps1'

Write-Host "Kestrel background process launched"

# =============================================================================
# Step 15/15: Keep container alive via ServiceMonitor
# ServiceMonitor watches the W3SVC (IIS) service. If IIS stops, the container
# exits and ECS replaces it.
# =============================================================================
Write-Host "=== Step 15/15: Starting ServiceMonitor ==="
Write-Host "============================================="
Write-Host "  LocalGov IMS is ready!"
Write-Host "  Portal: http://localhost:80"
Write-Host "  Admin:  http://localhost:81"
Write-Host "  API:    http://localhost:82"
Write-Host "  Pay:    http://localhost:83"
Write-Host "============================================="

& C:\ServiceMonitor.exe w3svc
