import { createHash } from 'node:crypto';
import type {
  DatasetRecord,
  NormalizationResult,
  NormalizedProfile,
  SafeJsonObject,
} from './dataset.types';
import { parseStructuredValue } from './structured-value-parser';
import {
  isCountryName,
  publicValueIssue,
  type PublicFieldKind,
} from './public-profile-value-guards';

const FIELD_ALIASES = {
  linkedinId: ['linkedin_id', 'linkedinid', 'linkedin_num_id'],
  linkedinUrl: ['linkedin_url', 'profile_url', 'url', 'input_url'],
  fullName: ['full_name', 'fullname', 'name'],
  firstName: ['first_name', 'firstname'],
  lastName: ['last_name', 'lastname'],
  industry: ['industry', 'industry_name'],
  jobTitle: ['job_title', 'title', 'position', 'current_position'],
  jobTitleRole: ['job_title_role', 'title_role', 'position_role'],
  currentCompanyName: [
    'current_company_name',
    'job_company_name',
    'company_name',
    'current_company',
  ],
  locationName: ['location_name', 'location', 'city'],
  country: ['country', 'country_name', 'country_code', 'location_country'],
  summary: ['summary', 'about', 'description', 'bio'],
  inferredYearsExperience: [
    'inferred_years_experience',
    'years_experience',
    'years_of_experience',
  ],
  skills: ['skills', 'skill'],
  experience: ['experience', 'experiences'],
  education: ['education', 'educations'],
  sourceUpdatedAt: [
    'source_updated_at',
    'updated_at',
    'timestamp',
    'last_updated',
    'job_last_updated',
    'location_last_updated',
  ],
} as const;

const EXPERIENCE_FIELDS = new Set([
  'title',
  'company',
  'companyname',
  'location',
  'description',
  'startdate',
  'enddate',
  'duration',
]);

const EDUCATION_FIELDS = new Set([
  'school',
  'schoolname',
  'degree',
  'fieldofstudy',
  'startdate',
  'enddate',
  'description',
]);

