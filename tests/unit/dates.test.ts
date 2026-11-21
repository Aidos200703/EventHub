import { describe, expect, it } from "vitest";
import {
  kzDateToUtc,
  kzLocalInputToUtc,
  presetRange,
  startOfKzDay,
  utcToKzLocalInput,
} from "@/lib/dates";
import { dateBadge, formatPrice, formatTime } from "@/lib/format";

describe("Kazakhstan time helpers (UTC+5)", () => {
  it("converts datetime-local values both ways", () => {
    const utc = kzLocalInputToUtc("2026-12-14T19:30");
    expect(utc.toISOString()).toBe("2026-12-14T14:30:00.000Z");
    expect(utcToKzLocalInput(utc)).toBe("2026-12-14T19:30");
  });

  it("finds the start of the local day", () => {
    // 22:00 UTC is already 03:00 next day in Kazakhstan
    expect(startOfKzDay(new Date("2026-12-14T22:00:00Z")).toISOString()).toBe(
      "2026-12-14T19:00:00.000Z",
    );
    expect(kzDateToUtc("2026-12-15").toISOString()).toBe("2026-12-14T19:00:00.000Z");
  });

  it("computes 'this weekend' from a weekday", () => {
    const wednesday = new Date("2026-11-18T07:00:00Z");
    const { from, to } = presetRange("weekend", wednesday);
    expect(utcToKzLocalInput(from)).toBe("2026-11-21T00:00"); // Saturday
    expect(utcToKzLocalInput(to)).toBe("2026-11-23T00:00"); // Monday
  });

  it("starts 'this weekend' now when it is already Saturday", () => {
    const saturday = new Date("2026-11-21T10:00:00Z");
    const { from, to } = presetRange("weekend", saturday);
    expect(from).toEqual(saturday);
    expect(utcToKzLocalInput(to)).toBe("2026-11-23T00:00");
  });
});

describe("formatting", () => {
  it("formats tenge prices", () => {
    expect(formatPrice(12000)).toBe("12,000 ₸");
    expect(formatPrice(0)).toBe("0 ₸");
  });

  it("formats times in Kazakhstan time", () => {
    const d = new Date("2026-12-14T14:30:00Z");
    expect(formatTime(d)).toBe("19:30");
    expect(dateBadge(d)).toEqual({ day: "14", month: "DEC" });
  });
});
