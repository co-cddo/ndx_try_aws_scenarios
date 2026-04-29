// Security smoke test (Task 13.14). Configuration-readback assertion, NOT
// load-driven. Per F-CI-clarification, runs in the per-PR fast layer against
// the long-lived integration stack.
//
// Implements: AC20.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { WAFV2Client, GetWebACLCommand, ListWebACLsCommand } from "@aws-sdk/client-wafv2";
import { S3Client, GetBucketCorsCommand } from "@aws-sdk/client-s3";

const REGION = process.env.AWS_REGION || "us-east-1";
const STACK_PREFIX = process.env.STACK_PREFIX || "ndx-try-ai-contact-centre";

const wafClient = new WAFV2Client({ region: "us-east-1" });
const s3Client = new S3Client({ region: REGION });

async function findWebAcl() {
  const list = await wafClient.send(new ListWebACLsCommand({ Scope: "CLOUDFRONT" }));
  return (list.WebACLs || []).find(a => a.Name && a.Name.startsWith("ndx-try-aicc-waf"));
}

describe("AC20, security boundaries are config-asserted", { skip: !process.env.AICC_INTEGRATION_STACK }, () => {
  test("WebACL has AWSManagedRulesCommonRuleSet", async () => {
    const summary = await findWebAcl();
    assert.ok(summary, "WebACL must exist");
    const get = await wafClient.send(new GetWebACLCommand({
      Name: summary.Name, Scope: "CLOUDFRONT", Id: summary.Id,
    }));
    const rules = get.WebACL?.Rules || [];
    const common = rules.find(r => r.Name === "AWS-AWSManagedRulesCommonRuleSet");
    assert.ok(common, "AWSManagedRulesCommonRuleSet must be present");
  });

  test("WebACL rate-based rule has Limit=1000 and EvaluationWindowSec=300", async () => {
    const summary = await findWebAcl();
    const get = await wafClient.send(new GetWebACLCommand({
      Name: summary.Name, Scope: "CLOUDFRONT", Id: summary.Id,
    }));
    const rate = (get.WebACL?.Rules || []).find(r => r.Name === "RateLimit");
    assert.ok(rate, "RateLimit rule must exist");
    const stmt = rate.Statement?.RateBasedStatement;
    assert.equal(stmt?.Limit, 1000);
    assert.equal(stmt?.EvaluationWindowSec, 300);
  });

  test("uploads bucket CORS pins AllowedOrigins to the deployed CloudFront domain", async () => {
    const bucket = process.env.AICC_UPLOAD_BUCKET;
    assert.ok(bucket, "AICC_UPLOAD_BUCKET env var required");
    const cors = await s3Client.send(new GetBucketCorsCommand({ Bucket: bucket }));
    const rules = cors.CORSRules || [];
    assert.ok(rules.length > 0, "CORS rules must exist");
    const wildcard = rules.flatMap(r => r.AllowedOrigins || []).find(o => o === "*");
    assert.ok(!wildcard, "AllowedOrigins must NOT contain wildcard '*'");
    const cdn = process.env.AICC_CDN_DOMAIN;
    if (cdn) {
      const matched = rules.flatMap(r => r.AllowedOrigins || []).find(o => o.includes(cdn));
      assert.ok(matched, `AllowedOrigins must include the CloudFront domain ${cdn}`);
    }
  });

  test("forged-origin OPTIONS preflight returns 403 against companion API", async () => {
    if (!process.env.AICC_API_BASE) return;
    const resp = await fetch(`${process.env.AICC_API_BASE}/api/upload-presign`, {
      method: "OPTIONS",
      headers: {
        origin: "https://attacker.example",
        "access-control-request-method": "POST",
      },
    });
    assert.ok([403, 401].includes(resp.status),
              `Forged origin must be blocked (got ${resp.status})`);
  });
});
