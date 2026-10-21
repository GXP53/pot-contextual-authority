import assert from "node:assert/strict";
import { createHash } from "node:crypto";

function digest(value) {
  return createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex");
}

function evaluateRoamingRequest(request) {
  return request.contextId === "roaming"
    ? "DEFERRED"
    : "ALLOW";
}

function createApproval(request, now) {
  return {
    approvalId: "approval-phone-001",
    approvedBy: "verified-household-adult",
    method: "simulated-phone-passkey",
    requestDigest: digest(request),
    issuedAt: now,
    expiresAt: now + 5 * 60 * 1000,
    nonce: "single-use-nonce-001"
  };
}

function applyApproval(request, approval, now, usedNonces) {
  if (approval.approvedBy !== request.actorId) {
    return "BLOCK";
  }

  if (approval.requestDigest !== digest(request)) {
    return "BLOCK";
  }

  if (now > approval.expiresAt) {
    return "BLOCK";
  }

  if (usedNonces.has(approval.nonce)) {
    return "BLOCK";
  }

  usedNonces.add(approval.nonce);
  return "ALLOW";
}

const now = Date.parse("2026-10-21T23:00:00.000Z");

const roamingRequest = {
  requestId: "request-roaming-001",
  actorId: "verified-household-adult",
  deviceId: "travel-fire-tv-stick",
  action: "rent-digital-content",
  contentId: "movie-002",
  amount: 9.99,
  currency: "CAD",
  contextId: "roaming"
};

assert.equal(
  evaluateRoamingRequest(roamingRequest),
  "DEFERRED",
  "A roaming request must wait for human approval."
);

const approval = createApproval(roamingRequest, now);
const usedNonces = new Set();

assert.equal(
  applyApproval(roamingRequest, approval, now, usedNonces),
  "ALLOW",
  "The exact approved request should be allowed."
);

assert.equal(
  applyApproval(roamingRequest, approval, now, usedNonces),
  "BLOCK",
  "A used approval must not be replayed."
);

const alteredRequest = {
  ...roamingRequest,
  amount: 19.99
};

assert.equal(
  applyApproval(alteredRequest, approval, now, new Set()),
  "BLOCK",
  "Approval must not authorize an altered request."
);

const expiredApproval = createApproval(roamingRequest, now);

assert.equal(
  applyApproval(
    roamingRequest,
    expiredApproval,
    now + 10 * 60 * 1000,
    new Set()
  ),
  "BLOCK",
  "An expired approval must be rejected."
);

console.log("PASS: Roaming request deferred for human approval.");
console.log("PASS: Exact phone-approved request allowed.");
console.log("PASS: Replayed approval blocked.");
console.log("PASS: Altered request blocked.");
console.log("PASS: Expired approval blocked.");
