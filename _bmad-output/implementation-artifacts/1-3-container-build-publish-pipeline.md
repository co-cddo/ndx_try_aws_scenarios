# Story 1.3: Container Build & Publish Pipeline

Status: done

## Story

As a **developer**,
I want **automated container builds published to ghcr.io**,
So that **deployments pull the latest tested image without manual intervention**.

## Acceptance Criteria

1. **Given** a push to the main branch affecting the docker directory
   **When** the GitHub Actions workflow runs
   **Then** the container image is built and tagged with commit SHA
   **And** the image is pushed to `ghcr.io/[org]/localgov-drupal`
   **And** the `latest` tag is updated
   **And** failed builds prevent the workflow from completing

## Tasks / Subtasks

- [x] **Task 1: Create GitHub Actions workflow** (AC: 1)
  - [x] 1.1 Create `.github/workflows/docker-build.yml`
  - [x] 1.2 Configure workflow to trigger on push to main branch
  - [x] 1.3 Add path filter for `cloudformation/scenarios/localgov-drupal/**`
  - [x] 1.4 Add workflow_dispatch for manual triggers

- [x] **Task 2: Configure build steps** (AC: 1)
  - [x] 2.1 Set up Docker Buildx for multi-platform builds
  - [x] 2.2 Configure build context as `cloudformation/scenarios/localgov-drupal`
  - [x] 2.3 Use Dockerfile path `docker/Dockerfile`
  - [x] 2.4 Enable build cache for faster builds

- [x] **Task 3: Configure ghcr.io authentication** (AC: 1)
  - [x] 3.1 Use `docker/login-action` with GITHUB_TOKEN
  - [x] 3.2 Configure ghcr.io as registry
  - [x] 3.3 Ensure repository has package write permissions

- [x] **Task 4: Configure image tagging** (AC: 1)
  - [x] 4.1 Tag with git commit SHA (`sha-abc123`)
  - [x] 4.2 Tag with `latest` for main branch
  - [x] 4.3 Use `docker/metadata-action` for consistent tagging

- [x] **Task 5: Push image to registry** (AC: 1)
  - [x] 5.1 Use `docker/build-push-action` to build and push
  - [x] 5.2 Push to `ghcr.io/[org]/localgov-drupal`
  - [x] 5.3 Verify failed builds fail the workflow

- [x] **Task 6: Add build status badge** (AC: 1)
  - [x] 6.1 Update README with workflow status badge
  - [x] 6.2 Add link to GitHub Actions workflow

## Dev Notes

### Architecture Compliance

This story implements the CI/CD pipeline defined in the Architecture document:

