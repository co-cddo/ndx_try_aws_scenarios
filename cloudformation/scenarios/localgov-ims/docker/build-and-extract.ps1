$ErrorActionPreference = 'Stop'

# Build the solution with DeployOnBuild — creates .zip packages under each
# web project's obj/Live/Package/ directory.
Write-Host '=== Building solution ==='
msbuild src\LocalGovIms.sln /p:Configuration=Live /p:DeployOnBuild=true /p:WebPublishMethod=Package /verbosity:minimal
if ($LASTEXITCODE -ne 0) { throw "MSBuild failed with exit code $LASTEXITCODE" }

# Extract from the Web Deploy .zip packages IMMEDIATELY (same process, before
# any cleanup can occur). The zips nest content under a PackageTmp directory.
Write-Host '=== Extracting packages ==='
$projects = @(
    @{ Name = 'PaymentPortal'; Dest = 'C:\build\portal' }
    @{ Name = 'Admin';         Dest = 'C:\build\admin'  }
    @{ Name = 'Api';           Dest = 'C:\build\api'    }
)

foreach ($proj in $projects) {
    $zip = "C:\src\src\$($proj.Name)\obj\Live\Package\$($proj.Name).zip"
    $dest = $proj.Dest
    New-Item -ItemType Directory -Force -Path $dest | Out-Null

    if (Test-Path $zip) {
        $tmp = "C:\tmp_extract\$($proj.Name)"
        Expand-Archive -Path $zip -DestinationPath $tmp -Force

        # Find PackageTmp inside the extracted zip
        $ptDir = Get-ChildItem -Path $tmp -Recurse -Directory -Filter 'PackageTmp' | Select-Object -First 1
        if ($ptDir) {
            Copy-Item -Path (Join-Path $ptDir.FullName '*') -Destination $dest -Recurse -Force
            $fileCount = (Get-ChildItem $dest -Recurse -File).Count
            $dllCount = (Get-ChildItem (Join-Path $dest 'bin') -File -ErrorAction SilentlyContinue).Count
            Write-Host "$($proj.Name): $fileCount files, $dllCount DLLs"
        } else {
            Write-Host "WARNING: No PackageTmp found in $zip"
            Copy-Item -Path (Join-Path $tmp '*') -Destination $dest -Recurse -Force
        }
        Remove-Item $tmp -Recurse -Force
    } else {
        Write-Host "WARNING: $zip not found!"
        Write-Host "Available zips:"
        Get-ChildItem -Path 'C:\src\src' -Recurse -Filter '*.zip' -ErrorAction SilentlyContinue | ForEach-Object { Write-Host "  $($_.FullName)" }
    }
}

Write-Host '=== Build and extract complete ==='
