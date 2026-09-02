import { describe, expect, it } from 'vitest';
import { profileAnalyticsQueryKey } from '../hooks/use-profile-analytics';
import { analyticsChartData } from '../components/AnalyticsBarChart';

describe('profile analytics query model', () => {
  it('uses a stable query key', () => {
    expect(profileAnalyticsQueryKey).toEqual(['profile-analytics']);
  });

  it('transforms real bucket values into matching chart labels and counts', () => {
    expect(analyticsChartData([{ key: 'Industry', count: 3 }])).toMatchObject({
      labels: ['Industry'],
      datasets: [{ data: [3] }],
    });
  });
});
