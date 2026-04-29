// Concurrent simulator submission race test (Task 13.13). Two simultaneous
// submitter calls, assert exactly one Case is associated with the phone (the
// ETag if-match retry merges into one).
//
// Implements: AC21.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { ConnectCasesClient, SearchCasesCommand } from "@aws-sdk/client-connectcases";

const REGION = process.env.AWS_REGION || "us-east-1";
const FUNCTION_NAME = process.env.AICC_MULTIMODAL_FN;
const CASES_DOMAIN_ID = process.env.AICC_CASES_DOMAIN_ID;

const lambda = new LambdaClient({ region: REGION });
const cases = new ConnectCasesClient({ region: REGION });

describe("AC21, concurrent submissions converge on one case", {
  skip: !process.env.AICC_INTEGRATION_STACK || !FUNCTION_NAME,
}, () => {
  test("two simultaneous submissions yield one case", async () => {
    const phone = `+44770${Math.floor(Math.random() * 1e7)}`;
    const fixtureKey = process.env.AICC_FIXTURE_IMAGE_KEY || "fixtures/bin-overflow.jpg";
    const payload = JSON.stringify({ image_s3_key: fixtureKey, sender_phone: phone });

    const [a, b] = await Promise.all([
      lambda.send(new InvokeCommand({ FunctionName: FUNCTION_NAME, Payload: Buffer.from(payload) })),
      lambda.send(new InvokeCommand({ FunctionName: FUNCTION_NAME, Payload: Buffer.from(payload) })),
    ]);
    const aJson = JSON.parse(Buffer.from(a.Payload || []).toString("utf-8") || "{}");
    const bJson = JSON.parse(Buffer.from(b.Payload || []).toString("utf-8") || "{}");

    // Both responses should reference the same case_id, OR one
    // returned 'saved_as_note_after_conflict' with the same case_id.
    const ids = [aJson.case_id, bJson.case_id].filter(Boolean);
    assert.ok(ids.length >= 1, "at least one case_id expected");
    assert.equal(new Set(ids).size, 1, `expected single case_id, got ${ids.join(",")}`);

    // SearchCases independently confirms exactly one open case.
    await new Promise(r => setTimeout(r, 1500));
    const search = await cases.send(new SearchCasesCommand({
      domainId: CASES_DOMAIN_ID,
      filter: {
        andAll: [
          { field: { id: "customer_phone_number", value: { stringValue: phone } } },
          { field: { id: "status", value: { stringValue: "open" } } },
        ],
      },
      maxResults: 5,
    }));
    assert.equal((search.cases || []).length, 1,
                 `expected exactly one open case for ${phone}, got ${(search.cases || []).length}`);
  });
});
