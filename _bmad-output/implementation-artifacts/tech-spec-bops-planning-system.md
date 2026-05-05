---
title: 'BOPS Planning System - NDX:Try Scenario Deployment'
slug: 'bops-planning-system'
created: '2026-03-16'
status: 'done'
baseline_commit: 'e13828c5ab8db16b150d944ff03aab36da2d62ac'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['AWS CDK (TypeScript)', 'ECS Fargate', 'Aurora PostgreSQL Serverless v2 (PostGIS 3)', 'ElastiCache Redis 7.0', 'S3', 'ALB (multi-listener)', 'CloudFront', 'ghcr.io (GitHub Container Registry)', 'Ruby 3.4.7 / Rails 8.1', 'Ruby 3.4.1 / Rails 7.2 (applicants)']
files_to_modify:
  - 'cloudformation/scenarios/bops-planning/ (new CDK project)'
  - 'cloudformation/scenarios/bops-planning/docker/bops/Dockerfile'
  - 'cloudformation/scenarios/bops-planning/docker/bops-applicants/Dockerfile'
  - 'cloudformation/scenarios/bops-planning/docker/bops/scripts/seed_sample_data.rb'
  - 'cloudformation/scenarios/bops-planning/docker/bops/config/initializers/default_local_authority.rb'
  - 'cloudformation/scenarios/bops-planning/docker/bops/entrypoint.sh'
  - '.github/workflows/docker-build-bops.yml'
  - 'src/_data/scenarios.yaml'
  - 'src/scenarios/bops-planning.njk'
  - 'src/_data/screenshots/bops-planning.yaml'
  - 'cloudformation/scenarios/bops-planning/BLUEPRINT.md'
code_patterns:
  - 'ISB role naming: InnovationSandbox-ndx-bops-{component} (hardcoded where possible, CDK Aspect needed for Provider framework roles)'
  - 'CDK modular constructs: networking.ts, database.ts, redis.ts, storage.ts, compute.ts, cloudfront.ts'
  - 'ghcr.io image reference: ecs.ContainerImage.fromRegistry()'
  - 'CloudFront HTTPS termination with CachePolicy.CACHING_DISABLED'
  - 'Public-only subnets, 0 NAT gateways'
  - 'Secrets Manager with unsafeUnwrap() — ISB SCP blocks runtime reads'
  - 'Health check: /healthcheck endpoint (BOPS-specific, differs from LocalGov Drupal /health)'
test_patterns:
  - 'Deploy to sandbox via NDX/SandboxUser + NDX/SandboxAdmin profiles'
  - 'Verify BOPS web UI at CloudFront URL'
  - 'Verify applicants portal at ALB:8080'
  - 'Verify seed data: 80 planning applications across 7 types'
  - 'Verify Sidekiq worker running (scheduled jobs executing)'
  - 'Verify PDF generation (officer report via Grover/Chrome)'
  - 'Verify OS Maps tiles rendering'
  - 'Verify stack deletion completes cleanly'
---

# Tech-Spec: BOPS Planning System - NDX:Try Scenario Deployment

**Created:** 2026-03-16

## Overview

### Problem Statement

UK councils exploring digital planning transformation need a way to experience BOPS (Back Office Planning System) without the complexity of standing up infrastructure themselves. The BOPS Terraform repository is private, making independent deployment impossible for evaluators. NDX:Try needs a one-click deployable BOPS scenario so councils can explore the system with realistic sample data, understand the benefits of data-driven planning workflows, and build an evidence pack for adoption decisions.

### Solution

Create a CDK-based CloudFormation deployment of BOPS (back-office + applicants portal) on AWS ECS Fargate with Aurora PostgreSQL Serverless v2 (PostGIS), ElastiCache Redis, and ALB. The deployment includes:
- Docker images pre-built and published to ghcr.io via GitHub Actions (two images: bops, bops-applicants), pulled at deploy time via `ContainerImage.fromRegistry()`
- 80 realistic sample planning applications across 7 types and varied statuses
- ECS Fargate seed task (CloudFormation custom resource) that runs `rails db:prepare`, loads seeds, and generates sample planning applications on first deploy
- Single-tenant configuration with a demo council using `DEFAULT_LOCAL_AUTHORITY` env var fallback (avoids subdomain DNS complexity)
- Graceful mocking of external services (GOV.UK Notify, PlanX, GOV.UK Pay) with Ordnance Survey maps enabled via seeded API key
- ISB-compatible role naming and auto-cleanup tagging
- Accompanying NDX:Try website pages with screenshots and guided walkthrough

### Scope

**In Scope:**
- CDK project producing a CloudFormation template for full BOPS deployment
- BOPS back-office (web + Sidekiq worker) on ECS Fargate — separate ECS services for web and worker
- BOPS applicants portal on ECS Fargate (same cluster, separate web service, separate ghcr.io image)
- Aurora PostgreSQL Serverless v2 (16) with PostGIS 3 extension (min 0.5 ACU for cost efficiency)
- ElastiCache Redis 7.0 for Sidekiq
- ALB with two listeners: port 80 → BOPS back-office, port 8080 → BOPS-Applicants portal
- CloudFront HTTPS termination for BOPS back-office (port 80 origin)
- S3 bucket for Active Storage file uploads
- ECS Fargate seed task (CloudFormation custom resource) for database initialization and sample data
- Ordnance Survey Maps API key seeded as environment variable
- Graceful disable/mock of GOV.UK Notify, PlanX, GOV.UK Pay
- ISB SCP-compliant IAM role naming (InnovationSandbox-ndx-* prefix)
- BLUEPRINT.md for ISB lease template registration
- NDX:Try scenario page (scenarios.yaml entry + .njk page)
- Screenshot metadata configuration
- GitHub Actions workflow for Docker image builds

**Out of Scope:**
- Production-grade HA/DR configuration
- Real GOV.UK Notify integration (emails will be logged, not sent)
- Real GOV.UK Pay integration
- PlanX submission integration
- Custom domain/SSL (will use CloudFront default domain + ALB DNS)
- Multi-tenant configuration (single demo council only)
- CI/CD pipeline for BOPS updates
- AppSignal monitoring integration
- Google Tag Manager

## Context for Development

### Codebase Patterns (from LocalGov Drupal reference)

**CDK project structure** (replicate from `cloudformation/scenarios/localgov-drupal/cdk/`):
```
cloudformation/scenarios/bops-planning/
├── cdk/
│   ├── bin/app.ts                    # Entry point
│   ├── lib/
│   │   ├── bops-planning-stack.ts    # Main stack
│   │   └── constructs/
│   │       ├── networking.ts         # VPC, security groups
│   │       ├── database.ts           # Aurora PostgreSQL + PostGIS (NOT MySQL — differs from LocalGov Drupal)
│   │       ├── redis.ts              # ElastiCache Redis (L1 CfnCacheCluster — no L2 exists)
│   │       ├── storage.ts            # S3 bucket for Active Storage uploads
│   │       ├── compute.ts            # ECS Fargate (3 services + seed task custom resource)
│   │       └── cloudfront.ts         # HTTPS termination
│   ├── package.json
│   ├── tsconfig.json
│   └── cdk.json
├── docker/
│   ├── bops/
│   │   ├── Dockerfile                # Extends upstream Dockerfile.production
│   │   ├── entrypoint.sh             # Init script with DB wait + status page
│   │   ├── scripts/
│   │   │   ├── init-bops.sh          # Initialization orchestrator
│   │   │   └── seed_sample_data.rb   # 80 sample planning applications
│   │   └── config/
│   │       └── initializers/
│   │           └── default_local_authority.rb  # Tenant fallback
│   └── bops-applicants/
│       └── Dockerfile                # Extends upstream Dockerfile.production
├── template.yaml                     # Generated CloudFormation template
└── BLUEPRINT.md                      # ISB registration guide
```

