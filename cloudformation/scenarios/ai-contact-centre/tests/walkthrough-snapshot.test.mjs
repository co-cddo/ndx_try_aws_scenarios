// Walkthrough render snapshot tests (Task 13.9). Asserts STRUCTURE not literal
// prose so content updates do not break tests (per F-Welsh-framing and AC11).
//
// Implements: AC11, AC14, AC22.

import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const walkthroughs = resolve(__dirname, "../../../../src/walkthroughs/ai-contact-centre");
const ethical = resolve(__dirname, "../audio/SCRIPT-ETHICAL-REVIEW.md");

async function readNjk(name) {
  return await readFile(resolve(walkthroughs, name), "utf-8");
}

describe("AC11, Welsh + accessibility takeaway page structure", () => {
  let step7;
  before(async () => { step7 = await readNjk("step-7.njk"); });

  test("page exists and renders", () => {
    assert.ok(step7.length > 1000, "Step 7 must be substantive");
  });

  test("contains a Strategic ask block with at least 4 bullets", () => {
    const askMatch = step7.match(/Strategic ask[\s\S]*?<\/ol>/i);
    assert.ok(askMatch, "Strategic ask block must exist");
    const bullets = askMatch[0].match(/<li>/g) || [];
    assert.ok(bullets.length >= 4, `Strategic ask must have >=4 bullets (got ${bullets.length})`);
  });

  test("each bullet mentions AWS Technical Account Manager / TAM / what to ask AWS", () => {
    const askMatch = step7.match(/Strategic ask[\s\S]*?<\/ol>/i);
    const liRe = /<li>([\s\S]*?)<\/li>/g;
    let m;
    let count = 0;
    while ((m = liRe.exec(askMatch[0])) !== null) {
      const li = m[1];
      const ok = /AWS Technical Account Manager|AWS TAM|what to ask AWS/i.test(li);
      assert.ok(ok, "Each strategic-ask bullet must reference AWS TAM");
      count += 1;
    }
    assert.ok(count >= 4);
  });

  test("contains the three-column gap table", () => {
    assert.ok(/<table[\s\S]*<\/table>/i.test(step7));
    const headers = step7.match(/<th[^>]*>(.*?)<\/th>/g) || [];
    const headerText = headers.join(" ");
    assert.ok(/English/i.test(headerText));
    assert.ok(/Welsh/i.test(headerText));
  });

  test("contains accessibility-beyond-Welsh content", () => {
    assert.ok(/TTY/i.test(step7));
    assert.ok(/Live Transcription/i.test(step7));
    assert.ok(/SMS/i.test(step7));
    assert.ok(/BSL/i.test(step7));
  });
});

describe("AC22, distress audio is ethically attributed and content-warned", () => {
  let step2;
  let ethicalDoc;
  before(async () => {
    step2 = await readNjk("step-2.njk");
    ethicalDoc = await readFile(ethical, "utf-8");
  });

  test("Step 2 has a content warning element near the audio link", () => {
    assert.ok(/content[- ]warning|distress|skip/i.test(step2),
              "Step 2 must include content warning / distress / skip language");
    assert.ok(/govuk-warning-text|content-warning|warning/.test(step2),
              "Step 2 must use a warning element");
  });

  test("Step 2 names an author and a safeguarding-lead reviewer", () => {
    assert.ok(/author|reviewed/i.test(step2));
    assert.ok(/safeguarding/i.test(step2));
  });

  test("Step 2 links to SCRIPT-ETHICAL-REVIEW.md", () => {
    assert.ok(/SCRIPT-ETHICAL-REVIEW\.md/i.test(step2));
  });

  test("ethical-review doc exists and has all required elements", () => {
    assert.ok(/Author/i.test(ethicalDoc));
    assert.ok(/[Ss]afeguarding [Ll]ead/i.test(ethicalDoc) ||
              /safeguarding lead reviewer/i.test(ethicalDoc));
    assert.ok(/[Dd]ate of review|review date|Date:/i.test(ethicalDoc));
    assert.ok(/[Cc]ontent warning|content_warning/i.test(ethicalDoc));
    assert.ok(/[Pp]layback policy/i.test(ethicalDoc));
  });
});

describe("AC14, walkthrough end-to-end is testable and traceable", () => {
  test("all 7 steps + index exist", async () => {
    const names = ["index.njk", "step-1.njk", "step-2.njk", "step-3.njk",
                   "step-4.njk", "step-5.njk", "step-6.njk", "step-7.njk"];
    for (const n of names) {
      const s = await readNjk(n);
      assert.ok(s.length > 100, `${n} should be non-trivial`);
    }
  });

  test("Step 1 has the climax phone-number card", async () => {
    const s = await readNjk("step-1.njk");
    assert.ok(/PstnNumber/i.test(s), "Step 1 must reference PstnNumber stack output");
  });

  test("Step 4 contains the climax line", async () => {
    const s = await readNjk("step-4.njk");
    assert.ok(/I[''']ve reviewed your photo/i.test(s),
              "Step 4 must include the climax line verbatim or near-verbatim");
    assert.ok(/environmental health/i.test(s));
    assert.ok(/Wednesday/i.test(s));
    assert.ok(/ABC123|ABC-123/i.test(s));
  });

  test("Step 6 mandates isb close-account", async () => {
    const s = await readNjk("step-6.njk");
    assert.ok(/isb close-account/i.test(s),
              "Step 6 must explicitly mandate isb close-account");
  });
});
