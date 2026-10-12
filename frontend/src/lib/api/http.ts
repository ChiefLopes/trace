import type { z } from "zod";

import { ApiContractError, ApiError } from "./errors";

type Query = Record<string, string | number | boolean | undefined>;

export type RequestOptions = Omit<RequestInit, "body"> & {
  query?: Query;
  /** Serialized as JSON. */
  body?: unknown;
};

type DefaultHeaders = () => HeadersInit | Promise<HeadersInit>;

function buildUrl(baseUrl: string, path: string, query?: Query) {
  const url = `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
  if (!query) return url;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function readBody(res: Response): Promise<unknown> {
  if (res.status === 204) return undefined;
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Creates a typed JSON client for one base URL. Every response is validated
 * against a Zod schema, so a backend contract change fails loudly at the
 * boundary instead of as an `undefined` deep inside a component.
 */
export function createHttpClient(baseUrl: string, getDefaultHeaders?: DefaultHeaders) {
  async function request<S extends z.ZodType>(
    path: string,
    schema: S,
    { query, body, headers, ...init }: RequestOptions = {},
  ): Promise<z.infer<S>> {
    const res = await fetch(buildUrl(baseUrl, path, query), {
      ...init,
      headers: {
        ...(await getDefaultHeaders?.()),
        Accept: "application/json",
        ...(body !== undefined && { "Content-Type": "application/json" }),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const data = await readBody(res);

    if (!res.ok) {
      const message =
        typeof data === "object" && data !== null && "message" in data
          ? String(data.message)
          : `Request to ${path} failed with ${res.status}`;
      throw new ApiError(res.status, message, data);
    }

    const result = schema.safeParse(data);
    if (!result.success) throw new ApiContractError(path, result.error.issues);
    return result.data;
  }

  return {
    get: <S extends z.ZodType>(path: string, schema: S, opts?: Omit<RequestOptions, "body">) =>
      request(path, schema, { ...opts, method: "GET" }),
    post: <S extends z.ZodType>(path: string, schema: S, opts?: RequestOptions) =>
      request(path, schema, { ...opts, method: "POST" }),
    put: <S extends z.ZodType>(path: string, schema: S, opts?: RequestOptions) =>
      request(path, schema, { ...opts, method: "PUT" }),
    patch: <S extends z.ZodType>(path: string, schema: S, opts?: RequestOptions) =>
      request(path, schema, { ...opts, method: "PATCH" }),
    delete: <S extends z.ZodType>(path: string, schema: S, opts?: RequestOptions) =>
      request(path, schema, { ...opts, method: "DELETE" }),
  };
}

export type HttpClient = ReturnType<typeof createHttpClient>;
