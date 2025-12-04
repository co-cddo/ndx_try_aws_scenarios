/**
 * Integration Tests for Reference Stack
 * Story: S0.5 - Reference Deployment Environment
 *
 * Tests end-to-end workflows with mocked AWS services
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Define mock at module scope with proper initialization
const mockSend = vi.fn();

// Mock AWS SDK clients BEFORE imports
vi.mock('@aws-sdk/client-cloudformation', () => ({
  CloudFormationClient: vi.fn().mockImplementation(() => ({ send: mockSend })),
  DescribeStacksCommand: vi.fn((params) => ({ ...params, __type: 'DescribeStacksCommand' })),
}));

vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: vi.fn().mockImplementation(() => ({ send: mockSend })),
  DescribeTableCommand: vi.fn((params) => ({ ...params, __type: 'DescribeTableCommand' })),
}));

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn().mockImplementation(() => ({ send: mockSend })),
  HeadBucketCommand: vi.fn((params) => ({ ...params, __type: 'HeadBucketCommand' })),
}));

// Import after mocks are defined
const { getStackOutputs, buildScenarioUrls } = await import('../../src/lib/console-url-builder');
const { verifyStackHealth } = await import('../../scripts/verify-reference-stack.mjs');

describe('Reference Stack Integration Tests', () => {
  beforeEach(() => {
    // Clear all mock calls before each test
    mockSend.mockClear();
  });

  describe('Full Health Check Workflow', () => {
    it('should complete full health check with all passing checks', async () => {
      // Mock CloudFormation stack response
      mockSend.mockImplementation((command: any) => {
        if (command.__type === 'DescribeStacksCommand') {
          return Promise.resolve({
            Stacks: [
              {
                StackStatus: 'CREATE_COMPLETE',
                Outputs: [
                  {
                    OutputKey: 'CouncilChatbotLambdaArn',
                    OutputValue:
                      'arn:aws:lambda:us-west-2:123456789012:function:ndx-reference-chatbot',
                  },
                  {
                    OutputKey: 'CouncilChatbotDynamoTableArn',
                    OutputValue:
                      'arn:aws:dynamodb:us-west-2:123456789012:table/ndx-reference-chatbot-conversations',
                  },
                  {
                    OutputKey: 'PlanningAiS3BucketArn',
                    OutputValue: 'arn:aws:s3:::ndx-reference-planning-ai-123456789012',
                  },
                  {
                    OutputKey: 'FoiRedactionS3BucketArn',
                    OutputValue:
                      'arn:aws:s3:::ndx-reference-foi-redaction-123456789012',
                  },
                  {
                    OutputKey: 'SmartCarParkDynamoTableArn',
                    OutputValue:
                      'arn:aws:dynamodb:us-west-2:123456789012:table/ndx-reference-car-park-sensors',
                  },
                  {
                    OutputKey: 'TextToSpeechS3BucketArn',
                    OutputValue:
                      'arn:aws:s3:::ndx-reference-text-to-speech-123456789012',
                  },
                ],
              },
            ],
          });
        }
        // DynamoDB and S3 commands succeed
        return Promise.resolve({});
      });

      const { healthy, result } = await verifyStackHealth('ndx-reference');

      expect(healthy).toBe(true);
      expect(result.stack_name).toBe('ndx-reference');
      expect(result.checks.stack_status).toBe('CREATE_COMPLETE');
      expect(result.checks.outputs_available).toBe(true);
      expect(result.checks.sample_data_accessible).toBe(true);
      expect(result.issues).toEqual([]);
    });

    it('should handle partially degraded stack with missing resources', async () => {
      let dynamoCallCount = 0;

      mockSend.mockImplementation((command: any) => {
        if (command.__type === 'DescribeStacksCommand') {
          return Promise.resolve({
            Stacks: [
              {
                StackStatus: 'CREATE_COMPLETE',
                Outputs: [
                  {
                    OutputKey: 'CouncilChatbotLambdaArn',
                    OutputValue:
                      'arn:aws:lambda:us-west-2:123456789012:function:ndx-reference-chatbot',
                  },
                  {
                    OutputKey: 'CouncilChatbotDynamoTableArn',
                    OutputValue:
                      'arn:aws:dynamodb:us-west-2:123456789012:table/ndx-reference-chatbot-conversations',
                  },
                  {
                    OutputKey: 'PlanningAiS3BucketArn',
                    OutputValue: 'arn:aws:s3:::ndx-reference-planning-ai-123456789012',
                  },
                  {
                    OutputKey: 'FoiRedactionS3BucketArn',
                    OutputValue:
                      'arn:aws:s3:::ndx-reference-foi-redaction-123456789012',
                  },
                  {
                    OutputKey: 'SmartCarParkDynamoTableArn',
                    OutputValue:
                      'arn:aws:dynamodb:us-west-2:123456789012:table/ndx-reference-car-park-sensors',
                  },
                  {
                    OutputKey: 'TextToSpeechS3BucketArn',
                    OutputValue:
                      'arn:aws:s3:::ndx-reference-text-to-speech-123456789012',
                  },
                ],
              },
            ],
          });
        }

        if (command.__type === 'DescribeTableCommand') {
          dynamoCallCount++;
          // First table exists, second does not
          if (dynamoCallCount === 1) {
            return Promise.resolve({});
          } else {
            const error: any = new Error('Table not found');
            error.name = 'ResourceNotFoundException';
            return Promise.reject(error);
          }
        }

        // S3 commands succeed
        return Promise.resolve({});
      });

      const { healthy, result } = await verifyStackHealth('ndx-reference');

      expect(healthy).toBe(false);
      expect(result.checks.sample_data_accessible).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues.some((issue) => issue.includes('DynamoDB'))).toBe(true);
    });
  });

  describe('Stack Output Retrieval and URL Building', () => {
    it('should retrieve stack outputs and build console URLs', async () => {
      mockSend.mockResolvedValue({
        Stacks: [
          {
            Outputs: [
              {
                OutputKey: 'CouncilChatbotLambdaArn',
                OutputValue:
                  'arn:aws:lambda:us-west-2:123456789012:function:ndx-reference-chatbot',
              },
              {
                OutputKey: 'CouncilChatbotDynamoTableArn',
                OutputValue:
                  'arn:aws:dynamodb:us-west-2:123456789012:table/ndx-reference-chatbot-conversations',
              },
              {
                OutputKey: 'PlanningAiS3BucketArn',
                OutputValue: 'arn:aws:s3:::ndx-reference-planning-ai-123456789012',
              },
              {
                OutputKey: 'FoiRedactionS3BucketArn',
                OutputValue:
                  'arn:aws:s3:::ndx-reference-foi-redaction-123456789012',
              },
              {
                OutputKey: 'SmartCarParkDynamoTableArn',
                OutputValue:
                  'arn:aws:dynamodb:us-west-2:123456789012:table/ndx-reference-car-park-sensors',
              },
              {
                OutputKey: 'TextToSpeechS3BucketArn',
                OutputValue:
                  'arn:aws:s3:::ndx-reference-text-to-speech-123456789012',
              },
              {
                OutputKey: 'QuickSightDashboardId',
                OutputValue: 'dashboard-12345',
              },
            ],
          },
        ],
      });

      const outputs = await getStackOutputs('ndx-reference');

      expect(outputs).toHaveProperty('CouncilChatbotLambdaArn');
      expect(outputs).toHaveProperty('PlanningAiS3BucketArn');
      expect(outputs).toHaveProperty('QuickSightDashboardId');

      // Build scenario URLs
      const scenarioUrls = await buildScenarioUrls('ndx-reference');

      expect(scenarioUrls.length).toBeGreaterThan(0);

      // Verify council-chatbot scenario
      const chatbotScenario = scenarioUrls.find(
        (s) => s.scenario === 'council-chatbot'
      );
      expect(chatbotScenario).toBeDefined();
      expect(chatbotScenario?.urls.length).toBeGreaterThan(0);

      // Verify Lambda URL is correctly formatted
      const lambdaUrl = chatbotScenario?.urls.find((u) => u.service === 'lambda');
      expect(lambdaUrl?.consoleUrl).toContain('lambda/home');
      expect(lambdaUrl?.consoleUrl).toContain('ndx-reference-chatbot');

      // Verify DynamoDB URL
      const dynamoUrl = chatbotScenario?.urls.find((u) => u.service === 'dynamodb');
      expect(dynamoUrl?.consoleUrl).toContain('dynamodbv2/home');
      expect(dynamoUrl?.consoleUrl).toContain(
        'ndx-reference-chatbot-conversations'
      );
    });

    it('should build URLs for all 6 scenarios when outputs are present', async () => {
      mockSend.mockResolvedValue({
        Stacks: [
          {
            Outputs: [
              {
                OutputKey: 'CouncilChatbotLambdaArn',
                OutputValue:
                  'arn:aws:lambda:us-west-2:123456789012:function:ndx-reference-chatbot',
              },
              {
                OutputKey: 'CouncilChatbotDynamoTableArn',
                OutputValue:
                  'arn:aws:dynamodb:us-west-2:123456789012:table/ndx-reference-chatbot-conversations',
              },
              {
                OutputKey: 'PlanningAiS3BucketArn',
                OutputValue: 'arn:aws:s3:::ndx-reference-planning-ai-123456789012',
              },
              {
                OutputKey: 'FoiRedactionS3BucketArn',
                OutputValue:
                  'arn:aws:s3:::ndx-reference-foi-redaction-123456789012',
              },
              {
                OutputKey: 'SmartCarParkDynamoTableArn',
                OutputValue:
                  'arn:aws:dynamodb:us-west-2:123456789012:table/ndx-reference-car-park-sensors',
              },
              {
                OutputKey: 'TextToSpeechS3BucketArn',
                OutputValue:
                  'arn:aws:s3:::ndx-reference-text-to-speech-123456789012',
              },
              {
                OutputKey: 'QuickSightDashboardId',
                OutputValue: 'dashboard-12345',
              },
            ],
          },
        ],
      });

      const scenarioUrls = await buildScenarioUrls('ndx-reference');

      // Should have 6 scenarios
      expect(scenarioUrls.length).toBe(6);

      const scenarios = scenarioUrls.map((s) => s.scenario);
      expect(scenarios).toContain('council-chatbot');
      expect(scenarios).toContain('planning-ai');
      expect(scenarios).toContain('foi-redaction');
      expect(scenarios).toContain('smart-car-park');
      expect(scenarios).toContain('text-to-speech');
      expect(scenarios).toContain('quicksight');
    });
  });

  describe('Fallback Screenshot Selection Logic', () => {
    it('should use fallback when stack is unhealthy', async () => {
      // Mock unhealthy stack
      mockSend.mockResolvedValue({
        Stacks: [
          {
            StackStatus: 'UPDATE_FAILED',
            Outputs: [],
          },
        ],
      });

      const { healthy } = await verifyStackHealth('ndx-reference');

      expect(healthy).toBe(false);

      // In a real workflow, this would trigger fallback screenshot selection
      // For this test, we just verify the stack is detected as unhealthy
    });

    it('should use live stack when healthy', async () => {
      mockSend.mockImplementation((command: any) => {
        if (command.__type === 'DescribeStacksCommand') {
          return Promise.resolve({
            Stacks: [
              {
                StackStatus: 'CREATE_COMPLETE',
                Outputs: [
                  {
                    OutputKey: 'CouncilChatbotLambdaArn',
                    OutputValue:
                      'arn:aws:lambda:us-west-2:123456789012:function:ndx-reference-chatbot',
                  },
                  {
                    OutputKey: 'CouncilChatbotDynamoTableArn',
                    OutputValue:
                      'arn:aws:dynamodb:us-west-2:123456789012:table/ndx-reference-chatbot-conversations',
                  },
                  {
                    OutputKey: 'PlanningAiS3BucketArn',
                    OutputValue: 'arn:aws:s3:::ndx-reference-planning-ai-123456789012',
                  },
                  {
                    OutputKey: 'FoiRedactionS3BucketArn',
                    OutputValue:
                      'arn:aws:s3:::ndx-reference-foi-redaction-123456789012',
                  },
                  {
                    OutputKey: 'SmartCarParkDynamoTableArn',
                    OutputValue:
                      'arn:aws:dynamodb:us-west-2:123456789012:table/ndx-reference-car-park-sensors',
                  },
                  {
                    OutputKey: 'TextToSpeechS3BucketArn',
                    OutputValue:
                      'arn:aws:s3:::ndx-reference-text-to-speech-123456789012',
                  },
                ],
              },
            ],
          });
        }
        // All other commands succeed
        return Promise.resolve({});
      });

      const { healthy } = await verifyStackHealth('ndx-reference');

      expect(healthy).toBe(true);

      // In a real workflow, this would proceed with live screenshot capture
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network error');
      networkError.name = 'NetworkError';
      mockSend.mockRejectedValue(networkError);

      const { healthy, result } = await verifyStackHealth('ndx-reference');

      expect(healthy).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should handle throttling errors', async () => {
      const throttleError = new Error('ThrottlingException');
      throttleError.name = 'ThrottlingException';
      mockSend.mockRejectedValue(throttleError);

      const { healthy, result } = await verifyStackHealth('ndx-reference');

      expect(healthy).toBe(false);
    });
  });
});
