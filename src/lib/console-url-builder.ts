/**
 * AWS Console URL Builder for Reference Stack
 * Story: S0.5 - Reference Deployment Environment
 *
 * Builds AWS Console URLs from CloudFormation stack outputs dynamically.
 * Supports all 6 scenario service types with region-specific URL construction.
 *
 * AC5.7: Console URLs built from stack outputs (not hardcoded ARNs)
 */

import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

/**
 * Reference stack outputs for all 6 scenarios
 */
export interface ReferenceStackOutputs {
  // Council Chatbot
  CouncilChatbotLambdaArn: string;
  CouncilChatbotApiEndpoint: string;
  CouncilChatbotDynamoTableArn: string;

  // Planning AI
  PlanningAiTextractEndpoint: string;
  PlanningAiS3BucketArn: string;

  // FOI Redaction
  FoiRedactionComprehendEndpoint: string;
  FoiRedactionS3BucketArn: string;

  // Smart Car Park
  SmartCarParkIotEndpoint: string;
  SmartCarParkDynamoTableArn: string;

  // Text-to-Speech
  TextToSpeechPollyEndpoint: string;
  TextToSpeechS3BucketArn: string;

  // QuickSight
  QuickSightDashboardId: string;
  QuickSightDataSetArn: string;
}

/**
 * Console URL configuration for building service-specific URLs
 */
export interface ConsoleUrlConfig {
  service: 'lambda' | 's3' | 'dynamodb' | 'cloudwatch' | 'iot' | 'quicksight';
  region: string;
  resourceIdentifier: string;
}

/**
 * Service-specific URLs for a scenario
 */
export interface ScenarioUrls {
  scenario: string;
  urls: {
    service: string;
    consoleUrl: string;
    description: string;
  }[];
}

// ============================================================================
// Console URL Patterns (from story context)
// ============================================================================

/**
 * Build AWS Console URL for a specific service and resource
 *
 * @param config - Console URL configuration
 * @returns AWS Console URL
 *
 * @example
 * ```typescript
 * const url = buildConsoleUrl({
 *   service: 'lambda',
 *   region: 'us-west-2',
 *   resourceIdentifier: 'my-function'
 * });
 * // Returns: https://us-west-2.console.aws.amazon.com/lambda/home?region=us-west-2#/functions/my-function
 * ```
 */
export function buildConsoleUrl(config: ConsoleUrlConfig): string {
  const { service, region, resourceIdentifier } = config;

  switch (service) {
    case 'lambda': {
      // Lambda: https://{region}.console.aws.amazon.com/lambda/home?region={region}#/functions/{functionName}
      return `https://${region}.console.aws.amazon.com/lambda/home?region=${region}#/functions/${resourceIdentifier}`;
    }

    case 's3': {
      // S3: https://s3.console.aws.amazon.com/s3/buckets/{bucketName}?region={region}
      return `https://s3.console.aws.amazon.com/s3/buckets/${resourceIdentifier}?region=${region}`;
    }

    case 'dynamodb': {
      // DynamoDB: https://{region}.console.aws.amazon.com/dynamodbv2/home?region={region}#table?name={tableName}
      return `https://${region}.console.aws.amazon.com/dynamodbv2/home?region=${region}#table?name=${resourceIdentifier}`;
    }

    case 'cloudwatch': {
      // CloudWatch: https://{region}.console.aws.amazon.com/cloudwatch/home?region={region}#logsV2:log-groups/log-group/{logGroupName}
      const encodedLogGroup = encodeURIComponent(resourceIdentifier);
      return `https://${region}.console.aws.amazon.com/cloudwatch/home?region=${region}#logsV2:log-groups/log-group/${encodedLogGroup}`;
    }

    case 'iot': {
      // IoT: https://{region}.console.aws.amazon.com/iot/home?region={region}#/thing/{thingName}
      return `https://${region}.console.aws.amazon.com/iot/home?region=${region}#/thing/${resourceIdentifier}`;
    }

    case 'quicksight': {
      // QuickSight: https://{region}.quicksight.aws.amazon.com/sn/dashboards/{dashboardId}
      return `https://${region}.quicksight.aws.amazon.com/sn/dashboards/${resourceIdentifier}`;
    }

    default:
      throw new Error(`Unsupported service: ${service}`);
  }
}

