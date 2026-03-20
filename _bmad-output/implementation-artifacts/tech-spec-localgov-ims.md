---
title: 'LocalGov IMS Income Management System'
slug: 'localgov-ims'
created: '2026-03-20'
status: 'done'
baseline_commit: 'e267e1f'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['.NET Framework 4.8.1', 'ASP.NET MVC 5', 'ASP.NET Web API 2', 'Entity Framework 6.4.4', '.NET 6.0 (GOV.UK Pay integration)', 'EF Core 7', 'SQL Server Express', 'Windows Server 2022 Core containers', 'ECS Fargate (Windows)', 'AWS CDK 2.241.0', 'GOV.UK Pay API', 'IIS 10', 'ASP.NET Identity 2.2.3', 'Unity 5.11.10 DI', 'MediatR 11.1.0', 'RDS SQL Server']
files_to_modify: ['cloudformation/scenarios/localgov-ims/cdk/bin/app.ts', 'cloudformation/scenarios/localgov-ims/cdk/lib/localgov-ims-stack.ts', 'cloudformation/scenarios/localgov-ims/cdk/lib/constructs/networking.ts', 'cloudformation/scenarios/localgov-ims/cdk/lib/constructs/database.ts', 'cloudformation/scenarios/localgov-ims/cdk/lib/constructs/compute.ts', 'cloudformation/scenarios/localgov-ims/cdk/lib/constructs/cloudfront.ts', 'cloudformation/scenarios/localgov-ims/docker/Dockerfile', 'cloudformation/scenarios/localgov-ims/docker/entrypoint.ps1', 'cloudformation/scenarios/localgov-ims/docker/seed-data.sql', 'cloudformation/scenarios/localgov-ims/docker/iis-config.ps1', 'cloudformation/scenarios/localgov-ims/BLUEPRINT.md', 'cloudformation/isb-hub/lib/isb-hub-stack.ts', 'src/_data/scenarios.yaml', 'src/scenarios/localgov-ims.njk', 'src/walkthroughs/localgov-ims.njk', '.github/workflows/docker-build-ims.yml', '.github/workflows/deploy-blueprints.yml']
code_patterns: ['CDK modular constructs (networking/database/compute/cloudfront)', 'IsbRoleNamingAspect CDK Aspect for SCP compliance', 'Secrets via unsafeUnwrap() at deploy time', 'Environment-agnostic stacks (no env property)', 'Port-based ALB routing with multiple listeners', 'Multiple CloudFront distributions per ALB port', 'Windows multi-site IIS via appcmd.exe', 'Entrypoint-based seed (BOPS pattern, not separate task)', 'EF6 MigrateDatabaseToLatestVersion auto-migration']
test_patterns: ['CDK snapshot tests (Jest)', 'Schema validation (AJV)', 'Playwright E2E for portal pages']
---

# Tech-Spec: LocalGov IMS Income Management System

**Created:** 2026-03-20

## Overview

### Problem Statement

UK councils need to evaluate open-source income management systems but setting up LocalGov IMS requires Windows Server, IIS, SQL Server, and payment provider integration — too complex for a quick trial. There's no existing NDX:Try scenario showcasing Windows containers on ECS Fargate either, making this a novel demonstration of AWS's Windows workload capabilities.

### Solution

Deploy the full LocalGov IMS stack (Payment Portal, Admin Portal, API) as Windows containers on ECS Fargate with RDS SQL Server, wired to GOV.UK Pay sandbox for real payment flows, pre-seeded with comprehensive council data (funds, MOPs, account holders, transactions, eReturns, import rules). This gives evaluators a fully populated, functional income management system they can explore immediately.

### Scope

**In Scope:**
- All 4 IMS web apps (Payment Portal, Admin Portal, API, GOV.UK Pay Integration) in a **single Windows container** with IIS multi-site hosting on different ports
- ALB port-based routing with multiple listeners (80, 8080, 8082) to the single container's different ports
- RDS SQL Server Express (provisioned `db.t3.medium`, right-sized for snappy single-user performance)
- GOV.UK Pay sandbox integration (real test card payments end-to-end)
- Comprehensive seed data across all features — 8-10 funds, 6+ MOPs, 200+ account holders, 500+ transactions, 30+ suspense items, eReturn templates, import processing rules, 5 staff users with varied roles
- **Seed task pattern** (like BOPS) — one-shot Fargate task runs EF6 migrations + seed SQL before services start
- CDK with modular constructs (following existing localgov-drupal/bops patterns)
- ISB SCP-compliant IAM role naming (`InnovationSandbox-ndx-*`)
- Portal scenario page, walkthrough guide, screenshots
- Docker image builds (Windows) + GHCR publishing via GitHub Actions (using `GITHUB_TOKEN` for NuGet package restore)
- CloudFront HTTPS termination
- **Windows EC2 dev box** (`m5.xlarge`, Windows Server 2022 w/ Containers, SSM access) for local development and testing

**Out of Scope:**
- SmartPay, Storm, or other payment integrations (GOV.UK Pay sandbox only)
- Live bank file import integrations (AllPay, DWP) — seed some imported data but no live file processing
- SMTP email delivery (log emails instead)
- Production hardening / multi-user scaling
- Custom branding or council-specific theming

## Context for Development

### Codebase Patterns

**CDK Architecture (from localgov-drupal + bops-planning):**
- Modular constructs: `networking.ts`, `database.ts`, `compute.ts`, `cloudfront.ts` (and `storage.ts`, `redis.ts` where needed)
- Stack entry: `bin/app.ts` → instantiates stack with NO `env` property (environment-agnostic for StackSets)
- `IsbRoleNamingAspect` CDK Aspect auto-prefixes all IAM roles with `InnovationSandbox-ndx-` (MD5 hash suffix for uniqueness, 64-char max)
- Explicit role names for known roles: `InnovationSandbox-ndx-ims-exec`, `InnovationSandbox-ndx-ims-task`
- Secrets: `secretValueFromJson().unsafeUnwrap()` → CloudFormation `{{resolve:secretsmanager:...}}` dynamic references at deploy time
- No hardcoded secret names (avoids 7-30 day recovery window collisions on rollback)
- VPC: public-only subnets, 2 AZs, NO NAT gateways (Fargate gets public IPs)
- ALB: port-based routing with multiple listeners (80, 8080, etc.) → different target groups
- CloudFront: separate distribution per service endpoint, `CACHING_DISABLED`, `ALL_VIEWER` origin request policy
- Removal policies: all `DESTROY`
- CDK versions: `aws-cdk-lib@2.241.0`, `constructs@10.5.1`
- Git-committed `template.yaml` generated from CDK synth in CI

**LocalGov IMS Source Architecture (from GitHub investigation):**
- Solution: `src/LocalGovIms.sln` — 7+ projects (.NET Framework 4.8.1)
- Build: `nuget restore` → `msbuild /p:configuration="Live" /p:WebPublishMethod=FileSystem /p:PublishUrl="../_build"`
- **Main IMS NuGet packages are ALL from nuget.org** — no GitHub Packages dependency for core build
- **Only GOV.UK Pay integration needs GitHub Packages** (2 packages: `LocalGovImsApiClient@1.5.0`, `GovUKPayApiClient@1.1.0`)
- Connection strings: `IncomeDb` (main, shared by Portal/Admin/API) + `ImsGovUkPayDatabase` (GOV.UK Pay integration)
- Provider: `System.Data.SqlClient` (main) + `Microsoft.EntityFrameworkCore.SqlServer` (GOV.UK Pay)
- EF6: 28 migrations, `MigrateDatabaseToLatestVersion` initializer — **auto-migrates on first request**
- EF Core (GOV.UK Pay): 5 migrations, standard `dotnet ef database update`
- Authentication: ASP.NET Identity 2.2.3 + OWIN (Admin only). Password: min 6 chars, require non-letter/digit, digit, lower, upper
- DemoData.sql: seed data with `PlaceholderReplacer.cs` — tokens like `[[SeedData.DemoData.PaymentIntegration.Name]]` replaced from AppSettings
- API: NO authentication — open access (GOV.UK Pay integration calls it directly)
- GOV.UK Pay integration discovers IMS API via `LocalGovImsApiUrl` config → `LocalGovImsApiClient` REST calls
- GOV.UK Pay API key: per-fund via `FundMetadata` key `GovUkPay.Api.Key`
- Background jobs: 3 HTTP GET endpoints (`/api/Job/CleanupIncompletePayments`, `ProcessUncapturedPayments`, `ProcessIncompleteRefunds`)

