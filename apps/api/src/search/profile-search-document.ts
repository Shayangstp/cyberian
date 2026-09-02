export interface ProfileSearchDocument {
  id: string;
  sourceKey: string;
  linkedinId?: string;
  linkedinUrl?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  currentCompanyName?: string;
  summary?: string;
  industry?: string;
  jobTitleRole?: string;
  country?: string;
  skills: string[];
  locationName?: string;
  inferredYearsExperience?: number;
  sourceUpdatedAt?: string;
  importedAt: string;
  updatedAt: string;
  experience?: Record<string, string>[];
  education?: Record<string, string>[];
}
