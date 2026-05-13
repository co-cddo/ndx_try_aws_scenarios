// Resolves a stack's Outputs via DescribeStacks. Outputs whose key matches
// SENSITIVE_KEY_PATTERN come back wrapped in a SensitiveValue whose toString
// / JSON.stringify / inspect emit [REDACTED]; the underlying value is only
// reachable via .sensitiveValue() so it can't accidentally land in a
// Playwright trace.

import {
  CloudFormationClient,
  DescribeStacksCommand,
  Output as CfnOutput,
} from '@aws-sdk/client-cloudformation';

const SENSITIVE_KEY_PATTERN =
  /(Password|Secret|Token|Credentials|Creds|Login|ApiKey|ConnectionString|PrivateKey|Passphrase)/i;

export interface SafeValue {
  readonly kind: 'safe';
  readonly value: string;
}

export interface SensitiveValue {
  readonly kind: 'sensitive';
  readonly length: number;
  sensitiveValue(): string;
}

export type ResolvedOutput = SafeValue | SensitiveValue;

export type CfnOutputs = Readonly<Record<string, ResolvedOutput>>;

const REDACTED_PLACEHOLDER = (length: number) => `[REDACTED (${length} chars)]`;

function makeSensitive(value: string): SensitiveValue {
  // Closure owns the value; toString / inspect emit a placeholder.
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
    // DescribeStacks does NOT return Output Metadata, so OutputMetadata:
    // { Sensitive: true } is unreachable here — the key-name regex is the
    // only signal. Extend SENSITIVE_KEY_PATTERN when new sensitive keys appear.
    if (isSensitiveKey(key, undefined)) {
      map[key] = makeSensitive(value);
    } else {
      map[key] = makeSafe(value);
    }
  }
  return Object.freeze(map);
}

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
