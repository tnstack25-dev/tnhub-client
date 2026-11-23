import assert from "node:assert/strict";
import test from "node:test";
import { adminEndpoint, sameOrigin } from "../src/lib/admin/proxy-policy.ts";
const id = "00000000-0000-4000-8000-000000000001";
test("supports exact module CRUD, bulk and assignment routes", () => {
  for (const resource of ["roles", "permissions", "users", "services"]) {
    for (const method of ["GET", "POST"])
      assert.equal(adminEndpoint(method, [resource]), "/" + resource);
    for (const method of ["GET", "PATCH", "DELETE"])
      assert.equal(adminEndpoint(method, [resource, id]), "/" + resource + "/" + id);
    assert.equal(adminEndpoint("DELETE", [resource, "bulk"]), "/" + resource + "/bulk");
    if (resource !== "services") {
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
