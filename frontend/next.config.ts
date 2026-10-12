import type { NextConfig } from "next";

// Where browser requests to /api/* are forwarded. Rewrites are resolved at build
// time, so API_BASE_URL must be set in the build environment.
const apiBaseUrl = (process.env.API_BASE_URL ?? "http://localhost:8080").replace(/\/+$/, "");

const isDev = process.env.NODE_ENV === "development";

/*
 * Content Security Policy without nonces. Nonces would force every page to
 * render dynamically, which rules out Partial Prerendering (cacheComponents),
 * so inline scripts stay allowed ('unsafe-inline': Next's own bootstrap and our
 * head scripts) while everything else is locked to this origin: no third-party
 * scripts, frames, plugins, or form posts elsewhere. All API traffic already
 * goes through same-origin /api, so connect-src needs nothing extra.
 * Dev additionally needs 'unsafe-eval' for React's debugging tools.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  // OAuth providers will need adding here once social sign-in redirects for real.
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Legacy twin of frame-ancestors 'none' (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // Isolates the window from cross-origin popups/openers.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // HTTPS-only for two years once a production response has been seen.
  ...(isDev
    ? []
    : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    // Backend-for-frontend proxy: the browser only ever talks to this origin, so
    // the backend needs no CORS setup and its URL stays out of the client bundle.
    return [{ source: "/api/:path*", destination: `${apiBaseUrl}/api/:path*` }];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
