import type { ApiError, ApiFieldError } from '@ds/contracts';

/** A non-2xx response from the API, carrying the API's structured error body when available. */
export class ApiRequestError extends Error {
  readonly status: number;
  readonly details: ApiFieldError[];
  readonly requestId?: string;

  constructor(status: number, body: Partial<ApiError> | null) {
    super(body?.message ?? `Request failed with status ${status}`);
    this.name = 'ApiRequestError';
    this.status = status;
    this.details = body?.details ?? [];
    this.requestId = body?.requestId;
  }
}

export async function toApiError(response: Response): Promise<ApiRequestError> {
  let body: Partial<ApiError> | null = null;
  try {
    body = (await response.json()) as Partial<ApiError>;
  } catch {
    // Non-JSON error (e.g. proxy failure): fall back to the status code.
  }
  return new ApiRequestError(response.status, body);
}

/** A message safe to show to visitors, without internal detail. */
export function userMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.status === 429) return 'Too many attempts. Please wait a few minutes and try again.';
    if (error.status >= 500) return 'Something went wrong on our side. Please try again later.';
    return error.message;
  }
  return 'We could not reach the server. Check your connection and try again.';
}
