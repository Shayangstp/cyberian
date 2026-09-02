import type { ConfigService } from '@nestjs/config';
import { ProfilesSearchService } from '../src/modules/profiles/profiles-search.service';
import { expectNoPublicPii } from './public-response-pii.assertion';

describe('ProfilesSearchService', () => {
  const config = {
    getOrThrow: jest.fn(() => 'profiles'),
  } as unknown as ConfigService;

  it('maps Elasticsearch hits to the public whitelist and uses the configured alias', async () => {
    const search = jest.fn().mockResolvedValue({
      took: 3,
      hits: {
        total: { value: 1 },
        hits: [
          {
            _source: {
              id: 'synthetic',
              fullName: 'Synthetic',
              skills: [],
              email: 'excluded',
              sourceKey: 'excluded',
            },
          },
        ],
      },
    });
    const service = new ProfilesSearchService({ search } as never, config);
    const result = await service.search({ page: 1, limit: 20 });
    expect(search).toHaveBeenCalledWith(
      expect.objectContaining({ index: 'profiles' }),
    );
    expect(result.meta).toMatchObject({ total: 1, totalPages: 1 });
    expectNoPublicPii(result);
  });

  it('returns a safe service-unavailable response when Elasticsearch fails', async () => {
    const service = new ProfilesSearchService(
      {
        search: jest.fn().mockRejectedValue(new Error('connection details')),
      } as never,
      config,
    );
    await expect(service.search({ page: 1, limit: 20 })).rejects.toMatchObject({
      status: 503,
      message: 'Profile search is temporarily unavailable',
    });
  });
});
