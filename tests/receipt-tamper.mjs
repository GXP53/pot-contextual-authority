import assert from "node:assert/strict";
import { createHash } from "node:crypto";

function digest(value) {
  return createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex");
}

function verifyReceipt(receipt) {
  const { integrity, ...receiptContents } = receipt;
  return digest(receiptContents) === integrity;
}

const receiptContents = {
  receiptId: "receipt-demo-001",
  timestamp: "2026-10-21T22:00:00.000Z",
  requestId: "request-roaming-001",
  actorId: "verified-household-adult",
  deviceId: "travel-fire-tv-stick",
  mandateId: "household-entertainment-v1",
  policyVersion: "0.1.0",
  decision: "DEFERRED",
  reason: "Action-specific approval is required from the owner.",
  requiresHumanApproval: true
};

const completedReceipt = {
  ...receiptContents,
  integrity: digest(receiptContents)
};

assert.equal(
  verifyReceipt(completedReceipt),
  true,
  "The unchanged receipt should verify."
);

const tamperedReceipt = {
  ...completedReceipt,
  decision: "ALLOW"
};

assert.equal(
  verifyReceipt(tamperedReceipt),
  false,
  "The altered receipt must fail verification."
);

console.log("PASS: Unchanged receipt verified.");
console.log("PASS: Altered receipt failed verification.");
