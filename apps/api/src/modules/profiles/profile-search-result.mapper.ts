import type { ProfileSearchDocument } from '../../search/profile-search-document';
import {
  isCountryName,
  publicValueIssue,
  type PublicFieldKind,
} from '../../data/public-profile-value-guards';
export function mapPublicProfile(
  source: ProfileSearchDocument,
  highlight?: Record<string, string[]>,
) {
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
  const matchedSkills = safeHighlights(highlight?.skills, 'skill');
  const matchedSummary = safeHighlights(highlight?.summary, 'summary')[0];
  const matchContext = {
    ...(matchedSkills.length ? { skills: matchedSkills } : {}),
    ...(matchedSummary ? { summary: matchedSummary } : {}),
  };
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
    ...(Object.keys(matchContext).length ? { matchContext } : {}),
  };
}

function safeHighlights(
  values: string[] | undefined,
  kind: 'skill' | 'summary',
): string[] {
  return [
    ...new Set(
      (values ?? [])
        .map(stripMarkup)
        .map((value) => value.trim())
        .filter((value) => value && !publicValueIssue(value, kind)),
    ),
  ];
}

function stripMarkup(value: string): string {
  return value.replace(/<[^>]*>/g, '');
}

function safe(
  value: string | undefined,
  kind: PublicFieldKind,
): string | undefined {
  return value && !publicValueIssue(value, kind) ? value : undefined;
}
