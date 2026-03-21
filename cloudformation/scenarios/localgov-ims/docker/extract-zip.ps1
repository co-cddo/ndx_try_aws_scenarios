param(
    [Parameter(Mandatory)][string]$Zip,
    [Parameter(Mandatory)][string]$Dest
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $Zip)) {
    Write-Host "WARNING: $Zip not found"
    New-Item -ItemType Directory -Force -Path $Dest | Out-Null
    return
}

$tmp = Join-Path 'C:\tmp_extract' ([IO.Path]::GetFileNameWithoutExtension($Zip))
New-Item -ItemType Directory -Force -Path $Dest | Out-Null
Expand-Archive -Path $Zip -DestinationPath $tmp -Force

$ptDir = Get-ChildItem -Path $tmp -Recurse -Directory -Filter 'PackageTmp' | Select-Object -First 1
if ($ptDir) {
    Copy-Item -Path (Join-Path $ptDir.FullName '*') -Destination $Dest -Recurse -Force
    Write-Host "$([IO.Path]::GetFileNameWithoutExtension($Zip)): extracted from zip PackageTmp ($((Get-ChildItem $Dest -Recurse -File).Count) files)"
} else {
    Write-Host "WARNING: No PackageTmp in $Zip, copying all content"
    Copy-Item -Path (Join-Path $tmp '*') -Destination $Dest -Recurse -Force
}

Remove-Item $tmp -Recurse -Force
