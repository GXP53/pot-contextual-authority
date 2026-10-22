import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const paths = {
  html: "demo/index.html",
  css: "demo/styles.css",
  app: "demo/app.js"
};

await Promise.all(Object.values(paths).map((path) => access(path)));

const [html, css, app] = await Promise.all([
  readFile(paths.html, "utf8"),
  readFile(paths.css, "utf8"),
  readFile(paths.app, "utf8")
]);

assert.match(
  html,
  /<link[^>]+href=["']styles\.css["'][^>]*>/i,
  "index.html must load styles.css"
);

assert.match(
  html,
  /<script[^>]+src=["']app\.js["'][^>]*><\/script>/i,
  "index.html must load app.js"
);

const requiredIds = [
  "evaluate-button",
  "approve-button",
  "replay-button",
  "reset-button",
  "decision-badge",
  "integrity-badge",
  "receipt-output",
  "flow-request",
  "flow-deferred",
  "flow-approved",
  "flow-receipt"
];

for (const id of requiredIds) {
  assert.match(
    html,
    new RegExp(`id=["']${id}["']`),
    `index.html must contain #${id}`
  );

  assert.ok(
    app.includes(`#${id}`),
    `app.js must reference #${id}`
  );
}

assert.ok(css.trim().length > 0, "styles.css must not be empty");

for (const decision of ["DEFERRED", "ALLOW", "BLOCK"]) {
  assert.ok(
    app.includes(`"${decision}"`),
    `app.js must implement the ${decision} state`
  );
}

assert.ok(
  app.includes("approvalPreviouslyUsed"),
  "app.js must preserve replay-protection evidence"
);

assert.ok(
  app.includes("INTEGRITY VERIFIED"),
  "app.js must expose receipt-integrity status"
);

console.log("PASS: Demo files exist and remain correctly connected.");
console.log("PASS: Required controls and output elements are present.");
console.log("PASS: DEFERRED, ALLOW, BLOCK, replay, and integrity states are represented.");
