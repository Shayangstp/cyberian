export interface HealthResponse {
  status: 'ok';
}
export interface ProfileSearchResult {
  id: string;
  fullName?: string;
  jobTitle?: string;
  currentCompanyName?: string;
  industry?: string;
  locationName?: string;
  country?: string;
  summary?: string;
  skills: string[];
  linkedinUrl?: string;
}
export interface ProfileSearchResponse {
  data: ProfileSearchResult[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    tookMs: number;
  };
}

export interface AnalyticsBucket {
  key: string;
  count: number;
}

export interface ProfileAnalyticsTotals {
  profiles: number;
  industries: number;
  skills: number;
  countries: number;
}

export interface ProfileAnalyticsResponse {
  totals: ProfileAnalyticsTotals;
  topIndustries: AnalyticsBucket[];
  topSkills: AnalyticsBucket[];
  countries: AnalyticsBucket[];
}
