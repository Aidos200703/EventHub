import { KZ_UTC_OFFSET_MINUTES } from "./constants";

const OFFSET_MS = KZ_UTC_OFFSET_MINUTES * 60_000;
const DAY_MS = 86_400_000;

/** Start of the Kazakhstan calendar day containing `date`, as a UTC instant. */
export function startOfKzDay(date: Date): Date {
  const local = date.getTime() + OFFSET_MS;
  return new Date(Math.floor(local / DAY_MS) * DAY_MS - OFFSET_MS);
}

/** Parse "YYYY-MM-DD" as midnight in Kazakhstan. */
export function kzDateToUtc(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!) - OFFSET_MS);
}

/** "2026-12-14T19:30" (datetime-local, Kazakhstan time) → UTC Date */
export function kzLocalInputToUtc(value: string): Date {
  const [date, time = "00:00"] = value.split("T");
  const [hh, mm] = time.split(":").map(Number);
  return new Date(kzDateToUtc(date!).getTime() + (hh! * 60 + mm!) * 60_000);
}

/** UTC Date → "2026-12-14T19:30" in Kazakhstan time for datetime-local inputs */
export function utcToKzLocalInput(date: Date): string {
  return new Date(date.getTime() + OFFSET_MS).toISOString().slice(0, 16);
}

/** Day of week in Kazakhstan, 0 = Sunday */
function kzWeekday(date: Date) {
  return new Date(date.getTime() + OFFSET_MS).getUTCDay();
}

export type DatePreset = "today" | "tomorrow" | "weekend" | "week" | "month";

export function presetRange(preset: DatePreset, now = new Date()): { from: Date; to: Date } {
  const today = startOfKzDay(now);
  switch (preset) {
    case "today":
      return { from: now, to: new Date(today.getTime() + DAY_MS) };
    case "tomorrow":
      return {
        from: new Date(today.getTime() + DAY_MS),
        to: new Date(today.getTime() + 2 * DAY_MS),
      };
    case "weekend": {
      const wd = kzWeekday(now);
      if (wd === 6 || wd === 0) {
        // Already the weekend: from now until Monday 00:00
        const daysToMonday = wd === 6 ? 2 : 1;
        return {
          from: now,
          to: new Date(today.getTime() + daysToMonday * DAY_MS),
        };
      }
      const saturday = new Date(today.getTime() + (6 - wd) * DAY_MS);
      return { from: saturday, to: new Date(saturday.getTime() + 2 * DAY_MS) };
    }
    case "week":
      return { from: now, to: new Date(today.getTime() + 7 * DAY_MS) };
    case "month":
      return { from: now, to: new Date(today.getTime() + 30 * DAY_MS) };
  }
}
