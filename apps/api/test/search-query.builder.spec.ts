import { BadRequestException } from '@nestjs/common';
import { buildSearchQuery } from '../src/modules/profiles/search-query.builder';
describe('buildSearchQuery', () => {
  const base = { page: 1, limit: 20 };
  it('builds keyword relevance search against alias', () => {
    const result = buildSearchQuery('profiles', { ...base, q: 'engineer' });
    expect(result.index).toBe('profiles');
    expect(result.query).toMatchObject({
      bool: { must: [{ multi_match: { query: 'engineer' } }] },
    });
    expect(result.sort[0]).toEqual({ _score: 'desc' });
  });
  it('uses AND exact skill filters and deterministic sorting', () => {
    const result = buildSearchQuery('profiles', {
      ...base,
      skills: ['TypeScript', 'PostgreSQL'],
      jobTitle: 'Engineer',
    });
    expect(result.query).toMatchObject({
      bool: {
        filter: [
          { term: { 'skills.keyword': 'TypeScript' } },
          { term: { 'skills.keyword': 'PostgreSQL' } },
          { term: { 'jobTitle.keyword': 'Engineer' } },
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
