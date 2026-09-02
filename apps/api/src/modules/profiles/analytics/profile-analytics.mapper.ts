import type {
  AnalyticsBucket,
  ProfileAnalyticsResponse,
} from '@cyberian/shared';

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
    topIndustries: buckets(aggregations.topIndustries),
    topSkills: buckets(aggregations.topSkills),
    countries: buckets(aggregations.countries),
  };
}

function totalHits(total: number | { value?: unknown } | undefined): number {
  if (typeof total === 'number') return safeCount(total);
  return safeCount(total?.value);
}

function cardinality(value: unknown): number {
  return safeCount((value as AggregationValue)?.value);
}

function buckets(value: unknown): AnalyticsBucket[] {
  const candidate = (value as BucketAggregation)?.buckets;
  if (!Array.isArray(candidate)) return [];
  return candidate
    .flatMap((bucket): AnalyticsBucket[] => {
      if (!bucket || typeof bucket !== 'object') return [];
      const source = bucket as { key?: unknown; doc_count?: unknown };
      if (typeof source.key !== 'string') return [];
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
