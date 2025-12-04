#!/usr/bin/env bash
# Deploy NDX:Try AWS Scenarios to the current AWS account
# Usage: ./deploy-scenarios.sh [scenario-name]
#   - No arguments: deploy all scenarios
#   - With argument: deploy only the specified scenario
# Examples:
#   ./deploy-scenarios.sh                    # Deploy all
#   ./deploy-scenarios.sh quicksight-dashboard  # Deploy only quicksight

set -e

REGION="us-west-2"
ALL_SCENARIOS=("text-to-speech" "council-chatbot" "foi-redaction" "planning-ai" "smart-car-park" "quicksight-dashboard")

# Check if a specific scenario was requested
if [ -n "$1" ]; then
    # Validate the scenario name
    VALID=false
    for s in "${ALL_SCENARIOS[@]}"; do
        if [ "$s" == "$1" ]; then
            VALID=true
            break
        fi
    done

    if [ "$VALID" = false ]; then
        echo "Error: Invalid scenario '$1'"
        echo "Valid scenarios: ${ALL_SCENARIOS[*]}"
        exit 1
    fi

    SCENARIOS=("$1")
    echo "Deploying single scenario: $1"
else
    SCENARIOS=("${ALL_SCENARIOS[@]}")
    echo "Deploying all scenarios"
fi

# Get current AWS account
ACCOUNT_ID=$(aws sts get-caller-identity --query "Account" --output text)
echo "AWS Account: $ACCOUNT_ID"
echo "Region: $REGION"
echo ""

# Create S3 bucket for large templates if needed
DEPLOY_BUCKET="ndx-try-deploy-${ACCOUNT_ID}-${REGION}"
echo "Creating deployment bucket: $DEPLOY_BUCKET"
aws s3 mb "s3://${DEPLOY_BUCKET}" --region "$REGION" 2>/dev/null || echo "Bucket already exists or created"
echo ""

# Deploy each scenario
for scenario in "${SCENARIOS[@]}"; do
    echo "=========================================="
    echo "Deploying: $scenario"
    echo "=========================================="

    # Build parameter overrides
    PARAMS="Environment=sandbox AutoCleanupHours=24"

    # Special handling for quicksight-dashboard - needs subscription first
    if [ "$scenario" == "quicksight-dashboard" ]; then
        echo "Step 1: Deploying QuickSight subscription..."
        aws cloudformation deploy \
            --template-file "cloudformation/scenarios/quicksight-dashboard/subscription-template.yaml" \
            --stack-name "ndx-try-quicksight-subscription" \
            --region "$REGION" \
            --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
            --s3-bucket "$DEPLOY_BUCKET" \
            --no-fail-on-empty-changeset \
            2>&1 || { echo "Warning: QuickSight subscription deployment had issues"; continue; }

        echo ""
        echo "Step 2: Deploying QuickSight dashboard (no user permissions needed)..."
    fi

    aws cloudformation deploy \
        --template-file "cloudformation/scenarios/${scenario}/template.yaml" \
        --stack-name "ndx-try-${scenario}" \
        --region "$REGION" \
        --parameter-overrides $PARAMS \
        --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
        --s3-bucket "$DEPLOY_BUCKET" \
        --no-fail-on-empty-changeset \
        2>&1 || echo "Warning: ${scenario} deployment had issues"

    echo ""
done

echo ""
echo "=========================================="
echo "DEPLOYMENT COMPLETE - ENDPOINT TABLE"
echo "=========================================="
echo ""
echo "| Scenario | API Endpoint | Status |"
echo "|----------|--------------|--------|"

# Map scenarios to their output key names
declare -A OUTPUT_KEYS=(
    ["text-to-speech"]="ConvertURL"
    ["council-chatbot"]="ChatbotURL"
    ["foi-redaction"]="RedactionURL"
    ["planning-ai"]="AnalyzerURL"
    ["smart-car-park"]="AvailabilityAPI"
    ["quicksight-dashboard"]="DashboardUrl"
)

for scenario in "${SCENARIOS[@]}"; do
    STACK_NAME="ndx-try-${scenario}"
    OUTPUT_KEY="${OUTPUT_KEYS[$scenario]}"

    # Get stack status
    STATUS=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --query "Stacks[0].StackStatus" \
        --output text 2>/dev/null || echo "NOT_FOUND")

    # Get API endpoint using the correct output key
    ENDPOINT=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --query "Stacks[0].Outputs[?OutputKey=='${OUTPUT_KEY}'].OutputValue" \
        --output text 2>/dev/null || echo "N/A")

    # Handle empty endpoint
    if [ -z "$ENDPOINT" ] || [ "$ENDPOINT" == "None" ]; then
        ENDPOINT="N/A"
    fi

    echo "| ${scenario} | ${ENDPOINT} | ${STATUS} |"
done

echo ""
echo "Account: $ACCOUNT_ID"
echo "Region: $REGION"
echo "Deployed: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
