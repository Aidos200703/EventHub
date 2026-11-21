"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { CITIES } from "@/lib/constants";
import { catalogSearchToQuery } from "@/lib/validation/catalog";
import { Button } from "@/components/ui/button";

export function HeroSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");

  return (
    <form
      role="search"
      aria-label="Search events"
      className="flex max-w-3xl flex-col gap-2 rounded-3xl bg-card p-2 ring-1 ring-border sm:flex-row sm:items-center sm:rounded-full"
      onSubmit={(e) => {
        e.preventDefault();
        const query = catalogSearchToQuery({
          q: q.trim() || undefined,
          city: (city || undefined) as never,
        });
        router.push(`/events${query ? `?${query}` : ""}`);
      }}
    >
      <label className="flex flex-1 items-center gap-3 px-4">
        <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        <span className="sr-only">Event, artist or venue</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Artist, event or venue"
          className="h-12 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
        />
      </label>
      <label className="flex items-center border-t px-4 sm:border-t-0 sm:border-l">
        <span className="sr-only">City</span>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="h-12 w-full cursor-pointer bg-transparent pr-2 text-base outline-none sm:w-40"
        >
          <option value="">All cities</option>
          {CITIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" variant="lime" size="lg" className="h-12">
        Find events
      </Button>
    </form>
  );
}
