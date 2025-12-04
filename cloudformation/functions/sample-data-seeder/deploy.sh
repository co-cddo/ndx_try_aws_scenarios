#!/bin/bash
# Deploy Sample Data Seeder Lambda Function
# Usage: ./deploy.sh [region] [stack-name] [layer-arn] [s3-bucket]

set -e

REGION="${1:-us-west-2}"
STACK_NAME="${2:-sample-data-seeder}"
LAYER_ARN="${3}"
S3_BUCKET="${4}"

echo "=========================================="
echo "Deploying Sample Data Seeder Function"
echo "=========================================="
echo "Region: $REGION"
echo "Stack: $STACK_NAME"
echo ""

# Validate layer ARN is provided
if [ -z "$LAYER_ARN" ]; then
    echo "ERROR: Layer ARN is required"
    echo "Usage: ./deploy.sh [region] [stack-name] [layer-arn] [s3-bucket]"
    echo ""
    echo "Example:"
    echo "./deploy.sh us-west-2 sample-data-seeder arn:aws:lambda:us-west-2:123456789012:layer:uk-data-generator:1 my-deployment-bucket"
    exit 1
fi

# Validate S3 bucket is provided
if [ -z "$S3_BUCKET" ]; then
    echo "ERROR: S3 bucket is required"
    echo "Usage: ./deploy.sh [region] [stack-name] [layer-arn] [s3-bucket]"
    echo ""
    echo "Example:"
    echo "./deploy.sh us-west-2 sample-data-seeder arn:aws:lambda:us-west-2:123456789012:layer:uk-data-generator:1 my-deployment-bucket"
    exit 1
fi

echo "Layer ARN: $LAYER_ARN"
echo "S3 Bucket: $S3_BUCKET"
echo ""

# Package Lambda function code
echo "[1/3] Packaging Lambda function code..."
FUNCTION_PACKAGE="sample-data-seeder.zip"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Create temporary directory for packaging
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Copy function code to temp directory
cp "${SCRIPT_DIR}/index.py" "$TEMP_DIR/"

# Create zip package
cd "$TEMP_DIR"
zip -q "$FUNCTION_PACKAGE" index.py
cd "$SCRIPT_DIR"

echo "Package created: $FUNCTION_PACKAGE"
echo ""

# Upload to S3
echo "[2/3] Uploading package to S3..."
S3_KEY="${STACK_NAME}/${FUNCTION_PACKAGE}"
aws s3 cp "$TEMP_DIR/$FUNCTION_PACKAGE" "s3://${S3_BUCKET}/${S3_KEY}" \
    --region "${REGION}"

echo "Uploaded to: s3://${S3_BUCKET}/${S3_KEY}"
echo ""

# Deploy CloudFormation stack
echo "[3/3] Deploying CloudFormation stack..."
aws cloudformation deploy \
    --template-file template.yaml \
    --stack-name "${STACK_NAME}" \
    --region "${REGION}" \
    --parameter-overrides \
        UKDataGeneratorLayerArn="${LAYER_ARN}" \
        FunctionCodeBucket="${S3_BUCKET}" \
        FunctionCodeKey="${S3_KEY}" \
    --capabilities CAPABILITY_IAM

# Get outputs
echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --region "${REGION}" \
    --query 'Stacks[0].Outputs' \
    --output table

echo ""
echo "Sample Data Seeder deployed successfully!"
echo "Use the SeederFunctionArn output in your scenario stacks."
