import { describe, expect, it } from 'vitest';
import { profileAnalyticsQueryKey } from '../hooks/use-profile-analytics';
import { analyticsChartData } from '../components/AnalyticsBarChart';
import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { ProfileAnalyticsPageSkeleton } from '../components/ProfileAnalyticsPageSkeleton';

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

  it('renders a page skeleton while the analytics route is loading', () => {
    render(createElement(ProfileAnalyticsPageSkeleton));

    expect(
      screen.getByRole('status', { name: 'Loading profile analytics' }),
    ).toHaveAttribute('aria-busy', 'true');
  });
});
