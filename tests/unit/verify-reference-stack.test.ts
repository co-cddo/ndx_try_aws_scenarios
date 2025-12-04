/**
 * Unit Tests for Reference Stack Verification Script
 * Story: S0.5 - Reference Deployment Environment
 *
 * Tests stack health verification functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Define mock at module scope with proper initialization
const mockSend = vi.fn();

// Set up mocks BEFORE imports using vi.mock (hoisted)
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
const { verifyStackStatus, verifyStackOutputs, verifySampleDataAccessibility, verifyStackHealth } = await import('../../scripts/verify-reference-stack.mjs');

describe('Reference Stack Verification', () => {
  beforeEach(() => {
    mockSend.mockClear();
  });

  describe('verifyStackStatus', () => {
    it('should return HEALTHY for CREATE_COMPLETE status', async () => {
      mockSend.mockResolvedValueOnce({
        Stacks: [
          {
            StackStatus: 'CREATE_COMPLETE',
          },
        ],
      });

      const result = await verifyStackStatus('test-stack');

      expect(result).toEqual({
        status: 'CREATE_COMPLETE',
        healthy: true,
      });
    });

    it('should return HEALTHY for UPDATE_COMPLETE status', async () => {
      mockSend.mockResolvedValueOnce({
        Stacks: [
          {
            StackStatus: 'UPDATE_COMPLETE',
          },
        ],
      });

      const result = await verifyStackStatus('test-stack');

      expect(result).toEqual({
        status: 'UPDATE_COMPLETE',
        healthy: true,
      });
    });

    it('should return UNHEALTHY for CREATE_IN_PROGRESS status', async () => {
      mockSend.mockResolvedValueOnce({
        Stacks: [
          {
            StackStatus: 'CREATE_IN_PROGRESS',
          },
        ],
      });

      const result = await verifyStackStatus('test-stack');

      expect(result).toEqual({
        status: 'CREATE_IN_PROGRESS',
        healthy: false,
      });
    });

    it('should return UNHEALTHY for ROLLBACK_COMPLETE status', async () => {
      mockSend.mockResolvedValueOnce({
        Stacks: [
          {
            StackStatus: 'ROLLBACK_COMPLETE',
          },
        ],
      });

      const result = await verifyStackStatus('test-stack');

      expect(result).toEqual({
        status: 'ROLLBACK_COMPLETE',
        healthy: false,
      });
    });

    it('should return NOT_FOUND when stack does not exist', async () => {
      mockSend.mockResolvedValueOnce({
        Stacks: [],
      });

      const result = await verifyStackStatus('non-existent-stack');

      expect(result).toEqual({
        status: 'NOT_FOUND',
        healthy: false,
      });
    });

    it('should handle ValidationError for non-existent stack', async () => {
      const error: any = new Error('Stack does not exist');
      error.name = 'ValidationError';
      mockSend.mockRejectedValueOnce(error);

      const result = await verifyStackStatus('non-existent-stack');

      expect(result).toEqual({
        status: 'NOT_FOUND',
        healthy: false,
      });
    });
  });

  describe('verifyStackOutputs', () => {
    it('should return all outputs when all required outputs present', async () => {
      mockSend.mockResolvedValueOnce({
        Stacks: [
          {
            Outputs: [
              {
                OutputKey: 'CouncilChatbotLambdaArn',
                OutputValue: 'arn:aws:lambda:us-west-2:123456789012:function:test',
              },
              {
                OutputKey: 'CouncilChatbotDynamoTableArn',
                OutputValue: 'arn:aws:dynamodb:us-west-2:123456789012:table/test',
              },
              {
                OutputKey: 'PlanningAiS3BucketArn',
                OutputValue: 'arn:aws:s3:::test-bucket',
              },
              {
                OutputKey: 'FoiRedactionS3BucketArn',
                OutputValue: 'arn:aws:s3:::test-bucket-2',
              },
              {
                OutputKey: 'SmartCarParkDynamoTableArn',
                OutputValue: 'arn:aws:dynamodb:us-west-2:123456789012:table/test2',
              },
              {
                OutputKey: 'TextToSpeechS3BucketArn',
                OutputValue: 'arn:aws:s3:::test-bucket-3',
              },
            ],
          },
        ],
      });

      const result = await verifyStackOutputs('test-stack');

      expect(result.allPresent).toBe(true);
      expect(result.missing).toEqual([]);
      expect(Object.keys(result.outputs)).toHaveLength(6);
    });

    it('should detect missing outputs', async () => {
      mockSend.mockResolvedValueOnce({
        Stacks: [
          {
            Outputs: [
              {
                OutputKey: 'CouncilChatbotLambdaArn',
                OutputValue: 'arn:aws:lambda:us-west-2:123456789012:function:test',
              },
              // Missing other required outputs
            ],
          },
        ],
      });

      const result = await verifyStackOutputs('test-stack');

      expect(result.allPresent).toBe(false);
      expect(result.missing.length).toBeGreaterThan(0);
      expect(result.missing).toContain('CouncilChatbotDynamoTableArn');
    });

    it('should handle stack with no outputs', async () => {
      mockSend.mockResolvedValueOnce({
        Stacks: [
          {
            Outputs: [],
          },
        ],
      });

      const result = await verifyStackOutputs('test-stack');

      expect(result.allPresent).toBe(false);
      expect(result.outputs).toEqual({});
      expect(result.missing.length).toBeGreaterThan(0);
    });
  });

  describe('verifySampleDataAccessibility', () => {
    it('should return accessible when all resources exist', async () => {
      // Mock all DynamoDB and S3 calls succeed
      mockSend.mockResolvedValue({});

      const outputs = {
        PlanningAiS3BucketArn: 'arn:aws:s3:::test-bucket',
        FoiRedactionS3BucketArn: 'arn:aws:s3:::test-bucket-2',
        TextToSpeechS3BucketArn: 'arn:aws:s3:::test-bucket-3',
      };

      const result = await verifySampleDataAccessibility(outputs);

      expect(result.accessible).toBe(true);
      expect(result.issues).toEqual([]);
    });

    it('should detect missing DynamoDB table', async () => {
      let callCount = 0;

      mockSend.mockImplementation((command: any) => {
        if (command.__type === 'DescribeTableCommand') {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve({});
          } else {
            const error: any = new Error('Table not found');
            error.name = 'ResourceNotFoundException';
            return Promise.reject(error);
          }
        }
        return Promise.resolve({});
      });

      const outputs = {
        PlanningAiS3BucketArn: 'arn:aws:s3:::test-bucket',
        FoiRedactionS3BucketArn: 'arn:aws:s3:::test-bucket-2',
        TextToSpeechS3BucketArn: 'arn:aws:s3:::test-bucket-3',
      };

      const result = await verifySampleDataAccessibility(outputs);

      expect(result.accessible).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues.some((issue) => issue.includes('DynamoDB'))).toBe(true);
    });

    it('should detect missing S3 bucket', async () => {
      let s3CallCount = 0;

      mockSend.mockImplementation((command: any) => {
        if (command.__type === 'DescribeTableCommand') {
          return Promise.resolve({});
        }
        if (command.__type === 'HeadBucketCommand') {
          s3CallCount++;
          if (s3CallCount === 1) {
            const error: any = new Error('Bucket not found');
            error.name = 'NotFound';
            error.$metadata = { httpStatusCode: 404 };
            return Promise.reject(error);
          }
          return Promise.resolve({});
        }
        return Promise.resolve({});
      });

      const outputs = {
        PlanningAiS3BucketArn: 'arn:aws:s3:::test-bucket',
        FoiRedactionS3BucketArn: 'arn:aws:s3:::test-bucket-2',
        TextToSpeechS3BucketArn: 'arn:aws:s3:::test-bucket-3',
      };

      const result = await verifySampleDataAccessibility(outputs);

      expect(result.accessible).toBe(false);
      expect(result.issues.some((issue) => issue.includes('S3'))).toBe(true);
    });

    it('should handle S3 access denied error', async () => {
      let s3CallCount = 0;

      mockSend.mockImplementation((command: any) => {
        if (command.__type === 'DescribeTableCommand') {
          return Promise.resolve({});
        }
        if (command.__type === 'HeadBucketCommand') {
          s3CallCount++;
          if (s3CallCount === 1) {
            const error: any = new Error('Access denied');
            error.name = 'Forbidden';
            error.$metadata = { httpStatusCode: 403 };
            return Promise.reject(error);
          }
          return Promise.resolve({});
        }
        return Promise.resolve({});
      });

      const outputs = {
        PlanningAiS3BucketArn: 'arn:aws:s3:::test-bucket',
        FoiRedactionS3BucketArn: 'arn:aws:s3:::test-bucket-2',
        TextToSpeechS3BucketArn: 'arn:aws:s3:::test-bucket-3',
      };

      const result = await verifySampleDataAccessibility(outputs);

      expect(result.accessible).toBe(false);
      expect(result.issues.some((issue) => issue.includes('access denied'))).toBe(
        true
      );
    });
  });

  describe('verifyStackHealth (integration)', () => {
    it('should return HEALTHY when all checks pass', async () => {
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
                      'arn:aws:lambda:us-west-2:123456789012:function:test',
                  },
                  {
                    OutputKey: 'CouncilChatbotDynamoTableArn',
                    OutputValue:
                      'arn:aws:dynamodb:us-west-2:123456789012:table/test',
                  },
                  {
                    OutputKey: 'PlanningAiS3BucketArn',
                    OutputValue: 'arn:aws:s3:::test-bucket',
                  },
                  {
                    OutputKey: 'FoiRedactionS3BucketArn',
                    OutputValue: 'arn:aws:s3:::test-bucket-2',
                  },
                  {
                    OutputKey: 'SmartCarParkDynamoTableArn',
                    OutputValue:
                      'arn:aws:dynamodb:us-west-2:123456789012:table/test2',
                  },
                  {
                    OutputKey: 'TextToSpeechS3BucketArn',
                    OutputValue: 'arn:aws:s3:::test-bucket-3',
                  },
                ],
              },
            ],
          });
        }
        return Promise.resolve({});
      });

      const { healthy, result } = await verifyStackHealth('test-stack');

      expect(healthy).toBe(true);
      expect(result.checks.stack_status).toBe('CREATE_COMPLETE');
      expect(result.checks.outputs_available).toBe(true);
      expect(result.checks.sample_data_accessible).toBe(true);
      expect(result.issues).toEqual([]);
    });

    it('should return UNHEALTHY when stack status is not complete', async () => {
      mockSend.mockResolvedValueOnce({
        Stacks: [
          {
            StackStatus: 'UPDATE_IN_PROGRESS',
            Outputs: [],
          },
        ],
      });

      const { healthy, result } = await verifyStackHealth('test-stack');

      expect(healthy).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });
});
