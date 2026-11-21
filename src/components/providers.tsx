"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiError } from "@/lib/api-client";
import { SessionProvider, type SessionUser } from "./session-provider";
import { Toaster } from "./ui/toaster";
import { FavoritesSync } from "./favorites/favorites-sync";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        // Don't retry client errors (401/403/404/422) — they won't fix themselves.
        retry: (count, err) =>
          !(err instanceof ApiError && err.status >= 400 && err.status < 500) && count < 2,
      },
    },
  });
}

export function Providers({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider user={user}>
        <FavoritesSync />
        {children}
        <Toaster />
      </SessionProvider>
    </QueryClientProvider>
  );
}
