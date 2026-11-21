import { z } from "zod";
import { CATEGORY_SLUGS, CITY_SLUGS } from "../constants";

export const SORT_OPTIONS = [
  { value: "date", label: "Soonest first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "popular", label: "Most popular" },
] as const;
export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

export const DATE_PRESETS = [
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "weekend", label: "This weekend" },
  { value: "week", label: "Next 7 days" },
  { value: "month", label: "Next 30 days" },
] as const;

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const optional = <T extends z.ZodType>(schema: T) => schema.optional().catch(undefined);

/**
 * URL search params are user input: every field falls back to "unset" instead of
 * throwing, so a hand-edited link still renders a sensible catalog.
 */
export const catalogSearchSchema = z.object({
  q: optional(
    z
      .string()
      .trim()
      .max(100)
      .transform((v) => v || undefined),
  ),
  city: optional(z.enum(CITY_SLUGS)),
  category: optional(z.enum(CATEGORY_SLUGS)),
  date: optional(z.enum(["today", "tomorrow", "weekend", "week", "month"])),
  from: optional(ymd),
  to: optional(ymd),
  minPrice: optional(z.coerce.number().int().min(0).max(10_000_000)),
  maxPrice: optional(z.coerce.number().int().min(0).max(10_000_000)),
  sort: z.enum(["date", "price-asc", "price-desc", "popular"]).catch("date").default("date"),
  page: z.coerce.number().int().min(1).max(500).catch(1).default(1),
});

export type CatalogSearch = z.output<typeof catalogSearchSchema>;

type RawParams = Record<string, string | string[] | undefined> | URLSearchParams;

export function parseCatalogSearch(raw: RawParams): CatalogSearch {
  const obj: Record<string, string> = {};
  if (raw instanceof URLSearchParams) {
    raw.forEach((v, k) => {
      if (v !== "") obj[k] = v;
    });
  } else {
    for (const [k, v] of Object.entries(raw)) {
      const first = Array.isArray(v) ? v[0] : v;
      if (first !== undefined && first !== "") obj[k] = first;
    }
  }
  const parsed = catalogSearchSchema.parse(obj);
  // A preset and a custom range are mutually exclusive; the preset wins.
  if (parsed.date) {
    parsed.from = undefined;
    parsed.to = undefined;
  }
  if (
    parsed.minPrice !== undefined &&
    parsed.maxPrice !== undefined &&
    parsed.minPrice > parsed.maxPrice
  ) {
    [parsed.minPrice, parsed.maxPrice] = [parsed.maxPrice, parsed.minPrice];
  }
  return parsed;
}

/** Serializes filters back to a canonical query string (defaults omitted). */
export function catalogSearchToQuery(search: Partial<CatalogSearch>): string {
  const params = new URLSearchParams();
  const order: (keyof CatalogSearch)[] = [
    "q",
    "city",
    "category",
    "date",
    "from",
    "to",
    "minPrice",
    "maxPrice",
    "sort",
    "page",
  ];
  for (const key of order) {
    const value = search[key];
    if (value === undefined || value === null || value === "") continue;
    if (key === "sort" && value === "date") continue;
    if (key === "page" && value === 1) continue;
    params.set(key, String(value));
  }
  return params.toString();
}

export function activeFilterCount(search: CatalogSearch) {
  return [
    search.city,
    search.category,
    search.date ?? search.from ?? search.to,
    search.minPrice ?? search.maxPrice,
  ].filter((v) => v !== undefined).length;
}
