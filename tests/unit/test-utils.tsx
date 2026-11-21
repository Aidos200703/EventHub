import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { SessionProvider, type SessionUser } from "@/components/session-provider";

export function renderWithProviders(
  ui: React.ReactElement,
  { user = null }: { user?: SessionUser } = {},
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <SessionProvider user={user}>{ui}</SessionProvider>
    </QueryClientProvider>,
  );
}

export const visitor = {
  id: "u1",
  name: "Aruzhan Sadykova",
  email: "visitor@eventhub.kz",
  role: "VISITOR" as const,
};
