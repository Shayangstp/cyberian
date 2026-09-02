import type { ProfileSearchResponse } from '@cyberian/shared';
import { apiRequest } from '../../../api/client';
import { serializeProfileSearchParams } from '../model/profile-search-url';
import type { ProfileSearchParams } from '../model/profile-search-params';
export function searchProfiles(
  params: ProfileSearchParams,
  options?: { signal?: AbortSignal },
): Promise<ProfileSearchResponse> {
  const query = serializeProfileSearchParams(params);
  return apiRequest<ProfileSearchResponse>(
    `/api/profiles/search${query ? `?${query}` : ''}`,
    { signal: options?.signal },
  );
}
