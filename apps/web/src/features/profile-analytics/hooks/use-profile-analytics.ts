import { useQuery } from '@tanstack/react-query';
import { getProfileAnalytics } from '../api/get-profile-analytics';

export const profileAnalyticsQueryKey = ['profile-analytics'] as const;

export function useProfileAnalytics() {
  return useQuery({
    queryKey: profileAnalyticsQueryKey,
    queryFn: ({ signal }) => getProfileAnalytics({ signal }),
    staleTime: 5 * 60_000,
    retry: 1,
  });
}
