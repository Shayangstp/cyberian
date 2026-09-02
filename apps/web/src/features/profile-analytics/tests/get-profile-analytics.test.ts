import { afterEach, describe, expect, it, vi } from 'vitest';
import { getProfileAnalytics } from '../api/get-profile-analytics';

describe('getProfileAnalytics', () => {
  afterEach(() => vi.restoreAllMocks());

  it('requests the analytics endpoint and forwards an abort signal', async () => {
    const signal = new AbortController().signal;
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          totals: { profiles: 0, industries: 0, skills: 0, countries: 0 },
          topIndustries: [],
          topSkills: [],
          countries: [],
        }),
        { status: 200 },
      ),
    );

    await expect(getProfileAnalytics({ signal })).resolves.toMatchObject({
      totals: { profiles: 0 },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      new URL('http://localhost:3000/api/profiles/analytics'),
      expect.objectContaining({ signal }),
    );
  });

  it('uses the existing safe API error for failures', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('', { status: 503 }),
    );
    await expect(getProfileAnalytics()).rejects.toMatchObject({ status: 503 });
  });
});
