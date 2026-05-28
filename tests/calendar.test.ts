import { describe, it, expect } from "vitest";
import type {
  CreateCalendarEventRequest,
  UpdateCalendarEventRequest,
} from "../src/api/types.js";

// These tests verify the request type shapes accept the synced-calendar
// parameters added in this PR. They do not exercise the live Skylight API —
// see the PR description for the verification gap and how it was mitigated by
// porting from @avinashjoshi's upstream PR #23, which was verified end-to-end
// against a live Google Calendar sync by its author.

describe("calendar request types", () => {
  describe("CreateCalendarEventRequest", () => {
    it("accepts calendar_id and calendar_account_id for source calendar sync", () => {
      const request: CreateCalendarEventRequest = {
        summary: "Lunch with Sam",
        starts_at: "2026-01-23T12:00:00-08:00",
        ends_at: "2026-01-23T13:00:00-08:00",
        calendar_account_id: "acct-123",
        calendar_id: "primary@group.calendar.google.com",
      };

      expect(request.calendar_id).toBe("primary@group.calendar.google.com");
      expect(request.calendar_account_id).toBe("acct-123");
    });

    it("accepts an explicit timezone override", () => {
      const request: CreateCalendarEventRequest = {
        summary: "Travel meeting",
        starts_at: "2026-03-15T10:00:00",
        ends_at: "2026-03-15T11:00:00",
        timezone: "Europe/London",
      };

      expect(request.timezone).toBe("Europe/London");
    });

    it("accepts rrule for recurring events", () => {
      const request: CreateCalendarEventRequest = {
        summary: "Weekly team standup",
        starts_at: "2026-01-26T10:00:00-08:00",
        ends_at: "2026-01-26T10:30:00-08:00",
        rrule: ["FREQ=WEEKLY;BYDAY=MO"],
      };

      expect(request.rrule).toEqual(["FREQ=WEEKLY;BYDAY=MO"]);
    });

    it("accepts null rrule for non-recurring events", () => {
      const request: CreateCalendarEventRequest = {
        summary: "Dentist",
        starts_at: "2026-02-04T14:00:00-08:00",
        ends_at: "2026-02-04T15:00:00-08:00",
        rrule: null,
      };

      expect(request.rrule).toBeNull();
    });

    it("accepts countdown_enabled and kind", () => {
      const request: CreateCalendarEventRequest = {
        summary: "Anniversary",
        starts_at: "2026-08-12T00:00:00-07:00",
        ends_at: "2026-08-13T00:00:00-07:00",
        all_day: true,
        countdown_enabled: true,
        kind: "birthday",
      };

      expect(request.countdown_enabled).toBe(true);
      expect(request.kind).toBe("birthday");
    });

    it("composes all sync parameters with the original fields", () => {
      const request: CreateCalendarEventRequest = {
        summary: "Dinner at Passatempo",
        starts_at: "2026-05-28T19:45:00-07:00",
        ends_at: "2026-05-28T21:30:00-07:00",
        all_day: false,
        description: "Kyle & Beverly",
        location: "Passatempo",
        category_ids: ["cat-kyle", "cat-beverly"],
        calendar_account_id: "acct-personal",
        calendar_id: "kyle@gmail.com",
        timezone: "America/Los_Angeles",
        rrule: null,
        countdown_enabled: false,
        kind: "standard",
      };

      expect(request.summary).toBe("Dinner at Passatempo");
      expect(request.location).toBe("Passatempo");
      expect(request.category_ids).toEqual(["cat-kyle", "cat-beverly"]);
      expect(request.calendar_id).toBe("kyle@gmail.com");
      expect(request.calendar_account_id).toBe("acct-personal");
    });
  });

  describe("UpdateCalendarEventRequest", () => {
    it("accepts calendar_id and calendar_account_id to move an event between source calendars", () => {
      const request: UpdateCalendarEventRequest = {
        calendar_account_id: "acct-work",
        calendar_id: "work@company.com",
      };

      expect(request.calendar_id).toBe("work@company.com");
      expect(request.calendar_account_id).toBe("acct-work");
    });

    it("accepts kind for re-categorizing events", () => {
      const request: UpdateCalendarEventRequest = {
        kind: "birthday",
      };

      expect(request.kind).toBe("birthday");
    });

    it("accepts timezone, rrule, and countdown_enabled updates", () => {
      const request: UpdateCalendarEventRequest = {
        timezone: "America/New_York",
        rrule: ["FREQ=DAILY"],
        countdown_enabled: true,
      };

      expect(request.timezone).toBe("America/New_York");
      expect(request.rrule).toEqual(["FREQ=DAILY"]);
      expect(request.countdown_enabled).toBe(true);
    });

    it("composes all new fields with the original update fields", () => {
      const request: UpdateCalendarEventRequest = {
        summary: "Updated event",
        starts_at: "2026-04-15T10:00:00-07:00",
        ends_at: "2026-04-15T11:00:00-07:00",
        calendar_account_id: "acct-789",
        calendar_id: "shared@group.calendar.google.com",
        timezone: "America/Los_Angeles",
        rrule: ["FREQ=MONTHLY"],
        countdown_enabled: false,
        kind: "standard",
      };

      expect(request.calendar_account_id).toBe("acct-789");
      expect(request.calendar_id).toBe("shared@group.calendar.google.com");
      expect(request.rrule).toEqual(["FREQ=MONTHLY"]);
    });
  });

  describe("webapp request parity", () => {
    it("CreateCalendarEventRequest mirrors the shape Skylight's web app sends for synced events", () => {
      // Reference shape observed by @avinashjoshi via network inspection in
      // TheEagleByte/skylight-mcp PR #23. This documents the API contract
      // we are coding against.
      const webappRequest = {
        summary: "test",
        kind: "standard",
        category_ids: ["cat-001"],
        starts_at: "2026-01-23T02:00:00.000Z",
        ends_at: "2026-01-23T03:00:00.000Z",
        all_day: false,
        rrule: null,
        location: "",
        description: "testing",
        calendar_account_id: "acct-123",
        calendar_id: "test-calendar@group.calendar.google.com",
        timezone: "America/Los_Angeles",
        countdown_enabled: false,
      };

      const request: CreateCalendarEventRequest = {
        summary: webappRequest.summary,
        kind: webappRequest.kind,
        category_ids: webappRequest.category_ids,
        starts_at: webappRequest.starts_at,
        ends_at: webappRequest.ends_at,
        all_day: webappRequest.all_day,
        rrule: webappRequest.rrule,
        location: webappRequest.location,
        description: webappRequest.description,
        calendar_account_id: webappRequest.calendar_account_id,
        calendar_id: webappRequest.calendar_id,
        timezone: webappRequest.timezone,
        countdown_enabled: webappRequest.countdown_enabled,
      };

      expect(request.calendar_id).toBe(webappRequest.calendar_id);
      expect(request.calendar_account_id).toBe(webappRequest.calendar_account_id);
      expect(request.timezone).toBe(webappRequest.timezone);
      expect(request.kind).toBe(webappRequest.kind);
      expect(request.countdown_enabled).toBe(webappRequest.countdown_enabled);
    });
  });
});
