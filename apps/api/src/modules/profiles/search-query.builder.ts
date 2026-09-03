import { BadRequestException } from '@nestjs/common';
import type { SearchProfilesQuery } from './dto/search-profiles.query';
export const MAX_RESULT_WINDOW = 1000;
const SEARCH_FIELDS = [
  'fullName^5',
  'jobTitle^4',
  'skills^4',
  'currentCompanyName^3',
  'industry^2',
  'locationName^2',
  'country^2',
  'summary',
] as const;
const PREFIX_FIELDS = [
  'fullName^6',
  'jobTitle^5',
  'currentCompanyName^4',
] as const;

export function buildSearchQuery(alias: string, query: SearchProfilesQuery) {
  const skills = [
    ...new Set(
      (query.skills ?? [])
        .map((s) => s.trim().toLocaleLowerCase())
        .filter(Boolean),
    ),
  ];
  if (skills.length > 10)
    throw new BadRequestException('At most 10 skills are allowed');
  const from = (query.page - 1) * query.limit;
  if (from + query.limit > MAX_RESULT_WINDOW)
    throw new BadRequestException(
      'Requested page exceeds the supported result window',
    );
  const filters = [
    // Each skill is required: multiple skills deliberately use AND semantics.
    ...skills.map((skill) => ({ term: { 'skills.keyword': skill } })),
    ...(query.jobTitle
      ? [
          {
            match: {
              jobTitle: {
                query: query.jobTitle.trim(),
                operator: 'and',
                fuzziness: 'AUTO:4,8',
                prefix_length: 1,
              },
            },
          },
        ]
      : []),
    ...(query.industry
      ? [
          {
            match: {
              industry: {
                query: query.industry.trim(),
                operator: 'and',
                fuzziness: 'AUTO:4,8',
                prefix_length: 1,
              },
            },
          },
        ]
      : []),
  ];
  const keyword = query.q?.trim();
  const body = keyword
    ? {
        bool: {
          must: [
            {
              bool: {
                should: [
                  {
                    multi_match: {
                      query: keyword,
                      fields: SEARCH_FIELDS,
                      operator: 'and',
                      fuzziness: 'AUTO:4,8',
                      prefix_length: 1,
                    },
                  },
                  {
                    multi_match: {
                      query: keyword,
                      fields: PREFIX_FIELDS,
                      type: 'phrase_prefix',
                    },
                  },
                ],
                minimum_should_match: 1,
              },
            },
          ],
          should: [
            {
              multi_match: {
                query: keyword,
                fields: SEARCH_FIELDS,
                type: 'phrase',
                boost: 2,
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
