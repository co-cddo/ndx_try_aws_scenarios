# =============================================================================
# LocalGov IMS -- EC2 Setup Script
# =============================================================================
# Variables must be set before running this script:
#   $dbHost, $dbPassword, $dbUser, $referenceSalt, $adminPassword,
#   $govukPayApiKey, $portalUrl, $adminUrl, $govukpayUrl
# Seed data SQL must be at: C:\setup\seed-data.sql
# =============================================================================

$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$setupDir = "C:\setup"

Write-Host "============================================="
Write-Host "  LocalGov IMS -- EC2 Setup"
Write-Host "============================================="

# ADO.NET helper — go-sqlcmd has incompatible CLI syntax, so use .NET SqlClient directly
function Invoke-Sql($query, $db = 'master') {
    $conn = New-Object System.Data.SqlClient.SqlConnection("Server=$dbHost;Database=$db;User Id=$dbUser;Password=$dbPassword;TrustServerCertificate=True")
    $conn.Open()
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = $query
    $cmd.CommandTimeout = 120
    try { return $cmd.ExecuteNonQuery() } finally { $conn.Close() }
}

function Invoke-SqlScalar($query, $db = 'master') {
    $conn = New-Object System.Data.SqlClient.SqlConnection("Server=$dbHost;Database=$db;User Id=$dbUser;Password=$dbPassword;TrustServerCertificate=True")
    $conn.Open()
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = $query
    try { return $cmd.ExecuteScalar() } finally { $conn.Close() }
}

# =============================================================================
# Step 1/12: Install IIS + ASP.NET 4.8
# =============================================================================
Write-Host "=== Step 1/12: Installing IIS and ASP.NET ==="
Install-WindowsFeature Web-Server, Web-Asp-Net45, Web-ISAPI-Ext, Web-ISAPI-Filter, Web-Net-Ext45, Web-Mgmt-Console, NET-Framework-45-ASPNET -IncludeManagementTools
Write-Host "  IIS installed"

# =============================================================================
# Step 2/12: Download and install tools
# =============================================================================
Write-Host "=== Step 2/12: Installing build tools ==="

# NuGet CLI
Invoke-WebRequest "https://dist.nuget.org/win-x86-commandline/latest/nuget.exe" -OutFile "$setupDir\nuget.exe" -UseBasicParsing
Write-Host "  NuGet CLI downloaded"

# SqlServer PowerShell module (for Invoke-Sqlcmd — used for seed SQL with :setvar)
Install-PackageProvider -Name NuGet -MinimumVersion 2.8.5.201 -Force -ErrorAction SilentlyContinue
Install-Module SqlServer -Force -AllowClobber -ErrorAction SilentlyContinue
Write-Host "  SqlServer module installed"

