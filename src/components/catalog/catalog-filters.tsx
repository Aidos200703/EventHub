"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { CATEGORIES, CITIES } from "@/lib/constants";
import {
  activeFilterCount,
  DATE_PRESETS,
  SORT_OPTIONS,
  type CatalogSearch,
} from "@/lib/validation/catalog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";
import { Label } from "@/components/ui/field";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/dialogs";
import { useCatalog } from "./catalog-shell";

/** Search box with debounce; Enter submits immediately. */
export function CatalogSearchBox() {
  const { search, update, isPending } = useCatalog();
  const [value, setValue] = useState(search.q ?? "");

  // Keep the input in sync when the URL changes from elsewhere (Back button, reset).
  const [lastQ, setLastQ] = useState(search.q);
  if (lastQ !== search.q) {
    setLastQ(search.q);
    setValue(search.q ?? "");
  }

  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed === (search.q ?? "")) return;
    const t = setTimeout(() => update({ q: trimmed || undefined }), 400);
    return () => clearTimeout(t);
  }, [value, search.q, update]);

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        update({ q: value.trim() || undefined });
      }}
      className="relative flex-1"
    >
      <label htmlFor="catalog-q" className="sr-only">
        Search events
      </label>
      <Search
        className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        id="catalog-q"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search by event, artist, venue or organizer"
        className="h-13 rounded-full pr-12 pl-12 text-base"
      />
      {isPending && (
        <Loader2
          className="absolute top-1/2 right-4 size-5 -translate-y-1/2 animate-spin text-muted-foreground"
          aria-label="Loading"
        />
      )}
    </form>
  );
}

export function SortSelect() {
  const { search, update } = useCatalog();
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="catalog-sort" className="hidden text-muted-foreground sm:block">
        Sort
      </Label>
      <NativeSelect
        id="catalog-sort"
        value={search.sort}
        onChange={(e) => update({ sort: e.target.value as CatalogSearch["sort"] })}
        className="h-10 w-48 rounded-full"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-2 text-sm font-medium transition",
        active
          ? "border-foreground bg-foreground text-background"
          : "bg-card hover:border-foreground/40",
      )}
    >
      {children}
    </button>
  );
}

