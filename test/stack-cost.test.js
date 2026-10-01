import { test } from "node:test";
import assert from "node:assert/strict";
import { stackCost, stackCostByVolume, growth, usd } from "../src/stack-cost.js";

// Synthetic apps: made-up names and prices, only to exercise the arithmetic.
const apps = [
  { app: "Example Upsell", slug: "example-upsell", plans: [{ plan: "Free", priceUsdMonthly: 0 }, { plan: "Growth", priceUsdMonthly: 29.99, limits: "up to 500 orders" }] },
  { app: "Example Reviews", slug: "example-reviews", plans: [{ plan: "Starter", priceUsdMonthly: 10 }, { plan: "Unlimited", priceUsdMonthly: 59.5 }] },
  { app: "Example Builder", slug: "example-builder", plans: [{ plan: "Pro", priceUsdMonthly: 24.99 }] },
];
const lines = [
  { slug: "example-upsell", plan: "Growth" },
  { slug: "example-reviews", plan: { "100": "Starter", "500": "Starter", "2000": "Unlimited" } },
  { slug: "example-builder", plan: "Pro" },
];

test("adds the plan prices and rounds to cents", () => {
  assert.equal(stackCost(apps, lines, 100).total, 64.98);
  assert.equal(stackCost(apps, lines, 2000).total, 114.48);
});

test("a per-volume plan map picks the plan for that volume", () => {
  assert.equal(stackCost(apps, lines, 500).lines[1].plan, "Starter");
  assert.equal(stackCost(apps, lines, 2000).lines[1].plan, "Unlimited");
});

test("throws instead of guessing when data is missing", () => {
  assert.throws(() => stackCost(apps, [{ slug: "nope", plan: "x" }], 100), /no data for nope/);
  assert.throws(() => stackCost(apps, [{ slug: "example-upsell", plan: "Missing" }], 100), /no data for example-upsell \/ Missing/);
  assert.throws(() => stackCost(apps, [{ slug: "example-reviews", plan: { "100": "Starter" } }], 2000), /no plan given/);
});

test("by volume and growth", () => {
  const by = stackCostByVolume(apps, lines, [100, 500, 2000]);
  assert.deepEqual(by, { "100": 64.98, "500": 64.98, "2000": 114.48 });
  assert.equal(growth(by, 500, 2000).toFixed(2), "1.76");
  assert.equal(growth({ "1": 0, "2": 5 }, 1, 2), null);
});

test("usd formatting", () => {
  assert.equal(usd(1234.5), "$1,234.50");
});
