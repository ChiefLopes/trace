"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // TODO: report to an error-tracking service once one is chosen.
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <h2 className="text-2xl font-semibold">Something went wrong</h2>
      <button
        type="button"
        onClick={() => retry()}
        className="rounded-md border border-border px-4 py-2 hover:bg-primary active:scale-[0.98] active:brightness-110"
      >
        Try again
      </button>
    </main>
  );
}
