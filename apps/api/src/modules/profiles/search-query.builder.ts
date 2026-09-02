import { BadRequestException } from '@nestjs/common';
import type { SearchProfilesQuery } from './dto/search-profiles.query';
export const MAX_RESULT_WINDOW = 1000;
export function buildSearchQuery(alias: string, query: SearchProfilesQuery) {
  const skills = [
    ...new Set((query.skills ?? []).map((s) => s.trim()).filter(Boolean)),
  ];
  if (skills.length > 10)
    throw new BadRequestException('At most 10 skills are allowed');
  const from = (query.page - 1) * query.limit;
  if (from + query.limit > MAX_RESULT_WINDOW)
    throw new BadRequestException(
      'Requested page exceeds the supported result window',
    );
  const filters = [
    ...skills.map((skill) => ({ term: { 'skills.keyword': skill } })),
    ...(query.jobTitle
      ? [{ term: { 'jobTitle.keyword': query.jobTitle } }]
      : []),
  ];
  const body = query.q
    ? {
        bool: {
          must: [
            {
              multi_match: {
                query: query.q,
                fields: [
                  'fullName^5',
                  'jobTitle^4',
                  'skills^4',
                  'currentCompanyName^3',
                  'industry^2',
                  'summary',
                ],
                fuzziness: 'AUTO',
              },
            },
          ],
          filter: filters,
        },
      }
    : filters.length
      ? { bool: { filter: filters } }
      : { match_all: {} };
  return {
    index: alias,
    from,
    size: query.limit,
    track_total_hits: true,
    query: body,
    sort: query.q
      ? [{ _score: 'desc' }, { 'fullName.keyword': 'asc' }, { id: 'asc' }]
      : [{ 'fullName.keyword': 'asc' }, { id: 'asc' }],
  };
}
