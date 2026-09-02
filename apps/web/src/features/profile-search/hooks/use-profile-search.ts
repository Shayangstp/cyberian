import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ApiError } from '../../../api/client';
import { searchProfiles } from '../api/search-profiles';
import type { ProfileSearchParams } from '../model/profile-search-params';
export function profileSearchQueryKey(params: ProfileSearchParams) {
  return [
    'profile-search',
    {
      ...params,
      skills: [...new Set(params.skills)].sort((a, b) => a.localeCompare(b)),
    },
  ] as const;
}
export function useProfileSearch(params: ProfileSearchParams) {
  return useQuery({
    queryKey: profileSearchQueryKey(params),
    queryFn: ({ signal }) => searchProfiles(params, { signal }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    retry: (count, error) =>
      !(error instanceof ApiError && error.status === 400) && count < 1,
  });
}
