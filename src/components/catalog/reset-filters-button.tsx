"use client";

import { Button } from "@/components/ui/button";
import { useCatalog } from "./catalog-shell";

export function ResetFiltersButton() {
  const { reset, update, search } = useCatalog();
  return (
    <>
      <Button variant="outline" onClick={reset}>
        Clear filters
      </Button>
      {search.q && <Button onClick={() => update({ q: undefined })}>Clear search</Button>}
    </>
  );
}
