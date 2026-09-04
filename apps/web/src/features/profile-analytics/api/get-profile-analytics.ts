import type { ProfileAnalyticsResponse } from '@cyberian/shared';
import { apiRequest } from '../../../api/client';

export function getProfileAnalytics(options?: { signal?: AbortSignal }) {
  return apiRequest<ProfileAnalyticsResponse>('/api/profiles/analytics', {
    signal: options?.signal,
  });
}
