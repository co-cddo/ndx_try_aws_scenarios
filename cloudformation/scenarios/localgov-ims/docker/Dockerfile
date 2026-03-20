# escape=`

# ==============================================================================
# LocalGov IMS — Multi-stage Windows Dockerfile
# Builds: IMS Portal/Admin/API (.NET Framework 4.8), GOV.UK Pay Integration
# (.NET 6), hash-password.exe (Identity hasher), efmigrate.dll (EF Core
# migrations). Final image: IIS multi-site + Kestrel on Windows Server Core.
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build IMS (.NET Framework 4.8)
# ------------------------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/framework/sdk:4.8-windowsservercore-ltsc2022 AS build-ims

SHELL ["powershell", "-Command", "$ErrorActionPreference = 'Stop'; $ProgressPreference = 'SilentlyContinue';"]

WORKDIR C:\src

# Download LocalGov IMS source archive (no git needed in SDK image)
# Pin to main branch — update URL to a specific commit SHA for reproducibility
RUN Invoke-WebRequest -Uri 'https://github.com/LocalGovIMS/localgov-ims/archive/refs/heads/main.zip' -OutFile src.zip ; `
    Expand-Archive src.zip -DestinationPath C:\tmp ; `
    Copy-Item -Path 'C:\tmp\localgov-ims-main\*' -Destination C:\src -Recurse -Force ; `
    Remove-Item src.zip, C:\tmp -Recurse -Force

# Restore NuGet packages (all from nuget.org — no GitHub Packages needed)
RUN nuget restore src\LocalGovIms.sln

# Build with Live configuration, publish all web projects to C:\build
RUN msbuild src\LocalGovIms.sln `
    /p:Configuration=Live `
    /p:DeployOnBuild=true `
    /p:WebPublishMethod=FileSystem `
    /p:PublishUrl=C:\build `
    /t:Build `
    /verbosity:minimal

# --- Build hash-password.exe ---
# Tiny .NET Framework 4.8 console app using Microsoft.AspNet.Identity.Core
# to produce password hashes in the exact binary format the IMS expects
# (version byte 0x00 + 16-byte salt + 32-byte subkey, base64-encoded).

WORKDIR C:\hash-password

# Copy hash-password source files (avoids PowerShell here-string issues in Docker)
COPY hash-password/ C:\hash-password\

# Download the NuGet package for ASP.NET Identity
RUN nuget install Microsoft.AspNet.Identity.Core -Version 2.2.4 -OutputDirectory packages

RUN msbuild HashPassword.csproj /p:Configuration=Release /verbosity:minimal

# Copy to tools directory
RUN New-Item -ItemType Directory -Force -Path C:\tools ; `
    Copy-Item bin\hash-password.exe C:\tools\ ; `
    Copy-Item packages\Microsoft.AspNet.Identity.Core.2.2.4\lib\net45\Microsoft.AspNet.Identity.Core.dll C:\tools\

# ------------------------------------------------------------------------------
# Stage 2: Build GOV.UK Pay Integration (.NET 6) + EF Core migrate tool
# ------------------------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/sdk:6.0-windowsservercore-ltsc2022 AS build-govukpay

SHELL ["powershell", "-Command", "$ErrorActionPreference = 'Stop'; $ProgressPreference = 'SilentlyContinue';"]

# GitHub token for NuGet package restore (LocalGovImsApiClient, GovUKPayApiClient)
# Only used in this build stage — not present in final image
ARG GITHUB_TOKEN

WORKDIR C:\src

# Download GOV.UK Pay integration source archive (no git needed)
RUN Invoke-WebRequest -Uri 'https://github.com/LocalGovIMS/localgov-ims-integration-govukpay/archive/refs/heads/main.zip' -OutFile src.zip ; `
    Expand-Archive src.zip -DestinationPath C:\tmp ; `
    Copy-Item -Path 'C:\tmp\localgov-ims-integration-govukpay-main\*' -Destination C:\src -Recurse -Force ; `
    Remove-Item src.zip, C:\tmp -Recurse -Force

# Add GitHub Packages NuGet source — use static template to avoid XML quoting issues
COPY nuget.config.template C:\src\NuGet.Config
RUN (Get-Content C:\src\NuGet.Config) -replace '__GITHUB_TOKEN__', $env:GITHUB_TOKEN | Set-Content C:\src\NuGet.Config

