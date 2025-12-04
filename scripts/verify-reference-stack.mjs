#!/usr/bin/env node

/**
 * Pre-Capture Verification Script
 * Story: S0.5 - Reference Deployment Environment
 *
 * Validates reference stack health before screenshot capture:
 * - CloudFormation stack status (CREATE_COMPLETE/UPDATE_COMPLETE)
 * - Stack outputs availability
 * - Sample data accessibility
 *
 * AC5.5: Pre-capture verification script validates stack health
 *
 * Exit Codes:
 * - 0: Stack healthy and ready for screenshots
 * - 1: Stack unhealthy or not found
 */

import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';

// ============================================================================
// Configuration
// ============================================================================

const STACK_NAME = process.env.REFERENCE_STACK_NAME || 'ndx-reference';
const REGION = process.env.AWS_REGION || 'us-west-2';

// Expected outputs from reference stack
const REQUIRED_OUTPUTS = [
  'CouncilChatbotLambdaArn',
  'CouncilChatbotDynamoTableArn',
  'PlanningAiS3BucketArn',
  'FoiRedactionS3BucketArn',
  'SmartCarParkDynamoTableArn',
  'TextToSpeechS3BucketArn',
];

// ============================================================================
// AWS Clients
// ============================================================================

const cfnClient = new CloudFormationClient({ region: REGION });
const dynamoClient = new DynamoDBClient({ region: REGION });
const s3Client = new S3Client({ region: REGION });

// ============================================================================
// Verification Functions (Exported for Testing)
// ============================================================================

/**
 * Verify CloudFormation stack status
 * @param {string} stackName - Name of the stack to verify
 * @returns {Promise<{status: string, healthy: boolean}>}
 */
export async function verifyStackStatus(stackName) {
  try {
    const response = await cfnClient.send(
      new DescribeStacksCommand({ StackName: stackName })
    );

    const stack = response.Stacks?.[0];
    if (!stack) {
      return { status: 'NOT_FOUND', healthy: false };
    }

    const status = stack.StackStatus;
    const completeStates = ['CREATE_COMPLETE', 'UPDATE_COMPLETE'];
    const healthy = completeStates.includes(status);

    return { status, healthy };
  } catch (error) {
    if (error.name === 'ValidationError' && error.message.includes('does not exist')) {
      return { status: 'NOT_FOUND', healthy: false };
    }
    throw error;
  }
}

/**
 * Verify stack outputs are available
 * @param {string} stackName - Name of the stack
 * @returns {Promise<{outputs: Record<string, string>, allPresent: boolean, missing: string[]}>}
 */
export async function verifyStackOutputs(stackName) {
  const response = await cfnClient.send(
    new DescribeStacksCommand({ StackName: stackName })
  );

  const stack = response.Stacks?.[0];
  const outputs = {};

  if (stack?.Outputs) {
    for (const output of stack.Outputs) {
      if (output.OutputKey && output.OutputValue) {
        outputs[output.OutputKey] = output.OutputValue;
      }
    }
  }

  // Check for required outputs
  const missing = REQUIRED_OUTPUTS.filter((key) => !outputs[key]);
  const allPresent = missing.length === 0;

  return { outputs, allPresent, missing };
}

/**
 * Verify sample data accessibility (DynamoDB tables and S3 buckets)
 * @param {Record<string, string>} outputs - Stack outputs
 * @returns {Promise<{accessible: boolean, issues: string[]}>}
 */
