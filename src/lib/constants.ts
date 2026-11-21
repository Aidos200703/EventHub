import type { Category } from "@/generated/prisma/enums";

export const SITE_NAME = "EventHub";

export const CITIES = [
  { slug: "almaty", name: "Almaty" },
  { slug: "astana", name: "Astana" },
  { slug: "shymkent", name: "Shymkent" },
  { slug: "karaganda", name: "Karaganda" },
  { slug: "aktobe", name: "Aktobe" },
  { slug: "atyrau", name: "Atyrau" },
  { slug: "aktau", name: "Aktau" },
  { slug: "pavlodar", name: "Pavlodar" },
  { slug: "oskemen", name: "Oskemen" },
  { slug: "turkistan", name: "Turkistan" },
] as const;

export type CitySlug = (typeof CITIES)[number]["slug"];
export const CITY_SLUGS = CITIES.map((c) => c.slug) as [CitySlug, ...CitySlug[]];

export function cityName(slug: string) {
  return CITIES.find((c) => c.slug === slug)?.name ?? slug;
}

export const CATEGORIES: ReadonlyArray<{
  value: Category;
  slug: string;
  label: string;
  tagline: string;
}> = [
  {
    value: "CONCERT",
    slug: "concert",
    label: "Concerts",
    tagline: "Live sets, big rooms",
  },
  {
    value: "FESTIVAL",
    slug: "festival",
    label: "Festivals",
    tagline: "All-day, open-air",
  },
  {
    value: "THEATRE",
    slug: "theatre",
    label: "Theatre",
    tagline: "Drama, ballet, opera",
  },
  {
    value: "STANDUP",
    slug: "standup",
    label: "Stand-up",
    tagline: "Comedy nights",
  },
  {
    value: "CONFERENCE",
    slug: "conference",
    label: "Conferences",
    tagline: "Tech, business, ideas",
  },
  { value: "SPORT", slug: "sport", label: "Sport", tagline: "Matches & races" },
  {
    value: "EXHIBITION",
    slug: "exhibition",
    label: "Exhibitions",
    tagline: "Art & design",
  },
  {
    value: "WORKSHOP",
    slug: "workshop",
    label: "Workshops",
    tagline: "Learn by doing",
  },
  { value: "KIDS", slug: "kids", label: "Kids", tagline: "Family weekends" },
];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug) as [string, ...string[]];

export function categoryBySlug(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug);
}
export function categoryByValue(value: Category) {
  return CATEGORIES.find((c) => c.value === value)!;
}

/** Kazakhstan uses a single time zone (UTC+5) since 1 March 2024. */
export const KZ_TIME_ZONE = "Asia/Almaty";
export const KZ_UTC_OFFSET_MINUTES = 5 * 60;

/** Service fee charged on top of the ticket subtotal. */
export const SERVICE_FEE_RATE = 0.04;
/** Hard limit of tickets in a single order (across all ticket types). */
export const MAX_TICKETS_PER_ORDER = 20;

export const CATALOG_PAGE_SIZE = 9;

export const COVER_MAX_BYTES = 4 * 1024 * 1024;
export const COVER_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
