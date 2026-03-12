"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

/**
 * QueryProvider wraps the dashboard in a React Query QueryClientProvider.
 * A new QueryClient is created per session (not shared globally) so that
 * server and client state stay isolated.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 2 * 60_000,       // 2 min
            gcTime: 5 * 60_000,          // 5 min — keep cache alive while navigating
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
