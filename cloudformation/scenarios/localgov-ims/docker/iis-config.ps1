# =============================================================================
# IIS Configuration Script for LocalGov IMS
# Creates 3 IIS sites (Portal, Admin, API) with isolated AppPools on ports
# 80, 81, 82. Configures MIME mapping for extensionless /health endpoints
# and creates required directories.
# =============================================================================

$ErrorActionPreference = "Stop"
$appcmd = "$env:windir\system32\inetsrv\appcmd.exe"

Write-Host "[IIS] Configuring IIS sites and application pools..."

# --- Remove Default Web Site ---
Write-Host "[IIS] Removing Default Web Site..."
& $appcmd delete site "Default Web Site" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[IIS] Default Web Site already removed or not found (non-fatal)"
}

# --- Create Application Pools ---
$appPools = @(
    @{ Name = "IMSPortal";  Description = "Payment Portal" },
    @{ Name = "IMSAdmin";   Description = "Admin Portal" },
    @{ Name = "IMSApi";     Description = "REST API" }
)

foreach ($pool in $appPools) {
    Write-Host "[IIS] Creating AppPool: $($pool.Name) ($($pool.Description))..."
    & $appcmd add apppool /name:$($pool.Name)
    if ($LASTEXITCODE -ne 0) { Write-Error "Failed to create AppPool $($pool.Name)"; exit 1 }

    # .NET CLR v4.0, Integrated pipeline, 32-bit disabled
    & $appcmd set apppool /apppool.name:$($pool.Name) /managedRuntimeVersion:v4.0
    & $appcmd set apppool /apppool.name:$($pool.Name) /managedPipelineMode:Integrated
    & $appcmd set apppool /apppool.name:$($pool.Name) /enable32BitAppOnWin64:false
}

# --- Create Sites ---
$sites = @(
    @{ Name = "Portal"; Path = "C:\inetpub\portal"; Port = 80; Pool = "IMSPortal" },
    @{ Name = "Admin";  Path = "C:\inetpub\admin";  Port = 81; Pool = "IMSAdmin" },
    @{ Name = "Api";    Path = "C:\inetpub\api";    Port = 82; Pool = "IMSApi" }
)

foreach ($site in $sites) {
    Write-Host "[IIS] Creating site: $($site.Name) on port $($site.Port) -> $($site.Path)..."
    & $appcmd add site /name:$($site.Name) /physicalPath:$($site.Path) /bindings:"http/*:$($site.Port):"
    if ($LASTEXITCODE -ne 0) { Write-Error "Failed to create site $($site.Name)"; exit 1 }

    # Assign AppPool
    & $appcmd set site /site.name:$($site.Name) /[path='/'].applicationPool:$($site.Pool)
    if ($LASTEXITCODE -ne 0) { Write-Error "Failed to assign AppPool for $($site.Name)"; exit 1 }
}

# --- MIME mapping for extensionless files ---
# IIS won't serve extensionless files (like /health) without this.
# Critical for ALB health checks that hit /health endpoints.
Write-Host "[IIS] Adding MIME mapping for extensionless files..."
& $appcmd set config /section:staticContent /+"[fileExtension='.',mimeType='text/plain']" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[IIS] MIME mapping may already exist (non-fatal)"
}

# --- Create /health files for each site ---
Write-Host "[IIS] Creating health check files..."
foreach ($site in $sites) {
    $healthPath = Join-Path $site.Path "health"
    Set-Content -Path $healthPath -Value "OK" -Force
    Write-Host "[IIS] Created $healthPath"
}

# --- Create Uploads directory (for file import uploads) ---
$uploadsDir = "C:\Uploads"
if (!(Test-Path $uploadsDir)) {
    New-Item -ItemType Directory -Path $uploadsDir -Force | Out-Null
    Write-Host "[IIS] Created $uploadsDir"
}

Write-Host "[IIS] Configuration complete -- Portal:80, Admin:81, Api:82"
