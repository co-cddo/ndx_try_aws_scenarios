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

# Clone LocalGov IMS — pin to main (update to specific commit SHA for reproducibility)
RUN git clone https://github.com/LocalGovIMS/localgov-ims.git . ; `
    git checkout main

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

# Download the NuGet package for ASP.NET Identity
RUN nuget install Microsoft.AspNet.Identity.Core -Version 2.2.4 -OutputDirectory packages

# Write the C# source
RUN Set-Content -Path Program.cs -Value @' `
using System; `
using Microsoft.AspNet.Identity; `
class Program { `
    static void Main() { `
        var password = Console.ReadLine(); `
        var hasher = new PasswordHasher(); `
        Console.Write(hasher.HashPassword(password)); `
    } `
} `
'@

# Write the project file
RUN Set-Content -Path HashPassword.csproj -Value @' `
<Project ToolsVersion="15.0" xmlns="http://schemas.microsoft.com/developer/msbuild/2003"> `
  <Import Project="$(MSBuildExtensionsPath)\$(MSBuildToolsVersion)\Microsoft.Common.props" /> `
  <PropertyGroup> `
    <OutputType>Exe</OutputType> `
    <TargetFrameworkVersion>v4.8</TargetFrameworkVersion> `
    <OutputPath>bin\</OutputPath> `
    <AssemblyName>hash-password</AssemblyName> `
  </PropertyGroup> `
  <ItemGroup> `
    <Reference Include="Microsoft.AspNet.Identity.Core"> `
      <HintPath>packages\Microsoft.AspNet.Identity.Core.2.2.4\lib\net45\Microsoft.AspNet.Identity.Core.dll</HintPath> `
    </Reference> `
    <Reference Include="System" /> `
  </ItemGroup> `
  <ItemGroup> `
    <Compile Include="Program.cs" /> `
  </ItemGroup> `
  <Import Project="$(MSBuildToolsPath)\Microsoft.CSharp.targets" /> `
</Project> `
'@

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

# Clone GOV.UK Pay integration — pin to main (update to commit SHA for reproducibility)
RUN git clone https://github.com/LocalGovIMS/localgov-ims-integration-govukpay.git . ; `
    git checkout main

# Add GitHub Packages NuGet source for LocalGovIMS packages
RUN dotnet nuget add source "https://nuget.pkg.github.com/LocalGovIMS/index.json" `
    -n github -u USERNAME -p $env:GITHUB_TOKEN --store-password-in-clear-text

# Restore and publish
RUN dotnet restore ; `
    dotnet publish -c Release -o C:\app

# --- Build efmigrate — small .NET 6 console app for EF Core migrations ---

WORKDIR C:\efmigrate

# Write the project file referencing the GOV.UK Pay Infrastructure project
RUN Set-Content -Path efmigrate.csproj -Value @' `
<Project Sdk="Microsoft.NET.Sdk"> `
  <PropertyGroup> `
    <OutputType>Exe</OutputType> `
    <TargetFramework>net6.0</TargetFramework> `
    <ImplicitUsings>enable</ImplicitUsings> `
  </PropertyGroup> `
  <ItemGroup> `
    <ProjectReference Include="..\src\Infrastructure\Infrastructure.csproj" /> `
  </ItemGroup> `
</Project> `
'@

# Write the migration runner
RUN Set-Content -Path Program.cs -Value @' `
using Microsoft.EntityFrameworkCore; `
using Microsoft.Extensions.DependencyInjection; `
 `
var connectionString = args.FirstOrDefault(a => a.StartsWith("--connection="))?.Substring("--connection=".Length) `
    ?? throw new ArgumentException("Usage: efmigrate --connection=<connection-string>"); `
 `
Console.WriteLine("Running EF Core migrations for GOV.UK Pay integration..."); `
 `
// Build DbContext with the provided connection string `
var optionsBuilder = new DbContextOptionsBuilder<LocalGovIms.Integration.GovUKPay.Infrastructure.GovUkPayDbContext>(); `
optionsBuilder.UseSqlServer(connectionString); `
 `
using var context = new LocalGovIms.Integration.GovUKPay.Infrastructure.GovUkPayDbContext(optionsBuilder.Options); `
context.Database.Migrate(); `
 `
Console.WriteLine("EF Core migrations completed successfully."); `
'@

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
