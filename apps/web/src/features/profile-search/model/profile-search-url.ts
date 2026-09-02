import type { ProfileSearchParams } from './profile-search-params';
export function parseProfileSearchParams(
  input: URLSearchParams,
): ProfileSearchParams {
  const q = (input.get('q') ?? '').trim();
  const jobTitle = (input.get('jobTitle') ?? '').trim();
  const skills = [
    ...new Set(
      (input.get('skills') ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b));
  const page = positive(input.get('page'), 1);
  const limit = Math.min(50, positive(input.get('limit'), 20));
  return { q, skills, jobTitle, page, limit };
}
export function serializeProfileSearchParams(
  params: ProfileSearchParams,
): string {
  const p = new URLSearchParams();
  if (params.q) p.set('q', params.q);
  if (params.skills.length)
    p.set(
      'skills',
      [...new Set(params.skills)].sort((a, b) => a.localeCompare(b)).join(','),
    );
  if (params.jobTitle) p.set('jobTitle', params.jobTitle);
  if (params.page !== 1) p.set('page', String(params.page));
  if (params.limit !== 20) p.set('limit', String(params.limit));
  return p.toString();
}
export function withSearchChange(
  params: ProfileSearchParams,
  change: Partial<ProfileSearchParams>,
): ProfileSearchParams {
  const resets =
    change.q !== undefined ||
    change.skills !== undefined ||
    change.jobTitle !== undefined;
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
