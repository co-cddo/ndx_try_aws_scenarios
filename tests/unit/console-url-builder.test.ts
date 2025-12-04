/**
 * Unit Tests for Console URL Builder
 * Story: S0.5 - Reference Deployment Environment
 *
 * Tests console URL generation for all 6 scenarios
 */

import { describe, it, expect } from 'vitest';
import {
  buildConsoleUrl,
  extractResourceFromArn,
  type ConsoleUrlConfig,
} from '../../src/lib/console-url-builder';

describe('Console URL Builder', () => {
  describe('buildConsoleUrl', () => {
    it('should generate correct Lambda console URL', () => {
      const config: ConsoleUrlConfig = {
        service: 'lambda',
        region: 'us-west-2',
        resourceIdentifier: 'my-function',
      };

      const url = buildConsoleUrl(config);

      expect(url).toBe(
        'https://us-west-2.console.aws.amazon.com/lambda/home?region=us-west-2#/functions/my-function'
      );
    });

    it('should generate correct S3 console URL', () => {
      const config: ConsoleUrlConfig = {
        service: 's3',
        region: 'us-west-2',
        resourceIdentifier: 'my-bucket',
      };

      const url = buildConsoleUrl(config);

      expect(url).toBe(
        'https://s3.console.aws.amazon.com/s3/buckets/my-bucket?region=us-west-2'
      );
    });

    it('should generate correct DynamoDB console URL', () => {
      const config: ConsoleUrlConfig = {
        service: 'dynamodb',
        region: 'us-west-2',
        resourceIdentifier: 'my-table',
      };

      const url = buildConsoleUrl(config);

      expect(url).toBe(
        'https://us-west-2.console.aws.amazon.com/dynamodbv2/home?region=us-west-2#table?name=my-table'
      );
    });

    it('should generate correct CloudWatch console URL with encoded log group', () => {
      const config: ConsoleUrlConfig = {
        service: 'cloudwatch',
        region: 'us-west-2',
        resourceIdentifier: '/aws/lambda/my-function',
      };

      const url = buildConsoleUrl(config);

      expect(url).toBe(
        'https://us-west-2.console.aws.amazon.com/cloudwatch/home?region=us-west-2#logsV2:log-groups/log-group/%2Faws%2Flambda%2Fmy-function'
      );
    });

    it('should generate correct IoT console URL', () => {
      const config: ConsoleUrlConfig = {
        service: 'iot',
        region: 'us-west-2',
        resourceIdentifier: 'my-iot-thing',
      };

      const url = buildConsoleUrl(config);

      expect(url).toBe(
        'https://us-west-2.console.aws.amazon.com/iot/home?region=us-west-2#/thing/my-iot-thing'
      );
    });

    it('should generate correct QuickSight console URL', () => {
      const config: ConsoleUrlConfig = {
        service: 'quicksight',
        region: 'us-west-2',
        resourceIdentifier: 'dashboard-123',
      };

      const url = buildConsoleUrl(config);

      expect(url).toBe(
        'https://us-west-2.quicksight.aws.amazon.com/sn/dashboards/dashboard-123'
      );
    });

    it('should handle different AWS regions correctly', () => {
      const config: ConsoleUrlConfig = {
        service: 'lambda',
        region: 'eu-west-1',
        resourceIdentifier: 'my-function',
      };

      const url = buildConsoleUrl(config);

      expect(url).toBe(
        'https://eu-west-1.console.aws.amazon.com/lambda/home?region=eu-west-1#/functions/my-function'
      );
    });

    it('should handle us-west-2 region', () => {
      const config: ConsoleUrlConfig = {
        service: 'dynamodb',
        region: 'us-west-2',
        resourceIdentifier: 'my-table',
      };

      const url = buildConsoleUrl(config);

      expect(url).toBe(
        'https://us-west-2.console.aws.amazon.com/dynamodbv2/home?region=us-west-2#table?name=my-table'
      );
    });

    it('should throw error for unsupported service', () => {
      const config = {
        service: 'unsupported-service' as any,
        region: 'us-west-2',
        resourceIdentifier: 'resource',
      };

      expect(() => buildConsoleUrl(config)).toThrow('Unsupported service');
    });
  });

  describe('extractResourceFromArn', () => {
    it('should extract Lambda function name from ARN', () => {
      const arn = 'arn:aws:lambda:us-west-2:123456789012:function:my-function';
      const result = extractResourceFromArn(arn);

      expect(result).toEqual({
        resourceId: 'my-function',
        region: 'us-west-2',
        service: 'lambda',
      });
    });

    it('should extract Lambda function name with colon separator', () => {
      const arn = 'arn:aws:lambda:us-west-2:123456789012:function/my-function';
      const result = extractResourceFromArn(arn);

      expect(result).toEqual({
        resourceId: 'my-function',
        region: 'us-west-2',
        service: 'lambda',
      });
    });

    it('should extract S3 bucket name from ARN with default region', () => {
      const arn = 'arn:aws:s3:::my-bucket';
      const result = extractResourceFromArn(arn);

      // S3 ARNs don't include region, so default region is used
      expect(result).toEqual({
        resourceId: 'my-bucket',
        region: 'us-west-2',
        service: 's3',
      });
    });

    it('should use custom default region for S3 ARN', () => {
      const arn = 'arn:aws:s3:::my-bucket';
      const result = extractResourceFromArn(arn, 'eu-west-1');

      expect(result).toEqual({
        resourceId: 'my-bucket',
        region: 'eu-west-1',
        service: 's3',
      });
    });

    it('should extract DynamoDB table name from ARN', () => {
      const arn = 'arn:aws:dynamodb:us-west-2:123456789012:table/my-table';
      const result = extractResourceFromArn(arn);

      expect(result).toEqual({
        resourceId: 'my-table',
        region: 'us-west-2',
        service: 'dynamodb',
      });
    });

    it('should handle ARN from different regions', () => {
      const arn = 'arn:aws:lambda:eu-west-1:123456789012:function:my-function';
      const result = extractResourceFromArn(arn);

      expect(result.region).toBe('eu-west-1');
    });

    it('should throw error for invalid ARN format', () => {
      const invalidArn = 'not-an-arn';

      expect(() => extractResourceFromArn(invalidArn)).toThrow('Invalid ARN format');
    });

    it('should handle ARN with complex resource identifiers', () => {
      const arn =
        'arn:aws:lambda:us-west-2:123456789012:function:my-function:alias/production';
      const result = extractResourceFromArn(arn);

      expect(result.resourceId).toBe('my-function:alias/production');
    });
  });

  describe('URL Pattern Consistency', () => {
    it('should generate URLs matching documented patterns for all services', () => {
      const testCases = [
        {
          service: 'lambda' as const,
          region: 'us-west-2',
          resourceIdentifier: 'test-function',
          expectedPattern:
            /^https:\/\/us-west-2\.console\.aws\.amazon\.com\/lambda\/home\?region=us-west-2#\/functions\/.+$/,
        },
        {
          service: 's3' as const,
          region: 'us-west-2',
          resourceIdentifier: 'test-bucket',
          expectedPattern:
            /^https:\/\/s3\.console\.aws\.amazon\.com\/s3\/buckets\/.+\?region=us-west-2$/,
        },
        {
          service: 'dynamodb' as const,
          region: 'us-west-2',
          resourceIdentifier: 'test-table',
          expectedPattern:
            /^https:\/\/us-west-2\.console\.aws\.amazon\.com\/dynamodbv2\/home\?region=us-west-2#table\?name=.+$/,
        },
        {
          service: 'iot' as const,
          region: 'us-west-2',
          resourceIdentifier: 'test-thing',
          expectedPattern:
            /^https:\/\/us-west-2\.console\.aws\.amazon\.com\/iot\/home\?region=us-west-2#\/thing\/.+$/,
        },
        {
          service: 'quicksight' as const,
          region: 'us-west-2',
          resourceIdentifier: 'test-dashboard',
          expectedPattern:
            /^https:\/\/us-west-2\.quicksight\.aws\.amazon\.com\/sn\/dashboards\/.+$/,
        },
      ];

      for (const testCase of testCases) {
        const url = buildConsoleUrl({
          service: testCase.service,
          region: testCase.region,
          resourceIdentifier: testCase.resourceIdentifier,
        });

        expect(url).toMatch(testCase.expectedPattern);
      }
    });
  });
});
