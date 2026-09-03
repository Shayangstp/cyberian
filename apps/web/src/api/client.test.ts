import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiRequest, resolveApiUrl } from './client';

describe('resolveApiUrl', () => {
  it('uses an absolute API origin for host development', () => {
    expect(
      resolveApiUrl(
        '/api/profiles/search?q=engineer',
        'http://localhost:3000',
        'http://localhost:5173',
      ).toString(),
    ).toBe('http://localhost:3000/api/profiles/search?q=engineer');
  });

  it('resolves a relative Docker base against the browser origin', () => {
    expect(
      resolveApiUrl(
        '/api/profiles/search?q=engineer',
        '/api',
        'http://localhost:5173',
      ).toString(),
    ).toBe('http://localhost:5173/api/profiles/search?q=engineer');
  });
});

describe('apiRequest', () => {
  afterEach(() => vi.restoreAllMocks());

  it('passes the resolved URL and request options to fetch', async () => {
    const signal = new AbortController().signal;
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ status: 'ok' })));

    await expect(
      apiRequest<{ status: string }>('/api/health', { signal }),
    ).resolves.toEqual({ status: 'ok' });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toEqual(new URL('http://localhost:3000/api/health'));
    expect(init?.signal).toBe(signal);
    expect(new Headers(init?.headers).get('Accept')).toBe('application/json');
  });
});