# Restore and publish (solution is under src/ in the repo)
RUN dotnet restore src\LocalGovIms.Integration.GovUKPay.sln ; `
    dotnet publish src\Web\Web.csproj -c Release -o C:\app

# --- Build efmigrate — small .NET 6 console app for EF Core migrations ---

# Copy efmigrate source into the repo's src directory so the project reference resolves
COPY efmigrate/ C:\src\efmigrate\

WORKDIR C:\src\efmigrate

RUN dotnet publish efmigrate.csproj -c Release -o C:\efmigrate-out

# ------------------------------------------------------------------------------
# Stage 3: Runtime — IIS + .NET 6 Kestrel
# ------------------------------------------------------------------------------
FROM mcr.microsoft.com/dotnet/framework/aspnet:4.8-windowsservercore-ltsc2022 AS runtime

SHELL ["powershell", "-Command", "$ErrorActionPreference = 'Stop'; $ProgressPreference = 'SilentlyContinue';"]

# Copy published IMS apps from build-ims stage
COPY --from=build-ims C:\build\LocalGovIms.Web C:\inetpub\portal
COPY --from=build-ims C:\build\LocalGovIms.Admin C:\inetpub\admin
COPY --from=build-ims C:\build\LocalGovIms.Api C:\inetpub\api

# Copy GOV.UK Pay integration from build-govukpay stage
COPY --from=build-govukpay C:\app C:\govukpay

# Copy EF Core migration tool
COPY --from=build-govukpay C:\efmigrate-out C:\efmigrate

# Copy hash-password tool
COPY --from=build-ims C:\tools C:\tools

# Install .NET 6 ASP.NET Core runtime (for Kestrel hosting of GOV.UK Pay)
RUN Invoke-WebRequest -Uri 'https://dot.net/v1/dotnet-install.ps1' -OutFile dotnet-install.ps1 ; `
    .\dotnet-install.ps1 -Channel 6.0 -Runtime aspnetcore -InstallDir C:\dotnet6 ; `
    Remove-Item dotnet-install.ps1

# Install sqlcmd (SQL Server command-line tools)
RUN Invoke-WebRequest -Uri 'https://go.microsoft.com/fwlink/?linkid=2142258' -OutFile sqlcmd.msi ; `
    Start-Process msiexec -ArgumentList '/i','sqlcmd.msi','/quiet','/norestart','IACCEPTMSODBCSQLLICENSETERMS=YES' -Wait ; `
    Remove-Item sqlcmd.msi

# Verify sqlcmd installation
RUN if (!(Test-Path 'C:\Program Files\Microsoft SQL Server\Client SDK\ODBC\*\Tools\Binn\SQLCMD.EXE')) { `
        Write-Error 'sqlcmd install failed' ; exit 1 `
    } ; `
    Write-Host 'sqlcmd installed successfully'

# Add sqlcmd to PATH
RUN $sqlcmdDir = (Resolve-Path 'C:\Program Files\Microsoft SQL Server\Client SDK\ODBC\*\Tools\Binn').Path ; `
    [Environment]::SetEnvironmentVariable('PATH', $env:PATH + ';' + $sqlcmdDir, [EnvironmentVariableTarget]::Machine)

# Copy entrypoint and configuration scripts
COPY entrypoint.ps1 C:\entrypoint.ps1
COPY seed-data.sql C:\seed-data.sql
COPY iis-config.ps1 C:\iis-config.ps1

# Create static /health endpoints for ALB health checks (IIS serves these immediately)
RUN Set-Content -Path C:\inetpub\portal\health -Value 'OK' ; `
    Set-Content -Path C:\inetpub\admin\health -Value 'OK' ; `
    Set-Content -Path C:\inetpub\api\health -Value 'OK'

EXPOSE 80 81 82 83

# Long start period: IIS boots immediately for health checks, but EF6 migrations
# + seed data take several minutes. 900s (15 min) accommodates cold JIT + 28
# migrations + seed SQL on a 2-vCPU Fargate task.
HEALTHCHECK --interval=30s --timeout=10s --start-period=900s --retries=3 `
    CMD ["powershell", "-Command", "(Invoke-WebRequest -Uri http://localhost:80/health -UseBasicParsing).StatusCode -eq 200"]

ENTRYPOINT ["powershell", "-File", "C:\\entrypoint.ps1"]
