import type {
  AnalyticsBucket,
  ProfileAnalyticsResponse,
} from '@cyberian/shared';
import {
  isCountryName,
  publicValueIssue,
} from '../../../data/public-profile-value-guards';

type AggregationValue = { value?: unknown } | undefined;
type BucketAggregation = { buckets?: unknown } | undefined;

export function mapProfileAnalytics(response: {
  hits?: { total?: number | { value?: unknown } };
  aggregations?: Record<string, unknown>;
}): ProfileAnalyticsResponse {
  const aggregations = response.aggregations ?? {};
  return {
    totals: {
      profiles: totalHits(response.hits?.total),
      industries: cardinality(aggregations.uniqueIndustries),
      skills: cardinality(aggregations.uniqueSkills),
      countries: cardinality(aggregations.uniqueCountries),
    },
    topIndustries: buckets(aggregations.topIndustries, 'industry'),
    topSkills: buckets(aggregations.topSkills, 'skill'),
    countries: buckets(aggregations.countries, 'country'),
  };
}

function totalHits(total: number | { value?: unknown } | undefined): number {
  if (typeof total === 'number') return safeCount(total);
  return safeCount(total?.value);
}

function cardinality(value: unknown): number {
  return safeCount((value as AggregationValue)?.value);
}

function buckets(
  value: unknown,
  kind: 'industry' | 'skill' | 'country',
): AnalyticsBucket[] {
  const candidate = (value as BucketAggregation)?.buckets;
  if (!Array.isArray(candidate)) return [];
  return candidate
    .flatMap((bucket): AnalyticsBucket[] => {
      if (!bucket || typeof bucket !== 'object') return [];
      const source = bucket as { key?: unknown; doc_count?: unknown };
      if (typeof source.key !== 'string') return [];
      if (kind === 'country') {
        if (!isCountryName(source.key) && !/^[A-Z]{2}$/.test(source.key))
          return [];
      } else if (publicValueIssue(source.key, kind)) return [];
      return [{ key: source.key, count: safeCount(source.doc_count) }];
    })
    .sort(
      (left, right) =>
        right.count - left.count || left.key.localeCompare(right.key),
    );
}

function safeCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : 0;
}
