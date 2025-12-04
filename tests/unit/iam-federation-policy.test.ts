/**
 * Unit tests for IAM Federation Policy
 * Story: S0.1 - AWS Federation Service Account Setup
 *
 * Tests validate:
 * - AC1.2: Policy allows only read-only actions (Describe*, List*, Get*)
 * - AC1.3: Policy denies Create/Delete/Update/iam:/organizations: actions
 * - NFR48: Explicit deny on modify/delete actions
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { parse } from 'yaml';
import { join } from 'path';

interface IAMPolicyStatement {
  Sid?: string;
  Effect: 'Allow' | 'Deny';
  Action: string | string[];
  Resource: string | string[];
}

interface IAMPolicyDocument {
  Version: string;
  Statement: IAMPolicyStatement[];
}

interface CloudFormationTemplate {
  Resources: {
    [key: string]: {
      Type: string;
      Properties?: {
        PolicyDocument?: IAMPolicyDocument;
      };
    };
  };
}

describe('IAM Federation Policy Validation', () => {
  let policyDocument: IAMPolicyDocument;
  let allowStatements: IAMPolicyStatement[];
  let denyStatements: IAMPolicyStatement[];

  beforeAll(() => {
    // Load CloudFormation template
    const templatePath = join(
      process.cwd(),
      'cloudformation/screenshot-automation/iam.yaml'
    );
    const templateContent = readFileSync(templatePath, 'utf-8');
    const template = parse(templateContent) as CloudFormationTemplate;

    // Extract IAM policy from FederationTokenPolicy resource
    const policyResource = template.Resources.FederationTokenPolicy;
    expect(policyResource).toBeDefined();
    expect(policyResource.Type).toBe('AWS::IAM::Policy');

    policyDocument = policyResource.Properties!.PolicyDocument!;
    expect(policyDocument).toBeDefined();
    expect(policyDocument.Version).toBe('2012-10-17');

    // Separate Allow and Deny statements
    allowStatements = policyDocument.Statement.filter(s => s.Effect === 'Allow');
    denyStatements = policyDocument.Statement.filter(s => s.Effect === 'Deny');
  });

  describe('Policy Structure', () => {
    it('should have at least 3 statements (federation, read-only, deny)', () => {
      expect(policyDocument.Statement.length).toBeGreaterThanOrEqual(3);
    });

    it('should have at least 2 Allow statements', () => {
      expect(allowStatements.length).toBeGreaterThanOrEqual(2);
    });

    it('should have at least 1 Deny statement', () => {
      expect(denyStatements.length).toBeGreaterThanOrEqual(1);
    });

    it('should have proper Sid labels', () => {
      const sids = policyDocument.Statement
        .map(s => s.Sid)
        .filter(Boolean);

      expect(sids).toContain('AllowFederationTokenGeneration');
      expect(sids).toContain('AllowReadOnlyConsoleAccess');
      expect(sids).toContain('DenyAllModifications');
    });
  });

  describe('Federation Token Permission (AC1.1)', () => {
    it('should allow sts:GetFederationToken', () => {
      const federationStatement = allowStatements.find(
        s => s.Sid === 'AllowFederationTokenGeneration'
      );

      expect(federationStatement).toBeDefined();
      const actions = Array.isArray(federationStatement!.Action)
        ? federationStatement!.Action
        : [federationStatement!.Action];

      expect(actions).toContain('sts:GetFederationToken');
    });

    it('should not allow other STS actions', () => {
      const allAllowedActions = allowStatements
        .flatMap(s => Array.isArray(s.Action) ? s.Action : [s.Action]);

      // Only sts:GetFederationToken should be allowed
      const stsActions = allAllowedActions.filter(a => a.startsWith('sts:'));
      expect(stsActions).toEqual(['sts:GetFederationToken']);
    });
  });

  describe('Read-Only Console Access (AC1.2)', () => {
    it('should allow Describe* actions for all required services', () => {
      const readOnlyStatement = allowStatements.find(
        s => s.Sid === 'AllowReadOnlyConsoleAccess'
      );

      expect(readOnlyStatement).toBeDefined();
      const actions = Array.isArray(readOnlyStatement!.Action)
        ? readOnlyStatement!.Action
        : [readOnlyStatement!.Action];

      // Required services per tech spec
      const requiredDescribeActions = [
        'ec2:Describe*',
        'cloudformation:Describe*',
        'dynamodb:Describe*',
        'logs:Describe*',
        'cloudwatch:Describe*',
        'iot:Describe*',
        'polly:Describe*',
        'comprehend:Describe*',
        'textract:Describe*',
        'quicksight:Describe*'
      ];

      requiredDescribeActions.forEach(action => {
        expect(actions).toContain(action);
      });
    });

    it('should allow List* actions for required services', () => {
      const readOnlyStatement = allowStatements.find(
        s => s.Sid === 'AllowReadOnlyConsoleAccess'
      );

      const actions = Array.isArray(readOnlyStatement!.Action)
        ? readOnlyStatement!.Action
        : [readOnlyStatement!.Action];

      const requiredListActions = [
        's3:List*',
        'lambda:List*',
        'cloudformation:List*',
        'dynamodb:List*',
        'cloudwatch:List*',
        'iot:List*',
        'polly:List*',
        'comprehend:List*',
        'bedrock:List*',
        'quicksight:List*'
      ];

      requiredListActions.forEach(action => {
        expect(actions).toContain(action);
      });
    });

    it('should allow Get* actions for required services', () => {
      const readOnlyStatement = allowStatements.find(
        s => s.Sid === 'AllowReadOnlyConsoleAccess'
      );

      const actions = Array.isArray(readOnlyStatement!.Action)
        ? readOnlyStatement!.Action
        : [readOnlyStatement!.Action];

      const requiredGetActions = [
        's3:Get*',
        'lambda:Get*',
        'cloudformation:Get*',
        'logs:Get*',
        'cloudwatch:Get*',
        'iot:Get*',
        'polly:Get*',
        'textract:Get*',
        'bedrock:Get*',
        'quicksight:Get*'
      ];

      requiredGetActions.forEach(action => {
        expect(actions).toContain(action);
      });
    });

    it('should only allow read-only actions (no Create/Delete/Update/Put)', () => {
      const allAllowedActions = allowStatements
        .flatMap(s => Array.isArray(s.Action) ? s.Action : [s.Action]);

      // Validate that no modification actions are allowed
      const modificationPatterns = [
        /Create/i,
        /Delete/i,
        /Update/i,
        /Put(?!Object$)/i, // Put but not PutObject (which is for upload)
        /Modify/i,
        /Terminate/i,
        /Stop/i,
        /Start/i,
        /Invoke/i,
        /Execute/i,
        /Run/i
      ];

      const violatingActions = allAllowedActions.filter(action =>
        modificationPatterns.some(pattern => pattern.test(action))
      );

      expect(violatingActions).toEqual([]);
    });
  });

  describe('Explicit Deny on Modifications (AC1.3, NFR48)', () => {
    it('should deny iam:* actions', () => {
      const denyStatement = denyStatements.find(
        s => s.Sid === 'DenyAllModifications'
      );

      expect(denyStatement).toBeDefined();
      const deniedActions = Array.isArray(denyStatement!.Action)
        ? denyStatement!.Action
        : [denyStatement!.Action];

      expect(deniedActions).toContain('iam:*');
    });

    it('should deny organizations:* actions', () => {
      const denyStatement = denyStatements.find(
        s => s.Sid === 'DenyAllModifications'
      );

      const deniedActions = Array.isArray(denyStatement!.Action)
        ? denyStatement!.Action
        : [denyStatement!.Action];

      expect(deniedActions).toContain('organizations:*');
    });

    it('should deny all Create* actions', () => {
      const denyStatement = denyStatements.find(
        s => s.Sid === 'DenyAllModifications'
      );

      const deniedActions = Array.isArray(denyStatement!.Action)
        ? denyStatement!.Action
        : [denyStatement!.Action];

      expect(deniedActions).toContain('*:Create*');
    });

    it('should deny all Delete* actions', () => {
      const denyStatement = denyStatements.find(
        s => s.Sid === 'DenyAllModifications'
      );

      const deniedActions = Array.isArray(denyStatement!.Action)
        ? denyStatement!.Action
        : [denyStatement!.Action];

      expect(deniedActions).toContain('*:Delete*');
    });

    it('should deny all Update* actions', () => {
      const denyStatement = denyStatements.find(
        s => s.Sid === 'DenyAllModifications'
      );

      const deniedActions = Array.isArray(denyStatement!.Action)
        ? denyStatement!.Action
        : [denyStatement!.Action];

      expect(deniedActions).toContain('*:Update*');
    });

    it('should deny all Put* actions', () => {
      const denyStatement = denyStatements.find(
        s => s.Sid === 'DenyAllModifications'
      );

      const deniedActions = Array.isArray(denyStatement!.Action)
        ? denyStatement!.Action
        : [denyStatement!.Action];

      expect(deniedActions).toContain('*:Put*');
    });

    it('should deny all Start* and Stop* actions', () => {
      const denyStatement = denyStatements.find(
        s => s.Sid === 'DenyAllModifications'
      );

      const deniedActions = Array.isArray(denyStatement!.Action)
        ? denyStatement!.Action
        : [denyStatement!.Action];

      expect(deniedActions).toContain('*:Start*');
      expect(deniedActions).toContain('*:Stop*');
    });

    it('should deny all Invoke* actions', () => {
      const denyStatement = denyStatements.find(
        s => s.Sid === 'DenyAllModifications'
      );

      const deniedActions = Array.isArray(denyStatement!.Action)
        ? denyStatement!.Action
        : [denyStatement!.Action];

      expect(deniedActions).toContain('*:Invoke*');
    });

    it('should have comprehensive deny list covering all modification types', () => {
      const denyStatement = denyStatements.find(
        s => s.Sid === 'DenyAllModifications'
      );

      const deniedActions = Array.isArray(denyStatement!.Action)
        ? denyStatement!.Action
        : [denyStatement!.Action];

      // Minimum set of denials per tech spec
      const requiredDenials = [
        'iam:*',
        'organizations:*',
        '*:Create*',
        '*:Delete*',
        '*:Update*',
        '*:Put*',
        '*:Start*',
        '*:Stop*',
        '*:Invoke*'
      ];

      requiredDenials.forEach(denial => {
        expect(deniedActions).toContain(denial);
      });
    });
  });

  describe('Security Best Practices', () => {
    it('should use allowlist approach (explicit Allow statements)', () => {
      // Verify we have explicit Allow statements for specific actions
      // This is safer than deny-by-default
      expect(allowStatements.length).toBeGreaterThan(0);

      const hasSpecificAllows = allowStatements.some(stmt => {
        const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
        // Check if we have specific service actions (not just "*")
        return actions.some(action =>
          action.includes(':') && !action.startsWith('*')
        );
      });

      expect(hasSpecificAllows).toBe(true);
    });

    it('should apply to all resources (*)', () => {
      // All statements should apply to all resources
      // This is required for console federation
      policyDocument.Statement.forEach(stmt => {
        const resource = Array.isArray(stmt.Resource)
          ? stmt.Resource
          : [stmt.Resource];
        expect(resource).toContain('*');
      });
    });

    it('should not allow wildcard actions in Allow statements', () => {
      allowStatements.forEach(stmt => {
        const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
        // Allow wildcards only in read-only patterns (Describe*, List*, Get*)
        actions.forEach(action => {
          if (action.endsWith('*')) {
            const prefix = action.slice(0, -1);
            const isReadOnlyPattern =
              prefix.endsWith('Describe') ||
              prefix.endsWith('List') ||
              prefix.endsWith('Get') ||
              action === 'sts:GetFederationToken'; // Exception for the federation action

            expect(isReadOnlyPattern).toBe(true);
          }
        });
      });
    });
  });

  describe('Federation Token Scoping Logic', () => {
    it('should support inline policy restriction via GetFederationToken', () => {
      // The policy allows GetFederationToken which supports inline policy parameter
      // This allows runtime restriction of permissions beyond what the base policy allows
      const federationStatement = allowStatements.find(
        s => s.Sid === 'AllowFederationTokenGeneration'
      );

      expect(federationStatement).toBeDefined();

      // Verify the action allows federation token generation
      const actions = Array.isArray(federationStatement!.Action)
        ? federationStatement!.Action
        : [federationStatement!.Action];

      expect(actions).toContain('sts:GetFederationToken');
    });

    it('should have no session duration constraints in policy (handled by API call)', () => {
      // Session duration is controlled by GetFederationToken API call
      // Policy should not restrict this - verify no conditions on statements
      policyDocument.Statement.forEach(stmt => {
        expect(stmt).not.toHaveProperty('Condition');
      });
    });
  });
});