export async function verifySampleDataAccessibility(outputs) {
  const issues = [];

  // Check DynamoDB tables
  const dynamoTables = [
    'ndx-reference-chatbot-conversations',
    'ndx-reference-car-park-sensors',
  ];

  for (const tableName of dynamoTables) {
    try {
      await dynamoClient.send(new DescribeTableCommand({ TableName: tableName }));
    } catch (error) {
      if (error.name === 'ResourceNotFoundException') {
        issues.push(`DynamoDB table '${tableName}' not found`);
      } else {
        issues.push(`DynamoDB table '${tableName}' error: ${error.message}`);
      }
    }
  }

  // Check S3 buckets from outputs
  const s3Outputs = [
    'PlanningAiS3BucketArn',
    'FoiRedactionS3BucketArn',
    'TextToSpeechS3BucketArn',
  ];

  for (const outputKey of s3Outputs) {
    if (outputs[outputKey]) {
      // Extract bucket name from ARN
      const bucketName = outputs[outputKey].split(':').pop();
      try {
        await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
      } catch (error) {
        if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
          issues.push(`S3 bucket '${bucketName}' not found`);
        } else if (error.name === 'Forbidden' || error.$metadata?.httpStatusCode === 403) {
          issues.push(`S3 bucket '${bucketName}' access denied`);
        } else {
          issues.push(`S3 bucket '${bucketName}' error: ${error.message}`);
        }
      }
    }
  }

  return {
    accessible: issues.length === 0,
    issues,
  };
}

/**
 * Run complete health verification
 * @param {string} stackName - Name of the stack to verify
 * @returns {Promise<{healthy: boolean, result: object}>}
 */
export async function verifyStackHealth(stackName) {
  const result = {
    stack_name: stackName,
    timestamp: new Date().toISOString(),
    healthy: true,
    checks: {
      stack_status: 'UNKNOWN',
      outputs_available: false,
      sample_data_accessible: false,
    },
    issues: [],
  };

  try {
    // Check 1: Stack status
    const statusCheck = await verifyStackStatus(stackName);
    result.checks.stack_status = statusCheck.status;

    if (!statusCheck.healthy) {
      result.healthy = false;
      result.issues.push(
        `Stack status is '${statusCheck.status}', expected CREATE_COMPLETE or UPDATE_COMPLETE`
      );
      return { healthy: false, result };
    }

    // Check 2: Stack outputs
    const outputsCheck = await verifyStackOutputs(stackName);
    result.checks.outputs_available = outputsCheck.allPresent;

    if (!outputsCheck.allPresent) {
      result.healthy = false;
      result.issues.push(
        `Missing required outputs: ${outputsCheck.missing.join(', ')}`
      );
    }

    // Check 3: Sample data accessibility
    const dataCheck = await verifySampleDataAccessibility(outputsCheck.outputs);
    result.checks.sample_data_accessible = dataCheck.accessible;

    if (!dataCheck.accessible) {
      result.healthy = false;
      result.issues.push(...dataCheck.issues);
    }

    return { healthy: result.healthy, result };
  } catch (error) {
    result.healthy = false;
    result.issues.push(`Verification failed: ${error.message}`);
    return { healthy: false, result };
  }
}

// ============================================================================
// Main Execution
// ============================================================================

/**
 * Main function for CLI execution
 */
async function main() {
  console.log(`Verifying reference stack: ${STACK_NAME}`);
  console.log(`Region: ${REGION}\n`);

  const { healthy, result } = await verifyStackHealth(STACK_NAME);

  // Print results
  console.log('Health Check Results:');
  console.log('─────────────────────');
  console.log(`Status: ${healthy ? '✓ HEALTHY' : '✗ UNHEALTHY'}`);
  console.log(`Stack Status: ${result.checks.stack_status}`);
  console.log(`Outputs Available: ${result.checks.outputs_available ? '✓' : '✗'}`);
  console.log(
    `Sample Data Accessible: ${result.checks.sample_data_accessible ? '✓' : '✗'}`
  );

  if (result.issues.length > 0) {
    console.log('\nIssues Found:');
    for (const issue of result.issues) {
      console.log(`  • ${issue}`);
    }
  }

  console.log('\n' + JSON.stringify(result, null, 2));

  // Exit with appropriate code
  process.exit(healthy ? 0 : 1);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}
