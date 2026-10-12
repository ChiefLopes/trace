import { createHttpClient } from "./http";

/**
 * API client for Client Components. Calls go to same-origin /api/*, which
 * next.config.ts rewrites to the backend.
 */
// API paths already include /api; next.config.ts rewrites that prefix to the
// backend while the Proxy sees the same path for auth-token forwarding.
export const api = createHttpClient("");
