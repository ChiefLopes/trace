"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Suspense, type ReactNode } from "react";

import { Toaster } from "@/components/feedback/toaster";
import { FlashToasts } from "@/features/flash/flash-toasts";
import { getQueryClient } from "@/lib/query/query-client";

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
      <Suspense fallback={null}>
        <FlashToasts />
      </Suspense>
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools buttonPosition="bottom-left" />
      )}
    </QueryClientProvider>
  );
}
