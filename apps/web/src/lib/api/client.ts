import { toApiError } from './errors';

/** Browser-side base path; proxied to the API by next.config.ts rewrites. */
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api/v1').replace(/\/+$/, '');

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

interface RequestOptions {
  method?: Method;
  /** JSON body. */
  json?: unknown;
  /** Multipart body (file uploads). */
  formData?: FormData;
  query?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
}

/** Client Components: typed request to the API, sending the session cookie (same origin). */
export async function apiRequest<T = void>(path: string, options: RequestOptions = {}): Promise<T> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const qs = params.size ? `?${params.toString()}` : '';

  const headers: Record<string, string> = { Accept: 'application/json' };
  let body: BodyInit | undefined;
  if (options.formData) {
    body = options.formData;
  } else if (options.json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.json);
  }

  const response = await fetch(`${API_BASE}${path}${qs}`, {
    method: options.method ?? 'GET',
    headers,
    body,
    credentials: 'same-origin',
    signal: options.signal,
  });
  if (!response.ok) throw await toApiError(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