export class ProfileNormalizer {
  normalize(record: DatasetRecord): NormalizationResult {
    const fields = normalizedFieldMap(record);
    const warningCodes: string[] = [];

    const linkedinUrl = normalizeLinkedinUrl(
      pick(fields, FIELD_ALIASES.linkedinUrl),
    );
    let linkedinId = normalizeLinkedinId(
      pick(fields, FIELD_ALIASES.linkedinId),
    );
    if (!linkedinId && linkedinUrl) {
      linkedinId = linkedinIdFromUrl(linkedinUrl);
    }
    if (!linkedinUrl && pick(fields, FIELD_ALIASES.linkedinUrl)) {
      warningCodes.push('invalid_linkedin_url');
    }

    let fullName = cleanPublic(
      pick(fields, FIELD_ALIASES.fullName),
      'name',
      255,
    );
    let firstName = cleanPublic(
      pick(fields, FIELD_ALIASES.firstName),
      'name',
      120,
    );
    let lastName = cleanPublic(
      pick(fields, FIELD_ALIASES.lastName),
      'name',
      120,
    );

    if (!fullName && (firstName || lastName)) {
      fullName = cleanPublic(
        [firstName, lastName].filter(Boolean).join(' '),
        'name',
        255,
      );
    }
    if (fullName && !firstName && !lastName) {
      const parts = fullName.split(' ');
      firstName = parts.shift() ?? null;
      lastName = parts.length > 0 ? parts.join(' ') : null;
    }

    const industry = cleanPublic(
      pick(fields, FIELD_ALIASES.industry),
      'industry',
      255,
    );
    let jobTitle = cleanPublic(
      pick(fields, FIELD_ALIASES.jobTitle),
      'job_title',
      255,
    );
    const jobTitleRole = cleanPublic(
      pick(fields, FIELD_ALIASES.jobTitleRole),
      'job_title',
      255,
    );
    const currentCompanyName = normalizeCompanyName(
      pick(fields, FIELD_ALIASES.currentCompanyName),
    );
    const locationName = cleanPublic(
      pick(fields, FIELD_ALIASES.locationName),
      'location',
      255,
    );
    const country = normalizeCountry(pick(fields, FIELD_ALIASES.country));
    const summary = cleanPublic(pick(fields, FIELD_ALIASES.summary), 'summary');
    const inferredYearsExperience = normalizeYears(
      pick(fields, FIELD_ALIASES.inferredYearsExperience),
    );
    const skillsResult = normalizeSkills(pick(fields, FIELD_ALIASES.skills));
    const experienceResult = normalizeStructured(
      pick(fields, FIELD_ALIASES.experience),
      EXPERIENCE_FIELDS,
    );
    const educationResult = normalizeStructured(
      pick(fields, FIELD_ALIASES.education),
      EDUCATION_FIELDS,
    );
    const sourceUpdatedAt = normalizeDate(
      pick(fields, FIELD_ALIASES.sourceUpdatedAt),
    );

    addInvalidWarning(
      warningCodes,
      fields,
      FIELD_ALIASES.jobTitle,
      'job_title',
      'invalid_job_title',
    );
    addInvalidWarning(
      warningCodes,
      fields,
      FIELD_ALIASES.currentCompanyName,
      'company',
      'invalid_company_name',
    );
    addInvalidWarning(
      warningCodes,
      fields,
      FIELD_ALIASES.locationName,
      'location',
      'invalid_location',
    );
    const rawCountry = pick(fields, FIELD_ALIASES.country);
    if (rawCountry?.trim() && !country) warningCodes.push('invalid_country');
    addInvalidWarning(
      warningCodes,
      fields,
      FIELD_ALIASES.summary,
      'summary',
      'invalid_summary',
    );
    if (skillsResult.invalid) warningCodes.push('invalid_skills');

    if (experienceResult.warning) {
      warningCodes.push('invalid_experience');
    }
    if (educationResult.warning) {
      warningCodes.push('invalid_education');
    }

    if (!jobTitle) {
      jobTitle = currentTitleFromExperience(
        pick(fields, FIELD_ALIASES.experience),
      );
    }

    const sourceKey = createSourceKey({
      linkedinId,
      linkedinUrl,
      fullName,
      jobTitle,
      currentCompanyName,
      locationName,
      country,
    });

    if (!sourceKey) {
      return {
        profile: null,
        warningCodes,
        rejectionCode: 'missing_stable_identity',
      };
    }

    const profile: NormalizedProfile = {
      sourceKey,
      linkedinId,
      linkedinUrl,
      fullName,
      firstName,
      lastName,
      industry,
      jobTitle,
      jobTitleRole,
      currentCompanyName,
      locationName,
      country,
      summary,
      inferredYearsExperience,
      skills: skillsResult.value,
      experience: experienceResult.value,
      education: educationResult.value,
      sourceUpdatedAt,
    };

    return { profile, warningCodes };
  }
}

function normalizedFieldMap(
  record: DatasetRecord,
): ReadonlyMap<string, string> {
  const fields = new Map<string, string>();
  for (const [header, value] of Object.entries(record)) {
    const normalizedHeader = normalizeFieldName(header);
    if (!fields.has(normalizedHeader)) {
      fields.set(normalizedHeader, value);
    }
  }
  return fields;
}

function normalizeFieldName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function pick(
  fields: ReadonlyMap<string, string>,
  aliases: readonly string[],
): string | undefined {
  for (const alias of aliases) {
    const value = fields.get(normalizeFieldName(alias));
    if (value !== undefined && value.trim() !== '') {
      return value;
    }
  }
  return undefined;
}

function clean(
  value: string | null | undefined,
  maxLength?: number,
): string | null {
  if (!value) {
    return null;
  }
  const cleaned = value.replace(/\s+/g, ' ').trim();
  if (!cleaned) {
    return null;
  }
  return maxLength ? cleaned.slice(0, maxLength) : cleaned;
}

function normalizeLinkedinId(value: string | undefined): string | null {
  const cleaned = clean(value, 255);
  if (!cleaned) {
    return null;
  }
  const fromUrl = normalizeLinkedinUrl(cleaned);
  const normalized = fromUrl ? linkedinIdFromUrl(fromUrl) : cleaned;
  return normalized?.toLowerCase() ?? null;
}

