import type { DatasetRecord } from './dataset.types';
import { parseStructuredValue } from './structured-value-parser';

/**
 * Known 77-column LinkedIn profile export. Identity scalars occupy 0-10,
 * professional scalars 11-44, the thirteen collection fields 45-57, the
 * version-status object 58, and trailing private scalars 59-76.
 *
 * Some supplied rows contain 77 values but place the collection block at a
 * different offset. Those rows have lost source-key alignment and cannot be
 * repaired safely. They are rejected; values are never shifted heuristically.
 */
export const LINKEDIN_PROFILE_SOURCE_HEADERS = [
  'full_name',
  'first_name',
  'last_name',
  'gender',
  'linkedin_url',
  'linkedin_username',
  'linkedin_id',
  'facebook_url',
  'facebook_username',
  'facebook_id',
  'industry',
  'job_title',
  'job_title_role',
  'job_title_levels',
  'job_company_id',
  'job_company_name',
  'job_company_website',
  'job_company_size',
  'job_company_founded',
  'job_company_industry',
  'job_company_linkedin_url',
  'job_company_linkedin_id',
  'job_company_facebook_url',
  'job_company_twitter_url',
  'job_company_location_name',
  'job_company_location_locality',
  'job_company_location_metro',
  'job_company_location_region',
  'job_company_location_geo',
  'job_company_location_country',
  'job_company_location_continent',
  'job_last_updated',
  'job_start_date',
  'location_name',
  'location_locality',
  'location_metro',
  'location_region',
  'location_country',
  'location_continent',
  'location_geo',
  'location_last_updated',
  'linkedin_connections',
  'inferred_salary',
  'inferred_years_experience',
  'summary',
  'phone_numbers',
  'emails',
  'interests',
  'skills',
  'location_names',
  'regions',
  'countries',
  'street_addresses',
  'experience',
  'education',
  'profiles',
  'certifications',
  'languages',
  'version_status',
  'work_email',
  'job_company_location_street_address',
  'job_company_location_postal_code',
  'job_summary',
  'location_street_address',
  'location_postal_code',
  'middle_initial',
  'middle_name',
  'birth_year',
  'birth_date',
  'twitter_url',
  'twitter_username',
  'github_url',
  'github_username',
  'mobile_phone',
  'location_address_line_2',
  'job_title_sub_role',
  'job_company_location_address_line_2',
] as const;

export const LINKEDIN_PROFILE_COLLECTION_STARTS = [
  25, 28, 39, 40, 41, 42, 44, 45, 46, 48,
] as const;

/** Zero-based positions in the canonical source layout. */
export const LINKEDIN_PROFILE_SOURCE_POSITIONS = {
  fullName: 0,
  firstName: 1,
  lastName: 2,
  linkedinUrl: 4,
  linkedinId: 6,
  industry: 10,
  currentJobTitle: 11,
  jobTitleRole: 12,
  currentCompanyName: 15,
  sourceUpdatedAt: 31,
  locationName: 33,
  country: 37,
  inferredYearsExperience: 43,
  summary: 44,
  skills: 48,
  experience: 53,
  education: 54,
} as const;

export interface SourceLayoutResult {
  record: DatasetRecord | null;
  layoutId?: string;
  rejectionCode?: 'unknown_header_layout' | 'ambiguous_value_layout';
}

export function adaptLinkedinProfileSource(
  record: DatasetRecord,
): SourceLayoutResult {
  const headers = Object.keys(record);
  if (!sameSequence(headers, LINKEDIN_PROFILE_SOURCE_HEADERS)) {
    return { record: null, rejectionCode: 'unknown_header_layout' };
  }

  const sourceValues = Object.values(record);
  const matchingStarts = LINKEDIN_PROFILE_COLLECTION_STARTS.filter((start) =>
    matchesKnownValueFingerprint(sourceValues, start),
  );
  if (matchingStarts.length !== 1) {
    return { record: null, rejectionCode: 'ambiguous_value_layout' };
  }

  const collectionStart = matchingStarts[0] ?? -1;
  const canonical = collectionStart === 45;
  const at = (position: number): string => sourceValues[position] ?? '';
  return {
    layoutId: `linkedin-77-collections-${collectionStart}`,
    record: {
      full_name: at(LINKEDIN_PROFILE_SOURCE_POSITIONS.fullName),
      first_name: at(LINKEDIN_PROFILE_SOURCE_POSITIONS.firstName),
      last_name: at(LINKEDIN_PROFILE_SOURCE_POSITIONS.lastName),
      linkedin_url: at(LINKEDIN_PROFILE_SOURCE_POSITIONS.linkedinUrl),
      linkedin_id: at(LINKEDIN_PROFILE_SOURCE_POSITIONS.linkedinId),
      industry: canonical ? at(LINKEDIN_PROFILE_SOURCE_POSITIONS.industry) : '',
      job_title: canonical
        ? at(LINKEDIN_PROFILE_SOURCE_POSITIONS.currentJobTitle)
        : '',
      job_title_role: canonical
        ? at(LINKEDIN_PROFILE_SOURCE_POSITIONS.jobTitleRole)
        : '',
      current_company_name: canonical
        ? at(LINKEDIN_PROFILE_SOURCE_POSITIONS.currentCompanyName)
        : '',
      location_name: canonical
        ? at(LINKEDIN_PROFILE_SOURCE_POSITIONS.locationName)
        : '',
      country: canonical ? at(LINKEDIN_PROFILE_SOURCE_POSITIONS.country) : '',
      summary: canonical ? at(LINKEDIN_PROFILE_SOURCE_POSITIONS.summary) : '',
      inferred_years_experience: canonical
        ? at(LINKEDIN_PROFILE_SOURCE_POSITIONS.inferredYearsExperience)
        : '',
      skills: at(collectionStart + 3),
      experience: at(collectionStart + 8),
      education: at(collectionStart + 9),
      source_updated_at: canonical
        ? at(LINKEDIN_PROFILE_SOURCE_POSITIONS.sourceUpdatedAt)
        : '',
    },
  };
}

function matchesKnownValueFingerprint(
  values: readonly string[],
  collectionStart: number,
): boolean {
  return (
    values.length === LINKEDIN_PROFILE_SOURCE_HEADERS.length &&
    Array.from({ length: 13 }, (_, index) => collectionStart + index).every(
      (position) => isArrayValue(values[position]),
    ) &&
    isObjectValue(values[collectionStart + 13])
  );
}

function isArrayValue(value: string | undefined): boolean {
  const parsed = parseStructuredValue(value ?? '');
  return parsed.success && Array.isArray(parsed.value);
}

function isObjectValue(value: string | undefined): boolean {
  const parsed = parseStructuredValue(value ?? '');
  return (
    parsed.success &&
    typeof parsed.value === 'object' &&
    parsed.value !== null &&
    !Array.isArray(parsed.value)
  );
}

function sameSequence(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}
