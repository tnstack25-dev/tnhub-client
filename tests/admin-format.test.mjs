import assert from "node:assert/strict";
import test from "node:test";
import { formatPrice } from "../src/lib/admin/format.ts";
test("preserves decimal precision for database monetary strings", () => {
  assert.equal(formatPrice("1250000.50"), "1.250.000,50");
  assert.equal(formatPrice("9999999999999999.99"), "9.999.999.999.999.999,99");
  assert.equal(formatPrice("0.00"), "0");
});
