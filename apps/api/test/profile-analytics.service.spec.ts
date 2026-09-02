import { ServiceUnavailableException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { mapProfileAnalytics } from '../src/modules/profiles/analytics/profile-analytics.mapper';
import { expectNoPublicPii } from './public-response-pii.assertion';
import { ProfileAnalyticsService } from '../src/modules/profiles/analytics/profile-analytics.service';

describe('ProfileAnalyticsService', () => {
  const config = {
    getOrThrow: jest.fn(() => 'profiles'),
  } as unknown as ConfigService;

  it('uses the alias, aggregation-only request, exact fields, and maps totals', async () => {
    const search = jest.fn<Promise<unknown>, [unknown]>().mockResolvedValue({
      hits: { total: { value: 12 } },
      aggregations: {
        uniqueIndustries: { value: 3 },
        uniqueSkills: { value: 8 },
        uniqueCountries: { value: 2 },
        topIndustries: {
          buckets: [
            { key: 'B', doc_count: 2 },
            { key: 'A', doc_count: 2 },
          ],
        },
        topSkills: { buckets: [{ key: 'Skill', doc_count: 4 }] },
        countries: { buckets: [{ key: 'Country', doc_count: 12 }] },
      },
    });
    const service = new ProfileAnalyticsService({ search } as never, config);

    const result = await service.getAnalytics();
    expect(search).toHaveBeenCalledWith({
      index: 'profiles',
      size: 0,
      track_total_hits: true,
      aggs: {
        uniqueIndustries: {
          cardinality: {
            field: 'industry.keyword',
            precision_threshold: 1000,
          },
        },
        uniqueSkills: {
          cardinality: { field: 'skills.keyword', precision_threshold: 1000 },
        },
        uniqueCountries: {
          cardinality: { field: 'country', precision_threshold: 1000 },
        },
        topIndustries: {
          terms: {
            field: 'industry.keyword',
            size: 10,
            order: { _count: 'desc' },
          },
        },
        topSkills: {
          terms: {
            field: 'skills.keyword',
            size: 10,
            order: { _count: 'desc' },
          },
        },
        countries: {
          terms: { field: 'country', size: 10, order: { _count: 'desc' } },
        },
      },
    });
    expect(result).toEqual({
      totals: { profiles: 12, industries: 3, skills: 8, countries: 2 },
      topIndustries: [
        { key: 'A', count: 2 },
        { key: 'B', count: 2 },
      ],
      topSkills: [{ key: 'Skill', count: 4 }],
      countries: [{ key: 'Country', count: 12 }],
    });
    expectNoPublicPii(result);
  });

  it('maps missing aggregations safely and turns Elasticsearch failures into a safe 503', async () => {
    const service = new ProfileAnalyticsService(
      { search: jest.fn().mockResolvedValue({ hits: { total: 0 } }) } as never,
      config,
    );
    await expect(service.getAnalytics()).resolves.toEqual({
      totals: { profiles: 0, industries: 0, skills: 0, countries: 0 },
      topIndustries: [],
      topSkills: [],
      countries: [],
    });
    const unavailable = new ProfileAnalyticsService(
      {
        search: jest.fn().mockRejectedValue(new Error('unavailable')),
      } as never,
      config,
    );
    await expect(unavailable.getAnalytics()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('supports numeric total hits without exposing aggregation objects', () => {
    expect(mapProfileAnalytics({ hits: { total: 7 } })).toEqual({
      totals: { profiles: 7, industries: 0, skills: 0, countries: 0 },
      topIndustries: [],
      topSkills: [],
      countries: [],
    });
  });
});