**IIS Multi-Site Container Architecture:**
- Base image: `mcr.microsoft.com/dotnet/framework/aspnet:4.8-windowsservercore-ltsc2022` (includes IIS + .NET 4.8)
- 4 IIS sites configured via `appcmd.exe` in entrypoint:
  - Port 80: Payment Portal (public citizen-facing)
  - Port 81: Admin Portal (staff-facing)
  - Port 82: API (called by GOV.UK Pay integration via localhost)
  - Port 83: GOV.UK Pay Integration (.NET 6 on IIS via ASP.NET Core module)
- `ServiceMonitor.exe w3svc` keeps container alive
- Inter-app communication: GOV.UK Pay Integration → `http://localhost:82/api/...` (no external hop for API calls)
- External browser redirects: Portal → GOV.UK Pay Integration URL (CloudFront) → GOV.UK Pay hosted page → back

**Seed Data Architecture:**
- EF6 `MigrateDatabaseToLatestVersion` runs automatically on first HTTP request to Portal — creates schema + runs `SeedData.sql`, `Indexes.sql`, `ComputedColumns.sql`
- `DemoData.sql` runs when `Environment` appSetting = `Demo` — creates offices, users, funds, MOPs, VAT codes, payment integrations, import rules
- Comprehensive seed SQL (custom) adds: 200+ account holders, 500+ transactions, 30+ suspense items, eReturn data
- GOV.UK Pay integration EF Core migrations: run via `dotnet ef database update` or application startup
- Placeholder replacement: `PlaceholderReplacer.cs` substitutes `[[key]]` tokens with AppSettings values in seed SQL

**CI/CD Patterns (new for Windows):**
- **CRITICAL**: Windows Docker images CANNOT be built on `ubuntu-latest` — requires `windows-latest` GitHub Actions runner
- New workflow: `.github/workflows/docker-build-ims.yml` on `windows-latest`
- Slower builds than Linux (~15-20 min vs 5 min) due to Windows base image size
- Image: `ghcr.io/co-cddo/ndx_try_aws_scenarios-localgov-ims:latest`
- CDK synth: still on `ubuntu-latest` (CDK is Node.js, platform-agnostic)
- Template post-processing: strip `BootstrapVersion`, `CDKMetadata`, `CheckBootstrapVersion`; validate no `AssetParameters`; validate all `DeletionPolicy: Delete`

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `cloudformation/scenarios/localgov-drupal/cdk/lib/localgov-drupal-stack.ts` | Reference: main stack pattern, construct orchestration |
| `cloudformation/scenarios/bops-planning/cdk/lib/bops-planning-stack.ts` | Reference: multi-service pattern, IsbRoleNamingAspect, entrypoint seed |
| `cloudformation/scenarios/bops-planning/cdk/lib/constructs/compute.ts` | Reference: ALB multi-listener, port-based routing, embedded boot script |
| `cloudformation/scenarios/bops-planning/cdk/lib/constructs/cloudfront.ts` | Reference: multiple CloudFront distributions per ALB port |
| `cloudformation/scenarios/localgov-drupal/cdk/lib/constructs/networking.ts` | Reference: VPC public-only, security groups |
| `cloudformation/scenarios/localgov-drupal/cdk/lib/constructs/database.ts` | Reference: Aurora credentials, removal policies |
| `cloudformation/scenarios/localgov-drupal/docker/Dockerfile` | Reference: multi-stage build, health check, entrypoint pattern |
| `cloudformation/scenarios/bops-planning/docker/bops/entrypoint.sh` | Reference: seed-on-boot entrypoint logic |
| `cloudformation/isb-hub/lib/isb-hub-stack.ts` | Modify: add `localgov-ims` to SCENARIOS array |
| `src/_data/scenarios.yaml` | Modify: add localgov-ims scenario entry |
| `schemas/scenario.schema.json` | Reference: scenario validation schema |
| `.github/workflows/deploy-blueprints.yml` | Modify: add `synth-localgov-ims` job |
| `.github/workflows/docker-build-bops.yml` | Reference: multi-image Docker build pattern |

### Technical Decisions

- **Windows Fargate over EC2**: Fargate simplifies ops (no AMI management, patching). Cost is higher than Linux Fargate but acceptable for a single-user demo ($50/24hr budget — check in if trending over). Windows Fargate supports `WINDOWS_SERVER_2022_CORE` runtime platform. Minimum task size 1 vCPU / 2GB.
- **RDS SQL Server Express**: 10GB database limit — more than sufficient for demo data. `db.t3.medium` (2 vCPU, 4GB RAM) for snappy single-user performance. Two SQL Server databases on one instance: `IncomeManagement` (main — referenced in Web.config via connection string name `IncomeDb`) + `IncomeManagement_GovUkPayIntegration` (GOV.UK Pay — referenced via connection string name `ImsGovUkPayDatabase`). **Note**: `IncomeDb` is the Web.config connection string *name*, `IncomeManagement` is the actual SQL Server *database name*. Exclude shell-special chars from generated password (following BOPS pattern).
- **Single container, multi-site IIS + Kestrel**: All 4 apps in one Windows container image. IIS hosts 3 .NET Framework apps on ports 80 (Portal), 81 (Admin), 82 (API). GOV.UK Pay Integration (.NET 6) runs self-hosted on **Kestrel** at port 83 (avoids ASP.NET Core Hosting Bundle dependency). ALB multi-listener routing. One Fargate task (2 vCPU / 4GB), one image pull. GOV.UK Pay integration calls API via `http://localhost:82` (no external hop).
- **3 CloudFront distributions** (following BOPS dual-distribution pattern):
  - CF1 → ALB:80 → Portal (citizen-facing, primary payment entry)
  - CF2 → ALB:8080 → Admin (staff-facing, main demo interface)
  - CF3 → ALB:8082 → GOV.UK Pay Integration (browser redirect target during payment flow)
  - API (port 82) is internal-only via localhost — no CloudFront needed
