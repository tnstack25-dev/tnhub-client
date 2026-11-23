import assert from "node:assert/strict";
import test from "node:test";
import { adminEndpoint } from "../src/lib/admin/proxy-policy.ts";
import {
  imageError,
  MAX_IMAGE_BYTES,
  safeImageUrl,
} from "../src/lib/media/validation.ts";
import { buildAuditFilters } from "../src/lib/audit/filters.ts";
const id = "00000000-0000-4000-8000-000000000001";
test("media exposes only backend-supported methods, audit is read-only", () => {
  for (const [method, parts] of [
    ["GET", ["media"]],
    ["POST", ["media", "upload"]],
    ["GET", ["media", "trash", id]],
    ["PATCH", ["media", id]],
    ["DELETE", ["media", "bulk"]],
    ["PATCH", ["media", "bulk", "restore"]],
    ["DELETE", ["media", "bulk", "permanent"]],
    ["GET", ["audit-logs"]],
    ["GET", ["audit-logs", "export"]],
    ["GET", ["audit-logs", id]],
  ])
    assert.equal(adminEndpoint(method, parts), "/" + parts.join("/"));
  for (const [method, parts] of [
    ["POST", ["media"]],
    ["POST", ["media", "bulk"]],
    ["GET", ["media", "upload"]],
    ["PUT", ["media", id]],
    ["PATCH", ["audit-logs", id]],
    ["DELETE", ["audit-logs", id]],
    ["POST", ["audit-logs"]],
    ["GET", ["audit-logs", "trash"]],
    ["GET", ["media", "upload", "nested"]],
  ])
    assert.equal(adminEndpoint(method, parts), null);
});
test("reject empty, oversized and unsupported uploads; allow exact maximum", () => {
  assert.equal(imageError({ type: "image/png", size: MAX_IMAGE_BYTES }), null);
  assert.ok(imageError({ type: "image/png", size: MAX_IMAGE_BYTES + 1 }));
  assert.ok(imageError({ type: "image/png", size: 0 }));
  assert.ok(imageError({ type: "image/svg+xml", size: 100 }));
  assert.equal(safeImageUrl("javascript:alert(1)"), undefined);
  assert.equal(safeImageUrl("data:text/html,script"), undefined);
  assert.equal(
    safeImageUrl("https://example.test/photo.png"),
    "https://example.test/photo.png",
  );
});
test("audit normalizes actor ID, converts timestamps and rejects reversed intervals", () => {
  const filters = buildAuditFilters({
    eventType: " media.uploaded ",
    userId: id.toUpperCase(),
    fromLocal: "2026-11-21T00:00:00Z",
    toLocal: "2026-11-22T00:00:00Z",
  });
  assert.equal(filters.eventType, "media.uploaded");
  assert.equal(filters.userId, id);
  assert.equal(filters.from, "2026-11-21T00:00:00.000Z");
  assert.throws(() =>
    buildAuditFilters({
      fromLocal: "2026-11-22T00:00:00Z",
      toLocal: "2026-11-21T00:00:00Z",
    }),
  );
  assert.throws(() => buildAuditFilters({ userId: "invalid" }));
  assert.throws(() => buildAuditFilters({ fromLocal: "invalid date" }));
});
