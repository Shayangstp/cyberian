import type { Profile } from '@prisma/client';
import type { ProfileSearchDocument } from './profile-search-document';
import {
  hasPossiblePii,
  isCountryName,
  publicValueIssue,
  type PublicFieldKind,
} from '../data/public-profile-value-guards';
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
  const value = (
    key: keyof Profile,
    kind: PublicFieldKind,
  ): string | undefined => {
    const candidate = profile[key];
    return typeof candidate === 'string' && !publicValueIssue(candidate, kind)
      ? candidate
      : undefined;
  };
  const document = compact({
    id: profile.id,
    linkedinUrl:
      typeof profile.linkedinUrl === 'string' ? profile.linkedinUrl : undefined,
    fullName: value('fullName', 'name'),
    firstName: value('firstName', 'name'),
    lastName: value('lastName', 'name'),
    jobTitle: value('jobTitle', 'job_title'),
    currentCompanyName: value('currentCompanyName', 'company'),
    summary: value('summary', 'summary'),
    industry: value('industry', 'industry'),
    jobTitleRole: value('jobTitleRole', 'job_title'),
    country:
      typeof profile.country === 'string' &&
      (isCountryName(profile.country) || /^[A-Z]{2}$/.test(profile.country))
        ? profile.country
        : undefined,
    skills: profile.skills
      .filter((skill) => !publicValueIssue(skill, 'skill'))
      .slice(0, 100),
    locationName: value('locationName', 'location'),
    inferredYearsExperience: profile.inferredYearsExperience ?? undefined,
    experience: sanitize(profile.experience, experience),
    education: sanitize(profile.education, education),
  });
  assertSearchDocumentSafe(document);
  return document;
}

export function assertSearchDocumentSafe(
  document: ProfileSearchDocument,
): void {
  const typedFields = [
    [document.fullName, 'name'],
    [document.firstName, 'name'],
    [document.lastName, 'name'],
    [document.jobTitle, 'job_title'],
    [document.currentCompanyName, 'company'],
    [document.summary, 'summary'],
    [document.industry, 'industry'],
    [document.jobTitleRole, 'job_title'],
    [document.locationName, 'location'],
  ] as const;
  if (
    typedFields.some(
      ([value, kind]) => value && publicValueIssue(value, kind),
    ) ||
    (document.skills ?? []).some((skill) => publicValueIssue(skill, 'skill')) ||
    (document.country &&
      !isCountryName(document.country) &&
      !/^[A-Z]{2}$/.test(document.country))
  ) {
    throw new Error('Corrupted public profile document');
  }
  const values: string[] = [
    document.fullName,
    document.firstName,
    document.lastName,
    document.jobTitle,
    document.currentCompanyName,
    document.summary,
    document.industry,
    document.jobTitleRole,
    document.country,
    document.locationName,
    ...(document.skills ?? []),
    ...structuredValues(document.experience),
    ...structuredValues(document.education),
  ].filter((value): value is string => typeof value === 'string');
  if (values.some(hasPossiblePii))
    throw new Error('Unsafe public profile document');
}

function structuredValues(
  rows: Record<string, string>[] | undefined,
): string[] {
  return (
    rows?.flatMap((row) =>
      Object.entries(row)
        .filter(([key]) => !['startdate', 'enddate', 'duration'].includes(key))
        .map(([, value]) => value),
    ) ?? []
  );
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
