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
const EXPERIENCE_FIELDS = [
  'experience.title^4',
  'experience.company^3',
  'experience.companyname^3',
] as const;
const EXPERIENCE_TITLE_FIELDS = ['experience.title'] as const;

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
    ...(query.jobTitle?.trim()
      ? [
          {
            bool: {
              should: [
                controlledTextFilter(normalizeWhitespace(query.jobTitle), [
                  'jobTitle',
                ]),
                nestedTextFilter(
                  normalizeWhitespace(query.jobTitle),
                  EXPERIENCE_TITLE_FIELDS,
                ),
              ],
              minimum_should_match: 1,
            },
          },
        ]
      : []),
    ...(query.industry?.trim()
      ? [
          controlledTextFilter(normalizeWhitespace(query.industry), [
            'industry',
          ]),
        ]
      : []),
  ];
  const keyword = query.q ? normalizeWhitespace(query.q) : '';
  const body = keyword
    ? {
        bool: {
          must: [
            {
              bool: {
                should: [
                  tokenMatch(keyword, SEARCH_FIELDS),
                  prefixMatch(keyword, PREFIX_FIELDS),
                  nestedKeywordMatch(keyword),
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
                boost: 6,
              },
            },
            {
              nested: {
                path: 'experience',
                score_mode: 'max',
                query: {
                  multi_match: {
                    query: keyword,
                    fields: EXPERIENCE_FIELDS,
                    type: 'phrase',
                    boost: 6,
                  },
                },
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
    ...(keyword
      ? {
          highlight: {
            fields: {
              skills: { number_of_fragments: 0 },
              summary: { fragment_size: 240, number_of_fragments: 1 },
            },
          },
        }
      : {}),
    query: body,
    sort: query.q
      ? [{ _score: 'desc' }, { 'fullName.keyword': 'asc' }, { id: 'asc' }]
      : [{ 'fullName.keyword': 'asc' }, { id: 'asc' }],
  };
}

function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function supportsFuzziness(value: string): boolean {
  return value.split(' ').every((term) => term.length >= 4);
}

function tokenMatch(query: string, fields: readonly string[]) {
  return {
    multi_match: {
      query,
      fields,
      operator: 'and',
      boost: 2,
      ...(supportsFuzziness(query)
        ? { fuzziness: 'AUTO:4,8', prefix_length: 2 }
        : {}),
    },
  };
}

function prefixMatch(query: string, fields: readonly string[]) {
  return {
    multi_match: {
      query,
      fields,
      type: 'bool_prefix',
      operator: 'and',
    },
  };
}

function nestedKeywordMatch(query: string) {
  return {
    nested: {
      path: 'experience',
      score_mode: 'max',
      query: {
        bool: {
          should: [
            tokenMatch(query, EXPERIENCE_FIELDS),
            prefixMatch(query, EXPERIENCE_FIELDS),
          ],
          minimum_should_match: 1,
        },
      },
    },
  };
}

function controlledTextFilter(query: string, fields: readonly string[]) {
  return {
    bool: {
      should: [
        {
          multi_match: {
            query,
            fields,
            operator: 'and',
          },
        },
        prefixMatch(query, fields),
      ],
      minimum_should_match: 1,
    },
  };
}

function nestedTextFilter(query: string, fields: readonly string[]) {
  return {
    nested: {
      path: 'experience',
      query: controlledTextFilter(query, fields),
    },
  };
}
