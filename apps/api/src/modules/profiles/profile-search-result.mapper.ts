import type { ProfileSearchDocument } from '../../search/profile-search-document';
import {
  isCountryName,
  publicValueIssue,
  type PublicFieldKind,
} from '../../data/public-profile-value-guards';
export function mapPublicProfile(source: ProfileSearchDocument) {
  const {
    id,
    fullName,
    jobTitle,
    currentCompanyName,
    industry,
    locationName,
    country,
    summary,
    skills,
    linkedinUrl,
  } = source;
  return {
    id,
    fullName: safe(fullName, 'name'),
    jobTitle: safe(jobTitle, 'job_title'),
    currentCompanyName: safe(currentCompanyName, 'company'),
    industry: safe(industry, 'industry'),
    locationName: safe(locationName, 'location'),
    country:
      country && (isCountryName(country) || /^[A-Z]{2}$/.test(country))
        ? country
        : undefined,
    summary: safe(summary, 'summary'),
    skills: (skills ?? []).filter((skill) => !publicValueIssue(skill, 'skill')),
    linkedinUrl,
  };
}

function safe(
  value: string | undefined,
  kind: PublicFieldKind,
): string | undefined {
  return value && !publicValueIssue(value, kind) ? value : undefined;
}
