#!/bin/bash
# Deploy UK Data Generator Lambda Layer
# Usage: ./deploy.sh [region] [stack-name]

set -e

REGION="${1:-us-west-2}"
STACK_NAME="${2:-uk-data-generator-layer}"
LAYER_NAME="uk-data-generator"

echo "=========================================="
echo "Deploying UK Data Generator Lambda Layer"
echo "=========================================="
echo "Region: $REGION"
echo "Stack: $STACK_NAME"
echo "Layer: $LAYER_NAME"
echo ""

# Create deployment package
echo "[1/4] Creating layer package..."
cd "$(dirname "$0")"
zip -r uk-data-generator.zip python/ -x "*.pyc" -x "*__pycache__*"
echo "Package created: uk-data-generator.zip"

# Create S3 bucket for layer code if it doesn't exist
BUCKET_NAME="${STACK_NAME}-code-${AWS_ACCOUNT_ID:-$(aws sts get-caller-identity --query Account --output text)}"
echo ""
echo "[2/4] Checking S3 bucket..."
if aws s3 ls "s3://${BUCKET_NAME}" 2>&1 | grep -q 'NoSuchBucket'; then
    echo "Creating bucket: ${BUCKET_NAME}"
    aws s3 mb "s3://${BUCKET_NAME}" --region "${REGION}"
else
    echo "Bucket exists: ${BUCKET_NAME}"
fi

# Upload layer package to S3
echo ""
echo "[3/4] Uploading layer package to S3..."
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
S3_KEY="uk-data-generator-${TIMESTAMP}.zip"
aws s3 cp uk-data-generator.zip "s3://${BUCKET_NAME}/${S3_KEY}"
echo "Uploaded to: s3://${BUCKET_NAME}/${S3_KEY}"

# Deploy CloudFormation stack
echo ""
echo "[4/4] Deploying CloudFormation stack..."
aws cloudformation deploy \
    --template-file layer.yaml \
    --stack-name "${STACK_NAME}" \
    --region "${REGION}" \
    --parameter-overrides \
        LayerName="${LAYER_NAME}" \
        LayerCodeBucket="${BUCKET_NAME}" \
        LayerCodeKey="${S3_KEY}" \
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

# Clean up local package
rm uk-data-generator.zip
echo ""
echo "Layer deployed successfully!"
echo "Use the LayerArn output in your Lambda functions."
