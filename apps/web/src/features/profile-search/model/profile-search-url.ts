import type { ProfileSearchParams } from './profile-search-params';
export function parseProfileSearchParams(
  input: URLSearchParams,
): ProfileSearchParams {
  const q = (input.get('q') ?? '').trim();
  const jobTitle = (input.get('jobTitle') ?? '').trim();
  const industry = (input.get('industry') ?? '').trim();
  const skills = normalizeSkills((input.get('skills') ?? '').split(','));
  const page = positive(input.get('page'), 1);
  const limit = Math.min(10, positive(input.get('limit'), 10));
  return { q, skills, jobTitle, industry, page, limit };
}
export function serializeProfileSearchParams(
  params: ProfileSearchParams,
): string {
  const p = new URLSearchParams();
  if (params.q) p.set('q', params.q);
  if (params.skills.length)
    p.set('skills', normalizeSkills(params.skills).join(','));
  if (params.jobTitle) p.set('jobTitle', params.jobTitle);
  if (params.industry) p.set('industry', params.industry);
  if (params.page !== 1) p.set('page', String(params.page));
  if (params.limit !== 10) p.set('limit', String(params.limit));
  return p.toString();
}
function normalizeSkills(values: string[]): string[] {
  const unique = new Map<string, string>();
  for (const value of values) {
    const skill = value.trim();
    if (skill && !unique.has(skill.toLocaleLowerCase())) {
      unique.set(skill.toLocaleLowerCase(), skill);
    }
  }
  return [...unique.values()].slice(0, 10).sort((a, b) => a.localeCompare(b));
}
export function withSearchChange(
  params: ProfileSearchParams,
  change: Partial<ProfileSearchParams>,
): ProfileSearchParams {
  const resets =
    change.q !== undefined ||
    change.skills !== undefined ||
    change.jobTitle !== undefined ||
    change.industry !== undefined;
  return {
    ...params,
    ...change,
    page: resets ? 1 : (change.page ?? params.page),
  };
}
function positive(value: string | null, fallback: number) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}
