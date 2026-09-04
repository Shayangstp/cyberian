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
            _index: 'profiles-v3-test',
            _score: 12,
            sort: [12, 'synthetic'],
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
    const result = await service.search({ page: 1, limit: 10 });
    expect(search).toHaveBeenCalledWith(
      expect.objectContaining({ index: 'profiles' }),
    );
    expect(result.meta).toMatchObject({ total: 1, totalPages: 1 });
    expect(result.data[0]).not.toHaveProperty('_index');
    expect(result.data[0]).not.toHaveProperty('_score');
    expect(result.data[0]).not.toHaveProperty('sort');
    expectNoPublicPii(result);
  });

  it('returns a safe service-unavailable response when Elasticsearch fails', async () => {
    const service = new ProfilesSearchService(
      {
        search: jest.fn().mockRejectedValue(new Error('connection details')),
      } as never,
      config,
    );
    await expect(service.search({ page: 1, limit: 10 })).rejects.toMatchObject({
      status: 503,
      message: 'Profile search is temporarily unavailable',
    });
  });

  it('removes PII-like values even if a stale index document contains them', async () => {
    const service = new ProfilesSearchService(
      {
        search: jest.fn().mockResolvedValue({
          took: 1,
          hits: {
            total: 1,
            hits: [
              {
                _source: {
                  id: 'synthetic',
                  fullName: 'Synthetic Person',
                  locationName: '123 Example Street',
                  skills: ['TypeScript', 'person@example.invalid'],
                },
              },
            ],
          },
        }),
      } as never,
      config,
    );
    const result = await service.search({ page: 1, limit: 10 });
    expect(result.data[0]).toMatchObject({
      locationName: undefined,
      skills: ['TypeScript'],
    });
    expectNoPublicPii(result);
  });

  it('returns only sanitized skill and summary highlights as match context', async () => {
    const service = new ProfilesSearchService(
      {
        search: jest.fn().mockResolvedValue({
          took: 1,
          hits: {
            total: 1,
            hits: [
              {
                _source: {
                  id: 'synthetic',
                  skills: ['Executive Search', 'TypeScript'],
                  summary: 'A long original summary.',
                },
                highlight: {
                  skills: [
                    'Executive <em>Search</em>',
                    '<script>alert(1)</script>Type<em>Script</em>',
                    'person@example.invalid',
                  ],
                  summary: [
                    '...built an <em>executive search</em> practice...',
                  ],
                  email: ['private@example.invalid'],
                },
              },
            ],
          },
        }),
      } as never,
      config,
    );

    const result = await service.search({ page: 1, limit: 10, q: 'search' });

    expect(result.data[0]).toMatchObject({
      matchContext: {
        skills: ['Executive Search', 'alert(1)TypeScript'],
        summary: '...built an executive search practice...',
      },
    });
    expect(JSON.stringify(result)).not.toMatch(/<\/?(?:em|script)>|email/i);
    expectNoPublicPii(result);
  });

  it('omits match context when Elasticsearch supplies no highlights', async () => {
    const service = new ProfilesSearchService(
      {
        search: jest.fn().mockResolvedValue({
          took: 1,
          hits: {
            total: 1,
            hits: [{ _source: { id: 'synthetic', skills: [] } }],
          },
        }),
      } as never,
      config,
    );

    const result = await service.search({ page: 1, limit: 10 });
    expect(result.data[0]).not.toHaveProperty('matchContext');
  });
});
