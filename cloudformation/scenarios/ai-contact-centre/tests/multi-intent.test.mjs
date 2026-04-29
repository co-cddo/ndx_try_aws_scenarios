// Multi-intent decomposer Lambda direct test (Task 13.10). Replays the
// fixtures in tests/multi-intent-fixtures.json against the deployed Lambda
// (synchronous invoke) and asserts cap behaviour.
//
// Implements: AC3.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtures = JSON.parse(await readFile(resolve(__dirname, "multi-intent-fixtures.json"), "utf-8"));

const REGION = process.env.AWS_REGION || "us-east-1";
const FUNCTION_NAME = process.env.AICC_MULTI_INTENT_FN || "ndx-try-aicc-multi-intent-us-east-1";

const lambda = new LambdaClient({ region: REGION });

async function invoke(utterance) {
  const resp = await lambda.send(new InvokeCommand({
    FunctionName: FUNCTION_NAME,
    Payload: Buffer.from(JSON.stringify({ utterance })),
  }));
  const text = Buffer.from(resp.Payload || []).toString("utf-8");
  return JSON.parse(text || "{}");
}

describe("AC3, multi-intent decomposer", { skip: !process.env.AICC_INTEGRATION_STACK }, () => {
  for (const fixture of fixtures.fixtures) {
    test(`fixture ${fixture.id}`, async () => {
      const result = await invoke(fixture.utterance);
      const decomposed = result.decomposed || result;
      const intents = decomposed.intents || [];

      if (fixture.expected_intents_count !== undefined) {
        assert.equal(intents.length, fixture.expected_intents_count,
                     `expected ${fixture.expected_intents_count} intents, got ${intents.length}`);
      } else {
        assert.equal(intents.length, fixture.expected_intents.length);
        const names = intents.map(i => i.intent_name).sort();
        assert.deepEqual(names, [...fixture.expected_intents].sort());
      }

      if (fixture.expected_truncated_count !== undefined) {
        const truncated = decomposed.truncated_intents || [];
        assert.equal(truncated.length, fixture.expected_truncated_count);
      }

      if (fixture.expected_safeguarding !== undefined) {
        assert.equal(decomposed.requires_safeguarding_review,
                     fixture.expected_safeguarding);
      }

      if (fixture.expected_intents_subset_of) {
        const allowed = new Set(fixture.expected_intents_subset_of);
        for (const i of intents) {
          assert.ok(allowed.has(i.intent_name),
                    `unexpected intent ${i.intent_name}`);
        }
      }
    });
  }

  test("cap is hard at 4", async () => {
    const result = await invoke(
      "Bin missed, council tax wrong, damp, fly tip, parked vehicle, pothole, broken pavement"
    );
    const intents = (result.decomposed || result).intents || [];
    assert.ok(intents.length <= 4, `cap exceeded: got ${intents.length}`);
  });
});
