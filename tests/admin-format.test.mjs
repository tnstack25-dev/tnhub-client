import assert from "node:assert/strict";
import test from "node:test";
import { formatPrice, matchesYearMonth, sumDecimalStrings } from "../src/lib/admin/format.ts";
test("preserves decimal precision for database monetary strings", () => {
  assert.equal(formatPrice("1250000.50"), "1.250.000,50");
  assert.equal(formatPrice("9999999999999999.99"), "9.999.999.999.999.999,99");
  assert.equal(formatPrice("0.00"), "0");
});

test("sums project budgets with exact BigInt decimal arithmetic and filters by month", () => {
  assert.equal(
    sumDecimalStrings(["15000000.00", "2500000.50", "9999999999999999.99"]),
    "10000000017500000.49",
  );
  assert.equal(sumDecimalStrings([]), "0.00");
  assert.equal(matchesYearMonth("2026-11-24T10:00:00.000Z", "2026-11"), true);
  assert.equal(matchesYearMonth("2026-10-31", "2026-11"), false);
  assert.equal(matchesYearMonth("2026-10-31", "all"), true);
});