# VS Build Tools 2022 (WebBuildTools + .NET 4.8.1 targeting pack)
Write-Host "  Installing VS Build Tools 2022 (this takes several minutes)..."
Invoke-WebRequest "https://aka.ms/vs/17/release/vs_buildtools.exe" -OutFile "$setupDir\vs_buildtools.exe" -UseBasicParsing
$proc = Start-Process "$setupDir\vs_buildtools.exe" -Wait -PassThru -ArgumentList `
    '--quiet', '--wait', '--norestart', '--nocache', `
    '--add', 'Microsoft.VisualStudio.Workload.WebBuildTools', `
    '--add', 'Microsoft.VisualStudio.Component.WebDeploy', `
    '--add', 'Microsoft.Net.Component.4.8.1.TargetingPack', `
    '--add', 'Microsoft.Net.Component.4.8.1.SDK'
if ($proc.ExitCode -ne 0 -and $proc.ExitCode -ne 3010) {
    Write-Error "VS Build Tools install failed (exit $($proc.ExitCode))"
    exit 1
}
Write-Host "  VS Build Tools installed"

$msbuild = "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\MSBuild\Current\Bin\MSBuild.exe"
if (-not (Test-Path $msbuild)) { Write-Error "MSBuild not found at $msbuild"; exit 1 }

# =============================================================================
# Step 3/12: Download source code
# =============================================================================
Write-Host "=== Step 3/12: Downloading source code ==="

Invoke-WebRequest "https://github.com/LocalGovIMS/localgov-ims/archive/refs/heads/main.zip" -OutFile "$setupDir\ims.zip" -UseBasicParsing
Expand-Archive "$setupDir\ims.zip" -DestinationPath "$setupDir" -Force
$imsDir = (Get-ChildItem "$setupDir\localgov-ims-*" -Directory)[0].FullName
Write-Host "  IMS source: $imsDir"

# =============================================================================
# Step 4/12: Build IMS (.NET Framework 4.8.1)
# =============================================================================
Write-Host "=== Step 4/12: Building IMS ==="

$sln = (Get-ChildItem $imsDir -Filter "*.sln" -Recurse)[0].FullName
$msbuildDir = "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\MSBuild\Current\Bin"
& "$setupDir\nuget.exe" restore $sln -MSBuildPath $msbuildDir
if ($LASTEXITCODE -ne 0) { Write-Error "NuGet restore failed"; exit 1 }

# Build entire solution — Configuration=Live maps to Release for class libs at solution level.
# Test projects may fail (assembly conflicts) but web apps build fine.
& $msbuild $sln /p:Configuration=Live /verbosity:minimal /m
$srcBase = Join-Path $imsDir "src"
foreach ($app in @('PaymentPortal', 'Admin', 'Api')) {
    $bin = Join-Path $srcBase "$app\bin"
    if (-not (Test-Path $bin) -or (Get-ChildItem "$bin\*.dll" -ErrorAction SilentlyContinue).Count -eq 0) {
        Write-Error "$app did not build (no DLLs in $bin)"; exit 1
    }
}
Write-Host "  Build complete (web apps verified)"

# =============================================================================
# Step 5/12: Deploy to IIS directories
# =============================================================================
Write-Host "=== Step 5/12: Deploying to IIS ==="

$srcBase = Join-Path $imsDir "src"
$apps = @{ portal = 'PaymentPortal'; admin = 'Admin'; api = 'Api' }

foreach ($entry in $apps.GetEnumerator()) {
    $src = Join-Path $srcBase $entry.Value
    $dest = "C:\inetpub\$($entry.Key)"
    New-Item -ItemType Directory -Force -Path $dest | Out-Null
    robocopy $src $dest /E /XD obj packages node_modules Properties .git /XF *.cs *.csproj *.csproj.user *.sln /NFL /NDL /NJH /NJS /NP
    if ($LASTEXITCODE -ge 8) { Write-Error "robocopy failed for $($entry.Value)"; exit 1 }
    Write-Host "  Deployed $($entry.Value) -> $dest"
}

# =============================================================================
# Step 6/12: Configure IIS -- 3 sites on ports 80/8081/8082
# =============================================================================
Write-Host "=== Step 6/12: Configuring IIS ==="

$appcmd = "$env:windir\system32\inetsrv\appcmd.exe"
& $appcmd delete site "Default Web Site" 2>$null

$sites = @(
    @{ Name = 'Portal'; Port = 80; Path = 'portal' }
    @{ Name = 'Admin';  Port = 8081; Path = 'admin' }
    @{ Name = 'Api';    Port = 8082; Path = 'api' }
)

foreach ($site in $sites) {
    $pool = "IMS$($site.Name)"
    $name = "IMS$($site.Name)"
    & $appcmd add apppool /name:$pool
    & $appcmd set apppool /apppool.name:$pool /managedRuntimeVersion:v4.0 /managedPipelineMode:Integrated /enable32BitAppOnWin64:false
    & $appcmd add site /name:$name /physicalPath:"C:\inetpub\$($site.Path)" /bindings:"http/*:$($site.Port):"
    if ($LASTEXITCODE -ne 0) { Write-Error "Failed to create site $name"; exit 1 }
    & $appcmd set app "$name/" /applicationPool:$pool
    Set-Content -Path "C:\inetpub\$($site.Path)\health" -Value "OK" -Force
    Write-Host "  $name on port $($site.Port)"
}

# MIME mapping for extensionless /health
& $appcmd set config /section:staticContent /+"[fileExtension='.',mimeType='text/plain']" 2>$null

# Uploads directory (required by IMS)
New-Item -ItemType Directory -Force -Path "C:\Uploads" | Out-Null

# Windows Firewall — allow ALB health checks on non-standard ports
New-NetFirewallRule -DisplayName "IMS Admin 8081" -Direction Inbound -LocalPort 8081 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "IMS Api 8082" -Direction Inbound -LocalPort 8082 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue

# Start IIS
Start-Service W3SVC -ErrorAction SilentlyContinue
Write-Host "  IIS started"

# =============================================================================
# Step 7/12: Patch Web.config files
# =============================================================================
Write-Host "=== Step 7/12: Patching Web.config ==="

$connStr = "Server=$dbHost;Database=IncomeManagement;User Id=$dbUser;Password=$dbPassword;TrustServerCertificate=True"

foreach ($app in @('portal', 'admin', 'api')) {
    $webConfig = "C:\inetpub\$app\Web.config"
    if (-not (Test-Path $webConfig)) { Write-Host "  WARNING: $webConfig not found"; continue }

    [xml]$doc = Get-Content $webConfig

    # IncomeDb connection string
    $node = $doc.configuration.connectionStrings.add | Where-Object { $_.name -eq 'IncomeDb' }
    if ($node) { $node.connectionString = $connStr }

    # DefaultConnection for ASP.NET Identity (Admin login requires this)
    $dc = $doc.configuration.connectionStrings.add | Where-Object { $_.name -eq 'DefaultConnection' }
    if (-not $dc) {
        $newConn = $doc.CreateElement('add')
        $newConn.SetAttribute('name', 'DefaultConnection')
        $newConn.SetAttribute('connectionString', $connStr)
        $newConn.SetAttribute('providerName', 'System.Data.SqlClient')
        $doc.configuration.connectionStrings.AppendChild($newConn) | Out-Null
    } else {
        $dc.connectionString = $connStr
    }

    # appSettings
    $settings = $doc.configuration.appSettings.add
    if ($settings) {
        foreach ($s in $settings) {
            switch ($s.key) {
                'ReferenceSalt'     { $s.value = $referenceSalt }
                'Environment'       { $s.value = 'Demo' }
                'PortalPaymentsURL' { $s.value = $portalUrl }
            }
        }
    }

    $doc.Save($webConfig)
    Write-Host "  Patched $app"
}

# Recycle app pools to pick up config changes
foreach ($pool in @('IMSPortal', 'IMSAdmin', 'IMSApi')) {
    & $appcmd recycle apppool /apppool.name:$pool 2>$null
}
Write-Host "  App pools recycled"

# =============================================================================
# Step 8/12: Wait for RDS + create database
# =============================================================================
Write-Host "=== Step 8/12: Waiting for RDS ==="

for ($i = 1; $i -le 60; $i++) {
    $r = Test-NetConnection -ComputerName $dbHost -Port 1433 -WarningAction SilentlyContinue
    if ($r.TcpTestSucceeded) { Write-Host "  RDS reachable (attempt $i)"; break }
    if ($i -eq 60) { Write-Error "RDS not reachable after 5 min"; exit 1 }
    Start-Sleep 5
}

Invoke-Sql "IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'IncomeManagement') CREATE DATABASE IncomeManagement"
Write-Host "  IncomeManagement DB ready"

# =============================================================================
# Step 9/12: Trigger EF6 migrations
# =============================================================================
Write-Host "=== Step 9/12: Running EF6 migrations ==="

& $appcmd recycle apppool /apppool.name:IMSPortal 2>$null

$migrated = $false
for ($i = 1; $i -le 40; $i++) {
    try {
        $r = Invoke-WebRequest -Uri http://localhost:80/ -UseBasicParsing -TimeoutSec 30
        if ($r.StatusCode -eq 200) {
            Write-Host "  Migration complete (attempt $i)"
            $migrated = $true
            break
        }
    } catch {
        $msg = $_.Exception.Message
        if ($msg.Length -gt 150) { $msg = $msg.Substring(0, 150) + "..." }
        Write-Host "  Attempt $i/40: $msg"
    }
    Start-Sleep 15
}
if (-not $migrated) { Write-Error "EF6 migration failed after 10 min"; exit 1 }

# =============================================================================
# Step 10/12: Seed data
# =============================================================================
Write-Host "=== Step 10/12: Seeding data ==="

$marker = Invoke-SqlScalar "SELECT 1 FROM sys.tables WHERE name='_SeedComplete'" 'IncomeManagement'
if ($marker -ne 1) {
    # Use Invoke-Sqlcmd for seed SQL (supports :setvar syntax)
    Invoke-Sqlcmd -ServerInstance $dbHost -Username $dbUser -Password $dbPassword -Database IncomeManagement -InputFile C:\setup\seed-data.sql -Variable "GOVUKPAY_API_KEY=$govukPayApiKey" -TrustServerCertificate
    Invoke-Sql "CREATE TABLE dbo._SeedComplete (SeededAt DATETIME DEFAULT GETDATE()); INSERT INTO _SeedComplete DEFAULT VALUES" 'IncomeManagement'
    Invoke-Sql "UPDATE PaymentIntegrations SET BaseUri='$govukpayUrl'" 'IncomeManagement'
    Write-Host "  Seed data loaded"
} else {
    Write-Host "  Already seeded, skipping"
}

# =============================================================================
# Step 11/12: Set admin password
# =============================================================================
Write-Host "=== Step 11/12: Setting admin password ==="

# ASP.NET Identity v2 password hasher (PBKDF2-HMACSHA1, 1000 iterations)
function New-IdentityPasswordHash($pw) {
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $salt = New-Object byte[] 16
    $rng.GetBytes($salt)
    $derived = (New-Object System.Security.Cryptography.Rfc2898DeriveBytes($pw, $salt, 1000)).GetBytes(32)
    $out = New-Object byte[] 49
    [Array]::Copy($salt, 0, $out, 1, 16)
    [Array]::Copy($derived, 0, $out, 17, 32)
    [Convert]::ToBase64String($out)
}

$hash = New-IdentityPasswordHash $adminPassword
Invoke-Sql "UPDATE AspNetUsers SET PasswordHash='$hash'" 'IncomeManagement'
Write-Host "  Admin password set"

# =============================================================================
# Step 12/12: Verify
# =============================================================================
Write-Host "=== Step 12/12: Verifying ==="
$funds = Invoke-SqlScalar "SELECT COUNT(*) FROM Funds WHERE Disabled = 0" 'IncomeManagement'
$accounts = Invoke-SqlScalar "SELECT COUNT(*) FROM AccountHolders" 'IncomeManagement'
$txns = Invoke-SqlScalar "SELECT COUNT(*) FROM ProcessedTransactions" 'IncomeManagement'
Write-Host "  Funds: $funds, Accounts: $accounts, Transactions: $txns"

Write-Host "============================================="
Write-Host "  LocalGov IMS setup complete!"
Write-Host "  Portal: http://localhost:80"
Write-Host "  Admin:  http://localhost:8081"
Write-Host "  API:    http://localhost:8082"
Write-Host "============================================="
