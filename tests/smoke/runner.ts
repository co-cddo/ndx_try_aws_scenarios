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
  /**
   * Per-spec output-name aliases. Keys are the canonical names the spec
   * already uses (matching the all-demo umbrella's namespaced names);
   * values are the fallback leaf-stack output names emitted when the spec
   * runs against a single-scenario ISB-leased stack instead of all-demo.
   * If the canonical key is missing from the stack outputs, the alias is
   * copied to the canonical key so the rest of the spec works unchanged.
   * Never overwrites an already-present canonical value, so all-demo
   * smoke runs are unaffected.
   */
  outputAliases?: Readonly<Record<string, string>>;
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

      const fetched = await fetchStackOutputs({
        stackName: process.env.SMOKE_STACK_NAME ?? 'all-demo',
        region: process.env.SMOKE_AWS_REGION ?? 'us-east-1',
      });
      const merged = { ...fetched } as Record<string, typeof fetched[string]>;
      for (const [canonical, alias] of Object.entries(config.outputAliases ?? {})) {
        if (merged[canonical] === undefined && merged[alias] !== undefined) {
          merged[canonical] = merged[alias];
        }
      }
      const outputs = merged as CfnOutputs;

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
