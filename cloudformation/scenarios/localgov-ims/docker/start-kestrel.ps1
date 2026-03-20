# Kestrel restart loop for GOV.UK Pay integration
# Runs in background via Start-Process, auto-restarts on crash
while ($true) {
    Write-Host '[Kestrel] Starting GOV.UK Pay on port 83'
    try {
        & C:\dotnet6\dotnet.exe C:\govukpay\LocalGovIms.Integration.GovUKPay.Web.dll --urls http://0.0.0.0:83 2>&1 | ForEach-Object { Write-Host "[Kestrel] $_" }
    } catch {
        Write-Host "[Kestrel] Error: $_"
    }
    Write-Host '[Kestrel] Process exited, restarting in 5s'
    Start-Sleep 5
}
