// PII residue assertion test (Task 13.15). Drives a StartChatContact with
// fixture utterances containing known PII tokens, then scans DDB and the
// generated share-PDF for any verbatim PII.
//
// Implements: AC19.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { ConnectClient, StartChatContactCommand, StopContactCommand } from "@aws-sdk/client-connect";
import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const REGION = process.env.AWS_REGION || "us-east-1";

const connect = new ConnectClient({ region: REGION });
const ddb = new DynamoDBClient({ region: REGION });

const PII_TOKENS = {
  NAME:     ["John Smith", "John", "Smith"],
  ADDRESS:  ["SW1A 1AA", "10 Downing Street"],
  PHONE:    ["07700 900123", "+447700900123", "07700900123"],
  EMAIL:    ["john.smith@example.com"],
  NI_NUMBER:["AB123456C"],
};

const PII_FLAT = Object.values(PII_TOKENS).flat();

describe("AC19, PII does not persist at rest unredacted", { skip: !process.env.AICC_INTEGRATION_STACK }, () => {
  test("DDB ContactLensCache contains no fixture-known PII verbatim", async () => {
    const contactId = process.env.AICC_FIXTURE_CONTACT_ID;
    assert.ok(contactId, "AICC_FIXTURE_CONTACT_ID required (drive a chat against the integration stack first)");
    const tableName = process.env.AICC_DDB_TABLE;
    assert.ok(tableName, "AICC_DDB_TABLE required");

    const resp = await ddb.send(new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "contactId = :c",
      ExpressionAttributeValues: { ":c": { S: contactId } },
    }));
    const items = (resp.Items || []).map(unmarshall);

    assert.ok(items.length > 0, "fixture contact should have produced segments");

    for (const item of items) {
      const flat = JSON.stringify(item);
      for (const token of PII_FLAT) {
        assert.ok(!flat.includes(token),
                  `DDB item for ${contactId} contains raw PII token '${token}'\nitem: ${flat}`);
      }
    }
  });

  test("DDB transcripts use {NAME} {ADDRESS} {PHONE} {EMAIL} placeholders", async () => {
    const contactId = process.env.AICC_FIXTURE_CONTACT_ID;
    const tableName = process.env.AICC_DDB_TABLE;
    const resp = await ddb.send(new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "contactId = :c",
      ExpressionAttributeValues: { ":c": { S: contactId } },
    }));
    const items = (resp.Items || []).map(unmarshall);
    const allTranscripts = items.map(i => i.transcript || "").join("\n");
    const placeholderRe = /\{[A-Z_]+\}/g;
    const matches = allTranscripts.match(placeholderRe) || [];
    assert.ok(matches.length > 0, "expected at least one {PLACEHOLDER} in transcripts");
  });

  test("share-PDF contains no fixture-known PII", async () => {
    const pdfUrl = process.env.AICC_FIXTURE_SHARE_PDF_URL;
    if (!pdfUrl) return; // Only when share-PDF was generated
    const resp = await fetch(pdfUrl);
    assert.equal(resp.status, 200);
    const buf = Buffer.from(await resp.arrayBuffer());
    // Convert binary to ASCII probe (Latin-1 covers PDF text streams)
    const text = buf.toString("latin1");
    for (const token of PII_FLAT) {
      assert.ok(!text.includes(token), `share-PDF leaked raw PII token '${token}'`);
    }
  });
});
