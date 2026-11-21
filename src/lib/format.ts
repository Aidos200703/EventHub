import { KZ_TIME_ZONE } from "./constants";

const priceFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** 12000 → "12,000 ₸" */
export function formatPrice(amount: number) {
  return `${priceFormatter.format(amount)} ₸`;
}

const fmt = (o: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: KZ_TIME_ZONE, ...o });
const dateFmt = fmt({ weekday: "short", day: "numeric", month: "short" });
const longDateFmt = fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" });
const timeFmt = fmt({ hour: "2-digit", minute: "2-digit", hour12: false });
const partsFmt = fmt({ day: "2-digit", month: "short" });
const dateTimeFmt = fmt({
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const shortDayFmt = fmt({ day: "numeric", month: "short" });

/** "Sat, 14 Dec" */
export const formatDate = (d: Date) => dateFmt.format(d);
/** "Saturday, 14 December 2026" */
export const formatLongDate = (d: Date) => longDateFmt.format(d);
/** "19:30" */
export const formatTime = (d: Date) => timeFmt.format(d);
/** "14 Dec 2026, 19:30" */
export const formatDateTime = (d: Date) => dateTimeFmt.format(d);
/** "14 Dec" */
export const formatShortDay = (d: Date) => shortDayFmt.format(d);

/** Day + short month split for calendar-style date badges. */
export function dateBadge(d: Date) {
  const parts = partsFmt.formatToParts(d);
  return {
    day: parts.find((p) => p.type === "day")?.value ?? "",
    month: (parts.find((p) => p.type === "month")?.value ?? "").toUpperCase(),
  };
}
