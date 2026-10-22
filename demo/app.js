const evaluateButton = document.querySelector("#evaluate-button");
const approveButton = document.querySelector("#approve-button");
const replayButton = document.querySelector("#replay-button");
const resetButton = document.querySelector("#reset-button");

const decisionBadge = document.querySelector("#decision-badge");
const integrityBadge = document.querySelector("#integrity-badge");
const receiptOutput = document.querySelector("#receipt-output");

const flowRequest = document.querySelector("#flow-request");
const flowDeferred = document.querySelector("#flow-deferred");
const flowApproved = document.querySelector("#flow-approved");
const flowReceipt = document.querySelector("#flow-receipt");

const request = {
  requestId: "request-roaming-001",
  actorId: "verified-household-adult",
  deviceId: "travel-fire-tv-stick",
  action: "rent-digital-content",
  amount: 9.99,
  currency: "CAD",
  contextId: "roaming",
  mandateId: "household-entertainment-v1"
};

let requestDigest = "";
let approvalId = "";
let approvalUsed = false;

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function createId(prefix) {
  const randomPart = crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(16).slice(2);

  return `${prefix}-${randomPart}`;
}

function setBadge(element, text, state) {
  element.textContent = text;
  element.className = `badge ${state}`;
}

function setFlow(activeStep, completedSteps = []) {
  const steps = [
    flowRequest,
    flowDeferred,
    flowApproved,
    flowReceipt
  ];

  steps.forEach((step) => {
    step.classList.remove("active", "complete");
  });

  completedSteps.forEach((step) => {
    step.classList.add("complete");
  });

  if (activeStep) {
    activeStep.classList.add("active");
  }
}

async function displayReceipt(decision, reason, extra = {}) {
  const receipt = {
    receiptId: createId("receipt"),
    timestamp: new Date().toISOString(),
    requestId: request.requestId,
    requestDigest,
    actorId: request.actorId,
    deviceId: request.deviceId,
    contextId: request.contextId,
    mandateId: request.mandateId,
    decision,
    reason,
    requiresHumanApproval: decision === "DEFERRED",
    ...extra
  };

  const integrity = await sha256(JSON.stringify(receipt));

  receiptOutput.textContent = JSON.stringify(
    {
      ...receipt,
      integrity
    },
    null,
    2
  );

  setBadge(integrityBadge, "INTEGRITY VERIFIED", "verified");
}

async function evaluateRequest() {
  evaluateButton.disabled = true;
  requestDigest = await sha256(JSON.stringify(request));

  setBadge(decisionBadge, "DEFERRED", "deferred");
  setFlow(flowDeferred, [flowRequest]);

  await displayReceipt(
    "DEFERRED",
    "Action-specific approval is required from the owner."
  );

  approveButton.disabled = false;
  replayButton.disabled = true;
}

async function approveRequest() {
  approveButton.disabled = true;
  approvalId = createId("approval");
  approvalUsed = true;

  setBadge(decisionBadge, "ALLOW", "allow");
  setFlow(flowReceipt, [
    flowRequest,
    flowDeferred,
    flowApproved
  ]);

  await displayReceipt(
    "ALLOW",
    "The exact phone-approved request is authorized.",
    {
      approvalId,
      approvalMethod: "simulated-phone-passkey",
      approvalBoundTo: requestDigest,
      approvalSingleUse: true
    }
  );

  replayButton.disabled = false;
}

async function attemptReplay() {
  replayButton.disabled = true;

  setBadge(decisionBadge, "BLOCK", "block");
  setFlow(flowReceipt, [
    flowRequest,
    flowDeferred,
    flowApproved
  ]);

  await displayReceipt(
    "BLOCK",
    "The approval has already been used and cannot be replayed.",
    {
      approvalId,
      approvalBoundTo: requestDigest,
      approvalPreviouslyUsed: approvalUsed
    }
  );
}

function resetDemo() {
  requestDigest = "";
  approvalId = "";
  approvalUsed = false;

  setBadge(decisionBadge, "READY", "neutral");
  setBadge(integrityBadge, "NOT ISSUED", "neutral");

  receiptOutput.textContent = "Evaluate the request to begin.";

  evaluateButton.disabled = false;
  approveButton.disabled = true;
  replayButton.disabled = true;

  setFlow(flowRequest);
}

evaluateButton.addEventListener("click", evaluateRequest);
approveButton.addEventListener("click", approveRequest);
replayButton.addEventListener("click", attemptReplay);
resetButton.addEventListener("click", resetDemo);

resetDemo();
