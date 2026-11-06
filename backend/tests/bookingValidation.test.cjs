
const test = require("node:test");
const assert = require("node:assert/strict");

const { validateBookingDates } = require("../dist/utils/bookingValidation");

const today = new Date("2026-11-06T00:00:00Z");

test("Reject past check-in dates", () => {
  const result = validateBookingDates(
    "2026-11-05",
    "2026-11-08",
    today
  );

  assert.equal(result, "Check-in date must be today or a future date");
});

test("Reject check-out before check-in", () => {
  const result = validateBookingDates(
    "2026-12-10",
    "2026-12-08",
    today
  );

  assert.equal(result, "Check-out must be after check-in");
});

test("Reject same-day check-in and check-out", () => {
  const result = validateBookingDates(
    "2026-12-10",
    "2026-12-10",
    today
  );

  assert.equal(result, "Check-out must be after check-in");
});

test("Accept valid future booking dates", () => {
  const result = validateBookingDates(
    "2026-12-10",
    "2026-12-12",
    today
  );

  assert.equal(result, null);
});

test("Reject invalid calendar dates", () => {
  const result = validateBookingDates(
    "2026-02-30",
    "2026-03-02",
    today
  );

  assert.equal(result, "Invalid date");
});