function PriceRange() {
  const { search, update } = useCatalog();
  const [min, setMin] = useState(search.minPrice?.toString() ?? "");
  const [max, setMax] = useState(search.maxPrice?.toString() ?? "");
  const [synced, setSynced] = useState(`${search.minPrice}-${search.maxPrice}`);
  if (synced !== `${search.minPrice}-${search.maxPrice}`) {
    setSynced(`${search.minPrice}-${search.maxPrice}`);
    setMin(search.minPrice?.toString() ?? "");
    setMax(search.maxPrice?.toString() ?? "");
  }
  const apply = () => {
    const toNum = (v: string) =>
      v.trim() === "" || Number.isNaN(Number(v)) ? undefined : Math.max(0, Math.round(Number(v)));
    update({ minPrice: toNum(min), maxPrice: toNum(max) });
  };
  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
    >
      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-1.5">
          <Label htmlFor="price-min" className="text-xs text-muted-foreground">
            Min, ₸
          </Label>
          <Input
            id="price-min"
            inputMode="numeric"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            placeholder="0"
            onBlur={apply}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="price-max" className="text-xs text-muted-foreground">
            Max, ₸
          </Label>
          <Input
            id="price-max"
            inputMode="numeric"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            placeholder="Any"
            onBlur={apply}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {[
          { label: "Under 5,000 ₸", min: undefined, max: 5000 },
          { label: "5–15k ₸", min: 5000, max: 15000 },
          { label: "15k+ ₸", min: 15000, max: undefined },
        ].map((p) => (
          <Chip
            key={p.label}
            active={search.minPrice === p.min && search.maxPrice === p.max}
            onClick={() => update({ minPrice: p.min, maxPrice: p.max })}
          >
            {p.label}
          </Chip>
        ))}
      </div>
    </form>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid gap-3 border-b pb-6 last:border-b-0">
      <legend className="mb-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

export function FilterPanel() {
  const { search, update, reset } = useCatalog();
  const count = activeFilterCount(search);
  return (
    <div className="grid gap-6">
      <FilterGroup title="City">
        <Label htmlFor="filter-city" className="sr-only">
          City
        </Label>
        <NativeSelect
          id="filter-city"
          value={search.city ?? ""}
          onChange={(e) => update({ city: (e.target.value || undefined) as CatalogSearch["city"] })}
        >
          <option value="">All cities</option>
          {CITIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </NativeSelect>
      </FilterGroup>

      <FilterGroup title="Category">
        <div className="flex flex-wrap gap-2">
          <Chip active={!search.category} onClick={() => update({ category: undefined })}>
            All
          </Chip>
          {CATEGORIES.map((c) => (
            <Chip
              key={c.slug}
              active={search.category === c.slug}
              onClick={() => update({ category: search.category === c.slug ? undefined : c.slug })}
            >
              {c.label}
            </Chip>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Date">
        <div className="flex flex-wrap gap-2">
          {DATE_PRESETS.map((d) => (
            <Chip
              key={d.value}
              active={search.date === d.value}
              onClick={() =>
                update({
                  date: search.date === d.value ? undefined : d.value,
                  from: undefined,
                  to: undefined,
                })
              }
            >
              {d.label}
            </Chip>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="grid gap-1.5">
            <Label htmlFor="date-from" className="text-xs text-muted-foreground">
              From
            </Label>
            <Input
              id="date-from"
              type="date"
              value={search.from ?? ""}
              onChange={(e) => update({ from: e.target.value || undefined, date: undefined })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="date-to" className="text-xs text-muted-foreground">
              To
            </Label>
            <Input
              id="date-to"
              type="date"
              value={search.to ?? ""}
              min={search.from}
              onChange={(e) => update({ to: e.target.value || undefined, date: undefined })}
            />
          </div>
        </div>
      </FilterGroup>

      <FilterGroup title="Price">
        <PriceRange />
      </FilterGroup>

      {count > 0 && (
        <Button type="button" variant="outline" onClick={reset}>
          <X /> Clear {count} filter{count === 1 ? "" : "s"}
        </Button>
      )}
    </div>
  );
}

export function MobileFilters() {
  const { search } = useCatalog();
  const count = activeFilterCount(search);
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="h-10 lg:hidden">
          <SlidersHorizontal /> Filters
          {count > 0 && (
            <span className="grid size-5 place-items-center rounded-full bg-lime text-[11px] text-[#101010]">
              {count}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <div>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Results update as you change filters.</SheetDescription>
        </div>
        <FilterPanel />
      </SheetContent>
    </Sheet>
  );
}

/** Removable chips summarizing active filters. */
export function ActiveFilters() {
  const { search, update } = useCatalog();
  const chips: { label: string; clear: Partial<CatalogSearch> }[] = [];
  if (search.q) chips.push({ label: `"${search.q}"`, clear: { q: undefined } });
  if (search.city)
    chips.push({
      label: CITIES.find((c) => c.slug === search.city)?.name ?? search.city,
      clear: { city: undefined },
    });
  if (search.category)
    chips.push({
      label: CATEGORIES.find((c) => c.slug === search.category)?.label ?? search.category,
      clear: { category: undefined },
    });
  if (search.date)
    chips.push({
      label: DATE_PRESETS.find((d) => d.value === search.date)!.label,
      clear: { date: undefined },
    });
  if (search.from || search.to)
    chips.push({
      label: `${search.from ?? "…"} → ${search.to ?? "…"}`,
      clear: { from: undefined, to: undefined },
    });
  if (search.minPrice !== undefined || search.maxPrice !== undefined)
    chips.push({
      label: `${search.minPrice?.toLocaleString("en-US") ?? 0} – ${search.maxPrice?.toLocaleString("en-US") ?? "∞"} ₸`,
      clear: { minPrice: undefined, maxPrice: undefined },
    });
  if (!chips.length) return null;
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Active filters">
      {chips.map((c) => (
        <li key={c.label}>
          <button
            type="button"
            onClick={() => update(c.clear)}
            className="inline-flex items-center gap-1.5 rounded-full bg-lime px-3 py-1.5 text-sm font-semibold text-[#101010] transition hover:bg-lime-strong"
            aria-label={`Remove filter ${c.label}`}
          >
            {c.label} <X className="size-3.5" aria-hidden />
          </button>
        </li>
      ))}
    </ul>
  );
}
