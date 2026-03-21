$ErrorActionPreference = 'Stop'

# The solution maps Configuration=Live -> Release for library projects.
# Web projects reference these at bin\Live\, so we copy bin\Release\ -> bin\Live\.
foreach ($lib in @('BusinessLogic', 'DataAccess', 'Web')) {
    $src = "C:\src\src\$lib\bin\Release"
    $dst = "C:\src\src\$lib\bin\Live"
    if (Test-Path $src) {
        New-Item -ItemType Directory -Force -Path $dst | Out-Null
        Copy-Item -Path (Join-Path $src '*') -Destination $dst -Recurse -Force
        Write-Host "Copied $lib bin\Release -> bin\Live"
    } else {
        Write-Host "WARNING: $src not found"
    }
}
