import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchX } from "lucide-react";
import { categoryBySlug, cityName } from "@/lib/constants";
import { catalogSearchToQuery, parseCatalogSearch } from "@/lib/validation/catalog";
import { searchEvents } from "@/server/services/events";
import { pluralize } from "@/lib/utils";
import { EventCard } from "@/components/events/event-cards";
import { EmptyState } from "@/components/ui/states";
import { CatalogResultsRegion, CatalogShell } from "@/components/catalog/catalog-shell";
import {
  ActiveFilters,
  CatalogSearchBox,
  FilterPanel,
  MobileFilters,
  SortSelect,
} from "@/components/catalog/catalog-filters";
import { Pagination } from "@/components/catalog/pagination";
import { ResetFiltersButton } from "@/components/catalog/reset-filters-button";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const search = parseCatalogSearch(await searchParams);
  const cat = search.category ? categoryBySlug(search.category)?.label : undefined;
  const city = search.city ? cityName(search.city) : undefined;
  const title = [cat ?? "Events", city ? `in ${city}` : "in Kazakhstan"].join(" ");
  return {
    title,
    description: `Browse ${title.toLowerCase()} and book tickets online on EventHub.`,
    alternates: {
      canonical: `/events${search.category || search.city ? `?${catalogSearchToQuery({ category: search.category, city: search.city })}` : ""}`,
    },
  };
}

export default async function EventsPage({ searchParams }: Props) {
  const search = parseCatalogSearch(await searchParams);
  const { items, total, page, pageCount } = await searchEvents(search);
  const cat = search.category ? categoryBySlug(search.category) : undefined;

  return (
    <Suspense>
      <CatalogShell>
        <section className="border-b bg-card">
          <div className="container-page grid gap-6 py-10 md:py-14">
            <div className="grid gap-2">
              <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                Catalog
              </p>
              <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">
                {cat ? cat.label : "All events"}
                {search.city && (
                  <span className="text-muted-foreground"> in {cityName(search.city)}</span>
                )}
              </h1>
            </div>
            <CatalogSearchBox />
          </div>
        </section>

        <div className="container-page grid gap-10 py-10 lg:grid-cols-[280px_1fr]">
          <aside className="hidden lg:block" aria-label="Filters">
            <div className="sticky top-24">
              <FilterPanel />
            </div>
          </aside>

          <div className="grid content-start gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground" aria-live="polite">
                <span className="font-semibold text-foreground">{pluralize(total, "event")}</span>{" "}
                found
              </p>
              <div className="flex items-center gap-2">
                <MobileFilters />
                <SortSelect />
              </div>
            </div>
            <ActiveFilters />

            <CatalogResultsRegion>
              {items.length ? (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((e, i) => (
                    <EventCard key={e.id} event={e} priority={i < 3} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<SearchX />}
                  title="No events match your filters"
                  description="Try a different date, widen the price range or search for something else."
                  action={<ResetFiltersButton />}
                />
              )}
            </CatalogResultsRegion>

            <Pagination
              page={page}
              pageCount={pageCount}
              hrefFor={(p) => `/events?${catalogSearchToQuery({ ...search, page: p })}`}
            />
          </div>
        </div>
      </CatalogShell>
    </Suspense>
  );
}