// ============================================================================
// ARN Parsing
// ============================================================================

/**
 * Extract resource identifier and region from AWS ARN
 *
 * @param arn - AWS ARN (e.g., arn:aws:lambda:us-west-2:123456789012:function:my-function)
 * @param defaultRegion - Default region for services without region in ARN (e.g., S3)
 * @returns Resource identifier and region
 *
 * @example
 * ```typescript
 * const { resourceId, region } = extractResourceFromArn(
 *   'arn:aws:lambda:us-west-2:123456789012:function:my-function'
 * );
 * // resourceId: 'my-function'
 * // region: 'us-west-2'
 * ```
 */
export function extractResourceFromArn(
  arn: string,
  defaultRegion: string = 'us-west-2'
): {
  resourceId: string;
  region: string;
  service: string;
} {
  // ARN format: arn:partition:service:region:account-id:resource
  const arnParts = arn.split(':');

  if (arnParts.length < 6) {
    throw new Error(`Invalid ARN format: ${arn}`);
  }

  const service = arnParts[2];
  let region = arnParts[3];
  const resourcePart = arnParts.slice(5).join(':'); // Everything after account-id

  // Extract resource identifier based on service
  let resourceId = resourcePart;

  // Lambda: function:function-name or function/function-name
  if (service === 'lambda' && resourcePart.startsWith('function')) {
    resourceId = resourcePart.replace(/^function[:/]/, '');
  }

  // DynamoDB: table/table-name
  if (service === 'dynamodb' && resourcePart.startsWith('table/')) {
    resourceId = resourcePart.replace(/^table\//, '');
  }

  // S3: bucket-name (no prefix, no region in ARN)
  if (service === 's3') {
    resourceId = resourcePart;
    // S3 ARNs don't include region, use default
    region = defaultRegion;
  }

  // Use default region if empty (e.g., for global services)
  if (!region) {
    region = defaultRegion;
  }

  return { resourceId, region, service };
}

// ============================================================================
// Stack Output Functions
// ============================================================================

/**
 * Get CloudFormation stack outputs
 *
 * @param stackName - Name of the CloudFormation stack
 * @param region - AWS region (defaults to us-west-2)
 * @returns Stack outputs as key-value map
 *
 * @example
 * ```typescript
 * const outputs = await getStackOutputs('ndx-reference', 'us-west-2');
 * const lambdaArn = outputs['CouncilChatbotLambdaArn'];
 * ```
 */
export async function getStackOutputs(
  stackName: string,
  region: string = 'us-west-2'
): Promise<Record<string, string>> {
  // Get credentials from environment
  const credentials =
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          sessionToken: process.env.AWS_SESSION_TOKEN,
        }
      : undefined;

  const cfnClient = new CloudFormationClient({
    region,
    credentials,
  });

  const command = new DescribeStacksCommand({
    StackName: stackName,
  });

  const response = await cfnClient.send(command);
  const stack = response.Stacks?.[0];

  if (!stack || !stack.Outputs) {
    return {};
  }

  // Convert outputs array to key-value map
  return stack.Outputs.reduce(
    (acc, output) => {
      if (output.OutputKey && output.OutputValue) {
        acc[output.OutputKey] = output.OutputValue;
      }
      return acc;
    },
    {} as Record<string, string>
  );
}

/**
 * Build scenario-specific console URLs from reference stack outputs
 *
 * @param stackName - Name of the reference stack (default: ndx-reference)
 * @param region - AWS region (defaults to us-west-2)
 * @returns Scenario URLs for all 6 scenarios
 *
 * @example
 * ```typescript
 * const scenarioUrls = await buildScenarioUrls('ndx-reference');
 * // Returns array of ScenarioUrls for all 6 scenarios
 * ```
 */