- **GOV.UK Pay sandbox**: Real payment flow with test card numbers (4242424242424242 etc.). API key stored as `CfnParameter` (NoEcho=true), injected as env var + seeded into `FundMetadata` table as `GovUkPay.Api.Key` per fund.
- **Entrypoint-based seed (revised from "seed task")**: Investigation shows BOPS runs all seed logic inside the web container entrypoint, NOT as a separate Fargate task. Same approach for IMS:
  _(Authoritative boot sequence is in Task 1.3. Summary here for context:)_
  1. Start IIS immediately with static `/health` files (ALB health checks pass from boot)
  2. Wait for SQL Server connectivity
  3. Create databases (`IncomeManagement`, `IncomeManagement_GovUkPayIntegration`)
  4. Patch Web.config files (connection strings with `TrustServerCertificate=True`, ReferenceSalt, Environment=Demo)
  5. Patch GOV.UK Pay `appsettings.json`
  6. Recycle IIS app pools
  7. Trigger EF6 migration via polling loop (2-5 min)
  8. Check idempotency marker, skip seed if already done
  9. Run custom seed SQL with `-v GOVUKPAY_API_KEY=...`
  10. UPDATE all PaymentIntegrations rows with CloudFront URL
  11. Hash admin password via stdin pipe to `hash-password.exe`
  12. Run GOV.UK Pay EF Core migrations via `efmigrate.dll`
  13. Start Kestrel for GOV.UK Pay (port 83) in restart loop
  14. `ServiceMonitor.exe w3svc`
  - Idempotency: check for marker table/flag before re-seeding
  - **sqlcmd**: Always install in Dockerfile (not in base image by default). Download `mssql-tools` MSI installer in runtime stage: `Invoke-WebRequest -Uri 'https://go.microsoft.com/fwlink/?linkid=2142258' -OutFile sqlcmd.msi; Start-Process msiexec -ArgumentList '/i','sqlcmd.msi','/quiet','/norestart','IACCEPTMSODBCSQLLICENSETERMS=YES' -Wait`. **Verify installation**: `if (!(Test-Path 'C:\Program Files\Microsoft SQL Server\Client SDK\ODBC\*\Tools\Binn\SQLCMD.EXE')) { Write-Error 'sqlcmd install failed'; exit 1 }`. Add sqlcmd to PATH. This eliminates the fallback ambiguity — all entrypoint steps use `sqlcmd` consistently.
  - **sqlcmd error handling**: All `sqlcmd` calls must use `-b` flag (batch abort on error). Entrypoint checks `$LASTEXITCODE` after each call and fails loudly with `Write-Error` + `exit 1` if non-zero.
  - **ECS Exec on Windows**: may not be supported — verify; if not, debugging is CloudWatch logs only
  - Seed data includes:
    - **Funds (10)**: Council Tax, Business Rates (NNDR), Housing Rents, Parking Fines, Planning Fees, Leisure Services, Commercial Waste, Sundry Debtors, Garden Waste, Building Control
    - **Methods of Payment (6+)**: GOV.UK Pay (card online), Cash, Cheque, Direct Debit, BACS, Standing Order
    - **Account Holders (200+)**: Realistic reference numbers with valid check digits
    - **Processed Transactions (500+)**: Across all funds, spanning 3 months of history
    - **Suspense Items (30+)**: Unallocated payments awaiting journal
    - **eReturn Templates**: For 3 offices with cash/cheque cashing-up data
    - **Import Processing Rules**: For BACS and Direct Debit file formats
    - **Staff Users (5)**: Finance Admin, Cashier, Payments Supervisor, Read-Only Auditor, System Admin (ASP.NET Identity users + IMS Users table + role assignments)
- **AppSettings injection**: Web.config transforms at build time for `Live` config. Runtime overrides via environment variables where supported, or entrypoint script patches Web.config before IIS starts. Key settings:
  - `ReferenceSalt` — shared across all 3 IMS apps + GOV.UK Pay integration
  - `Environment` = `Demo` (triggers DemoData.sql seed)
  - `PortalPaymentsURL` — CF1 URL (Portal)
  - `LocalGovImsApiUrl` = `http://localhost:82` (internal)
  - `PaymentPortalUrl` — CF1 URL (for GOV.UK Pay redirect-back)
  - `PaymentIntegration.BaseUri` — CF3 URL (GOV.UK Pay integration)
  - Connection strings: `Server={RDS_ENDPOINT};Database=IncomeManagement;User Id={DB_USER};Password={DB_PASSWORD};TrustServerCertificate=True` (SQL Server 2022 enforces TLS; no RDS CA bundle in container)
- **Image pull speed investigation**: First task on dev box — test whether ASP.NET 4.8 base image is in AWS Fargate's managed image cache. If not, explore building on `windowsservercore-ltsc2022` base (which IS cached) and installing ASP.NET manually.
- **Windows EC2 dev box**: `m5.xlarge` (4 vCPU, 16GB), Windows Server 2022 with Containers AMI, 100GB gp3 EBS, SSM Session Manager for remote access. Instance profile named `InnovationSandbox-ndx-localgov-ims-dev` for SCP compliance.
- **NuGet package restore**: Main IMS: all packages from nuget.org (no GitHub Packages needed). GOV.UK Pay integration: needs `nuget.pkg.github.com/LocalGovIMS/` for `LocalGovImsApiClient@1.5.0` and `GovUKPayApiClient@1.1.0`. Docker build uses `GITHUB_TOKEN` (CI) or PAT (dev box).
- **CI/CD (new pattern)**: Windows Docker build requires `windows-latest` runner (new `.github/workflows/docker-build-ims.yml`). CDK synth stays on `ubuntu-latest`. Expect 15-20 min Docker builds due to Windows image size.
- **Performance tuning for "wow"**: `db.t3.medium` for SQL Server, 2 vCPU / 4GB for single Fargate task. Health check grace period 15 min (IIS startup + migration + seed). Health check uses dedicated `/health` static file (returns 200 immediately, independent of app routes). `enableExecuteCommand: true` for debugging (verify Windows Fargate support).
- **Deployment phases for walkthrough UX** (longest deploy in portfolio, ~35-45 min):
  1. "Creating network infrastructure" (VPC, subnets, security groups — ~30s)
  2. "Provisioning SQL Server database" (RDS creation — ~10 min)
  3. "Starting Windows container" (image pull — ~10-20 min depending on cache)
  4. "Running database migrations" (EF6 28 migrations — ~60s)
  5. "Seeding sample council data" (500+ transactions, 200+ accounts — ~30s)
  6. "Configuring payment integration" (GOV.UK Pay wiring — ~10s)
  7. "Ready!"
- **Walkthrough narrative structure** — day-in-the-life of a council finance team:
  1. "A citizen pays their Council Tax" — Payment Portal → GOV.UK Pay sandbox → test card
  2. "A finance officer reviews transactions" — Admin portal, search, receipt
  3. "An unallocated payment arrives" — suspense management, journal to correct account
  4. "End of day cashing up" — eReturns for a cashier office
  5. "Monthly bank file review" — import processing rules, imported transaction history

## Implementation Plan

### Phase 0: Dev Environment

- [ ] **Task 0.1**: Launch Windows EC2 dev box in sandbox account
  - File: N/A (AWS CLI commands)
  - Action: `aws ec2 run-instances` with Windows Server 2022 with Containers AMI, `m5.xlarge`, 100GB gp3, instance profile `InnovationSandbox-ndx-localgov-ims-dev`, public subnet, SSM agent enabled
  - Notes: Use `NDX/SandboxAdmin` profile. The IAM **role** (not just instance profile) must be named `InnovationSandbox-ndx-localgov-ims-dev` to satisfy SCP. Security group: egress-only (no inbound). Verify SSM Session Manager connectivity. Install Git, clone repos. **Terminate after Phase 1 is complete** (~$4.60/day while running).

- [ ] **Task 0.2**: Validate Windows Fargate base image caching
  - File: N/A (Docker commands on dev box)
  - Action: Pull `mcr.microsoft.com/dotnet/framework/aspnet:4.8-windowsservercore-ltsc2022` on dev box to measure size. Then deploy a minimal Windows Fargate task using this base image to measure cold-start pull time. Compare with `mcr.microsoft.com/windows/servercore:ltsc2022` (known-cached).
  - Notes: If ASP.NET image is NOT cached (~5.5GB pull, 20+ min), pivot to building on `servercore:ltsc2022` + manual IIS/ASP.NET install. Document findings.

- [ ] **Task 0.3**: Verify ECS Exec support and multi-port mappings for Windows Fargate
  - File: N/A (AWS documentation / test deployment)
  - Action: Check AWS docs for: (a) `enableExecuteCommand` on Windows Fargate tasks — if not supported, plan for CloudWatch-only debugging and add verbose logging to entrypoint. (b) Multiple port mappings (80, 81, 82, 83) on a single Windows Fargate container — if not supported, the single-container architecture needs restructuring (reverse proxy or multiple containers in one task).
  - Notes: Both are critical assumptions. Validate before investing in Docker image work.

### Phase 1: Docker Image

