"use client"; // Replaces the root layout when it throws, so it renders its own <html>.

export default function GlobalError({
  error: _error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          padding: "4rem",
          textAlign: "center",
          background: "#020a23",
          color: "#f5f5f5",
        }}
      >
        <title>Something went wrong · TRACE</title>
        <h2>Something went wrong</h2>
        <button
          type="button"
          onClick={() => retry()}
          style={{ cursor: "pointer" }}
          className="rounded-md border border-border px-4 py-2 hover:bg-primary active:scale-[0.98] active:brightness-110"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
