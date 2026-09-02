import type { Profile } from '@prisma/client';
import type { ProfileSearchDocument } from './profile-search-document';
const experience = new Set([
  'title',
  'company',
  'companyname',
  'location',
  'description',
  'startdate',
  'enddate',
  'duration',
]);
const education = new Set([
  'school',
  'schoolname',
  'degree',
  'fieldofstudy',
  'startdate',
  'enddate',
  'description',
]);
export function mapProfileToSearchDocument(
  profile: Profile,
): ProfileSearchDocument {
  const value = (key: keyof Profile): string | undefined =>
    typeof profile[key] === 'string' ? profile[key] : undefined;
  return compact({
    id: profile.id,
    sourceKey: profile.sourceKey,
    linkedinId: value('linkedinId'),
    linkedinUrl: value('linkedinUrl'),
    fullName: value('fullName'),
    firstName: value('firstName'),
    lastName: value('lastName'),
    jobTitle: value('jobTitle'),
    currentCompanyName: value('currentCompanyName'),
    summary: value('summary'),
    industry: value('industry'),
    jobTitleRole: value('jobTitleRole'),
    country: value('country'),
    skills: profile.skills,
    locationName: value('locationName'),
    inferredYearsExperience: profile.inferredYearsExperience ?? undefined,
    sourceUpdatedAt: profile.sourceUpdatedAt?.toISOString(),
    importedAt: profile.importedAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
    experience: sanitize(profile.experience, experience),
    education: sanitize(profile.education, education),
  });
}
function sanitize(
  value: unknown,
  allowed: Set<string>,
): Record<string, string>[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const rows: Record<string, string>[] = value
    .map((row) =>
      typeof row === 'object' && row
        ? (Object.fromEntries(
            Object.entries(row as Record<string, unknown>).filter(
              ([k, v]) => allowed.has(k) && typeof v === 'string',
            ),
          ) as Record<string, string>)
        : {},
    )
    .filter((row) => Object.keys(row).length);
  return rows.length ? rows : undefined;
}
function compact<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== undefined),
  ) as T;
}