function normalizeLinkedinUrl(value: string | undefined): string | null {
  const cleaned = clean(value);
  if (!cleaned) {
    return null;
  }

  try {
    const url = new URL(
      /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`,
    );
    const hostname = url.hostname.toLowerCase();
    if (hostname !== 'linkedin.com' && !hostname.endsWith('.linkedin.com')) {
      return null;
    }
    url.protocol = 'https:';
    url.hostname = hostname;
    url.search = '';
    url.hash = '';
    url.pathname = url.pathname.replace(/\/+$/, '');
    return url.toString();
  } catch {
    return null;
  }
}

function linkedinIdFromUrl(url: string): string | null {
  const segments = new URL(url).pathname.split('/').filter(Boolean);
  return segments.at(-1)?.toLowerCase() ?? null;
}

function normalizeCompanyName(value: string | undefined): string | null {
  const cleaned = cleanPublic(value, 'company', 255);
  if (!cleaned) {
    return null;
  }
  return cleaned;
}

function normalizeCountry(value: string | undefined): string | null {
  const country = cleanPublic(value, 'country', 120);
  if (!country || (!isCountryName(country) && !/^[A-Za-z]{2}$/.test(country))) {
    return null;
  }
  return country?.length === 2 ? country.toUpperCase() : country;
}

function normalizeYears(value: string | undefined): number | null {
  const cleaned = clean(value);
  if (!cleaned || !/^\d+(?:\.\d+)?$/.test(cleaned)) {
    return null;
  }
  const years = Number(cleaned);
  return Number.isFinite(years) && years >= 0 && years <= 100 ? years : null;
}

function normalizeSkills(value: string | undefined): {
  value: string[];
  invalid: boolean;
} {
  const cleaned = clean(value);
  if (!cleaned) {
    return { value: [], invalid: false };
  }

  let candidates: unknown[] | null = null;
  const parsedSkills = parseStructuredValue(cleaned);
  if (parsedSkills.success && Array.isArray(parsedSkills.value)) {
    candidates = parsedSkills.value;
  }

  const rawSkills =
    candidates ?? cleaned.replace(/^\[|\]$/g, '').split(/[,;|]/);
  const unique = new Map<string, string>();
  let invalid = false;
  for (const candidate of rawSkills) {
    const raw =
      typeof candidate === 'string'
        ? candidate
        : isPlainObject(candidate) && typeof candidate.name === 'string'
          ? candidate.name
          : '';
    const skill = cleanPublic(raw.replace(/^['"]|['"]$/g, ''), 'skill', 120);
    if (!skill && raw.trim()) invalid = true;
    if (skill && !unique.has(skill.toLowerCase()) && unique.size < 100) {
      unique.set(skill.toLowerCase(), skill);
    }
  }
  return { value: [...unique.values()], invalid };
}

function normalizeStructured(
  value: string | undefined,
  allowedFields: ReadonlySet<string>,
): { value: SafeJsonObject[] | null; warning: boolean } {
  const cleaned = clean(value);
  if (!cleaned) {
    return { value: null, warning: false };
  }

  const parsed = parseStructuredValue(cleaned);
  if (!parsed.success) {
    return { value: null, warning: true };
  }

  const items = Array.isArray(parsed.value) ? parsed.value : [parsed.value];
  const sanitized = items
    .map((item) => sanitizeStructuredItem(item, allowedFields))
    .filter((item): item is SafeJsonObject => item !== null);
  return { value: sanitized.length > 0 ? sanitized : null, warning: false };
}

function sanitizeStructuredItem(
  value: unknown,
  allowedFields: ReadonlySet<string>,
): SafeJsonObject | null {
  if (!isPlainObject(value)) {
    return null;
  }
  const sanitized: SafeJsonObject = {};
  for (const [key, fieldValue] of Object.entries(value)) {
    const normalizedKey = normalizeFieldName(key);
    if (!allowedFields.has(normalizedKey)) {
      continue;
    }
    if (
      typeof fieldValue !== 'string' &&
      typeof fieldValue !== 'number' &&
      typeof fieldValue !== 'boolean'
    ) {
      continue;
    }
    const normalizedValue = clean(String(fieldValue));
    const guardKind = structuredFieldKind(normalizedKey);
    if (
      normalizedValue &&
      (!guardKind || !publicValueIssue(normalizedValue, guardKind))
    ) {
      sanitized[normalizedKey] = normalizedValue;
    }
  }
  return Object.keys(sanitized).length > 0 ? sanitized : null;
}

function structuredFieldKind(key: string): PublicFieldKind | null {
  if (key === 'title') return 'job_title';
  if (key === 'company' || key === 'companyname') return 'company';
  if (key === 'location') return 'location';
  if (key === 'description') return 'summary';
  if (
    key === 'school' ||
    key === 'schoolname' ||
    key === 'degree' ||
    key === 'fieldofstudy'
  )
    return 'industry';
  return null;
}

function normalizeDate(value: string | undefined): Date | null {
  const cleaned = clean(value);
  if (!cleaned) {
    return null;
  }
  const date = new Date(cleaned);
  const maximumYear = new Date().getUTCFullYear() + 1;
  return Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() < 1900 ||
    date.getUTCFullYear() > maximumYear
    ? null
    : date;
}

function cleanPublic(
  value: string | null | undefined,
  field: PublicFieldKind,
  maxLength?: number,
): string | null {
  const cleaned = clean(value, maxLength);
  if (!cleaned || publicValueIssue(cleaned, field)) return null;
  return cleaned;
}
function addInvalidWarning(
  warnings: string[],
  fields: ReadonlyMap<string, string>,
  aliases: readonly string[],
  field: PublicFieldKind,
  code: string,
): void {
  const raw = pick(fields, aliases);
  if (
    raw !== undefined &&
    raw.trim() !== '' &&
    cleanPublic(raw, field) === null
  )
    warnings.push(code);
}

function currentTitleFromExperience(value: string | undefined): string | null {
  if (!value) return null;
  const parsed = parseStructuredValue(value);
  if (!parsed.success || !Array.isArray(parsed.value)) return null;
  const candidates = parsed.value.flatMap(
    (entry): Array<{ title: string; explicit: boolean }> => {
      if (!isPlainObject(entry)) return [];
      const title =
        typeof entry.title === 'string'
          ? cleanPublic(entry.title, 'job_title', 255)
          : null;
      if (!title) return [];
      const explicitlyCurrent =
        entry.is_primary === true ||
        entry.is_current === true ||
        entry.current === true ||
        entry.primary === true;
      const noEndDate =
        entry.end_date === null ||
        entry.end_date === undefined ||
        entry.end_date === '';
      return explicitlyCurrent || noEndDate
        ? [{ title, explicit: explicitlyCurrent }]
        : [];
    },
  );
  const explicit = candidates.filter((candidate) => candidate.explicit);
  return uniqueTitle(explicit.length > 0 ? explicit : candidates);
}

function uniqueTitle(
  candidates: ReadonlyArray<{ title: string }>,
): string | null {
  const unique = new Map<string, string>();
  for (const candidate of candidates)
    unique.set(candidate.title.toLocaleLowerCase(), candidate.title);
  return unique.size === 1 ? ([...unique.values()][0] ?? null) : null;
}

function createSourceKey(fields: {
  linkedinId: string | null;
  linkedinUrl: string | null;
  fullName: string | null;
  jobTitle: string | null;
  currentCompanyName: string | null;
  locationName: string | null;
  country: string | null;
}): string | null {
  if (fields.linkedinId) {
    return hashedSourceKey('linkedin-id', fields.linkedinId);
  }
  if (fields.linkedinUrl) {
    return hashedSourceKey('linkedin-url', fields.linkedinUrl.toLowerCase());
  }
  if (
    !fields.fullName ||
    ![
      fields.jobTitle,
      fields.currentCompanyName,
      fields.locationName,
      fields.country,
    ].some(Boolean)
  ) {
    return null;
  }
  const fingerprint = [
    fields.fullName,
    fields.jobTitle,
    fields.currentCompanyName,
    fields.locationName,
    fields.country,
  ]
    .map((value) => value?.toLowerCase() ?? '')
    .join('\u0000');
  return hashedSourceKey('professional', fingerprint);
}

function hashedSourceKey(namespace: string, value: string): string {
  const digest = createHash('sha256')
    .update(`${namespace}\u0000${value}`)
    .digest('hex');
  return `${namespace}:${digest}`;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