- [ ] **Task 1.1**: Create Dockerfile (multi-stage Windows build)
  - File: `cloudformation/scenarios/localgov-ims/docker/Dockerfile`
  - Action: Create multi-stage Dockerfile:
    - **Stage 1 (build-ims)**: FROM `sdk:4.8-windowsservercore-ltsc2022`. Clone `localgov-ims` repo (pinned commit). `nuget restore`. `msbuild /p:configuration="Live" /p:WebPublishMethod=FileSystem /p:PublishUrl="C:/build"`. Produces 3 published app directories (PaymentPortal, Admin, Api).
    - **Stage 2 (build-govukpay)**: FROM `mcr.microsoft.com/dotnet/sdk:6.0-windowsservercore-ltsc2022`. Clone `localgov-ims-integration-govukpay` repo (pinned commit). **NuGet auth**: `ARG GITHUB_TOKEN` then `RUN dotnet nuget add source "https://nuget.pkg.github.com/LocalGovIMS/index.json" -n github -u USERNAME -p %GITHUB_TOKEN% --store-password-in-clear-text` (token only in discarded build stage, not final image). `dotnet restore && dotnet publish -c Release -o C:\app`. **Also build `efmigrate.dll`**: create a small .NET 6 console app (`efmigrate/Program.cs`) that references the GOV.UK Pay Infrastructure project's `GovUkPayDbContext` and calls `Database.Migrate()` with a connection string from `--connection` CLI arg. `dotnet publish efmigrate -c Release -o C:\efmigrate`. Stage 3 then: `COPY --from=build-govukpay C:\app C:\govukpay` and `COPY --from=build-govukpay C:\efmigrate C:\efmigrate`.
    - **Stage 3 (runtime)**: FROM `aspnet:4.8-windowsservercore-ltsc2022`. COPY published apps from build stages. COPY `entrypoint.ps1`, `seed-data.sql`, `iis-config.ps1`. Install .NET 6 ASP.NET Core runtime via `dotnet-install.ps1` script: `Invoke-WebRequest -Uri 'https://dot.net/v1/dotnet-install.ps1' -OutFile dotnet-install.ps1; ./dotnet-install.ps1 -Channel 6.0 -Runtime aspnetcore -InstallDir C:\dotnet6` (auto-resolves latest 6.0.x patch). **Always install `sqlcmd`**: download `mssql-tools` MSI via `Invoke-WebRequest -Uri 'https://go.microsoft.com/fwlink/?linkid=2142258' -OutFile sqlcmd.msi; Start-Process msiexec -ArgumentList '/i','sqlcmd.msi','/quiet','/norestart','IACCEPTMSODBCSQLLICENSETERMS=YES' -Wait`. Build `hash-password.exe` — tiny .NET Framework console app that reads password from stdin and outputs the hash. **Must use `Microsoft.AspNet.Identity.Core.PasswordHasher.HashPassword(password)`** from the NuGet package (not a hand-rolled implementation) to guarantee exact binary format compatibility (version byte 0x00 + 16-byte salt + 32-byte subkey, base64-encoded). Create `/health` files for each site. Set `ENTRYPOINT ["powershell", "-File", "C:\\entrypoint.ps1"]`.
  - Notes: Pin upstream repo commits for reproducibility. Use `--build-arg GITHUB_TOKEN` for NuGet auth. Windows containers don't support `USER` instruction the same way — run as ContainerAdministrator. The `hash-password.exe` can be built in Stage 1 (build-ims) since it targets .NET Framework 4.8.

