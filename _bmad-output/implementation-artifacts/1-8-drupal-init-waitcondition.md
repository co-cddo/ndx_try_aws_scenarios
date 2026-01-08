# Story 1.8: Drupal Init & WaitCondition

Status: done

## Story

As a **deploying user**,
I want **Drupal to initialize automatically on first deployment**,
So that **the CMS is ready to use when CloudFormation completes**.

## Acceptance Criteria

1. **Given** a fresh deployment with empty database
   **When** the container starts
   **Then** the entrypoint script:
   - Waits for Aurora to be available (retry loop)
   - Runs `drush site:install localgov` with admin credentials from Secrets Manager
   - Runs `drush config:import` to apply exported configuration
   - Signals CloudFormation WaitCondition on success
   **And** a status page at `/init-status` shows progress during initialization
   **And** CloudFormation stack completes only after Drupal is ready
   **And** subsequent container restarts skip initialization

## Tasks / Subtasks

- [x] **Task 1: Create container entrypoint script** (AC: 1)
  - [x] 1.1 Create `docker/scripts/init-drupal.sh` script (existing entrypoint.sh calls this)
  - [x] 1.2 Implement Aurora availability check with retry loop (60 retries, 5s interval)
  - [x] 1.3 Add condition check for first-run vs restart
  - [x] 1.4 Make script executable and integrate with entrypoint.sh

- [x] **Task 2: Implement Drupal site installation** (AC: 1)
  - [x] 2.1 Parse database credentials from environment variables
  - [x] 2.2 Run `drush site:install localgov` with admin credentials
  - [x] 2.3 Run `drush config:import` if config exists
  - [x] 2.4 Set proper file permissions after install

- [x] **Task 3: Create initialization status tracking** (AC: 1)
  - [x] 3.1 Create HTML status page at `/var/www/drupal/web/init-status.html`
  - [x] 3.2 Update status at each init phase with progress percentage
  - [x] 3.3 Create `/init-status` endpoint in nginx.conf
  - [x] 3.4 Include error messages in status on failure

- [x] **Task 4: Add CloudFormation WaitCondition** (AC: 1)
  - [x] 4.1 Add WaitCondition and WaitConditionHandle to CDK stack
  - [x] 4.2 Pass WaitCondition URL to container as WAIT_CONDITION_URL env var
  - [x] 4.3 Implement cfn-signal call on successful init (signal_cfn_success)
  - [x] 4.4 Signal failure on init error (signal_cfn_failure)

- [x] **Task 5: Implement skip logic for restarts** (AC: 1)
  - [x] 5.1 Check for existing installation marker at `/var/www/drupal/sites/default/.installed`
  - [x] 5.2 Skip init if marker exists
  - [x] 5.3 Only start web server on restart
  - [x] 5.4 Log restart vs first-run detection

- [x] **Task 6: Add init-related CDK resources** (AC: 1)
  - [x] 6.1 No Lambda needed - container signals directly via curl
  - [x] 6.2 Add WaitCondition timeout configuration (900s = 15 minutes)
  - [x] 6.3 Pass required environment variables to task definition
  - [x] 6.4 WaitCondition dependency on ECS service

- [x] **Task 7: Add tests** (AC: 1)
  - [x] 7.1 N/A - Shell script tested via integration
  - [x] 7.2 Test CDK WaitCondition resources exist (2 tests)
  - [x] 7.3 Test environment variables are passed correctly (1 test)

## Dev Notes

### Architecture Compliance

This story implements the initialization pattern from the Architecture document:

**Entrypoint + WaitCondition + status page initialization pattern** [Source: architecture.md]:
- Container waits for Aurora to become available
- Runs drush site:install and config:import
- Signals CloudFormation WaitCondition on completion
- Status page shows progress

**Drush commands** [Source: architecture.md]:
- `drush site:install localgov` for initial Drupal setup
- `drush config:import` for configuration import

### Technical Requirements

