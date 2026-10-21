import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(currentDirectory, "..");

const mandate = JSON.parse(
  readFileSync(
    resolve(repositoryRoot, "policies/household-mandates.json"),
    "utf8"
  )
);

const requests = JSON.parse(
  readFileSync(
    resolve(repositoryRoot, "examples/synthetic-requests.json"),
    "utf8"
  )
);

function digest(value) {
  return createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex");
}

function block(reason) {
  return {
    decision: "BLOCK",
    reason,
    requiresHumanApproval: false
  };
}

function evaluate(request, policy) {
  if (policy.status !== "active") {
    return block("Mandate is not active.");
  }

  if (request.actorId !== policy.subject.role) {
    return block("Actor is not authorized by this mandate.");
  }

  if (request.action !== policy.action.type) {
    return block("Requested action is outside the mandate.");
  }

  if (request.currency !== policy.action.currency) {
    return block("Currency does not match the mandate.");
  }

  if (request.amount > policy.action.maximumAmount) {
    return block("Requested amount exceeds the mandate maximum.");
  }

  const recognizedDevices = policy.contexts.flatMap(
    (context) => context.recognizedDevices
  );

  if (!recognizedDevices.includes(request.deviceId)) {
    return block("Device is not recognized by the mandate.");
  }

  const matchedContext = policy.contexts.find(
    (context) =>
      context.contextId === request.contextId &&
      context.recognizedDevices.includes(request.deviceId)
  );

  if (!matchedContext) {
    return block("Device and operating context do not match.");
  }

  if (matchedContext.decision === "DEFERRED") {
    return {
      decision: "DEFERRED",
      reason: "Action-specific approval is required from the owner.",
      requiresHumanApproval: true,
      authorizedApprovalChannels:
        matchedContext.authorizedApprovalChannels ?? []
    };
  }

  return {
    decision: matchedContext.decision,
    reason: "Request satisfies the active household mandate.",
    requiresHumanApproval:
      matchedContext.requiresHumanApproval ?? false
  };
}

function createReceipt(request, result, policy) {
  const receipt = {
    receiptId: randomUUID(),
    timestamp: new Date().toISOString(),
    requestId: request.requestId,
    requestDigest: digest(request),
    actorId: request.actorId,
    deviceId: request.deviceId,
    mandateId: policy.mandateId,
    policyVersion: policy.schemaVersion,
    decision: result.decision,
    reason: result.reason,
    requiresHumanApproval: result.requiresHumanApproval
  };

  return {
    ...receipt,
    integrity: digest(receipt)
  };
}

let allTestsPassed = true;

for (const request of requests) {
  const result = evaluate(request, mandate);
  const receipt = createReceipt(request, result, mandate);
  const passed = result.decision === request.expectedDecision;

  if (!passed) {
    allTestsPassed = false;
  }

  console.log(
    JSON.stringify(
      {
        requestId: request.requestId,
        expected: request.expectedDecision,
        actual: result.decision,
        passed,
        receipt
      },
      null,
      2
    )
  );
}

console.log(
  allTestsPassed
    ? "PASS: All PoT decisions matched expectations."
    : "FAIL: One or more PoT decisions did not match expectations."
);

process.exitCode = allTestsPassed ? 0 : 1;