export async function buildScenarioUrls(
  stackName: string = 'ndx-reference',
  region: string = 'us-west-2'
): Promise<ScenarioUrls[]> {
  const outputs = await getStackOutputs(stackName, region);

  const scenarios: ScenarioUrls[] = [];

  // Council Chatbot
  if (outputs.CouncilChatbotLambdaArn) {
    const lambda = extractResourceFromArn(outputs.CouncilChatbotLambdaArn);
    const urls: ScenarioUrls['urls'] = [
      {
        service: 'lambda',
        consoleUrl: buildConsoleUrl({
          service: 'lambda',
          region: lambda.region,
          resourceIdentifier: lambda.resourceId,
        }),
        description: 'Lambda function for chatbot processing',
      },
    ];

    if (outputs.CouncilChatbotDynamoTableArn) {
      const dynamo = extractResourceFromArn(outputs.CouncilChatbotDynamoTableArn);
      urls.push({
        service: 'dynamodb',
        consoleUrl: buildConsoleUrl({
          service: 'dynamodb',
          region: dynamo.region,
          resourceIdentifier: dynamo.resourceId,
        }),
        description: 'DynamoDB table for chatbot data',
      });
    }

    scenarios.push({
      scenario: 'council-chatbot',
      urls,
    });
  }

  // Planning AI
  if (outputs.PlanningAiS3BucketArn) {
    const s3 = extractResourceFromArn(outputs.PlanningAiS3BucketArn);
    scenarios.push({
      scenario: 'planning-ai',
      urls: [
        {
          service: 's3',
          consoleUrl: buildConsoleUrl({
            service: 's3',
            region: s3.region,
            resourceIdentifier: s3.resourceId,
          }),
          description: 'S3 bucket for planning application documents',
        },
      ],
    });
  }

  // FOI Redaction
  if (outputs.FoiRedactionS3BucketArn) {
    const s3 = extractResourceFromArn(outputs.FoiRedactionS3BucketArn);
    scenarios.push({
      scenario: 'foi-redaction',
      urls: [
        {
          service: 's3',
          consoleUrl: buildConsoleUrl({
            service: 's3',
            region: s3.region,
            resourceIdentifier: s3.resourceId,
          }),
          description: 'S3 bucket for FOI document processing',
        },
      ],
    });
  }

  // Smart Car Park
  if (outputs.SmartCarParkDynamoTableArn) {
    const dynamo = extractResourceFromArn(outputs.SmartCarParkDynamoTableArn);
    scenarios.push({
      scenario: 'smart-car-park',
      urls: [
        {
          service: 'dynamodb',
          consoleUrl: buildConsoleUrl({
            service: 'dynamodb',
            region: dynamo.region,
            resourceIdentifier: dynamo.resourceId,
          }),
          description: 'DynamoDB table for IoT sensor data',
        },
      ],
    });
  }

  // Text-to-Speech
  if (outputs.TextToSpeechS3BucketArn) {
    const s3 = extractResourceFromArn(outputs.TextToSpeechS3BucketArn);
    scenarios.push({
      scenario: 'text-to-speech',
      urls: [
        {
          service: 's3',
          consoleUrl: buildConsoleUrl({
            service: 's3',
            region: s3.region,
            resourceIdentifier: s3.resourceId,
          }),
          description: 'S3 bucket for generated audio files',
        },
      ],
    });
  }

  // QuickSight
  if (outputs.QuickSightDashboardId) {
    scenarios.push({
      scenario: 'quicksight',
      urls: [
        {
          service: 'quicksight',
          consoleUrl: buildConsoleUrl({
            service: 'quicksight',
            region,
            resourceIdentifier: outputs.QuickSightDashboardId,
          }),
          description: 'QuickSight dashboard for analytics',
        },
      ],
    });
  }

  return scenarios;
}