**Entrypoint Script Flow:**
```bash
#!/bin/bash
set -e

# Check if already initialized
if [ -f "/var/www/drupal/sites/default/.installed" ]; then
    echo "Drupal already installed, starting web server..."
    exec "$@"
fi

# Wait for database
wait_for_db() {
    until mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1" > /dev/null 2>&1; do
        echo "Waiting for database..."
        sleep 5
    done
}

# Update status
update_status() {
    echo "{\"phase\": \"$1\", \"message\": \"$2\", \"timestamp\": \"$(date -Iseconds)\"}" > /tmp/init-status.json
}

# Main init
update_status "waiting" "Waiting for database..."
wait_for_db

update_status "installing" "Installing Drupal..."
drush site:install localgov --yes \
    --db-url="mysql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME" \
    --account-name="admin" \
    --account-pass="$ADMIN_PASSWORD"

update_status "configuring" "Importing configuration..."
drush config:import --yes || true

update_status "complete" "Initialization complete"
touch /var/www/drupal/sites/default/.installed

# Signal CloudFormation
if [ -n "$WAIT_CONDITION_URL" ]; then
    curl -X PUT -H 'Content-Type:' --data-binary \
        '{"Status":"SUCCESS","UniqueId":"'$(hostname)'","Data":"Drupal initialized","Reason":"Site installation complete"}' \
        "$WAIT_CONDITION_URL"
fi

exec "$@"
```

**Status Endpoint (nginx config or PHP):**
```nginx
location /init-status {
    default_type application/json;
    alias /tmp/init-status.json;
}
```

**CDK WaitCondition Pattern:**
```typescript
// WaitCondition Handle
const waitHandle = new cdk.CfnWaitConditionHandle(this, 'WaitHandle');

// WaitCondition (waits for signal)
const waitCondition = new cdk.CfnWaitCondition(this, 'WaitCondition', {
  handle: waitHandle.ref,
  timeout: '900', // 15 minutes
  count: 1,
});

// Pass URL to container
const container = taskDefinition.addContainer('drupal', {
  environment: {
    WAIT_CONDITION_URL: waitHandle.ref,
  },
});
```

### Dependencies

- Story 1.2 (Container Image) - Need base container to add entrypoint
- Story 1.5 (Database) - Aurora must be provisioned
- Story 1.7 (Compute) - Fargate task definition to modify

### References

- [Architecture: Initialization Pattern](/_bmad-output/project-planning-artifacts/architecture.md)
- [LocalGov Drupal Drush Commands](https://localgovdrupal.org/documentation)
- [CloudFormation WaitCondition](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-waitcondition.html)
- [AWS CDK CfnWaitCondition](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.CfnWaitCondition.html)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

N/A - Tests pass on first run

### Completion Notes List

1. **Init Script Implementation**: Created comprehensive `init-drupal.sh` with:
   - Database wait loop (60 retries × 5s = 5 min timeout)
   - Drupal site installation via drush
   - Configuration import support
   - File permissions handling
   - Installation marker for restart detection
   - CloudFormation WaitCondition signaling

2. **Status Page**: Implemented visual HTML status page with:
   - Auto-refresh every 5 seconds
   - Progress bar with percentage
   - Phase-based status updates
   - Spinner animation during progress
   - Error/success styling
   - JSON API endpoint at `/init-status.json`

3. **CDK Resources**: Added to stack:
   - CfnWaitConditionHandle for presigned URL
   - CfnWaitCondition with 900s (15 min) timeout
   - WAIT_CONDITION_URL environment variable in task definition
   - Proper dependency chain (WaitCondition depends on ECS Service)

4. **Tests**: Added 3 new CDK tests verifying:
   - WaitCondition exists with correct timeout
   - WaitConditionHandle resource exists
   - WAIT_CONDITION_URL in container environment

### File List

**Files Modified:**
- `cloudformation/scenarios/localgov-drupal/docker/scripts/init-drupal.sh` - Complete rewrite
- `cloudformation/scenarios/localgov-drupal/docker/config/nginx.conf` - Added init-status endpoints
- `cloudformation/scenarios/localgov-drupal/cdk/lib/constructs/compute.ts` - Added waitConditionUrl prop
- `cloudformation/scenarios/localgov-drupal/cdk/lib/localgov-drupal-stack.ts` - Added WaitCondition resources
- `cloudformation/scenarios/localgov-drupal/cdk/test/localgov-drupal-stack.test.ts` - Added 3 tests

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-29 | Story created from epics | SM Agent |
| 2025-12-29 | Story implemented - all 21 tests pass | Dev Agent (Opus 4.5) |
