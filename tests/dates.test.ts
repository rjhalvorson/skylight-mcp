import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getTodayDate,
  getDateOffset,
  parseDate,
  parseTime,
  formatDateForDisplay,
  normalizeDateTime,
} from "../src/utils/dates.js";

describe("dates", () => {
  describe("getTodayDate", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns today's date in YYYY-MM-DD format", () => {
      const result = getTodayDate();
      expect(result).toBe("2025-06-15");
    });

    it("respects timezone parameter", () => {
      // Set a time that's still June 14 in LA but June 15 in UTC
      vi.setSystemTime(new Date("2025-06-15T05:00:00Z"));
      const result = getTodayDate("America/Los_Angeles");
      expect(result).toBe("2025-06-14");
    });
  });

  describe("getDateOffset", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns date N days from today", () => {
      expect(getDateOffset(1)).toBe("2025-06-16");
      expect(getDateOffset(7)).toBe("2025-06-22");
      expect(getDateOffset(-1)).toBe("2025-06-14");
    });

    it("handles month boundaries", () => {
      vi.setSystemTime(new Date("2025-06-30T12:00:00Z"));
      expect(getDateOffset(1)).toBe("2025-07-01");
    });

    it("handles year boundaries", () => {
      vi.setSystemTime(new Date("2025-12-31T12:00:00Z"));
      expect(getDateOffset(1)).toBe("2026-01-01");
    });
  });

  describe("parseDate", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      // Set to a Wednesday
      vi.setSystemTime(new Date("2025-06-18T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns YYYY-MM-DD format unchanged", () => {
      expect(parseDate("2025-01-15")).toBe("2025-01-15");
      expect(parseDate("2024-12-25")).toBe("2024-12-25");
    });

    it("parses 'today'", () => {
      expect(parseDate("today")).toBe("2025-06-18");
      expect(parseDate("TODAY")).toBe("2025-06-18");
      expect(parseDate("  Today  ")).toBe("2025-06-18");
    });

    it("parses 'tomorrow'", () => {
      expect(parseDate("tomorrow")).toBe("2025-06-19");
    });

    it("parses 'yesterday'", () => {
      expect(parseDate("yesterday")).toBe("2025-06-17");
    });

    it("parses day names (next occurrence)", () => {
      // Wednesday June 18, 2025
      expect(parseDate("thursday")).toBe("2025-06-19"); // Tomorrow
      expect(parseDate("friday")).toBe("2025-06-20"); // 2 days
      expect(parseDate("monday")).toBe("2025-06-23"); // 5 days
      expect(parseDate("wednesday")).toBe("2025-06-25"); // Next week (not today)
    });

    it("parses MM/DD/YYYY format", () => {
      expect(parseDate("01/15/2025")).toBe("2025-01-15");
      expect(parseDate("12/25/2024")).toBe("2024-12-25");
      expect(parseDate("1/5/2025")).toBe("2025-01-05");
    });

    it("returns unparseable input as-is", () => {
      expect(parseDate("not a date")).toBe("not a date");
    });
  });

  describe("parseTime", () => {
    it("returns HH:MM format unchanged", () => {
      expect(parseTime("10:00")).toBe("10:00");
      expect(parseTime("14:30")).toBe("14:30");
      expect(parseTime("9:00")).toBe("09:00");
    });

    it("parses 12-hour format with AM", () => {
      expect(parseTime("10:00 AM")).toBe("10:00");
      expect(parseTime("10:00 am")).toBe("10:00");
      expect(parseTime("12:00 AM")).toBe("00:00"); // Midnight
      expect(parseTime("9:30 AM")).toBe("09:30");
    });

    it("parses 12-hour format with PM", () => {
      expect(parseTime("2:00 PM")).toBe("14:00");
      expect(parseTime("2:00 pm")).toBe("14:00");
      expect(parseTime("12:00 PM")).toBe("12:00"); // Noon
      expect(parseTime("11:59 PM")).toBe("23:59");
    });

    it("returns unparseable input as-is", () => {
      expect(parseTime("not a time")).toBe("not a time");
    });
  });

  describe("formatDateForDisplay", () => {
    it("formats date for display", () => {
      expect(formatDateForDisplay("2025-06-15")).toMatch(/Sun.*Jun.*15/);
      expect(formatDateForDisplay("2025-12-25")).toMatch(/Thu.*Dec.*25/);
    });
  });

  describe("normalizeDateTime", () => {
    it("returns input unchanged when it has a trailing Z", () => {
      expect(normalizeDateTime("2026-05-28T19:45:00Z", "America/Los_Angeles")).toBe(
        "2026-05-28T19:45:00Z"
      );
    });

    it("returns input unchanged when it has a numeric offset", () => {
      expect(normalizeDateTime("2026-05-28T19:45:00-07:00", "America/Los_Angeles")).toBe(
        "2026-05-28T19:45:00-07:00"
      );
      expect(normalizeDateTime("2026-05-28T19:45:00+05:30", "America/Los_Angeles")).toBe(
        "2026-05-28T19:45:00+05:30"
      );
    });

    it("appends the configured timezone offset for naive ISO datetimes (PDT)", () => {
      // May 28 in LA is PDT (UTC-7)
      expect(normalizeDateTime("2026-05-28T19:45:00", "America/Los_Angeles")).toBe(
        "2026-05-28T19:45:00-07:00"
      );
    });

    it("appends the correct offset across DST boundaries (PST)", () => {
      // January in LA is PST (UTC-8)
      expect(normalizeDateTime("2026-01-15T19:45:00", "America/Los_Angeles")).toBe(
        "2026-01-15T19:45:00-08:00"
      );
    });

    it("handles non-DST timezones", () => {
      // Hawaii is UTC-10 year-round
      expect(normalizeDateTime("2026-05-28T19:45:00", "Pacific/Honolulu")).toBe(
        "2026-05-28T19:45:00-10:00"
      );
    });

    it("handles positive offsets with half-hour fractions", () => {
      // India is UTC+5:30
      expect(normalizeDateTime("2026-05-28T19:45:00", "Asia/Kolkata")).toBe(
        "2026-05-28T19:45:00+05:30"
      );
    });

    it("returns input unchanged when no timezone is provided", () => {
      expect(normalizeDateTime("2026-05-28T19:45:00")).toBe("2026-05-28T19:45:00");
    });

    it("returns input unchanged when it isn't an ISO datetime", () => {
      expect(normalizeDateTime("not a datetime", "America/Los_Angeles")).toBe("not a datetime");
      expect(normalizeDateTime("2026-05-28", "America/Los_Angeles")).toBe("2026-05-28");
    });

    it("handles empty string", () => {
      expect(normalizeDateTime("", "America/Los_Angeles")).toBe("");
    });
  });
});
