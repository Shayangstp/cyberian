import { BadRequestException } from '@nestjs/common';
import { buildSearchQuery } from '../src/modules/profiles/search-query.builder';
describe('buildSearchQuery', () => {
  const base = { page: 1, limit: 20 };
  it('builds keyword relevance search against alias', () => {
    const result = buildSearchQuery('profiles', { ...base, q: 'engineer' });
    expect(result.index).toBe('profiles');
    expect(result.query).toMatchObject({
      bool: {
        must: [
          {
            bool: {
              minimum_should_match: 1,
              should: [
                {
                  multi_match: {
                    query: 'engineer',
                    operator: 'and',
                    fuzziness: 'AUTO:4,8',
                  },
                },
                {
                  multi_match: {
                    query: 'engineer',
                    type: 'phrase_prefix',
                  },
                },
              ],
            },
          },
        ],
        should: [
          {
            multi_match: {
              query: 'engineer',
              type: 'phrase',
              boost: 2,
            },
          },
        ],
      },
    });
    expect(JSON.stringify(result.query)).toContain('locationName^2');
    expect(JSON.stringify(result.query)).toContain('country^2');
    expect(result.sort[0]).toEqual({ _score: 'desc' });
  });
  it('keeps short terms exact while allowing intentional prefixes', () => {
    const result = buildSearchQuery('profiles', { ...base, q: 'sam' });
    const serialized = JSON.stringify(result.query);
    expect(serialized).toContain('"fuzziness":"AUTO:4,8"');
    expect(serialized).toContain('"type":"phrase_prefix"');
    expect(serialized).toContain('fullName^6');
    expect(serialized).not.toContain('skills^6');
  });
  it('requires every word in a multi-word keyword', () => {
    const result = buildSearchQuery('profiles', {
      ...base,
      q: 'software engineer',
    });
    expect(JSON.stringify(result.query)).toContain('"operator":"and"');
  });
  it('uses case-insensitive AND skill filters and partial title matching', () => {
    const result = buildSearchQuery('profiles', {
      ...base,
      skills: ['TypeScript', 'PostgreSQL'],
      jobTitle: 'Engineer',
    });
    expect(result.query).toMatchObject({
      bool: {
        filter: [
          { term: { 'skills.keyword': 'typescript' } },
          { term: { 'skills.keyword': 'postgresql' } },
          { match: { jobTitle: { query: 'Engineer', operator: 'and' } } },
        ],
      },
    });
    expect(result.sort).toEqual([{ 'fullName.keyword': 'asc' }, { id: 'asc' }]);
  });
  it('uses match all and rejects result-window overflow', () => {
    expect(buildSearchQuery('profiles', base).query).toEqual({ match_all: {} });
    expect(() =>
      buildSearchQuery('profiles', { page: 100, limit: 50 }),
    ).toThrow(BadRequestException);
  });
});
