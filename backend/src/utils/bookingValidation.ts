
export function validateBookingDates(checkIn: unknown, checkOut: unknown, today = new Date()): string | null {
  if (typeof checkIn !== "string" || typeof checkOut !== "string") {
    return "Dates are required";
  }

  function isValidDate(value: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

    const date = new Date(value);
    return !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value;
  }

  if (!isValidDate(checkIn) || !isValidDate(checkOut)) {
    return "Invalid date";
  }

  const startDate = new Date(checkIn);
  const endDate = new Date(checkOut);

  if (endDate <= startDate) {
    return "Check-out must be after check-in";
  }

  const todayUTC = new Date(today);
  todayUTC.setUTCHours(0, 0, 0, 0);

  if (startDate < todayUTC) {
    return "Check-in date must be today or a future date";
  }

  return null;
}
