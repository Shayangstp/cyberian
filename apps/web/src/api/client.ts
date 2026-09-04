import { environment } from '../config/environment';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function resolveApiUrl(
  path: string,
  apiBaseUrl = environment.apiBaseUrl,
  browserOrigin = globalThis.location?.origin,
): URL {
  const baseUrl = new URL(apiBaseUrl, browserOrigin);
  return new URL(path, baseUrl);
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(resolveApiUrl(path), {
    ...init,
    headers: {
      Accept: 'application/json',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError('The request could not be completed.', response.status);
  }

  return (await response.json()) as T;
}
