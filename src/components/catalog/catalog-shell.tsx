"use client";

import { createContext, useCallback, useContext, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  catalogSearchToQuery,
  parseCatalogSearch,
  type CatalogSearch,
} from "@/lib/validation/catalog";
import { cn } from "@/lib/utils";

type Ctx = {
  search: CatalogSearch;
  isPending: boolean;
  /** Merges a patch into the current filters and navigates. Any filter change resets the page. */
  update: (patch: Partial<CatalogSearch>) => void;
  reset: () => void;
};

const CatalogContext = createContext<Ctx | null>(null);

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used inside <CatalogShell>");
  return ctx;
}

/**
 * The URL is the single source of truth for catalog filters: every change is pushed
 * to the query string, so results can be shared, bookmarked and restored with Back.
 */
export function CatalogShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const search = parseCatalogSearch(new URLSearchParams(params.toString()));

  const navigate = useCallback(
    (next: Partial<CatalogSearch>) => {
      const query = catalogSearchToQuery(next);
      startTransition(() =>
        router.push(`${pathname}${query ? `?${query}` : ""}`, { scroll: false }),
      );
    },
    [router, pathname],
  );

  const update = useCallback(
    (patch: Partial<CatalogSearch>) => navigate({ ...search, page: 1, ...patch }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigate, params],
  );

  const reset = useCallback(() => navigate({ q: search.q }), [navigate, search.q]);

  return (
    <CatalogContext.Provider value={{ search, isPending, update, reset }}>
      {children}
    </CatalogContext.Provider>
  );
}

export function CatalogResultsRegion({ children }: { children: React.ReactNode }) {
  const { isPending } = useCatalog();
  return (
    <div
      aria-busy={isPending}
      aria-live="polite"
      className={cn(
        "transition-opacity duration-200",
        isPending && "pointer-events-none opacity-50",
      )}
    >
      {children}
    </div>
  );
}
