import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { searchProfiles } from '../api/search-profiles';
import { useProfileSearch } from '../hooks/use-profile-search';
import type { ProfileSearchParams } from '../model/profile-search-params';

vi.mock('../api/search-profiles', () => ({ searchProfiles: vi.fn() }));

const empty: ProfileSearchParams = {
  q: '',
  skills: [],
  jobTitle: '',
  industry: '',
  page: 1,
  limit: 10,
};

describe('useProfileSearch', () => {
  it('requests unfiltered profiles and then requests all applied criteria', async () => {
    const mockedSearch = vi.mocked(searchProfiles);
    mockedSearch.mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 0, tookMs: 1 },
    });
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { rerender } = renderHook(({ params }) => useProfileSearch(params), {
      initialProps: { params: empty },
      wrapper,
    });

    await waitFor(() => expect(mockedSearch).toHaveBeenCalledTimes(1));
    const initialCall = mockedSearch.mock.calls[0];
    if (!initialCall) throw new Error('Expected an unfiltered profile request');
    expect(initialCall[0]).toEqual(empty);
    expect(hasAbortSignal(initialCall[1])).toBe(true);

    const applied = {
      ...empty,
      q: 'engineer',
      skills: ['TypeScript'],
      jobTitle: 'software eng',
      industry: 'information tech',
    };
    rerender({ params: applied });

    await waitFor(() => expect(mockedSearch).toHaveBeenCalledTimes(2));
    const call = mockedSearch.mock.calls[1];
    if (!call) throw new Error('Expected a profile search request');
    const [requestedParams, options] = call;
    expect(requestedParams).toEqual(applied);
    expect(hasAbortSignal(options)).toBe(true);
  });
});

function hasAbortSignal(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    'signal' in value &&
    value.signal instanceof AbortSignal
  );
}