- [ ] **Task 1.2**: Create IIS configuration script
  - File: `cloudformation/scenarios/localgov-ims/docker/iis-config.ps1`
  - Action: PowerShell script using `appcmd.exe` to:
    - Remove Default Web Site
    - Create AppPool `IMSPortal` (.NET CLR v4.0, Integrated, 32-bit disabled)
    - Create AppPool `IMSAdmin` (same config)
    - Create AppPool `IMSApi` (same config)
    - Create Site `Portal` → physical path `C:\inetpub\portal`, binding `*:80:`
    - Create Site `Admin` → physical path `C:\inetpub\admin`, binding `*:81:`
    - Create Site `Api` → physical path `C:\inetpub\api`, binding `*:82:`
    - Assign AppPools to sites
    - Add MIME mapping for extensionless files: `appcmd set config /section:staticContent /+"[fileExtension='.',mimeType='text/plain']"` (IIS won't serve extensionless files without this)
    - Create `C:\inetpub\portal\health`, `C:\inetpub\admin\health`, `C:\inetpub\api\health` with content "OK"
    - Create `C:\Uploads` directory (writable, for file import uploads)
  - Notes: Each site needs its own AppPool for isolation. IIS default site on port 80 must be removed first. The MIME mapping is critical — without it, `/health` returns 404 and ALB deregisters the target.

- [ ] **Task 1.3**: Create entrypoint script
  - File: `cloudformation/scenarios/localgov-ims/docker/entrypoint.ps1`
  - Action: PowerShell entrypoint implementing the 15-step boot sequence (IIS starts FIRST for health checks):
    1. Read env vars: `$env:DB_HOST`, `$env:DB_PASSWORD`, `$env:DB_USER`, `$env:REFERENCE_SALT`, `$env:GOVUKPAY_API_KEY`, `$env:PORTAL_URL`, `$env:ADMIN_URL`, `$env:GOVUKPAY_URL`, `$env:ADMIN_PASSWORD`
    2. **Start IIS immediately**: Run `iis-config.ps1` (creates sites with static `/health` files), then `Start-Service W3SVC`. ALB health checks now pass immediately — prevents target deregistration during boot.
    3. Wait for SQL Server: loop `Test-NetConnection $env:DB_HOST -Port 1433` with retry (max 60 attempts, 5s sleep)
    4. Create databases via `sqlcmd -b`: `IF NOT EXISTS (...) CREATE DATABASE IncomeManagement` (and `IncomeManagement_GovUkPayIntegration`). Check `$LASTEXITCODE` — `exit 1` on failure.
    5. Patch Web.config files (Portal, Admin, API): replace connection string (`Server=$env:DB_HOST;Database=IncomeManagement;User Id=$env:DB_USER;Password=$env:DB_PASSWORD;TrustServerCertificate=True`), ReferenceSalt, Environment=Demo, PortalPaymentsURL. Use PowerShell XML manipulation (`[xml]$doc = Get-Content ...`). **Note**: connection string name is `IncomeDb`, database name is `IncomeManagement`. `TrustServerCertificate=True` required because SQL Server 2022 on RDS enforces TLS and the container won't have the Amazon RDS CA bundle.
    6. Patch GOV.UK Pay `appsettings.json`: set `LocalGovImsApiUrl=http://localhost:82`, `PaymentPortalUrl=$env:PORTAL_URL`, connection string with database `IncomeManagement_GovUkPayIntegration`. Use `ConvertFrom-Json | ConvertTo-Json`
    7. Recycle IIS app pools to pick up patched configs: `& $env:windir\system32\inetsrv\appcmd recycle apppool /apppool.name:IMSPortal` (repeat for Admin, Api)
    8. Trigger EF6 migration via polling loop (cold JIT + 28 migrations may take 2-5 min): `for ($i=1; $i -le 40; $i++) { try { $r = Invoke-WebRequest http://localhost:80/ -UseBasicParsing -TimeoutSec 30; if ($r.StatusCode -eq 200) { Write-Host "Migration complete (attempt $i)"; break } } catch { Write-Host "Attempt $i: $_"; Start-Sleep 15 } }; if ($i -gt 40) { Write-Error "EF6 migration failed after 10 min"; exit 1 }`
    9. Check idempotency marker: `sqlcmd -b -Q "SELECT 1 FROM IncomeManagement.sys.tables WHERE name='_SeedComplete'"`. If exists, skip steps 10-12.
    10. Run custom seed SQL: `sqlcmd -b -d IncomeManagement -i C:\seed-data.sql -v GOVUKPAY_API_KEY="$env:GOVUKPAY_API_KEY"`. Check `$LASTEXITCODE`. Then: `sqlcmd -b -Q "CREATE TABLE IncomeManagement.dbo._SeedComplete (SeededAt DATETIME DEFAULT GETDATE())"`
    11. Update ALL PaymentIntegrations rows (in case DemoData.sql created >1): `sqlcmd -b -Q "UPDATE PaymentIntegrations SET BaseUri='$env:GOVUKPAY_URL'"`. Log actual URL.
    12. Hash and set admin password: `$hash = $env:ADMIN_PASSWORD | & C:\tools\hash-password.exe`; then `sqlcmd -b -Q "UPDATE AspNetUsers SET PasswordHash='$hash' WHERE UserName='admin'"`. Set all seeded users to same password.
    13. Run GOV.UK Pay EF Core migrations: `& C:\dotnet6\dotnet.exe C:\govukpay\efmigrate.dll --connection "Server=$env:DB_HOST;Database=IncomeManagement_GovUkPayIntegration;User Id=$env:DB_USER;Password=$env:DB_PASSWORD;TrustServerCertificate=True"` (small console app built in Docker stage that calls `Database.Migrate()`). If `dotnet ef` tooling unavailable at runtime, this is the cleaner alternative.
    14. Start Kestrel for GOV.UK Pay in a background restart loop using `Start-Process -NoNewWindow` (NOT `Start-Job` — job output doesn't reach container stdout/CloudWatch): `Start-Process powershell -NoNewWindow -ArgumentList '-Command', 'while ($true) { Write-Host \"[Kestrel] Starting GOV.UK Pay on port 83\"; & C:\dotnet6\dotnet.exe C:\govukpay\LocalGovIms.Integration.GovUKPay.Web.dll --urls http://0.0.0.0:83 2>&1 | ForEach-Object { Write-Host \"[Kestrel] $_\" }; Write-Host \"[Kestrel] Exited, restarting in 5s\"; Start-Sleep 5 }'`. Auto-restarts on crash, `[Kestrel]` prefix for CloudWatch filtering. IIS stays up via ServiceMonitor.
    15. `& C:\ServiceMonitor.exe w3svc`
  - Notes: All `sqlcmd` calls use `-S $env:DB_HOST -U $env:DB_USER -P $env:DB_PASSWORD -b` (batch abort on error). `hash-password.exe` reads password from stdin (not CLI arg — avoids process listing exposure). Both `hash-password.exe` and `efmigrate.dll` built in Docker build stages. Add verbose `Write-Host` logging at every step for CloudWatch debugging. **SQL injection safety**: env vars used in SQL string interpolation are safe because (a) DB password excludes single quotes via `excludeCharacters`, (b) CloudFront domain names contain no special chars, (c) GOV.UK Pay API key is alphanumeric. Add defensive comment in entrypoint documenting this.

- [ ] **Task 1.4**: Create comprehensive seed data SQL
  - File: `cloudformation/scenarios/localgov-ims/docker/seed-data.sql`
  - Action: SQL script (runs AFTER DemoData.sql has created base data) containing:
    - **Additional funds**: Expand from DemoData.sql's base set to full 10 funds (Council Tax, Business Rates/NNDR, Housing Rents, Parking Fines, Planning Fees, Leisure Services, Commercial Waste, Sundry Debtors, Garden Waste, Building Control)
    - **Fund metadata**: `IsABasketFund=True` for citizen-payable funds, `GovUkPay.Api.Key` set to `$(GOVUKPAY_API_KEY)` placeholder (replaced by entrypoint)
    - **Account Holders (200+)**: Realistic names (UK-style), addresses, account reference numbers with valid check digits per fund's algorithm
    - **Processed Transactions (500+)**: Spread across 3 months, all funds, varied amounts (Council Tax: £150-£1,800, Parking: £35-£70, etc.), varied MOPs, realistic entry dates
    - **Suspense Items (30+)**: Unallocated BACS payments with amounts that don't match any account holder — realistic scenarios (wrong reference, partial payment, overpayment)
    - **eReturn Templates**: 3 offices (Town Hall Reception, Leisure Centre, Parking Services), each with cash/cheque lines, cashing-up amounts
    - **eReturn Records**: 10 completed eReturns with cash/cheque breakdowns across 2 weeks
    - **Import Processing Rules**: BACS auto-allocation rules (match on reference → allocate to fund), Direct Debit rules, unmatched → suspense rules
    - **Import History**: 5 completed imports (BACS/DD files) with 50+ rows each, mix of allocated and suspense
    - **Staff Users (5)**: Each with ASP.NET Identity record + IMS User record + role assignments:
      1. `admin` — System Admin (all 21 roles)
      2. `finance.officer` — Finance Admin (transactions, suspense, transfers, eReturns)
      3. `cashier` — Cashier (payments, eReturns for their office only)
      4. `payments.supervisor` — Supervisor (transactions, refunds, user management)
      5. `auditor` — Read-Only (view transactions, view eReturns, view imports)
    - **FundGroups**: "All Revenue", "Housing", "Parking & Enforcement" — with user access mappings
    - **VAT codes**: S (Standard 20%), Z (Zero), X (Exempt), R (Reduced 5%)
  - Notes: Use `SQLCMD` variables (`:setvar`) for the GOV.UK Pay API key — entrypoint must pass `-v GOVUKPAY_API_KEY="$env:GOVUKPAY_API_KEY"` to `sqlcmd`. All INSERT statements should be idempotent (check before insert or use MERGE). Wrap entire seed in a transaction (`BEGIN TRAN ... COMMIT`) — partial failure rolls back cleanly, marker table not created, retry runs full seed. Transaction dates should be relative to GETDATE() so data always looks recent.

- [ ] **Task 1.5**: Build and test Docker image on dev box
  - File: N/A (Docker commands on dev box)
  - Action: Build image locally, run container with RDS endpoint env vars, verify:
    - All 3 IIS sites respond on ports 80, 81, 82
    - GOV.UK Pay Kestrel responds on port 83
    - EF6 migrations complete successfully
    - DemoData.sql + custom seed data populates correctly
    - Admin login works at port 81 with seeded credentials
    - Portal displays payment form at port 80
    - API Swagger UI accessible at port 82
  - Notes: May need to temporarily provision an RDS instance manually for testing. Document any issues and fixes.

### Phase 2: CDK Infrastructure

- [ ] **Task 2.1**: Scaffold CDK project
  - Files: `cloudformation/scenarios/localgov-ims/cdk/package.json`, `cdk.json`, `tsconfig.json`, `bin/app.ts`
  - Action: Create CDK TypeScript project structure:
    - `package.json`: `aws-cdk-lib@2.241.0`, `constructs@10.5.1`, `typescript@~5.9.3`, `aws-cdk@2.1110.0` (devDep)
    - `cdk.json`: `app: "npx ts-node --prefer-ts-exts bin/app.ts"`, output: `../cdk.out`
    - `tsconfig.json`: Standard CDK TypeScript config
    - `bin/app.ts`: Instantiate `LocalGovImsStack` with NO `env` property. Add `IsbRoleNamingAspect` to stack.
  - Notes: Copy structure from `bops-planning/cdk/` as starting point.

- [ ] **Task 2.2**: Create networking construct
  - File: `cloudformation/scenarios/localgov-ims/cdk/lib/constructs/networking.ts`
  - Action: Following localgov-drupal pattern:
    - VPC: 2 AZs, public-only subnets, NO NAT gateways
    - ALB Security Group: inbound 80, 8080, 8082 from `0.0.0.0/0` (one per CloudFront distribution). Outbound: TCP to Fargate SG on ports 80, 81, 83 (container ports behind each ALB listener)
    - Fargate Security Group: inbound TCP 80, 81, 83 from ALB SG (port 82/API is localhost-only, no ALB inbound needed). Outbound: ALL (AWS API access + GOV.UK Pay API)
    - RDS Security Group: inbound TCP 1433 from Fargate SG only. No outbound.
  - Notes: Export VPC, subnets, all security groups, ALB via construct props interface. Explicitly set `enableDnsSupport: true` and `enableDnsHostnames: true` on VPC (required for RDS endpoint hostname resolution within VPC).

- [ ] **Task 2.3**: Create database construct
  - File: `cloudformation/scenarios/localgov-ims/cdk/lib/constructs/database.ts`
  - Action: RDS SQL Server Express instance (NOT Aurora — SQL Server doesn't have Aurora Serverless):
    - Engine: `rds.DatabaseInstanceEngine.sqlServerEx({ version: rds.SqlServerEngineVersion.VER_16 })`
    - Instance: `ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM)`
    - Credentials: `rds.Credentials.fromGeneratedSecret('admin', { excludeCharacters: "' \"\\/@#%:<>?[]^`{|}$&()+,;=~" })` (RDS SQL Server reserves `sa` — use `admin` as master username)
    - No hardcoded secret name
    - `removalPolicy: cdk.RemovalPolicy.DESTROY`, `deletionProtection: false`
    - `allocatedStorage: 20` (GB), `maxAllocatedStorage: 50`
    - Subnet group: public subnets, `publiclyAccessible: false`
    - Security group from networking construct
    - `backupRetention: cdk.Duration.days(1)`
  - Notes: SQL Server Express on RDS requires `db.t3.medium` minimum in some regions — verify. Export endpoint, port, secret for compute construct.

- [ ] **Task 2.4**: Create compute construct
  - File: `cloudformation/scenarios/localgov-ims/cdk/lib/constructs/compute.ts`
  - Action: ECS Fargate (Windows) + ALB:
    - **Cluster**: `new ecs.Cluster` in VPC
    - **Task Definition**: `new ecs.FargateTaskDefinition` with:
      - `cpu: 2048, memoryLimitMiB: 4096`
      - `runtimePlatform: { cpuArchitecture: ecs.CpuArchitecture.X86_64, operatingSystemFamily: ecs.OperatingSystemFamily.WINDOWS_SERVER_2022_CORE }`
      - Execution role: `InnovationSandbox-ndx-ims-exec`
      - Task role: `InnovationSandbox-ndx-ims-task`
    - **Container**: image from `ghcr.io/co-cddo/ndx_try_aws_scenarios-localgov-ims:latest`. Note: `:latest` tag means CloudFormation won't detect image changes — run `aws ecs update-service --force-new-deployment` after pushing new images, or override tag via `CfnParameter`.
      - Port mappings: 80, 81, 82, 83
      - Environment variables: DB_HOST, DB_USER, DB_PASSWORD (unsafeUnwrap), REFERENCE_SALT (generated secret), GOVUKPAY_API_KEY (CfnParameter). CloudFront URLs (PORTAL_URL, ADMIN_URL, GOVUKPAY_URL) added AFTER cloudfront construct is created via `container.addEnvironment()` — called from main stack after both compute and cloudfront constructs exist. CDK evaluates lazily so this resolves to CloudFormation `Fn::GetAtt` references at synth time.
      - Health check: Use exec form to avoid cmd.exe `$` interpretation: `CMD ["powershell", "-Command", "(Invoke-WebRequest -Uri http://localhost:80/health -UseBasicParsing).StatusCode -eq 200"]`. Alternatively, create `C:\healthcheck.ps1` in Dockerfile and use `CMD-SHELL powershell -File C:\healthcheck.ps1`.
      - `stopTimeout: cdk.Duration.seconds(120)` (Windows containers need longer graceful shutdown for IIS + ServiceMonitor)
      - Logging: CloudWatch log group `/ndx-ims/production`, `removalPolicy: cdk.RemovalPolicy.DESTROY` (consistent with AC 1 "all DeletionPolicy: Delete" and CI validation)
    - **Fargate Service**: `desiredCount: 1`, `assignPublicIp: true`, `healthCheckGracePeriod: Duration.minutes(15)`, `circuitBreaker: { rollback: true }` (prevents 3-hour CFN hang on task failures). `enableExecuteCommand`: set to `true` ONLY if Task 0.3 confirms Windows Fargate support — if unsupported, omit this flag and rely on CloudWatch logs for debugging.
    - **ALB**: Application Load Balancer in public subnets
      - Listener port 80 → Target Group (container port 80) — Portal
      - Listener port 8080 → Target Group (container port 81) — Admin
      - Listener port 8082 → Target Group (container port 83) — GOV.UK Pay
      - Portal + Admin target groups: health check on `/health` (static IIS file), interval 30s, timeout 10s, healthy 2, unhealthy 5
      - GOV.UK Pay target group: health check on `/` (Kestrel root — returns 200 when app is running), interval 30s, timeout 10s, healthy 2, unhealthy 10 (higher threshold because Kestrel starts late in boot). Alternatively, add a `/health` endpoint to the GOV.UK Pay ASP.NET Core app via middleware: `app.MapGet("/health", () => "OK");`
    - **Admin password**: Generate secret, resolve via unsafeUnwrap, pass as ADMIN_PASSWORD env var
    - **ReferenceSalt**: Generate secret (32 chars), resolve via unsafeUnwrap, pass as REFERENCE_SALT env var
  - Notes: CloudFront URL circular dependency — use `cdk.Lazy.string` for env vars that reference CloudFront distribution domain names. These resolve at synth time to CloudFormation `Fn::GetAtt` references, which CFN resolves at deploy time.

- [ ] **Task 2.5**: Create CloudFront construct
  - File: `cloudformation/scenarios/localgov-ims/cdk/lib/constructs/cloudfront.ts`
  - Action: 3 CloudFront distributions (following BOPS cloudfront.ts pattern):
    - **Portal Distribution**: origin → ALB:80, REDIRECT_TO_HTTPS, CACHING_DISABLED, ALL_VIEWER, ALLOW_ALL methods
    - **Admin Distribution**: origin → ALB:8080 (`httpPort: 8080`), same policies
    - **GOV.UK Pay Distribution**: origin → ALB:8082 (`httpPort: 8082`), same policies
  - Notes: Export all 3 distribution domain names for CloudFormation outputs and compute construct env vars.

- [ ] **Task 2.6**: Create main stack
  - File: `cloudformation/scenarios/localgov-ims/cdk/lib/localgov-ims-stack.ts`
  - Action: Orchestrate constructs:
    - Instantiate: networking → database → compute (passing networking + database props) → cloudfront (passing ALB)
    - `CfnParameter` for `GovUkPayApiKey` (NoEcho=true, description for QuickCreate form)
    - `IsbRoleNamingAspect` applied to stack
    - CloudFormation Outputs:
      1. `AdminPortalUrl` — `https://{admin CF domain}/Account/Login`
      2. `PaymentPortalUrl` — `https://{portal CF domain}`
      3. `AdminUsername` — `admin`
      4. `AdminPassword` — resolved from generated secret
      5. `CloudWatchLogsUrl` — direct link to `/ndx-ims/production` log group
      6. `StackDescription` — "LocalGov IMS Income Management System..."
    - Empty-bucket custom resource (Lambda) for any S3 buckets if needed (following BOPS pattern)
  - Notes: Ensure no `env` property on stack. Test `cdk synth` produces valid template.

- [ ] **Task 2.7**: CDK snapshot tests
  - File: `cloudformation/scenarios/localgov-ims/cdk/test/localgov-ims.test.ts`
  - Action: Jest snapshot test:
    - Synthesize stack
    - Assert template matches snapshot
    - Assert key resources present: VPC, RDS, ECS Service, ALB, 3 CloudFront distributions, IAM roles with ISB prefix
    - Assert no `AssetParameters` or `cdk-bootstrap` references
  - Notes: Follow existing test patterns from localgov-drupal/bops.

### Phase 3: CI/CD

- [ ] **Task 3.1**: Create Windows Docker build workflow
  - File: `.github/workflows/docker-build-ims.yml`
  - Action: GitHub Actions workflow:
    - Trigger: push to main (docker/localgov-ims changes) + manual dispatch + PRs
    - Runner: `windows-latest`
    - Steps:
      1. Checkout
      2. Login to GHCR (`docker/login-action`)
      3. Docker metadata (tags: `sha-<commit>` + `latest` on main)
      4. `docker build` with `--build-arg GITHUB_TOKEN=${{ secrets.GITHUB_TOKEN }}`
      5. `docker push` (main/dispatch only)
      6. Step summary with image details
    - Context: `cloudformation/scenarios/localgov-ims/`
    - Image: `ghcr.io/co-cddo/ndx_try_aws_scenarios-localgov-ims`
  - Notes: Cannot use `docker/build-push-action` with buildx on Windows — use native `docker build` and `docker push` commands (add warning comment in workflow YAML to prevent accidental use). No multi-arch (Windows x86_64 only). Cache: may need to use `--cache-from` registry cache. Windows runner billing: 2x Linux rate (~$0.24-0.32/build). **After first push**: set GHCR package visibility to PUBLIC via GitHub UI (Settings > Packages > localgov-ims > Danger Zone > Change visibility) — required for Fargate to pull without auth.

- [ ] **Task 3.2**: Add CDK synth job to deploy-blueprints workflow
  - File: `.github/workflows/deploy-blueprints.yml`
  - Action: Add `synth-localgov-ims` job (following `synth-localgov-drupal` pattern):
    - Runner: `ubuntu-latest`
    - Working dir: `cloudformation/scenarios/localgov-ims/cdk`
    - Steps: npm ci → npm test → cdk synth → strip bootstrap → validate → write template.yaml
    - Artifact: `localgov-ims-template`
    - Add to `deploy` job's `needs` array and artifact download
    - Add path trigger: `cloudformation/scenarios/localgov-ims/**`
  - Notes: Template post-processing script must handle Windows Fargate-specific resources.

- [ ] **Task 3.3**: Register scenario in ISB hub
  - File: `cloudformation/isb-hub/lib/isb-hub-stack.ts`
  - Action: Add to SCENARIOS array:
    ```typescript
    { name: 'localgov-ims', description: 'LocalGov IMS Income Management System - Windows containers' }
    ```
  - Notes: This creates the S3 BucketDeployment + StackSet for the new scenario.

### Phase 4: Portal Integration

- [ ] **Task 4.1**: Add scenario to scenarios.yaml
  - File: `src/_data/scenarios.yaml`
  - Action: Add complete scenario entry following schema:
    - `id: localgov-ims`
    - `name: "LocalGov IMS"`
    - `headline: "Deploy a full open-source income management system with live GOV.UK Pay integration"`
    - `bestFor: "Finance teams evaluating council income management systems"`
    - `description`: 150-word description covering Windows containers + GOV.UK Pay + comprehensive seed data
    - `difficulty: advanced`
    - `timeEstimate: "35 to 55 minutes"` (accounts for Windows image pull variability)
    - `primaryPersona: finance`
    - `securitySummary: "Isolated sandbox session with SQL Server encryption and CloudFront HTTPS termination"`
    - `awsServices`: ECS Fargate, RDS SQL Server, CloudFront, VPC, ALB, CloudWatch, Secrets Manager
    - `deployment`:
      - templateUrl, templateS3Url, region us-east-1, stackNamePrefix ndx-try-localgov-ims
      - capabilities: [CAPABILITY_IAM, CAPABILITY_NAMED_IAM]
      - `deploymentTime: "35 to 55 minutes"`
      - parameters: `[{ name: "GovUkPayApiKey", value: "", description: "GOV.UK Pay sandbox API key from your test account" }]`
      - outputs: [AdminPortalUrl, PaymentPortalUrl, AdminUsername, AdminPassword, CloudWatchLogsUrl]
      - deploymentPhases (7 phases)
      - costBreakdown:
        - Windows Fargate (2 vCPU / 4GB): ~$0.96/hr (~$23/day, includes Windows licensing surcharge)
        - RDS SQL Server Express db.t3.medium: ~$0.086/hr (~$2.06/day, License Included)
        - ALB: ~$0.025/hr (~$0.60/day)
        - 3x CloudFront: ~$0/day (minimal traffic)
        - **Total: ~$27/day** (well within $50/24hr budget)
        - autoCleanup: "ISB terminates lease and runs AWS Nuke"
    - `sourceCode`: repoUrl, cloudformationPath, description
    - `skillsLearned`: Windows containers on AWS, .NET Framework modernisation, SQL Server on RDS, GOV.UK Pay integration, IIS on ECS Fargate
  - Notes: Validate with `npm run validate:schema` after adding. GOV.UK Pay API key is provided via StackSet parameter override — document in BLUEPRINT.md how ISB admin configures this per lease deployment.

- [ ] **Task 4.2**: Create scenario detail page
  - File: `src/scenarios/localgov-ims.njk`
  - Action: Nunjucks page with front matter:
    ```
    layout: layouts/scenario.njk
    title: "LocalGov IMS"
    description: "Deploy a full open-source income management system..."
    scenario: localgov-ims
    ```
  - Notes: Minimal template — `layouts/scenario.njk` handles all rendering from scenarios.yaml data.

- [ ] **Task 4.3**: Create walkthrough page
  - File: `src/walkthroughs/localgov-ims.njk`
  - Action: Day-in-the-life walkthrough with 5 chapters:
    1. **"A citizen pays their Council Tax"** — navigate to Portal, select Council Tax, enter account reference, enter amount, proceed to GOV.UK Pay, use test card 4242424242424242
    2. **"A finance officer reviews transactions"** — login to Admin, search transactions, view the payment just made, print receipt
    3. **"An unallocated payment arrives"** — navigate to Suspense, view items, add note, journal to correct account
    4. **"End of day cashing up"** — navigate to eReturns, create new return for Town Hall Reception, enter cash/cheque totals, submit
    5. **"Monthly bank file review"** — navigate to File Imports, view completed imports, see processing rules, check allocated vs suspense items
    - Include deployment phases section with timing estimates
    - Include "While you wait" content (overview of income management, what IMS does)
    - Include credentials card (admin username/password from CloudFormation outputs)
    - Include troubleshooting section
  - Notes: Follow existing walkthrough patterns (GOV.UK Design System, accessible, progressive disclosure).

- [ ] **Task 4.4**: Create BLUEPRINT.md
  - File: `cloudformation/scenarios/localgov-ims/BLUEPRINT.md`
  - Action: ISB registration guide following existing BLUEPRINT.md pattern:
    - S3 upload command
    - StackSet creation command with ISB role ARNs
    - ISB console registration steps
    - Lease template association
    - Parameters: GovUkPayApiKey
    - Timeout: 60 minutes (longest scenario — Windows image pull + RDS + seed)
  - Notes: Follow `localgov-drupal/BLUEPRINT.md` structure exactly.

### Phase 5: Validation & Polish

- [ ] **Task 5.1**: Full stack deployment test
  - File: N/A (AWS CLI / Console)
  - Action: Deploy complete stack in sandbox account using `aws cloudformation deploy`. Verify:
    - All CloudFormation outputs populated
    - Admin portal accessible and login works
    - Payment Portal accessible
    - Make a test payment end-to-end (Portal → GOV.UK Pay → confirm in Admin)
    - All seed data visible (transactions, suspense, eReturns, imports)
    - CloudWatch logs streaming
  - Notes: Use `NDX/SandboxAdmin` profile. Budget check: verify running cost < $50/24hr.

- [ ] **Task 5.2**: Screenshot pipeline
  - File: N/A (Playwright automation)
  - Action: Capture screenshots for portal scenario page:
    - Admin dashboard
    - Transaction search results
    - Payment Portal payment form
    - GOV.UK Pay test card page
    - Suspense management
    - eReturn form
  - Notes: Use `aws-sso-util console launch` + Playwright pattern from CLAUDE.md for any console screenshots.

- [ ] **Task 5.3**: Schema validation + portal build test
  - File: N/A (npm commands)
  - Action: `npm run validate:schema && npm run build && npm test`. Fix any failures.
  - Notes: Must pass before merge to main.

### Acceptance Criteria

**Infrastructure:**
- [ ] AC 1: Given the CDK stack is synthesised, when `cdk synth` runs, then a valid CloudFormation template is produced with no `AssetParameters`, no `cdk-bootstrap` references, all `DeletionPolicy: Delete`, and all IAM role names prefixed `InnovationSandbox-ndx-`
- [ ] AC 2: Given the CloudFormation template is deployed to a sandbox account, when the stack reaches `CREATE_COMPLETE`, then all 6 outputs are populated (AdminPortalUrl, PaymentPortalUrl, AdminUsername, AdminPassword, CloudWatchLogsUrl, StackDescription)
- [ ] AC 3: Given the stack is deployed, when the total deployment time is measured, then it completes within 60 minutes (target: 35-45 minutes)
- [ ] AC 4: Given the stack is running for 24 hours, when AWS Cost Explorer is checked, then the total cost is under $50

**Container & Seed:**
- [ ] AC 5: Given the Docker image is built, when `docker run` is executed with valid env vars, then all 4 services start (IIS ports 80/81/82, Kestrel port 83) and `/health` returns 200 on each
- [ ] AC 6: Given the container starts against an empty RDS instance, when the entrypoint completes, then both databases exist (`IncomeManagement`, `IncomeManagement_GovUkPayIntegration`), all EF6 + EF Core migrations have run, and seed data is populated
- [ ] AC 7: Given seed data has been populated, when querying the database, then there are 10 funds, 6+ MOPs, 200+ account holders, 500+ processed transactions, 30+ suspense items, 5 staff users with correct role assignments, eReturn templates for 3 offices, and import processing rules
- [ ] AC 8: Given the container has already been seeded (marker table exists), when the container restarts, then seed SQL is NOT re-executed (idempotency)

**GOV.UK Pay Integration:**
- [ ] AC 9: Given the stack is deployed with a valid GOV.UK Pay sandbox API key, when a user navigates to the Payment Portal, selects Council Tax, enters a valid account reference and amount, and proceeds to pay, then they are redirected to the GOV.UK Pay hosted payment page
- [ ] AC 10: Given a user is on the GOV.UK Pay payment page, when they enter test card 4242424242424242 with any future expiry and any CVV and submit, then the payment is authorised and the user is redirected back to the Payment Portal success page
- [ ] AC 11: Given a payment has been completed via GOV.UK Pay, when a staff user logs into the Admin portal and searches for the transaction, then the payment appears as a processed transaction with correct amount, fund, MOP, and payment reference

**Admin Portal:**
- [ ] AC 12: Given the Admin portal is accessible, when the user logs in with the seeded admin credentials, then they see the dashboard with summary widgets showing transaction totals from seed data
- [ ] AC 13: Given the user is logged into Admin, when they navigate to Suspense, then they see 30+ unallocated items and can add notes and journal items to accounts
- [ ] AC 14: Given the user is logged into Admin, when they navigate to eReturns, then they see templates for 3 offices and can create a new cash/cheque return
- [ ] AC 15: Given the user is logged into Admin, when they navigate to File Imports, then they see 5 completed imports with allocated and suspense rows

**CI/CD:**
- [ ] AC 16: Given changes are pushed to `cloudformation/scenarios/localgov-ims/docker/`, when the `docker-build-ims.yml` workflow runs on `windows-latest`, then the Docker image is built and pushed to `ghcr.io/co-cddo/ndx_try_aws_scenarios-localgov-ims:latest`
- [ ] AC 17: Given changes are pushed to `cloudformation/scenarios/localgov-ims/cdk/`, when the `deploy-blueprints.yml` workflow runs, then the CDK synth job produces a valid `template.yaml` and uploads it to the ISB blueprints S3 bucket

**Portal:**
- [ ] AC 18: Given the scenarios.yaml entry is added, when `npm run validate:schema` runs, then validation passes with no errors
- [ ] AC 19: Given the portal is built, when a user navigates to the LocalGov IMS scenario page, then they see the full scenario description, deployment button, walkthrough link, and all metadata (difficulty, time, services, skills)
- [ ] AC 20: Given the walkthrough page exists, when a user reads through all 5 chapters, then each chapter provides clear step-by-step instructions with screenshots matching the deployed system

**Resilience:**
- [ ] AC 21: Given the container is running with all services healthy, when the GOV.UK Pay Kestrel process (port 83) crashes, then IIS sites on ports 80/81/82 continue to function (degraded mode — payments unavailable but admin/API still work, container stays alive via ServiceMonitor)

## Additional Context

### Dependencies

- LocalGov IMS source: https://github.com/LocalGovIMS/localgov-ims (AGPLv3)
- GOV.UK Pay integration: https://github.com/LocalGovIMS/localgov-ims-integration-govukpay
- GOV.UK Pay API client: https://github.com/LocalGovIMS/localgov-ims-integration-govukpay-apiclient
- IMS API client: https://github.com/LocalGovIMS/localgov-ims-apiclient
- GOV.UK Pay sandbox API key (user has obtained)
- Base images from MCR:
  - Build: `mcr.microsoft.com/dotnet/framework/sdk:4.8-windowsservercore-ltsc2022` (MSBuild + NuGet)
  - Runtime: `mcr.microsoft.com/dotnet/framework/aspnet:4.8-windowsservercore-ltsc2022` (IIS + .NET 4.8)
  - .NET 6 SDK: `mcr.microsoft.com/dotnet/sdk:6.0-windowsservercore-ltsc2022` (for GOV.UK Pay integration build stage — must be Windows variant, not Linux)
- GitHub token for NuGet restore of `LocalGovImsApiClient@1.5.0` + `GovUKPayApiClient@1.1.0` (GOV.UK Pay build only)
- Sandbox account with `NDX/SandboxAdmin` profile (available)
- GitHub Actions `windows-latest` runner (for Docker build workflow)

### Testing Strategy

- **CDK snapshot tests** (Jest): Validate synthesised template structure against baseline
- **Schema validation**: `npm run validate:schema` — validates new scenarios.yaml entry
- **Docker build validation**: Build image on Windows EC2 dev box; verify all 4 IIS sites respond on correct ports
- **Seed data validation**: Verify EF6 migrations run, DemoData.sql populates, custom seed SQL executes, admin login works
- **GOV.UK Pay E2E**: Make test payment through Portal → GOV.UK Pay sandbox → verify transaction appears in Admin
- **Portal E2E** (Playwright): Scenario page renders, walkthrough content correct, deployment links work
- **CloudFormation deploy test**: Full stack deploy in sandbox account, verify all outputs accessible

### Notes

- This is the first Windows container scenario in NDX:Try — establishes patterns for future .NET Framework workloads
- GOV.UK Pay test card: 4242 4242 4242 4242, any future expiry, any CVV
- Admin login: DemoData.sql seeds users with dummy password hash. Entrypoint then overrides with generated admin password via `hash-password.exe` (ASP.NET Identity v2 PBKDF2 hasher built in Docker build stage). Password generated by Secrets Manager, resolved at deploy time via `unsafeUnwrap()`, displayed in CloudFormation outputs. All 5 seeded staff users get the same password for demo simplicity.
- Main IMS NuGet: ALL from nuget.org — no GitHub Packages needed for core build
- .NET Framework 4.8.1 requires Windows containers — cannot run on macOS Docker Desktop, use Windows EC2 dev box
- The "wow" narrative: "full .NET Framework Windows workload on AWS" + live GOV.UK Pay payment flow as interactive hook
- Budget: $50/24hr — check in if trending over
- GOV.UK Pay integration has 3 background job endpoints — for demo, these can be called manually or ignored (payments still process synchronously)
- GOV.UK Pay integration session timeout: 20 minutes — sufficient for demo
- Admin portal OWIN cookie auth: 1-day sliding expiry — user won't get logged out during demo
- File import upload directory: `C:\Uploads` — created in `iis-config.ps1`, writable. Fargate ephemeral storage (files lost on restart, acceptable for demo). Walkthrough notes imports as "view seeded data" not "upload new files"
- IMS uses Unity DI container — each project has `UnityConfig.cs` registering all dependencies
- API has `maxRequestLength="2147483647"` — no file size limits for import uploads
- GOV.UK Pay API key is per-fund (stored in `FundMetadata` as `GovUkPay.Api.Key`) — seed one key across all basket-enabled funds
