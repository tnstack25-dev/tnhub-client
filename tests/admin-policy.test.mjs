import assert from "node:assert/strict";
import test from "node:test";
import { ADMIN_RESOURCE_POLICIES, adminEndpoint, sameOrigin } from "../src/lib/admin/proxy-policy.ts";
const id = "00000000-0000-4000-8000-000000000001";
test("supports exact module CRUD, bulk and assignment routes", () => {
  assert.deepEqual(Object.keys(ADMIN_RESOURCE_POLICIES), [
    "audit-logs",
    "health",
    "media",
    "roles",
    "permissions",
    "users",
    "services",
    "clients",
    "tags",
    "notifications",
    "websites",
    "projects",
  ]);
  assert.equal(adminEndpoint("GET", ["health", "live"]), "/health/live");
  assert.equal(adminEndpoint("GET", ["health", "ready"]), "/health/ready");
  for (const resource of [
    "roles",
    "permissions",
    "users",
    "services",
    "clients",
    "tags",
    "websites",
    "projects",
  ]) {
    for (const method of ["GET", "POST"])
      assert.equal(adminEndpoint(method, [resource]), "/" + resource);
    for (const method of ["GET", "PATCH", "DELETE"])
      assert.equal(adminEndpoint(method, [resource, id]), "/" + resource + "/" + id);
    assert.equal(adminEndpoint("DELETE", [resource, "bulk"]), "/" + resource + "/bulk");
    if (!["services", "tags"].includes(resource)) {
      assert.equal(adminEndpoint("GET", [resource, "trash"]), "/" + resource + "/trash");
      assert.equal(
        adminEndpoint("PATCH", [resource, "bulk", "restore"]),
        "/" + resource + "/bulk/restore",
      );
      assert.equal(
        adminEndpoint("DELETE", [resource, id, "permanent"]),
        "/" + resource + "/" + id + "/permanent",
      );
    }
  }
  assert.equal(
    adminEndpoint("PUT", ["roles", id, "permissions"]),
    "/roles/" + id + "/permissions",
  );
  assert.equal(adminEndpoint("PUT", ["users", id, "roles"]), "/users/" + id + "/roles");
  assert.equal(
    adminEndpoint("PATCH", ["services", "bulk", "status"]),
    "/services/bulk/status",
  );
  assert.equal(
    adminEndpoint("PATCH", ["clients", "bulk", "status"]),
    "/clients/bulk/status",
  );
  const contactId = "00000000-0000-4000-8000-000000000002";
  assert.equal(
    adminEndpoint("GET", ["clients", id, "contacts"]),
    "/clients/" + id + "/contacts",
  );
  assert.equal(
    adminEndpoint("POST", ["clients", id, "contacts"]),
    "/clients/" + id + "/contacts",
  );
  assert.equal(
    adminEndpoint("PATCH", ["clients", id, "contacts", contactId]),
    "/clients/" + id + "/contacts/" + contactId,
  );
  assert.equal(
    adminEndpoint("PATCH", ["clients", id, "contacts", contactId, "primary"]),
    "/clients/" + id + "/contacts/" + contactId + "/primary",
  );
  assert.equal(
    adminEndpoint("DELETE", ["clients", id, "contacts", "bulk"]),
    "/clients/" + id + "/contacts/bulk",
  );
  // Projects, tasks and nested project-work routes
  assert.equal(
    adminEndpoint("PATCH", ["projects", id, "status"]),
    "/projects/" + id + "/status",
  );
  assert.equal(
    adminEndpoint("GET", ["projects", id, "milestones"]),
    "/projects/" + id + "/milestones",
  );
  assert.equal(
    adminEndpoint("PATCH", ["projects", id, "milestones", contactId, "status"]),
    "/projects/" + id + "/milestones/" + contactId + "/status",
  );
  assert.equal(
    adminEndpoint("GET", ["projects", id, "tasks", "trash"]),
    "/projects/" + id + "/tasks/trash",
  );
  assert.equal(
    adminEndpoint("PATCH", ["projects", id, "tasks", "bulk", "status"]),
    "/projects/" + id + "/tasks/bulk/status",
  );
  assert.equal(
    adminEndpoint("POST", ["projects", id, "tasks", contactId, "checklists"]),
    "/projects/" + id + "/tasks/" + contactId + "/checklists",
  );
  assert.equal(
    adminEndpoint("PATCH", ["projects", id, "tasks", contactId, "checklists", id]),
    "/projects/" + id + "/tasks/" + contactId + "/checklists/" + id,
  );
  assert.equal(
    adminEndpoint("PUT", ["projects", id, "tasks", contactId, "tags"]),
    "/projects/" + id + "/tasks/" + contactId + "/tags",
  );
  assert.equal(
    adminEndpoint("POST", ["projects", id, "tasks", contactId, "time-entries"]),
    "/projects/" + id + "/tasks/" + contactId + "/time-entries",
  );
  assert.equal(
    adminEndpoint("GET", ["websites", id, "deliverables"]),
    "/websites/" + id + "/deliverables",
  );
  assert.equal(
    adminEndpoint("POST", ["websites", id, "maintenance-logs"]),
    "/websites/" + id + "/maintenance-logs",
  );
  // Notifications admin and personal inbox routes
  assert.equal(adminEndpoint("GET", ["notifications"]), "/notifications");
  assert.equal(adminEndpoint("POST", ["notifications"]), "/notifications");
  assert.equal(adminEndpoint("PATCH", ["notifications", id]), "/notifications/" + id);
  assert.equal(adminEndpoint("DELETE", ["notifications", id]), "/notifications/" + id);
  assert.equal(adminEndpoint("GET", ["notifications", "me"]), "/notifications/me");
  assert.equal(
    adminEndpoint("GET", ["notifications", "me", "unread-count"]),
    "/notifications/me/unread-count",
  );
  assert.equal(
    adminEndpoint("PATCH", ["notifications", "me", "read-all"]),
    "/notifications/me/read-all",
  );
  for (const action of ["read", "unread", "archive", "unarchive"]) {
    assert.equal(
      adminEndpoint("PATCH", ["notifications", "me", id, action]),
      "/notifications/me/" + id + "/" + action,
    );
  }
  assert.equal(adminEndpoint("POST", ["notifications", "me", id, "read"]), null);
  assert.equal(adminEndpoint("PATCH", ["notifications", "me", id, "delete"]), null);
});
test("rejects arbitrary resources, invalid identifiers and unexpected methods", () => {
  for (const [method, path] of [
    ["GET", ["auth", "me"]],
    ["GET", ["roles", ".."]],
    ["GET", ["roles", "https://example.com"]],
    ["PUT", ["roles", id, "other"]],
    ["PATCH", ["roles", id, "permissions"]],
    ["GET", ["services", "trash"]],
    ["DELETE", ["services", id, "permanent"]],
    ["POST", ["roles", "bulk"]],
    ["GET", ["users", id, "roles"]],
    ["GET", ["roles", id, "extra", "nested"]],
  ])
    assert.equal(adminEndpoint(method, path), null);
});
test("mutation origin fails closed", () => {
  assert.equal(sameOrigin("http://localhost:5173", "http://localhost:5173/login"), true);
  for (const [origin, url] of [
    [null, "http://localhost:5173"],
    ["http://evil.test", "http://localhost:5173"],
    ["http://localhost:5174", "http://localhost:5173"],
    ["http://localhost:5173", undefined],
    ["http://localhost:5173", "bad-url"],
  ])
    assert.equal(sameOrigin(origin, url), false);
});
