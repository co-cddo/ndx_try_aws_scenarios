/**
 * Smoke-pack CFN-outputs helper.
 *
 * Resolves the deployed all-demo stack's Outputs at test time via
 * cloudformation:DescribeStacks and returns a typed map where sensitive
 * outputs are gated behind a callable accessor that never leaks through
 * toString / JSON.stringify / Playwright trace logs.
 *
 * Phase 3 / T3.2 of the scenario-regression smoke-pack tech-spec.
 */

import {
  CloudFormationClient,
  DescribeStacksCommand,
  Output as CfnOutput,
} from '@aws-sdk/client-cloudformation';

/**
 * The regex is deliberately broader than first-pass to catch AdminCreds,
 * DefaultLogin, BootstrapKey, ApiKey, DBConnectionString, etc. Plus an
 * opt-in via OutputMetadata: { Sensitive: true } on the CFN Output.
 */
const SENSITIVE_KEY_PATTERN =
  /(Password|Secret|Token|Credentials|Creds|Login|ApiKey|ConnectionString|PrivateKey|Passphrase)/i;

export interface SafeValue {
  readonly kind: 'safe';
  /** The output value, safe to log / assert by string. */
  readonly value: string;
}

export interface SensitiveValue {
  readonly kind: 'sensitive';
  /** Length of the redacted value (safe to log; useful for shape assertions). */
  readonly length: number;
  /** Returns the actual value. Callers MUST NOT pass this through string
   *  interpolation or assertion frameworks that auto-print on failure. */
  sensitiveValue(): string;
}

export type ResolvedOutput = SafeValue | SensitiveValue;

export type CfnOutputs = Readonly<Record<string, ResolvedOutput>>;

const REDACTED_PLACEHOLDER = (length: number) => `[REDACTED (${length} chars)]`;

function makeSensitive(value: string): SensitiveValue {
  // Closures own the value; toString / JSON.stringify / inspect on the
  // wrapper object never expose it. The accessor is the explicit unlock.
  const v = value;
  const wrapper: SensitiveValue = {
    kind: 'sensitive',
    length: v.length,
    sensitiveValue: () => v,
  };
  // Make toString / inspect emit the placeholder, even if the wrapper is
  // logged directly.
  Object.defineProperty(wrapper, 'toString', {
    enumerable: false,
    value: () => REDACTED_PLACEHOLDER(v.length),
  });
  Object.defineProperty(wrapper, Symbol.toPrimitive, {
    enumerable: false,
    value: () => REDACTED_PLACEHOLDER(v.length),
  });
  // Node's util.inspect honors this:
  Object.defineProperty(wrapper, Symbol.for('nodejs.util.inspect.custom'), {
    enumerable: false,
    value: () => REDACTED_PLACEHOLDER(v.length),
  });
  return wrapper;
}

function makeSafe(value: string): SafeValue {
  return { kind: 'safe', value };
}

function isSensitiveKey(key: string, metadataJson: string | undefined): boolean {
  if (SENSITIVE_KEY_PATTERN.test(key)) return true;
  if (metadataJson) {
    try {
      const meta = JSON.parse(metadataJson);
      if (meta?.Sensitive === true) return true;
    } catch {
      // ignore unparseable metadata
    }
  }
  return false;
}

interface FetchOptions {
  readonly stackName: string;
  readonly region: string;
  readonly client?: CloudFormationClient;
}

/**
 * Resolves all Outputs of the named stack. The returned map is the helper's
 * authoritative read of "what does this deployment expose"; smoke tests
 * import the assertion-bar row, look up the row's outputsToCheck, and
 * assert on this map.
 */
export async function fetchStackOutputs(
  opts: FetchOptions,
): Promise<CfnOutputs> {
  const client =
    opts.client ?? new CloudFormationClient({ region: opts.region });
  const res = await client.send(
    new DescribeStacksCommand({ StackName: opts.stackName }),
  );
  const stacks = res.Stacks ?? [];
  if (stacks.length === 0) {
    throw new Error(`Stack "${opts.stackName}" not found in ${opts.region}`);
  }
  const outputs: CfnOutput[] = stacks[0].Outputs ?? [];
  const map: Record<string, ResolvedOutput> = {};
  for (const o of outputs) {
    const key = o.OutputKey;
    const value = o.OutputValue;
    if (!key || value === undefined) continue;
    // Limitation: CloudFormation's DescribeStacks API does NOT return
    // Output Metadata, so the spec's Metadata: { Sensitive: true } opt-in
    // is unimplementable via this API. The regex below is the sole signal.
    // The spec's "audit pass after Phase 4" should grow the regex when it
    // identifies outputs that need redaction but aren't matched yet.
    if (isSensitiveKey(key, undefined)) {
      map[key] = makeSensitive(value);
    } else {
      map[key] = makeSafe(value);
    }
  }
  return Object.freeze(map);
}

/**
 * Convenience: assert a Safe output exists and return its value, or throw.
 * Prevents tests from accidentally treating a missing Output as an empty
 * string.
 */
export function requireSafe(outputs: CfnOutputs, key: string): string {
  const o = outputs[key];
  if (!o) throw new Error(`Required CFN output "${key}" not present`);
  if (o.kind !== 'safe') {
    throw new Error(
      `Output "${key}" is sensitive; use requireSensitive() and pass the accessor only to fillPassword`,
    );
  }
  return o.value;
}

/**
 * Convenience: assert a Sensitive output exists and return its accessor.
 * The caller MUST only pass the accessor's RETURN VALUE to credential-entry
 * sites (e.g. secure-form.ts::fillPassword); the accessor itself never logs
 * the value.
 */
export function requireSensitive(
  outputs: CfnOutputs,
  key: string,
): SensitiveValue {
  const o = outputs[key];
  if (!o) throw new Error(`Required CFN output "${key}" not present`);
  if (o.kind !== 'sensitive') {
    throw new Error(
      `Output "${key}" is not flagged sensitive; either rename it to match the sensitivity regex or use requireSafe()`,
    );
  }
  return o;
}