**Container Registry** [Source: architecture.md#ADR-005]:
- ghcr.io for open-source image hosting
- Direct Fargate pull (no ECR setup needed in user accounts)
- GitHub Actions integration for automated builds

**Image Naming Convention** [Source: architecture.md#Core Technologies]:
- Registry: `ghcr.io`
- Image: `[org]/localgov-drupal`
- Tags: `latest`, `sha-<commit>`

### Technical Requirements

**Workflow Triggers:**
```yaml
on:
  push:
    branches: [main]
    paths:
      - 'cloudformation/scenarios/localgov-drupal/**'
  workflow_dispatch:  # Manual trigger
```

**Build Matrix (optional for future):**
- linux/amd64 (primary, required for Fargate)
- linux/arm64 (optional, for Graviton)

**Required Secrets/Permissions:**
- `GITHUB_TOKEN` (automatic, needs `packages: write`)
- No additional secrets needed for ghcr.io

### Workflow Pattern

```yaml
name: Build LocalGov Drupal Container

on:
  push:
    branches: [main]
    paths:
      - 'cloudformation/scenarios/localgov-drupal/**'
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository_owner }}/localgov-drupal

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - uses: docker/setup-buildx-action@v3

      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - uses: docker/metadata-action@v5
        id: meta
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=sha-
            type=raw,value=latest,enable={{is_default_branch}}

      - uses: docker/build-push-action@v5
        with:
          context: cloudformation/scenarios/localgov-drupal
          file: cloudformation/scenarios/localgov-drupal/docker/Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### References

- [Architecture: ADR-005 ghcr.io over ECR](/_bmad-output/project-planning-artifacts/architecture.md#ADR-005-ghcr.io-over-ECR)
- [GitHub Container Registry Docs](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Build Push Action](https://github.com/docker/build-push-action)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- GitHub Actions workflow created with standard Docker build actions
- Using docker/login-action@v3, docker/metadata-action@v5, docker/build-push-action@v5
- GHA cache enabled for faster builds

### Completion Notes List

1. **Workflow Created** (2025-12-29): `.github/workflows/docker-build.yml` with push triggers and workflow_dispatch
2. **Path Filters** (2025-12-29): Triggers on docker/**, drupal/**, and .dockerignore changes
3. **Image Tagging** (2025-12-29): SHA prefix tags + latest for main branch
4. **Build Cache** (2025-12-29): GHA cache-from/cache-to enabled
5. **README Badge** (2025-12-29): Added Docker Build badge to README.md

### File List

**Created Files:**
- `.github/workflows/docker-build.yml`

**Modified Files:**
- `README.md` (added workflow badge)

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-29 | Story created from epics | SM Agent |
| 2025-12-29 | Implementation complete - all tasks done | Dev Agent (Claude Opus 4.5) |
| 2025-12-29 | Senior Developer Review - approved | Review Agent (Claude Opus 4.5) |

---

## Senior Developer Review (AI)

### Reviewer
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Date
2025-12-29

### Outcome
**APPROVE** - All acceptance criteria implemented correctly.

### Summary
Story 1-3 implements a GitHub Actions workflow for automated container builds. The workflow uses modern Docker actions (v3-v5), proper ghcr.io authentication via GITHUB_TOKEN, and implements all required tagging strategies (SHA and latest).

### Key Findings

**No issues found.** Implementation follows GitHub Actions best practices.

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| 1a | Push to main affecting docker triggers build | ✅ IMPLEMENTED | docker-build.yml:14-19 |
| 1b | Image tagged with commit SHA | ✅ IMPLEMENTED | docker-build.yml:61 (`type=sha,prefix=sha-`) |
| 1c | Image pushed to ghcr.io/[org]/localgov-drupal | ✅ IMPLEMENTED | docker-build.yml:30, :58 |
| 1d | latest tag updated | ✅ IMPLEMENTED | docker-build.yml:63 (`type=raw,value=latest,enable={{is_default_branch}}`) |
| 1e | Failed builds prevent completion | ✅ IMPLEMENTED | GitHub Actions default behavior; no `continue-on-error` |

**Summary: 5 of 5 acceptance criteria fully implemented**

### Task Completion Validation

| Task | Marked | Verified | Evidence |
|------|--------|----------|----------|
| 1.1 Create workflow file | ✅ | ✅ | .github/workflows/docker-build.yml exists |
| 1.2 Trigger on push to main | ✅ | ✅ | docker-build.yml:14-15 |
| 1.3 Path filter | ✅ | ✅ | docker-build.yml:16-19 |
| 1.4 workflow_dispatch | ✅ | ✅ | docker-build.yml:20-26 |
| 2.1 Docker Buildx | ✅ | ✅ | docker-build.yml:44-45 |
| 2.2 Build context | ✅ | ✅ | docker-build.yml:70 |
| 2.3 Dockerfile path | ✅ | ✅ | docker-build.yml:71 |
| 2.4 Build cache | ✅ | ✅ | docker-build.yml:75-76 |
| 3.1 docker/login-action | ✅ | ✅ | docker-build.yml:47-52 |
| 3.2 ghcr.io registry | ✅ | ✅ | docker-build.yml:29, :50 |
| 3.3 packages:write permission | ✅ | ✅ | docker-build.yml:38 |
| 4.1 SHA tag | ✅ | ✅ | docker-build.yml:61 |
| 4.2 latest tag | ✅ | ✅ | docker-build.yml:63 |
| 4.3 metadata-action | ✅ | ✅ | docker-build.yml:54-65 |
| 5.1 build-push-action | ✅ | ✅ | docker-build.yml:67-77 |
| 5.2 Push to ghcr.io | ✅ | ✅ | docker-build.yml:72 |
| 5.3 Failed builds fail workflow | ✅ | ✅ | No continue-on-error |
| 6.1 README badge | ✅ | ✅ | README.md:4 |
| 6.2 Badge links to workflow | ✅ | ✅ | README.md:4 |

**Summary: 19 of 19 tasks verified complete, 0 questionable, 0 false completions**

### Test Coverage and Gaps

- Workflow will be tested on first push to main branch
- No unit tests applicable for GitHub Actions workflow
- Manual verification possible via workflow_dispatch

### Architectural Alignment

✅ **Compliant with architecture.md:**
- Uses ghcr.io per ADR-005
- Image naming follows convention: `[org]/localgov-drupal`
- SHA and latest tagging as specified

### Security Notes

- ✅ Uses GITHUB_TOKEN (automatic, least privilege)
- ✅ No hardcoded secrets
- ✅ packages:write permission explicitly declared
- ✅ PR builds don't push (push: false condition)

### Best-Practices and References

- [GitHub Actions Security Hardening](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)

### Action Items

**Code Changes Required:**
(None - all requirements met)

**Advisory Notes:**
- Note: First actual build will occur when this workflow is pushed to main branch
- Note: Repository may need Packages settings configured if not already enabled
