import { test, expect } from '@playwright/test';
import type {
  Browser,
  APIRequestContext,
  Page,
} from '@playwright/test';

import {
  fetchStackOutputs,
  requireSafe,
  requireSensitive,
} from './fixtures/cfn-outputs';
import type { CfnOutputs, SensitiveValue } from './fixtures/cfn-outputs';

export type Quarantine =
  | { state: 'active' }
  | { state: 'quarantined'; until: string; reason: string };

export interface SmokeContext {
  page: Page;
  request: APIRequestContext;
  browser: Browser;
  outputs: CfnOutputs;
  /** Resolve a non-sensitive output; throws if missing or flagged sensitive. */
  get: (key: string) => string;
  /** Resolve a sensitive output; throws if missing or non-sensitive. */
  getSecret: (key: string) => SensitiveValue;
}

export interface UrlProbe {
  outputKey: string;
  method?: 'GET' | 'POST';
  postBody?: { headers?: Record<string, string>; data?: unknown };
}

export interface SmokeConfig {
  scenario: string;
  outputs?: ReadonlyArray<string>;
  quarantine?: Quarantine;
  publicUrl?: UrlProbe;
  test?: (ctx: SmokeContext) => Promise<void>;
}

export function runSmoke(config: SmokeConfig): void {
  test.describe(config.scenario, () => {
    test('smoke', async ({ page, request, browser }) => {
      if (config.quarantine?.state === 'quarantined') {
        test.skip(
          true,
          `Quarantined until ${config.quarantine.until}: ${config.quarantine.reason}`,
        );
      }

      const outputs = await fetchStackOutputs({
        stackName: process.env.SMOKE_STACK_NAME ?? 'all-demo',
        region: process.env.SMOKE_AWS_REGION ?? 'us-east-1',
      });

      for (const key of config.outputs ?? []) {
        expect(outputs[key], `CFN output ${key} missing`).toBeDefined();
      }

      if (config.publicUrl) {
        const url = requireSafe(outputs, config.publicUrl.outputKey);
        const method = config.publicUrl.method ?? 'GET';
        const resp =
          method === 'POST'
            ? await request.post(url, {
                failOnStatusCode: false,
                ...config.publicUrl.postBody,
              })
            : await request.get(url, { failOnStatusCode: false });
        expect(
          resp.status(),
          `${config.scenario} ${config.publicUrl.outputKey} 403 — public-Lambda dual-perm regressed`,
        ).not.toBe(403);
        expect(
          resp.status(),
          `${config.scenario} ${config.publicUrl.outputKey} 5xx`,
        ).toBeLessThan(500);
      }

      if (config.test) {
        await config.test({
          page,
          request,
          browser,
          outputs,
          get: (k) => requireSafe(outputs, k),
          getSecret: (k) => requireSensitive(outputs, k),
        });
      }
    });
  });
}
