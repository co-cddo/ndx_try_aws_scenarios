$ErrorActionPreference = 'Stop'

# Step 1: Build the solution (compiles everything including libraries).
Write-Host '=== Step 1: Building solution ==='
msbuild src\LocalGovIms.sln /p:Configuration=Live /t:Build /verbosity:minimal
if ($LASTEXITCODE -ne 0) { throw "Solution build failed" }

# Step 2: Fix lib paths — solution maps Live->Release for libraries, but web
# projects reference them at bin\Live\. Copy Release -> Live.
Write-Host '=== Step 2: Fixing library paths ==='
foreach ($lib in @('BusinessLogic', 'DataAccess', 'Web')) {
    $src = "C:\src\src\$lib\bin\Release"
    $dst = "C:\src\src\$lib\bin\Live"
    if (Test-Path $src) {
        New-Item -ItemType Directory -Force -Path $dst | Out-Null
        Copy-Item -Path "$src\*" -Destination $dst -Recurse -Force
        Write-Host "  Copied $lib bin\Release -> bin\Live"
    }
}

# Step 3: Publish each web project individually and extract immediately.
# Using pipelinePreDeployCopyAllFilesToOneFolder which creates _PackageTempDir.
# BuildProjectReferences=false prevents rebuilding libs (already built above).
Write-Host '=== Step 3: Publishing web projects ==='
$projects = @(
    @{ Csproj = 'src\PaymentPortal\PaymentPortal.csproj'; Dest = 'C:\build\portal' }
    @{ Csproj = 'src\Admin\Admin.csproj';                 Dest = 'C:\build\admin'  }
    @{ Csproj = 'src\Api\Api.csproj';                     Dest = 'C:\build\api'    }
)

foreach ($proj in $projects) {
    $dest = $proj.Dest
    New-Item -ItemType Directory -Force -Path $dest | Out-Null

    Write-Host "  Publishing $($proj.Csproj) -> $dest"
    msbuild $proj.Csproj `
        /p:Configuration=Live `
        /p:BuildProjectReferences=false `
        /t:pipelinePreDeployCopyAllFilesToOneFolder `
        "/p:_PackageTempDir=$dest" `
        /verbosity:minimal

    if ($LASTEXITCODE -ne 0) {
        Write-Host "  WARNING: pipelinePreDeployCopyAllFilesToOneFolder failed, trying WebPublishMethod=Package"
        msbuild $proj.Csproj `
            /p:Configuration=Live `
            /p:BuildProjectReferences=false `
            /p:DeployOnBuild=true `
            /p:WebPublishMethod=Package `
            /verbosity:minimal

        # Extract from zip
        $name = [IO.Path]::GetFileNameWithoutExtension($proj.Csproj)
        $projDir = Split-Path $proj.Csproj -Parent
        $zip = "C:\src\$projDir\obj\Live\Package\$name.zip"
        if (Test-Path $zip) {
            $tmp = "C:\tmp_extract\$name"
            Expand-Archive -Path $zip -DestinationPath $tmp -Force
            $ptDir = Get-ChildItem -Path $tmp -Recurse -Directory -Filter 'PackageTmp' | Select-Object -First 1
            if ($ptDir) {
                Copy-Item -Path "$($ptDir.FullName)\*" -Destination $dest -Recurse -Force
            }
            Remove-Item $tmp -Recurse -Force
        }
    }

    $fileCount = (Get-ChildItem $dest -Recurse -File -ErrorAction SilentlyContinue).Count
    $dllCount = (Get-ChildItem "$dest\bin" -File -ErrorAction SilentlyContinue).Count
    Write-Host "  Result: $fileCount files, $dllCount DLLs"
}

Write-Host '=== Build and extract complete ==='
