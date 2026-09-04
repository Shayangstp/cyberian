import { inspectDataset } from './dataset-reader';
import type { NormalizedProfile } from './dataset.types';
import { adaptLinkedinProfileSource } from './linkedin-profile-source-layout';
import { ProfileNormalizer } from './profile-normalizer';
import {
  hasPossiblePii,
  isCountryName,
  publicValueIssue,
} from './public-profile-value-guards';

export interface ProfileDataAudit {
  totalCsvRecords: number;
  malformedWidthRecords: number;
  supportedLayoutRecords: number;
  unsupportedLayoutRecords: number;
  acceptedProfiles: number;
  rejectedProfiles: number;
  duplicates: number;
  invalidCountryValues: number;
  invalidJobTitles: number;
  invalidCompanyNames: number;
  invalidLocations: number;
  invalidSkills: number;
  possiblePiiLeakage: number;
  corruptedAcceptedPublicFields: number;
}

export async function auditProfileDataset(
  filePath: string,
): Promise<ProfileDataAudit> {
  const normalizer = new ProfileNormalizer();
  const keys = new Set<string>();
  const audit: ProfileDataAudit = {
    totalCsvRecords: 0,
    malformedWidthRecords: 0,
    supportedLayoutRecords: 0,
    unsupportedLayoutRecords: 0,
    acceptedProfiles: 0,
    rejectedProfiles: 0,
    duplicates: 0,
    invalidCountryValues: 0,
    invalidJobTitles: 0,
    invalidCompanyNames: 0,
    invalidLocations: 0,
    invalidSkills: 0,
    possiblePiiLeakage: 0,
    corruptedAcceptedPublicFields: 0,
  };

  const inspection = await inspectDataset(filePath, (source) => {
    const adapted = adaptLinkedinProfileSource(source);
    if (!adapted.record) {
      audit.unsupportedLayoutRecords += 1;
      audit.rejectedProfiles += 1;
      return;
    }
    audit.supportedLayoutRecords += 1;
    const normalized = normalizer.normalize(adapted.record);
    countWarnings(audit, normalized.warningCodes);
    if (!normalized.profile) {
      audit.rejectedProfiles += 1;
      return;
    }
    if (keys.has(normalized.profile.sourceKey)) {
      audit.duplicates += 1;
      audit.rejectedProfiles += 1;
      return;
    }
    keys.add(normalized.profile.sourceKey);
    audit.acceptedProfiles += 1;
    const quality = profileQuality(normalized.profile);
    audit.possiblePiiLeakage += quality.pii;
    audit.corruptedAcceptedPublicFields += quality.corrupt;
  });

  audit.totalCsvRecords = inspection.recordCount;
  audit.malformedWidthRecords = inspection.malformedCount;
  audit.rejectedProfiles += inspection.malformedCount;
  return audit;
}

export function profileQuality(profile: NormalizedProfile): {
  pii: number;
  corrupt: number;
} {
  let pii = 0;
  let corrupt = 0;
  const fields = [
    [profile.fullName, 'name'],
    [profile.firstName, 'name'],
    [profile.lastName, 'name'],
    [profile.industry, 'industry'],
    [profile.jobTitle, 'job_title'],
    [profile.jobTitleRole, 'job_title'],
    [profile.currentCompanyName, 'company'],
    [profile.locationName, 'location'],
    [profile.summary, 'summary'],
  ] as const;
  for (const [value, kind] of fields) {
    if (!value) continue;
    if (hasPossiblePii(value)) pii += 1;
    if (publicValueIssue(value, kind)) corrupt += 1;
  }
  if (
    profile.country &&
    !isCountryName(profile.country) &&
    !/^[A-Z]{2}$/.test(profile.country)
  )
    corrupt += 1;
  for (const skill of profile.skills) {
    if (hasPossiblePii(skill)) pii += 1;
    if (publicValueIssue(skill, 'skill')) corrupt += 1;
  }
  for (const collection of [profile.experience, profile.education]) {
    for (const row of collection ?? []) {
      for (const [key, value] of Object.entries(row)) {
        if (['startdate', 'enddate', 'duration'].includes(key)) continue;
        if (hasPossiblePii(value)) pii += 1;
      }
    }
  }
  return { pii, corrupt };
}

function countWarnings(
  audit: ProfileDataAudit,
  warnings: readonly string[],
): void {
  for (const warning of warnings) {
    if (warning === 'invalid_country') audit.invalidCountryValues += 1;
    if (warning === 'invalid_job_title') audit.invalidJobTitles += 1;
    if (warning === 'invalid_company_name') audit.invalidCompanyNames += 1;
    if (warning === 'invalid_location') audit.invalidLocations += 1;
    if (warning === 'invalid_skills') audit.invalidSkills += 1;
  }
}

export function auditPassed(audit: ProfileDataAudit): boolean {
  return (
    audit.possiblePiiLeakage === 0 && audit.corruptedAcceptedPublicFields === 0
  );
}
