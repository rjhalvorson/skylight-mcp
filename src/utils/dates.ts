/**
 * Date utility functions for Skylight MCP
 */

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(timezone?: string): string {
  const date = new Date();
  if (timezone) {
    return date.toLocaleDateString("en-CA", { timeZone: timezone });
  }
  return date.toISOString().split("T")[0];
}

/**
 * Get a date N days from today in YYYY-MM-DD format
 */
export function getDateOffset(days: number, timezone?: string): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  if (timezone) {
    return date.toLocaleDateString("en-CA", { timeZone: timezone });
  }
  return date.toISOString().split("T")[0];
}

/**
 * Parse a date string to YYYY-MM-DD format
 * Accepts: YYYY-MM-DD, MM/DD/YYYY, or natural language like "today", "tomorrow"
 */
export function parseDate(input: string, timezone?: string): string {
  const lower = input.toLowerCase().trim();

  // Handle natural language
  if (lower === "today") {
    return getTodayDate(timezone);
  }
  if (lower === "tomorrow") {
    return getDateOffset(1, timezone);
  }
  if (lower === "yesterday") {
    return getDateOffset(-1, timezone);
  }

  // Handle day of week (next occurrence)
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const dayIndex = days.indexOf(lower);
  if (dayIndex !== -1) {
    const today = new Date();
    const todayDay = today.getDay();
    let daysUntil = dayIndex - todayDay;
    if (daysUntil <= 0) {
      daysUntil += 7; // Next week if today or past
    }
    return getDateOffset(daysUntil, timezone);
  }

  // Already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return input;
  }

  // MM/DD/YYYY format
  const usMatch = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usMatch) {
    const [, month, day, year] = usMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // Try parsing as a date
  const parsed = new Date(input);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  // Return as-is if we can't parse it
  return input;
}

/**
 * Parse a time string to HH:MM format (24-hour)
 * Accepts: "10:00", "10:00 AM", "2:30 PM", "14:30"
 */
export function parseTime(input: string): string {
  const trimmed = input.trim();

  // Already in HH:MM format (24-hour)
  if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
    const [hours, minutes] = trimmed.split(":");
    return `${hours.padStart(2, "0")}:${minutes}`;
  }

  // 12-hour format with AM/PM
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match) {
    const [, hours, minutes, period] = match;
    let h = parseInt(hours, 10);
    if (period.toUpperCase() === "PM" && h !== 12) {
      h += 12;
    } else if (period.toUpperCase() === "AM" && h === 12) {
      h = 0;
    }
    return `${h.toString().padStart(2, "0")}:${minutes}`;
  }

  // Return as-is
  return trimmed;
}

/**
 * Format a date for display
 */
export function formatDateForDisplay(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * Get the UTC offset (e.g. "-07:00", "+05:30") that applies to a given local
 * date in a given IANA timezone. Accounts for DST.
 */
function getOffsetForDateInTimezone(localDateTime: string, timezone: string): string | null {
  // Treat the naive local datetime as a UTC instant for the purpose of asking
  // Intl what offset the target zone uses near that wall-clock moment. This is
  // accurate for all dates except those within DST transition gaps/overlaps,
  // which we accept as a documented edge case.
  const refInstant = new Date(localDateTime.endsWith("Z") ? localDateTime : `${localDateTime}Z`);
  if (isNaN(refInstant.getTime())) {
    return null;
  }
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    timeZoneName: "longOffset",
    year: "numeric",
  }).formatToParts(refInstant);
  const tzName = parts.find((p) => p.type === "timeZoneName")?.value;
  if (!tzName) return null;
  // longOffset returns "GMT-07:00", "GMT+05:30", or bare "GMT" for UTC
  if (tzName === "GMT") return "+00:00";
  const match = tzName.match(/^GMT([+-]\d{2}:\d{2})$/);
  return match ? match[1] : null;
}

/**
 * Normalize a datetime string for the Skylight API.
 *
 * If `input` already has a timezone designator (trailing Z or ±HH:MM), it's
 * returned unchanged. If it's a naive ISO datetime (e.g. "2026-05-28T19:45:00"),
 * the offset for the configured frame timezone on that date is appended so the
 * API doesn't interpret the wall-clock time as UTC.
 *
 * Returns the input unchanged if it doesn't look like an ISO datetime or if the
 * timezone can't be resolved — letting the API surface its own validation error
 * rather than us mangling the value.
 */
export function normalizeDateTime(input: string, timezone?: string): string {
  if (!input) return input;
  // Already has a timezone designator
  if (/Z$|[+-]\d{2}:\d{2}$/.test(input)) {
    return input;
  }
  // Only normalize things that look like an ISO datetime "YYYY-MM-DDTHH:MM(:SS)?"
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(input)) {
    return input;
  }
  if (!timezone) return input;
  const offset = getOffsetForDateInTimezone(input, timezone);
  return offset ? `${input}${offset}` : input;
}