**Key patterns from LocalGov Drupal (with BOPS-specific deviations noted):**
- Modular constructs: networking, database, compute, cloudfront — each isolated with clear interfaces
- ISB role naming: Hardcode `InnovationSandbox-ndx-bops-{component}` on all explicitly created roles. **Additionally, add a CDK Aspect** (`IsbRoleNamingAspect`) to catch hidden auto-generated roles (e.g., the CDK `Provider` framework Lambda role). The Aspect should walk all `iam.CfnRole` constructs and prefix any role name not already starting with `InnovationSandbox-ndx-`. **Note**: `simply-readable-stack.ts` uses a `_toCloudFormation()` override (not a CDK Aspect) because it uses upstream constructs from a different CDK module version. For BOPS, a CDK Aspect is sufficient since all constructs are in the same module. The Aspect approach is simpler and more idiomatic.
- VPC: public-only subnets, 2 AZs, 0 NAT gateways (cost savings)
- ECS: `assignPublicIp: true`, `enableExecuteCommand: true`, `circuitBreaker.rollback: true`
- Health check: BOPS uses `/healthcheck` (NOT `/health` like LocalGov Drupal). 5-minute start period, 10-minute ALB grace period.
- CloudFront: `CachePolicy.CACHING_DISABLED`, `REDIRECT_TO_HTTPS`, default domain
- **Secrets Manager — ISB SCP blocks runtime reads.** All secrets must be injected via `secretValueFromJson('key').unsafeUnwrap()` as plaintext environment variables at CloudFormation deploy time. Do NOT use CDK's `secrets` property on container definitions. This is the same pattern as LocalGov Drupal `compute.ts:285-287`.
- **Secret names: Do NOT hardcode `secretName`** (unlike LocalGov Drupal's database construct which hardcodes `NdxDrupal/database-credentials-{mode}`). Let CFN auto-generate names to avoid 7-30 day Secrets Manager recovery window collisions on stack redeploys.
- Status page: HTML file written during initialization for user feedback (auto-refreshes)
- **Key differences from LocalGov Drupal reference**: PostgreSQL (not MySQL), PostGIS extensions, ElastiCache Redis (new, L1 only), S3 (not EFS), multiple ECS services, custom resource Provider pattern (new)

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `cloudformation/scenarios/localgov-drupal/cdk/bin/app.ts` | CDK entry point pattern |
| `cloudformation/scenarios/localgov-drupal/cdk/lib/localgov-drupal-stack.ts` | Main stack pattern |
| `cloudformation/scenarios/localgov-drupal/cdk/lib/constructs/networking.ts` | VPC + security groups pattern |
| `cloudformation/scenarios/localgov-drupal/cdk/lib/constructs/database.ts` | Aurora Serverless v2 pattern |
| `cloudformation/scenarios/localgov-drupal/cdk/lib/constructs/compute.ts` | ECS Fargate + ALB + ghcr.io pattern |
| `cloudformation/scenarios/localgov-drupal/cdk/lib/constructs/cloudfront.ts` | HTTPS termination pattern |
| `cloudformation/scenarios/localgov-drupal/docker/entrypoint.sh` | Init script with status page pattern |
| `cloudformation/scenarios/localgov-drupal/docker/scripts/init-drupal.sh` | Database init + content generation pattern |
| `.github/workflows/docker-build.yml` | GitHub Actions Docker build+push pattern |
| `src/_data/scenarios.yaml` | Scenario registration |
| `schemas/scenario.schema.json` | Schema validation for scenario entries |
| `src/scenarios/localgov-drupal.njk` | Reference scenario page template |

### Technical Decisions

1. **Single-tenant with DEFAULT_LOCAL_AUTHORITY fallback**: One demo council ("NDX Demo Borough"). Patch BOPS tenant middleware via Rails initializer:
   ```ruby
   # config/initializers/default_local_authority.rb
   Rails.application.config.after_initialize do
     BopsCore::Middleware::LocalAuthority.prepend(Module.new do
       def call(env)
         super
         env["bops.local_authority"] ||= ::LocalAuthority.find_by(subdomain: ENV["DEFAULT_LOCAL_AUTHORITY"])
         @app.call(env) # Note: super already called @app.call, so this needs adjustment
       end
     end)
   end
   ```
   Actual implementation: override the middleware's `call` method to add fallback after `find_by(subdomain:)` returns nil.

2. **Pre-built images on ghcr.io (like LocalGov Drupal)**: Docker images built via GitHub Actions workflow, pushed to:
   - `ghcr.io/co-cddo/ndx_try_aws_scenarios-bops:latest`
   - `ghcr.io/co-cddo/ndx_try_aws_scenarios-bops-applicants:latest`
   CDK references via `ecs.ContainerImage.fromRegistry()`. No per-deploy builds.

3. **Aurora PostgreSQL Serverless v2 with PostGIS**: Aurora PostgreSQL 16, min 0.5 ACU, max 2 ACU. Cluster parameter group needs:
   - `rds.allowed_extensions`: `postgis,postgis_topology,btree_gin,pg_stat_statements`
   - `shared_preload_libraries`: `pg_stat_statements`
   Two databases on the same cluster: `bops_production` (main BOPS) and `bops_applicants_production` (BOPS-Applicants, 2 tables only).

4. **ECS Fargate seed task (not Lambda)**: One-shot ECS Fargate task as CloudFormation custom resource. Same BOPS container image, entrypoint script:
   ```bash
   #!/bin/bash
   # Wait for database connectivity
   until pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; do sleep 5; done
   # Enable PostGIS extensions
   PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS postgis; CREATE EXTENSION IF NOT EXISTS btree_gin;"
   # Run Rails setup
   bundle exec rails db:prepare
   bundle exec rails db:seed
   bundle exec rails runner scripts/seed_sample_data.rb
   # Create BOPS-Applicants database
   PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -c "CREATE DATABASE bops_applicants_production;"
   # BOPS-Applicants uses standard pg adapter (NOT postgis) — postgres:// scheme is correct
   DATABASE_URL="postgres://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/bops_applicants_production" bundle exec rails db:migrate
   ```

5. **Port-based ALB routing (not path-based)**: Both BOPS and BOPS-Applicants have root-level routes that conflict. Cannot share a hostname with path prefixes. Solution:
   - ALB listener port 80 → BOPS target group (container port 3000)
   - ALB listener port 8080 → BOPS-Applicants target group (container port — verify from upstream Dockerfile, likely 80)
   - CloudFront distribution for BOPS (HTTPS, origin ALB:80)
   - BOPS-Applicants accessible via `http://ALB-DNS:8080` (HTTP only — this is a known tradeoff for demo simplicity. The applicants portal in this demo shows only read-only planning data with no real user submissions. For production, a second CloudFront distribution or custom domain with ACM certificate would be needed.)

6. **BOPS-Applicants → BOPS API connectivity**: BOPS-Applicants connects to BOPS API via `{subdomain}.{api_host}/api/v1/` with Bearer token auth. In our deployment:
   - `API_HOST` env var → ALB internal DNS (port 80)
   - `PROTOCOL` → `http`
   - `API_BEARER` → auto-generated token matching BOPS API user seed
   - Tenant resolution: since we use DEFAULT_LOCAL_AUTHORITY fallback, the subdomain doesn't matter for internal API calls

7. **Mock external services**: `NOTIFY_API_KEY` → stub invalid token (logs, doesn't send). `PAAPI_HOST` → unset (disables PlanX). No GOV.UK Pay config needed (not referenced in core flows).

8. **OS Maps API key**: `OS_VECTOR_TILES_API_KEY` env var from CloudFormation parameter (`NoEcho: true`, no default). Key stored as GitHub secret, injected at StackSet deployment via parameter override. Never appears in codebase.

9. **PDF generation**: Chrome installed in BOPS production Dockerfile. `GROVER_NO_SANDBOX=true` and `PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable` env vars.

10. **Sample data composition**: 80 applications across 7 planning types with realistic status distribution. Geographically clustered in 3-4 streets. Seed script is idempotent. **Must use AASM state machine transitions** (not raw status inserts) to avoid inconsistent state — `app.validate!`, `app.start!`, etc. Planning constraints must be manually associated (conservation area, flood zone, TPO, listed building proximity) since Planning Data Platform API is not connected.

11. **Demo credentials via CloudFormation Outputs**: `BOPSLoginUrl`, `BOPSUsername`, `BOPSPassword`, `ApplicantsPortalUrl`.

12. **Three ECS services, one cluster**:
    - `bops-web`: BOPS Rails server (Puma, port 3000), 1 vCPU / 2GB RAM, `linuxParameters.sharedMemorySize: 256` (for Chrome PDF generation)
    - `bops-worker`: BOPS Sidekiq (CMD override: `bin/sidekiq`), 0.5 vCPU / 1GB RAM
    - `bops-applicants-web`: BOPS-Applicants Rails server (verify port from upstream Dockerfile), 0.5 vCPU / 1GB RAM
    - All three share `InnovationSandbox-ndx-bops-exec` (execution role) and `InnovationSandbox-ndx-bops-task` (task role). The shared task role gives BOPS-Applicants unnecessary S3 permissions — this is an accepted tradeoff for demo simplicity. Production would use separate roles per service.
    - **ISB role naming**: All role names use `bops` prefix (not `production` like LocalGov Drupal), avoiding collision if both scenarios deploy to the same sandbox account.

13. **No RAILS_MASTER_KEY needed**: BOPS uses environment variables for all secrets (`SECRET_KEY_BASE`, `ACTIVE_RECORD_ENCRYPTION_*`, `OTP_SECRET_ENCRYPTION_KEY`). These override Rails encrypted credentials. No `RAILS_MASTER_KEY` is required unless the upstream BOPS codebase stores additional secrets in `credentials.yml.enc` — verify during implementation by checking if the app boots without it.

### BOPS Environment Variables (Complete)

| Variable | Value | Source |
| -------- | ----- | ------ |
| `RAILS_ENV` | `production` | Hardcoded |
| `DATABASE_URL` | `postgres://user:pass@aurora-host:5432/bops_production` | Secrets Manager |
| `REDIS_URL` | `redis://elasticache-host:6379/1` | Construct output |
| `SECRET_KEY_BASE` | Auto-generated 128 chars | Secrets Manager |
| `OTP_SECRET_ENCRYPTION_KEY` | Auto-generated 32 chars | Secrets Manager |
| `ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY` | Auto-generated | Secrets Manager |
| `ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY` | Auto-generated | Secrets Manager |
| `ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT` | Auto-generated | Secrets Manager |
| `DOMAIN` | ALB DNS name | Construct output |
| `APPLICANTS_DOMAIN` | `ALB-DNS:8080` | Construct output |
| `DEFAULT_LOCAL_AUTHORITY` | `ndx-demo` | Hardcoded |
| `NOTIFY_API_KEY` | `test-00000000-0000-0000-0000-000000000000-00000000-0000-0000-0000-000000000000` | Hardcoded stub |
| `OS_VECTOR_TILES_API_KEY` | Real key | CloudFormation parameter (NoEcho, no default — injected via StackSet) |
| `S3_BUCKET` | Auto-generated bucket name | Construct output |
| `AWS_REGION` | `us-east-1` | Stack region |
| `GROVER_NO_SANDBOX` | `true` | Hardcoded |
| `PUPPETEER_EXECUTABLE_PATH` | `/usr/bin/google-chrome-stable` | Hardcoded |
| `RAILS_SERVE_STATIC_FILES` | `true` | Hardcoded |
| `RAILS_LOG_TO_STDOUT` | `true` | Hardcoded |
| `BOPS_ENVIRONMENT` | `production` | Hardcoded |

### BOPS-Applicants Environment Variables

| Variable | Value | Source |
| -------- | ----- | ------ |
| `RAILS_ENV` | `production` | Hardcoded |
| `DATABASE_URL` | `postgres://user:pass@aurora-host:5432/bops_applicants_production` | Secrets Manager |
| `SECRET_KEY_BASE` | Auto-generated | Secrets Manager |
| `API_HOST` | ALB internal DNS (port 80) | Construct output |
| `PROTOCOL` | `http` | Hardcoded |
| `API_BEARER` | Matches BOPS API user token | Secrets Manager |
| `OS_VECTOR_TILES_API_KEY` | Real key | CloudFormation parameter (NoEcho, no default — injected via StackSet) |
| `RAILS_SERVE_STATIC_FILES` | `true` | Hardcoded |
| `RAILS_LOG_TO_STDOUT` | `true` | Hardcoded |

### Security Groups

| SG | Inbound | Outbound |
| -- | ------- | -------- |
| ALB | 80 from 0.0.0.0/0, 8080 from 0.0.0.0/0, 443 from 0.0.0.0/0 | Fargate SG on 3000, 80 |
| Fargate | 3000 from ALB SG, 80 from ALB SG | All (AWS APIs, external) |
| Aurora | 5432 from Fargate SG | None |
| Redis | 6379 from Fargate SG | None |

### CloudFormation Outputs

| Output | Value |
| ------ | ----- |
| `BOPSUrl` | `https://{CloudFront-domain}` |
| `BOPSLoginUrl` | `https://{CloudFront-domain}/users/sign_in` |
| `BOPSUsername` | `ndx-demo_administrator@example.com` |
| `BOPSPassword` | Link to Secrets Manager console |
| `ApplicantsPortalUrl` | `http://{ALB-DNS}:8080` |
| `CloudWatchLogsUrl` | Link to CloudWatch Logs |
| `StackDescription` | `BOPS Planning System - NDX:Try` |

## Implementation Plan

### Phase 1: Docker Images (Infrastructure Foundation)

- [ ] **Task 1.1: Create BOPS Docker image**
  - File: `cloudformation/scenarios/bops-planning/docker/bops/Dockerfile`
  - Action: Create Dockerfile that builds BOPS from source with our overlay files
  - Details:
    - **Approach**: Clone the BOPS repo into the Docker build context OUTSIDE the Dockerfile (in the GitHub Actions workflow or a build script), then COPY it in. This avoids Git dependency during Docker build and enables proper layer caching.
    - Build script (`docker/bops/build.sh`):
      ```bash
      #!/bin/bash
      BOPS_COMMIT="<pin to specific commit SHA>"
      git clone --depth 1 https://github.com/unboxed/bops.git bops-src
      cd bops-src && git checkout $BOPS_COMMIT && cd ..
      # Copy our overlay files into the cloned source
      cp config/initializers/default_local_authority.rb bops-src/config/initializers/
      cp scripts/seed_sample_data.rb bops-src/scripts/
      cp entrypoint.sh bops-src/
      # Build using upstream Dockerfile.production
      docker build -f bops-src/Dockerfile.production -t bops:latest bops-src/
      ```
    - Alternatively, the Dockerfile can use `COPY . /rails` after the upstream stages
    - Pin to a specific BOPS commit SHA (not a tag — tags are mutable) for reproducibility
    - GitHub Actions workflow should clone the repo in a separate step, copy overlays, then build
  - Notes: Image will be ~1.5GB due to Chrome. GitHub Actions has a 6-hour job timeout — BOPS build takes ~10-15 min, well within limits. The upstream Dockerfile.production EXPOSE is 3000 (confirmed from source).

- [ ] **Task 1.2: Create DEFAULT_LOCAL_AUTHORITY initializer for BOPS**
  - File: `cloudformation/scenarios/bops-planning/docker/bops/config/initializers/default_local_authority.rb`
  - Action: Create Rails initializer that patches `BopsCore::Middleware::LocalAuthority` to fall back to `ENV["DEFAULT_LOCAL_AUTHORITY"]` when subdomain lookup returns nil
  - Details:
    ```ruby
    # Patch the tenant middleware to support single-tenant deployment.
    # When no subdomain matches a local authority, fall back to DEFAULT_LOCAL_AUTHORITY.
    Rails.application.config.after_initialize do
      BopsCore::Middleware::LocalAuthority.class_eval do
        alias_method :original_call, :call
        def call(env)
          request = ActionDispatch::Request.new(env)
          la = ::LocalAuthority.find_by(subdomain: request.subdomains.first)
          la ||= ::LocalAuthority.find_by(subdomain: ENV["DEFAULT_LOCAL_AUTHORITY"]) if ENV["DEFAULT_LOCAL_AUTHORITY"]
          env["bops.local_authority"] = la
          @app.call(env)
        end
      end
    end
    ```
  - Notes: This replaces the middleware's `call` entirely rather than using `prepend`+`super` to avoid double `@app.call`

- [ ] **Task 1.3: Create BOPS entrypoint script**
  - File: `cloudformation/scenarios/bops-planning/docker/bops/entrypoint.sh`
  - Action: Create entrypoint that waits for DB connectivity, writes init status page, runs migrations if needed, then starts Puma
  - Details: Follow the LocalGov Drupal `entrypoint.sh` pattern — write auto-refreshing HTML status page to a static file path, use `pg_isready` wait loop, then exec into the main process
  - Notes: The seed task runs separately (ECS one-shot task), so the entrypoint only needs to handle migrations and startup

- [ ] **Task 1.4: Create BOPS init script**
  - File: `cloudformation/scenarios/bops-planning/docker/bops/scripts/init-bops.sh`
  - Action: Create initialization orchestrator that runs during first container startup
  - Details:
    - `wait_for_database()` — retry `pg_isready` 60 times with 5s interval
    - `update_status()` — write HTML status page (auto-refresh, progress bar)
    - `run_migrations()` — `bundle exec rails db:migrate`
    - Skip seed (handled by separate ECS seed task)
    - Signal completion via status page update

- [ ] **Task 1.5: Create BOPS-Applicants Docker image**
  - File: `cloudformation/scenarios/bops-planning/docker/bops-applicants/Dockerfile`
  - Action: Create Dockerfile that builds BOPS-Applicants from source with our overlay files (same clone-outside-Docker approach as Task 1.1)
  - Details: Simpler than BOPS — no Chrome, no Sidekiq. ~500MB final image. **Verify the PORT from upstream Dockerfile.production** — it defaults to 80 in the upstream Dockerfile (`ENV PORT=80`), but the app runs Puma which typically listens on 3000. If PORT env var is set to 80 in the Dockerfile, that's what Puma will use. Confirm by reading the upstream Dockerfile before setting the ALB target group port.
  - Notes: BOPS-Applicants uses standard `pg` adapter (NOT `postgis`) — its `database.yml` uses `adapter: postgresql`. The applicants DB does not need PostGIS extensions.

- [ ] **Task 1.6: Create DEFAULT_LOCAL_AUTHORITY initializer for BOPS-Applicants**
  - File: `cloudformation/scenarios/bops-planning/docker/bops-applicants/config/initializers/default_local_authority.rb`
  - Action: Two patches needed:
    1. **Tenant fallback**: Patch `ApplicationController` (or the `CurrentAttributes` setup) to fall back to `ENV["DEFAULT_LOCAL_AUTHORITY"]` when subdomain is empty/unmatched.
    2. **HttpClient URL construction**: The `HttpClient` (`app/services/http_client.rb`) constructs API URLs as `{protocol}://{subdomain}.{api_host}/api/v1/`. This will fail because DNS won't resolve `ndx-demo.{ALB-DNS}`. Patch the `HttpClient` to use `API_HOST` directly without prepending subdomain:
    ```ruby
    # Patch HttpClient to skip subdomain prefix in single-tenant mode
    Rails.application.config.after_initialize do
      HttpClient.class_eval do
        private
        def base_url
          # In single-tenant mode, connect directly to API_HOST without subdomain prefix
          if ENV["DEFAULT_LOCAL_AUTHORITY"]
            "#{Rails.application.config.api_protocol}://#{Rails.application.config.api_host}/api/v1/"
          else
            # Original subdomain-prefixed URL
            "#{Rails.application.config.api_protocol}://#{current_local_authority.subdomain}.#{Rails.application.config.api_host}/api/v1/"
          end
        end
      end
    end
    ```
  - Notes: Without this patch, BOPS-Applicants will attempt DNS resolution of `ndx-demo.internal-NdxBops-ALB-xxx.us-east-1.elb.amazonaws.com` which will fail. The BOPS side doesn't need this fix because its DEFAULT_LOCAL_AUTHORITY middleware handles requests without subdomains.

- [ ] **Task 1.7: Create GitHub Actions workflow for Docker builds**
  - File: `.github/workflows/docker-build-bops.yml`
  - Action: Create workflow with **two parallel jobs** (existing `docker-build.yml` only builds one image — this pattern is new)
  - Details:
    - Triggers: push to `main` on `cloudformation/scenarios/bops-planning/docker/**`, manual `workflow_dispatch`
    - **Job 1: build-bops**
      1. Checkout our repo
      2. Clone `unboxed/bops` at pinned commit SHA into `docker/bops/bops-src/`
      3. Copy overlay files into `bops-src/`
      4. `docker/build-push-action@v6`: context `docker/bops/bops-src`, Dockerfile `Dockerfile.production`
      5. Push to `ghcr.io/co-cddo/ndx_try_aws_scenarios-bops:latest` (+ `sha-{commit}` tag)
    - **Job 2: build-bops-applicants** (runs in parallel)
      1. Same approach with `unboxed/bops-applicants`
      2. Push to `ghcr.io/co-cddo/ndx_try_aws_scenarios-bops-applicants:latest`
    - Platform: `linux/amd64`
    - GitHub Actions cache for layer caching
    - Login to GHCR via `${{ secrets.GITHUB_TOKEN }}`
  - Notes: Two separate jobs (not a matrix) since the build contexts and Dockerfiles differ. The clone step runs as a shell command in the workflow, not inside the Dockerfile, for better caching.

- [ ] **Task 1.8: Build and push initial images**
  - Action: Trigger the workflow (manual dispatch or push to main) and verify both images are published to ghcr.io
  - Verification: `docker pull ghcr.io/co-cddo/ndx_try_aws_scenarios-bops:latest` succeeds

### Phase 2: CDK Infrastructure

- [ ] **Task 2.1: Scaffold CDK project**
  - File: `cloudformation/scenarios/bops-planning/cdk/`
  - Action: Initialize CDK project with TypeScript, following LocalGov Drupal structure
  - Details:
    - `cdk.json` — app command: `npx ts-node --prefer-ts-exts bin/app.ts`, output: `../cdk.out`
    - `package.json` — deps: `aws-cdk-lib ^2.241.0`, `constructs ^10.5.1`, TypeScript ~5.9
    - `tsconfig.json` — target ES2020, strict, commonjs
    - `bin/app.ts` — instantiate `BopsPlanningStack`
    - `lib/bops-planning-stack.ts` — main stack, instantiates constructs in order

- [ ] **Task 2.2: Create networking construct**
  - File: `cloudformation/scenarios/bops-planning/cdk/lib/constructs/networking.ts`
  - Action: Create VPC with public-only subnets and 4 security groups
  - Details:
    - VPC: `NdxBops-VPC`, 2 AZs, 0 NAT gateways, public /24 subnets
    - ALB SG: inbound 80, 8080, 443 from 0.0.0.0/0; outbound to Fargate SG on 3000, 80
    - Fargate SG: inbound 3000, 80 from ALB SG; outbound all
    - Aurora SG: inbound 5432 from Fargate SG
    - Redis SG: inbound 6379 from Fargate SG
  - Notes: Follow `localgov-drupal/cdk/lib/constructs/networking.ts` pattern exactly, adding Redis SG

- [ ] **Task 2.3: Create database construct**
  - File: `cloudformation/scenarios/bops-planning/cdk/lib/constructs/database.ts`
  - Action: Create Aurora PostgreSQL Serverless v2 cluster with PostGIS support
  - **WARNING: LocalGov Drupal uses Aurora MySQL — this construct CANNOT be copy-pasted. Must be written from scratch for PostgreSQL.**
  - Details:
    - Engine: `rds.DatabaseClusterEngine.auroraPostgres({ version: rds.AuroraPostgresEngineVersion.VER_16_6 /* use latest available minor version at implementation time */ })` (NOT `auroraMysql`)
    - Serverless v2: `serverlessV2MinCapacity: 0.5`, `serverlessV2MaxCapacity: 2`
    - Default database: `bops_production`
    - Credentials: `rds.Credentials.fromGeneratedSecret('bops', { excludeCharacters: '/@"\':\\' })` — do NOT hardcode `secretName`. Note: the property is `excludeCharacters` (not `excludePunctuation` which belongs to a different API).
    - Cluster parameter group — requires explicit `ParameterGroup` construct:
      ```typescript
      const parameterGroup = new rds.ParameterGroup(this, 'BopsParams', {
        engine: rds.DatabaseClusterEngine.auroraPostgres({ version: rds.AuroraPostgresEngineVersion.VER_16_6 /* use latest available minor version at implementation time */ }),
        parameters: {
          'rds.allowed_extensions': 'postgis,postgis_topology,btree_gin,pg_stat_statements',
          'shared_preload_libraries': 'pg_stat_statements',
        },
      });
      ```
    - Writer: `writer: rds.ClusterInstance.serverlessV2('writer')`
    - Removal policy: DESTROY, `removalPolicy: cdk.RemovalPolicy.DESTROY`
    - Security group: Aurora SG from networking construct
    - Publicly accessible: false
    - Port: 5432 (PostgreSQL default)
  - Notes: Single writer instance, no readers. The `aurora-postgresql16` parameter group family is automatically inferred from the engine version.

- [ ] **Task 2.4: Create Redis construct**
  - File: `cloudformation/scenarios/bops-planning/cdk/lib/constructs/redis.ts`
  - Action: Create ElastiCache Redis 7.0 cluster
  - **WARNING: ElastiCache has NO L2 CDK construct — must use L1 `CfnCacheCluster` and `CfnSubnetGroup`.**
  - Details:
    ```typescript
    const subnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: 'BOPS Redis subnet group',
      subnetIds: props.vpc.publicSubnets.map(s => s.subnetId),
    });
    const redis = new elasticache.CfnCacheCluster(this, 'RedisCluster', {
      engine: 'redis',
      engineVersion: '7.0',
      cacheNodeType: 'cache.t3.micro',
      numCacheNodes: 1,
      cacheSubnetGroupName: subnetGroup.ref,
      vpcSecurityGroupIds: [props.redisSg.securityGroupId],
    });
    // Export: redis.attrRedisEndpointAddress + ':' + redis.attrRedisEndpointPort
    ```
  - Notes: ElastiCache nodes in VPC subnets do NOT get public IPs. This is fine since Fargate tasks are in the same VPC and can reach Redis via private IP. Export endpoint address for `REDIS_URL` construction as `redis://{endpoint}:{port}/1`.

- [ ] **Task 2.5: Create compute construct**
  - File: `cloudformation/scenarios/bops-planning/cdk/lib/constructs/compute.ts`
  - Action: Create ECS cluster, ALB, 3 Fargate services, and seed task
  - Details:
    - **ECS Cluster**: `NdxBops-Cluster`
    - **Execution Role**: `InnovationSandbox-ndx-bops-exec` with `AmazonECSTaskExecutionRolePolicy`, Secrets Manager read access
    - **Task Role**: `InnovationSandbox-ndx-bops-task` with S3 read/write (uploads bucket), CloudWatch Logs
    - **Seed onEvent Lambda Role**: `InnovationSandbox-ndx-bops-seed-onevent` with `ecs:RunTask`, `ecs:DescribeTasks`, `iam:PassRole`
    - **Seed isComplete Lambda Role**: `InnovationSandbox-ndx-bops-seed-iscomplete` with `ecs:DescribeTasks`
    - **BOPS Web Task Definition**: 1 vCPU, 2048 MB, container `bops-web` from `ghcr.io/co-cddo/ndx_try_aws_scenarios-bops:latest`, port 3000, health check `/healthcheck`, all BOPS env vars, start period 300s
    - **BOPS Worker Task Definition**: 512 CPU, 1024 MB, container `bops-worker` from same image, CMD override `["bin/sidekiq"]`, no port mapping, same env vars minus web-specific ones
    - **BOPS-Applicants Task Definition**: 512 CPU, 1024 MB, container `bops-applicants` from `ghcr.io/co-cddo/ndx_try_aws_scenarios-bops-applicants:latest`, port 80, health check `/healthcheck`, BOPS-Applicants env vars
    - **ALB**: `NdxBops-ALB`, listener port 80 → BOPS target group (port 3000), listener port 8080 → BOPS-Applicants target group (port 80)
    - **BOPS Web Service**: desired count 1, public IP, ECS Exec enabled, circuit breaker rollback, 10-min health check grace
    - **BOPS Worker Service**: desired count 1, public IP, no ALB target group
    - **BOPS-Applicants Service**: desired count 1, public IP, circuit breaker rollback
    - **Seed Task**: Separate task definition using BOPS image, CMD override runs `seed-entrypoint.sh`. Triggered as CloudFormation custom resource via CDK `Provider` with two Lambda handlers:
      - `onEvent` Lambda (`InnovationSandbox-ndx-bops-seed-onevent`): calls `ecs.runTask()` with the seed task definition, returns `{ PhysicalResourceId: taskArn }`
      - `isComplete` Lambda (`InnovationSandbox-ndx-bops-seed-iscomplete`): calls `ecs.describeTasks()`, returns `{ IsComplete: true }` when task is STOPPED with exit code 0, `{ IsComplete: false }` while running
      - Provider config: `queryInterval: Duration.seconds(30)`, `totalTimeout: Duration.minutes(15)`
      - Both Lambda roles need ISB-compliant names and IAM permissions: `ecs:RunTask`, `ecs:DescribeTasks`, `iam:PassRole` (for task execution/task roles)
      - DependsOn: Aurora cluster + Redis
  - **CRITICAL: CDK Provider auto-generates a hidden internal framework Lambda** (the "waiter" state machine) with an auto-named IAM role. This hidden role will violate the ISB SCP. Solution: Add an `IsbRoleNamingAspect` CDK Aspect to the stack that walks ALL `iam.CfnRole` nodes and renames any role not already prefixed with `InnovationSandbox-ndx-`. Apply the Aspect in `bops-planning-stack.ts`:
    ```typescript
    class IsbRoleNamingAspect implements cdk.IAspect {
      visit(node: IConstruct): void {
        if (node instanceof iam.CfnRole) {
          const currentName = node.roleName;
          if (!currentName || !currentName.toString().startsWith('InnovationSandbox-ndx-')) {
            node.roleName = `InnovationSandbox-ndx-bops-${node.node.id}`;
          }
        }
      }
    }
    cdk.Aspects.of(this).add(new IsbRoleNamingAspect());
    ```
  - Notes: This is a non-trivial CDK pattern. Import: `import { Provider } from 'aws-cdk-lib/custom-resources';`. Use `Provider` with separate `onEventHandler` and `isCompleteHandler`. The `isComplete` pattern allows CloudFormation to poll asynchronously rather than blocking the Lambda for 15 minutes. `queryInterval` and `totalTimeout` are `Provider` constructor props.

- [ ] **Task 2.6: Create CloudFront construct**
  - File: `cloudformation/scenarios/bops-planning/cdk/lib/constructs/cloudfront.ts`
  - Action: Create CloudFront distribution for HTTPS termination of BOPS web
  - Details:
    - Origin: ALB on port 80 (HTTP_ONLY)
    - Viewer protocol: REDIRECT_TO_HTTPS
    - Cache policy: CACHING_DISABLED
    - Origin request policy: ALL_VIEWER
    - Allowed methods: ALL
    - Default domain (no custom domain/ACM cert)
  - Notes: Follow `localgov-drupal/cdk/lib/constructs/cloudfront.ts` exactly

- [ ] **Task 2.7: Create Secrets Manager secrets**
  - File: `cloudformation/scenarios/bops-planning/cdk/lib/bops-planning-stack.ts` (in main stack)
  - Action: Create Secrets Manager secrets for all auto-generated credentials
  - **CRITICAL — ISB SCP blocks `secretsmanager:GetSecretValue` at runtime.** All secret values MUST be injected into ECS container environment variables at CloudFormation deploy time using `secretValueFromJson('key').unsafeUnwrap()`. This resolves the secret during synthesis and embeds it as a dynamic reference (`{{resolve:secretsmanager:...}}`) — the container never calls the Secrets Manager API. Do NOT use CDK's `secrets` property on container definitions.
  - Details:
    - **Multiple secrets needed** — Secrets Manager `generateSecretString` can only auto-generate one password per secret. Create separate secrets for each value, or use a single Lambda custom resource to generate all values and store them in one JSON secret. Recommended approach: create a custom resource Lambda (`InnovationSandbox-ndx-bops-secret-gen`) that generates 7 random values and stores them as a JSON secret:
      - `SECRET_KEY_BASE` (128 chars)
      - `OTP_SECRET_ENCRYPTION_KEY` (32 chars)
      - `ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY` (32 chars)
      - `ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY` (32 chars)
      - `ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT` (32 chars)
      - `ADMIN_PASSWORD` (16 chars, alphanumeric — for demo login)
      - `API_BEARER` (64 chars — for BOPS-Applicants API auth)
    - Alternative: Create 7 separate `secretsmanager.Secret` resources each with `generateSecretString`, then reference each individually via `unsafeUnwrap()`. More verbose but no custom resource needed.
    - Database credentials handled by Aurora construct (auto-generated, also accessed via `unsafeUnwrap()`)
  - Injection pattern:
    ```typescript
    // In container environment:
    environment: {
      SECRET_KEY_BASE: bopsSecrets.secretValueFromJson('SECRET_KEY_BASE').unsafeUnwrap(),
      ADMIN_PASSWORD: bopsSecrets.secretValueFromJson('ADMIN_PASSWORD').unsafeUnwrap(),
      DATABASE_URL: cdk.Fn.join('', [
        'postgres://',
        dbSecret.secretValueFromJson('username').unsafeUnwrap(),
        ':',
        dbSecret.secretValueFromJson('password').unsafeUnwrap(),
        '@', cluster.clusterEndpoint.hostname,
        ':', cluster.clusterEndpoint.port.toString(),
        '/bops_production'
      ]),
      // ... repeat for all secret-sourced values
    }
    ```

- [ ] **Task 2.8: Create S3 bucket and empty-bucket custom resource**
  - File: `cloudformation/scenarios/bops-planning/cdk/lib/constructs/storage.ts`
  - Action: Create S3 bucket for Active Storage uploads + Lambda custom resource to empty it on stack deletion
  - **WARNING: Do NOT use `autoDeleteObjects: true`** — it requires CDK bootstrap (`CDKToolkit` stack) which ISB sandbox accounts do not have. Instead, create a manual empty-bucket Lambda custom resource following the Simply Readable pattern (`simply-readable-stack.ts:404-457`).
  - Details:
    - S3 bucket: auto-generated name, `removalPolicy: DESTROY`, block all public access, S3-managed encryption, CORS `*` for direct uploads
    - Empty-bucket Lambda: triggered on CloudFormation DELETE, lists and deletes all objects in the bucket before CFN attempts to delete the bucket resource. Lambda role needs ISB-compliant name (`InnovationSandbox-ndx-bops-empty-bucket`).
  - Notes: Task role needs `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject` on this bucket. The empty-bucket Lambda needs `s3:ListBucket`, `s3:DeleteObject`, `s3:ListObjectVersions`, `s3:DeleteObjectVersion`.

- [ ] **Task 2.9: Wire up CloudFormation outputs**
  - File: `cloudformation/scenarios/bops-planning/cdk/lib/bops-planning-stack.ts`
  - Action: Add all CloudFormation outputs
  - Details:
    - `BOPSUrl` — `https://{CloudFront domain}`
    - `BOPSLoginUrl` — `https://{CloudFront domain}/users/sign_in`
    - `BOPSUsername` — `ndx-demo_administrator@example.com`
    - `BOPSPassword` — Secrets Manager console URL for the admin password
    - `ApplicantsPortalUrl` — `http://{ALB DNS}:8080`
    - `CloudWatchLogsUrl` — CloudWatch Logs console URL for ECS log group
    - `StackDescription` — `BOPS Planning System - NDX:Try`

- [ ] **Task 2.10: Add CloudFormation parameter for OS Maps key**
  - File: `cloudformation/scenarios/bops-planning/cdk/lib/bops-planning-stack.ts`
  - Action: Add `CfnParameter` for `OSVectorTilesApiKey` with `noEcho: true`, no default value
  - Details: Parameter value injected into both BOPS and BOPS-Applicants container env vars
  - Notes: This is the first use of `CfnParameter` in this codebase (LocalGov Drupal uses none). For ISB StackSet deployment, the parameter value is provided via StackSet parameter overrides (configured in the ISB admin console when creating the StackSet instance — see BLUEPRINT.md). For direct `cdk deploy` during development, pass via `--parameters OSVectorTilesApiKey=your-key`. This does NOT break one-click deployment because ISB handles parameter injection automatically.

- [ ] **Task 2.11: Deploy and verify empty stack**
  - Action: `cd cloudformation/scenarios/bops-planning/cdk && npx cdk deploy --profile NDX/SandboxAdmin --parameters OSVectorTilesApiKey=test`
  - Verification: Stack creates successfully, all 3 ECS services running (containers may crash without seed data — that's expected at this stage)

### Phase 3: Seed Data (Highest Risk)

- [ ] **Task 3.1: Create seed entrypoint script**
  - File: `cloudformation/scenarios/bops-planning/docker/bops/scripts/seed-entrypoint.sh`
  - Action: Create the script that the ECS seed task runs
  - Details:
    ```bash
    #!/bin/bash
    set -e
    # Wait for database
    until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" 2>/dev/null; do
      echo "Waiting for database..." && sleep 5
    done
    # Enable PostGIS extensions
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" \
      -c "CREATE EXTENSION IF NOT EXISTS postgis; CREATE EXTENSION IF NOT EXISTS postgis_topology; CREATE EXTENSION IF NOT EXISTS btree_gin;"
    # Run Rails setup
    bundle exec rails db:prepare
    bundle exec rails db:seed
    # Run custom sample data generator
    bundle exec rails runner scripts/seed_sample_data.rb
    # Create BOPS-Applicants database and run its migrations
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" \
      -c "CREATE DATABASE bops_applicants_production;" 2>/dev/null || true
    # BOPS-Applicants uses standard pg adapter (NOT postgis) — postgres:// scheme is correct here
    # No PostGIS extensions needed for the applicants database (only 2 tables: ownership_certificates, land_owners)
    DATABASE_URL="postgres://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/bops_applicants_production" \
      bundle exec rails db:migrate
    echo "Seed complete."
    ```

- [ ] **Task 3.2: Create sample data seed script**
  - File: `cloudformation/scenarios/bops-planning/docker/bops/scripts/seed_sample_data.rb`
  - Action: Create Ruby script that generates 80 realistic planning applications using BOPS domain model
  - Details:
    - **Idempotency guard**: Check `LocalAuthority.exists?(subdomain: "ndx-demo")` — skip if already seeded
    - **Create LocalAuthority**: "NDX Demo Borough", subdomain `ndx-demo`, council_code `NDX`, with signatory and email config
    - **Create Users**: assessor (`ndx-demo_assessor@example.com`), reviewer (`ndx-demo_reviewer@example.com`), administrator (`ndx-demo_administrator@example.com`) — password from `ENV["ADMIN_PASSWORD"]`
    - **Create API User**: For BOPS-Applicants Bearer token auth, token matching `ENV["API_BEARER"]`
    - **Create Planning Constraints**: Conservation Area, Flood Zone 2/3, TPO, Listed Building Grade II, AONB, Green Belt — associated with the local authority
    - **Generate 80 Applications**: Use AASM state machine transitions. For each application:
      1. `PlanningApplication.create!` with valid params (type, description, address, local_authority)
      2. Transition through states: `validate!` → `start!` → (optionally) `assess!` → `review!` → `determine!`
      3. Stop at target status
      4. Associate relevant planning constraints
    - **Address data**: Use real UK street patterns in fictional borough — e.g., "12 Oakwood Terrace, NDX Demo Borough", "34 Victoria Road, NDX Demo Borough"
    - **Application descriptions by type**:
      - Householder: "Single storey rear extension measuring 4m in depth", "Loft conversion with rear dormer", "Front porch and new driveway"
      - Prior Approval: "Change of use from office (Class E) to residential (Class C3)"
      - Listed Building: "Internal alterations to Grade II listed building including new kitchen"
      - Full Planning: "Demolition of existing garage and erection of two-storey side extension"
    - **Status distribution**: ~12 new, ~24 in assessment, ~12 under review, ~24 decided (18 granted + 6 refused), ~8 withdrawn
  - Notes: This is the highest-risk task. The AASM event names listed above (`validate!`, `start!`, `assess!`, `review!`, `determine!`) are illustrative — **the implementer must inspect `app/models/planning_application.rb` (and its AASM state machine definition) in the BOPS codebase** to discover actual event names, required parameters, and guard conditions. AASM transitions may have required attributes or callbacks that need to be satisfied (e.g., an `agent` user performing the action, associated Site/Applicant records). Build incrementally — start with 5 householder applications and verify, then expand. Wrap in `ActiveRecord::Base.transaction` for atomicity.

- [ ] **Task 3.3: Rebuild Docker images with seed script**
  - Action: Trigger GitHub Actions workflow to rebuild BOPS image with the seed script included
  - Verification: New image pushed to ghcr.io with seed script at `/rails/scripts/seed_sample_data.rb`

- [ ] **Task 3.4: Deploy and verify seed task**
  - Action: Deploy stack (or update) to trigger the seed ECS task
  - Verification:
    - Seed task runs to completion (check ECS task status + CloudWatch logs)
    - BOPS web UI shows login page
    - Login with `ndx-demo_administrator@example.com` succeeds
    - Dashboard shows 80 planning applications
    - Applications span all 7 types
    - Status distribution matches spec

- [ ] **Task 3.5: Iterate on seed script issues**
  - Action: Debug and fix AASM transition failures, missing required attributes, callback issues
  - Notes: Budget extra time here. Common issues: missing `agent` (the user performing the action), missing `description` on state transitions, required associated records (site, applicant). May need to create stub Site and Applicant records per application.
  - **Fallback strategy**: If AASM transitions prove too complex to drive programmatically for all 80 records, consider a hybrid approach: use model methods for the first 20 applications (to prove the workflow), then for remaining records use `update_columns` to set status directly (bypasses callbacks but populates the dashboard). This is a demo — having 80 records visible is more important than every record having perfect audit trail consistency.

### Phase 4: Integration Verification

- [ ] **Task 4.1: Verify BOPS back-office functionality**
  - Action: Manual testing of core BOPS workflows via CloudFront URL
  - Verification:
    - Login as assessor, reviewer, administrator — all work
    - Dashboard shows applications filtered by type and status
    - Application detail page renders with map (OS Maps tiles)
    - Planning constraints visible on application
    - PDF officer report generates successfully (Grover/Chrome)
    - Sidekiq dashboard accessible and shows 4 scheduled jobs
  - **PDF generation risk mitigation**: If Grover/Chrome PDF fails, check: `GROVER_NO_SANDBOX=true` is set, container has 2GB+ RAM, Chrome flags include `--no-sandbox --disable-gpu --disable-dev-shm-usage`. Chrome in containers is fragile — may need `/dev/shm` size increase via ECS `linuxParameters.sharedMemorySize`.

- [ ] **Task 4.2: Verify BOPS-Applicants functionality**
  - Action: Manual testing of applicants portal via ALB:8080
  - Verification:
    - Homepage loads with GOV.UK design
    - Can navigate to a planning application by reference number
    - Application details fetched from BOPS API (proves API connectivity)
    - Map renders with OS Maps tiles

- [ ] **Task 4.3: Verify stack deletion**
  - Action: Delete the CloudFormation stack and verify clean removal
  - Verification:
    - Stack deletion completes without errors
    - S3 bucket auto-emptied and deleted
    - Aurora cluster deleted (no final snapshot)
    - No orphaned resources remain

### Phase 5: Website Pages and Documentation

- [ ] **Task 5.1: Add scenario to scenarios.yaml**
  - File: `src/_data/scenarios.yaml`
  - Action: Add `bops-planning` entry following the schema
  - Details:
    - `id`: `bops-planning`
    - `name`: `Digital Planning (BOPS)`
    - `headline`: `Experience the Back Office Planning System used by UK councils`
    - `bestFor`: `Planning departments evaluating digital transformation`
    - `difficulty`: `intermediate`
    - `timeEstimate`: `15 to 20 minutes`
    - `primaryPersona`: `service-manager`
    - `secondaryPersonas`: `["technical", "leadership"]`
    - `description`: `Deploy the Back Office Planning System (BOPS) — the open-source digital planning platform used by UK councils. Experience the complete planning application lifecycle from validation through to decision, with 80 realistic sample applications, automated officer reports, and Ordnance Survey mapping.` (50-500 chars)
    - `awsServices`: `["Amazon ECS", "Amazon Aurora", "Amazon ElastiCache", "Amazon S3", "Amazon CloudFront", "Elastic Load Balancing"]`
    - `securitySummary`: `Sample data only in isolated sandbox. All secrets auto-generated. No real citizen data.` (10-200 chars)
    - `skillsLearned`: `["Container orchestration with ECS Fargate", "Aurora PostgreSQL with PostGIS", "Rails application deployment on AWS", "Load balancer configuration"]`
    - `deployment.templateUrl`: S3 URL for template
    - `deployment.region`: `us-east-1`
    - `deployment.parameters`: `[{name: "OSVectorTilesApiKey", value: ""}]` (filled at StackSet level)
    - `deployment.capabilities`: `["CAPABILITY_IAM", "CAPABILITY_NAMED_IAM"]`
    - `deployment.deploymentTime`: `25 to 35 minutes`
    - `success_metrics`: ODP programme figures (40% time savings, £180K annual savings)
    - Note: `tco_projection` is optional — omit from initial entry unless full 3-year breakdown with sub-components (`aws_services`, `integration`, `training`, `support`, `total` per year) is available. Schema requires all 3 years if included.
  - Notes: Validate against `schemas/scenario.schema.json`. **The schema has `additionalProperties: false`** — only use fields defined in the schema. Do not add custom fields (e.g., `bopsVersion`) or validation will fail with no explanation.

- [ ] **Task 5.2: Create scenario detail page**
  - File: `src/scenarios/bops-planning.njk`
  - Action: Create scenario page following `localgov-drupal.njk` pattern
  - Details:
    - Hero: "Experience Digital Planning" with BOPS dashboard screenshot
    - What you'll see: dashboard, application detail with map, officer report, applicants portal
    - Why it matters: 40% time savings, auto-generated reports, data-driven policy matching
    - How to deploy: one-click, wait 25-35 minutes, find credentials in Outputs
    - Guided walkthrough: the 4-step narrative
    - What's next: links to ODP, Unboxed, MHCLG

- [ ] **Task 5.3: Create screenshot metadata**
  - File: `src/_data/screenshots/bops-planning.yaml`
  - Action: Create screenshot configuration for the scenario page
  - Details: 4 steps — CloudFormation outputs, BOPS dashboard, application detail with map, applicants portal view

- [ ] **Task 5.4: Capture screenshots**
  - Action: Use Playwright to capture screenshots of the deployed BOPS system
  - Details: Navigate to each key screen, capture at 1920x1080, save to screenshots S3 bucket
  - Notes: Dismiss any cookie banners, ensure map tiles are loaded before capture

- [ ] **Task 5.5: Create BLUEPRINT.md**
  - File: `cloudformation/scenarios/bops-planning/BLUEPRINT.md`
  - Action: Create ISB registration guide following existing BLUEPRINT.md patterns
  - Details:
    - Prerequisites: hub account, ISB setup, OS Maps API key as GitHub secret
    - Step 1: Upload template to S3
    - Step 2: Create StackSet with `IntermediateRole` and `SandboxAccountRole`
    - Step 3: Register in ISB admin console
    - Step 4: Associate with lease template
    - Parameter overrides: `OSVectorTilesApiKey` from GitHub secret
    - Verification steps

- [ ] **Task 5.6: Synthesize and upload CloudFormation template**
  - Action: Synthesize and copy the template:
    ```bash
    npx cdk synth
    cp cdk.out/BopsPlanningStack.template.json ../template.yaml
    ```
  - Details: Upload to `s3://ndx-try-templates-us-east-1/scenarios/bops-planning/template.yaml`
  - Notes: `cdk synth` outputs JSON to `cdk.out/` (not YAML). The file extension `.yaml` is a convention in this project but the content is JSON — CloudFormation accepts both. Template will likely exceed 51KB — always use S3 bucket for deployment.

- [ ] **Task 5.7: Create CDK snapshot test**
  - File: `cloudformation/scenarios/bops-planning/cdk/test/bops-planning-stack.test.ts`
  - Action: Create a basic snapshot test following LocalGov Drupal pattern (`localgov-drupal/cdk/test/localgov-drupal-stack.test.ts`)
  - Details: Instantiate `BopsPlanningStack` and assert template matches snapshot. This catches unintended infrastructure changes on future modifications.

### Acceptance Criteria

- [ ] **AC 1**: Given a sandbox account with ISB lease, when the BOPS CloudFormation stack is deployed with a valid `OSVectorTilesApiKey` parameter, then the stack creates successfully within 35 minutes with all resources in CREATE_COMPLETE state (Aurora ~10 min, Redis ~8 min, CloudFront ~10 min, seed task ~10 min — partially parallel)
- [ ] **AC 2**: Given a deployed BOPS stack, when navigating to the `BOPSLoginUrl` output and logging in with `BOPSUsername`/`BOPSPassword`, then the BOPS dashboard loads showing planning applications
- [ ] **AC 3**: Given a logged-in BOPS user, when viewing the dashboard, then 80 planning applications are visible across 7 application types (Householder, Prior Approval, LDC, Listed Building, Full Planning, Discharge of Conditions, Tree Works) with varied statuses (new, in assessment, under review, decided, withdrawn)
- [ ] **AC 4**: Given a logged-in BOPS user viewing an application detail page, when the page loads, then the OS Maps view renders with Ordnance Survey vector tiles showing the site location
- [ ] **AC 5**: Given a logged-in BOPS user viewing an application in assessment, when generating an officer report, then a PDF is produced successfully via Grover/Chrome
- [ ] **AC 6**: Given a deployed BOPS stack, when navigating to the `ApplicantsPortalUrl` output (ALB:8080), then the BOPS-Applicants public portal loads with GOV.UK design system styling
- [ ] **AC 7**: Given the BOPS-Applicants portal, when navigating to a planning application by reference number, then the application details are fetched from the BOPS API and displayed correctly
- [ ] **AC 8**: Given a deployed BOPS stack, when checking ECS services, then three services are running: bops-web (healthy), bops-worker (running Sidekiq with 4 scheduled jobs registered), bops-applicants-web (healthy)
- [ ] **AC 9**: Given a deployed BOPS stack, when the CloudFormation stack is deleted, then all resources are removed cleanly (S3 bucket auto-emptied, Aurora deleted without snapshot, no orphaned resources)
- [ ] **AC 10**: Given the `scenarios.yaml` entry for `bops-planning`, when running `npm run validate:schema`, then schema validation passes with no errors
- [ ] **AC 11**: Given the BOPS planning applications in the seed data, when viewing the map for applications on the same street, then multiple application pins are visible in geographic proximity (clustered data)
- [ ] **AC 12**: Given all IAM roles in the stack, when checking role names, then every role name starts with `InnovationSandbox-ndx-` prefix (ISB SCP compliant)
- [ ] **AC 13**: Given a fresh sandbox account, when deploying the BOPS stack via StackSet with `OSVectorTilesApiKey` parameter override, then the deployment succeeds without manual intervention (one-click deployment)

## Additional Context

### Dependencies

- BOPS source: `github.com/unboxed/bops` (public, AGPL-3.0 license). AGPL requires that modifications made available over a network must be published. Our overlay files (initializer, seed script, entrypoint) constitute modifications — these are automatically open-sourced since the NDX:Try repo is public.
- BOPS Applicants: `github.com/unboxed/bops-applicants` (public)
- Ordnance Survey Vector Tiles API key (free tier)
- NDX:Try ISB hub account for StackSet registration
- Sandbox account with ISB lease for testing

### Testing Strategy

- Deploy to sandbox account using `NDX/SandboxUser` and `NDX/SandboxAdmin` profiles
- Verify BOPS web UI loads at CloudFront URL
- Verify login with seeded admin credentials (`ndx-demo_administrator@example.com`)
- Verify 80 sample planning applications visible in dashboard across all 7 types
- Verify application status distribution (new, in assessment, under review, decided, withdrawn)
- Verify BOPS applicants portal accessible at ALB:8080
- Verify map rendering with OS Maps tiles
- Verify PDF generation (officer report via Grover/Chrome)
- Verify Sidekiq dashboard shows workers running and scheduled jobs registered
- Verify BOPS-Applicants can fetch application data from BOPS API
- Verify stack cleanup (delete) completes without orphaned resources

### Guided Walkthrough Narrative

The NDX:Try scenario page should guide evaluators through this path:
1. Log in as a planning officer → see the dashboard with active cases across different types
2. Pick up an application "in assessment" → review documents, see the OS Maps view, check planning constraints
3. Make a recommendation → see the auto-generated officer report (PDF via Grover/Chrome)
4. Switch to the applicants portal → see the public-facing view of applications

This 15-minute guided experience forms the core of the evidence pack story.

### Cleanup / Deletion Considerations

- S3 buckets: `RemovalPolicy.DESTROY` + manual empty-bucket Lambda custom resource (NOT `autoDeleteObjects` — requires CDK bootstrap which ISB sandboxes don't have)
- Aurora: `removalPolicy: DESTROY`, skip final snapshot
- ghcr.io images are external — no cleanup needed
- ISB account cleanup handles remaining resources on lease termination

### Docker Image Build Details

**BOPS image** (`docker/bops/Dockerfile`):
- Build from source: clone `unboxed/bops` repo during Docker build (specific tag/commit pinned for reproducibility)
- Based on upstream `Dockerfile.production` pattern (Ruby 3.4.7, Rails 8.1, Chrome, ImageMagick, Ghostscript)
- COPY our `config/initializers/default_local_authority.rb` into app (tenant fallback)
- COPY our `scripts/seed_sample_data.rb` into app (sample data generator)
- COPY our `entrypoint.sh` (with DB wait loop + init status page)
- Build ARGs: `AWS_REGION=us-east-1`, override `PORT=3000`
- ~1.5GB final image (Chrome accounts for bulk of size)

**BOPS-Applicants image** (`docker/bops-applicants/Dockerfile`):
- Build from source: clone `unboxed/bops-applicants` repo during Docker build (pinned tag/commit)
- Based on upstream `Dockerfile.production` pattern (Ruby 3.4.1, Rails 7.2, Node 18)
- COPY our `config/initializers/default_local_authority.rb` into app (same tenant fallback — BOPS-Applicants also uses subdomain-based tenant resolution for API URL construction)
- Port 80 (production default)
- ~500MB final image

**Build strategy**: Both repos are cloned OUTSIDE the Docker build (in the GitHub Actions workflow) and copied into the build context. This provides better layer caching than cloning inside the Dockerfile. Pin to specific commit SHAs (not tags — tags are mutable and break reproducibility). The GitHub Actions workflow handles clone → overlay → build → push to ghcr.io.

### Seed Script Details (`scripts/seed_sample_data.rb`)

Must be idempotent. **This is the highest-risk deliverable** — BOPS planning applications are AASM state machines with strict transition rules and callbacks. Cannot shortcut with raw SQL inserts.

**Approach**: Use BOPS model methods and state machine transitions:
```ruby
app = PlanningApplication.create!(application_type:, description:, local_authority:, ...)
app.validate!          # triggers validation workflow
app.start!             # moves to assessment
app.assess!            # for applications past assessment
app.review!            # for applications under review
app.determine!("granted")  # for decided applications
```

**Creates:**
- 1 LocalAuthority: "NDX Demo Borough" (subdomain: `ndx-demo`, council_code: `NDX`)
- Users: assessor, reviewer, administrator (all with known password via Secrets Manager)
- Planning constraints: conservation areas, flood zones, TPOs, listed building proximity — manually associated since Planning Data Platform API is not connected
- 80 planning applications with:
  - Realistic UK addresses clustered in 3-4 streets
  - 7 application types (Householder 25, Prior Approval 15, LDC 10, Listed Building 8, Full Planning 12, Discharge of Conditions 5, Tree Works 5)
  - Status distribution: ~15% new, ~30% in assessment, ~15% under review, ~30% decided, ~10% withdrawn
  - Realistic descriptions ("Single storey rear extension measuring 4m in depth")
  - Planning constraints applied where relevant
  - Some cross-referencing between adjacent applications

### Evidence Pack / Scenario Page Data

For the `scenarios.yaml` entry, include ODP programme metrics:
- **Primary metric**: Time saved per planning application — baseline 90 min, projection 54 min (40% reduction)
- **Annual savings**: ~£180,000 for a medium council (3,000 apps/year × 36 min saved × £30/hr)
- **TCO**: Year 1 ~£25,000 (hosting + integration), Year 2 ~£15,000 (hosting only)
- **Source**: ODP programme published evaluation reports. Verify these figures against current ODP publications during implementation — numbers may have been updated since spec was written.

### Notes

- BOPS uses `postgis` adapter (rewrites `postgres://` to `postgis://` in database.yml) — DATABASE_URL must use `postgres://` scheme
- Health check endpoint: `/healthcheck` on both BOPS and BOPS-Applicants
- BOPS production config sets `config.assume_ssl = true` — works behind CloudFront/ALB SSL termination
- Puma: single-process, 5 threads, port from PORT env var
- Sidekiq: 3 queues (low_priority, high_priority, submissions), 4 scheduled jobs (daily/hourly)
- BOPS-Applicants has only 2 local DB tables (ownership_certificates, land_owners) — everything else via BOPS API
- BOPS-Applicants uses Faraday + HTTParty for API communication, Bearer token auth
- ECS seed task DependsOn: Aurora cluster + Redis must be fully available before seed runs
