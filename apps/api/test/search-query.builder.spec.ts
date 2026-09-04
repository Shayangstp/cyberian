import { BadRequestException } from '@nestjs/common';
import { buildSearchQuery } from '../src/modules/profiles/search-query.builder';

type JsonObject = Record<string, unknown>;

describe('buildSearchQuery', () => {
  const base = { page: 1, limit: 10 };

  it('searches top-level and nested professional fields through the alias', () => {
    const result = buildSearchQuery('profiles', { ...base, q: 'engineer' });
    const matches = valuesForKey(result.query, 'multi_match');
    const nested = valuesForKey(result.query, 'nested');

    expect(result.index).toBe('profiles');
    expect(
      matches.some((clause) =>
        stringArray(clause.fields).includes('jobTitle^4'),
      ),
    ).toBe(true);
    expect(
      nested.some(
        (clause) =>
          clause.path === 'experience' &&
          valuesForKey(clause.query, 'multi_match').some((match) => {
            const fields = stringArray(match.fields);
            return (
              match.operator === 'and' &&
              fields.includes('experience.title^4') &&
              fields.includes('experience.company^3') &&
              fields.includes('experience.companyname^3')
            );
          }),
      ),
    ).toBe(true);
    expect(result.sort).toEqual([
      { _score: 'desc' },
      { 'fullName.keyword': 'asc' },
      { id: 'asc' },
    ]);
  });

  it('boosts exact top-level and nested phrases above token matches', () => {
    const result = buildSearchQuery('profiles', {
      ...base,
      q: 'software engineer',
    });
    const matches = valuesForKey(result.query, 'multi_match');
    const phrases = matches.filter((match) => match.type === 'phrase');
    const tokens = matches.filter(
      (match) => match.type === undefined && match.operator === 'and',
    );

    expect(phrases).toHaveLength(2);
    expect(phrases.every((match) => match.boost === 6)).toBe(true);
    expect(tokens.some((match) => match.boost === 2)).toBe(true);
  });

  it('requires every keyword while allowing the final word as a prefix', () => {
    const result = buildSearchQuery('profiles', { ...base, q: 'software eng' });
    const prefixes = valuesForKey(result.query, 'multi_match').filter(
      (match) => match.type === 'bool_prefix',
    );

    expect(prefixes.length).toBeGreaterThan(0);
    expect(
      prefixes.every(
        (match) => match.query === 'software eng' && match.operator === 'and',
      ),
    ).toBe(true);
  });

  it('uses intentional prefixes without fuzzy expansion for short keywords', () => {
    const result = buildSearchQuery('profiles', { ...base, q: 'sam' });
    const matches = valuesForKey(result.query, 'multi_match');

    expect(matches.some((match) => match.type === 'bool_prefix')).toBe(true);
    expect(matches.some((match) => 'fuzziness' in match)).toBe(false);
  });

  it('matches job title at the top level or in nested experience titles', () => {
    const result = buildSearchQuery('profiles', {
      ...base,
      jobTitle: 'software engineer',
    });
    const matches = valuesForKey(result.query, 'multi_match');
    const nested = valuesForKey(result.query, 'nested');

    expect(
      matches.some((match) => stringArray(match.fields).includes('jobTitle')),
    ).toBe(true);
    expect(
      nested.some(
        (clause) =>
          clause.path === 'experience' &&
          valuesForKey(clause.query, 'multi_match').some((match) =>
            stringArray(match.fields).includes('experience.title'),
          ),
      ),
    ).toBe(true);
    expect(matches.some((match) => match.type === 'bool_prefix')).toBe(true);
    expect(matches.some((match) => 'fuzziness' in match)).toBe(false);
  });

  it('uses deduplicated exact AND skills and controlled AND industry matching', () => {
    const result = buildSearchQuery('profiles', {
      ...base,
      skills: [' TypeScript ', 'PostgreSQL', 'typescript'],
      industry: '  Information   Technology  ',
    });
    const terms = valuesForKey(result.query, 'term');
    const industries = valuesForKey(result.query, 'multi_match').filter(
      (match) => stringArray(match.fields).includes('industry'),
    );

    expect(terms).toEqual([
      { 'skills.keyword': 'typescript' },
      { 'skills.keyword': 'postgresql' },
    ]);
    expect(industries).toHaveLength(2);
    expect(
      industries.every(
        (match) =>
          match.query === 'Information Technology' && match.operator === 'and',
      ),
    ).toBe(true);
    expect(industries.some((match) => match.type === 'bool_prefix')).toBe(true);
  });

  it('composes keyword and every filter without weakening criteria', () => {
    const result = buildSearchQuery('profiles', {
      ...base,
      q: 'senior engineer',
      skills: ['SQL', 'Leadership'],
      jobTitle: 'engineer',
      industry: 'technology',
    });
    const rootBool = objectValue(objectValue(result.query).bool);
    const filters = arrayValue(rootBool.filter);

    expect(arrayValue(rootBool.must)).toHaveLength(1);
    expect(filters).toHaveLength(4);
    expect(valuesForKey(filters, 'term')).toEqual([
      { 'skills.keyword': 'sql' },
      { 'skills.keyword': 'leadership' },
    ]);
    expect(result.index).toBe('profiles');
  });

  it('requests match highlights only for keyword searches', () => {
    const keyword = buildSearchQuery('profiles', { ...base, q: 'engineer' });
    const unfiltered = buildSearchQuery('profiles', base);

    expect(keyword.highlight).toEqual({
      fields: {
        skills: { number_of_fragments: 0 },
        summary: { fragment_size: 240, number_of_fragments: 1 },
      },
    });
    expect(unfiltered).not.toHaveProperty('highlight');
  });

  it('uses match all and rejects result-window overflow', () => {
    expect(buildSearchQuery('profiles', base).query).toEqual({ match_all: {} });
    expect(() =>
      buildSearchQuery('profiles', { page: 100, limit: 50 }),
    ).toThrow(BadRequestException);
  });
});

function valuesForKey(value: unknown, key: string): JsonObject[] {
  if (Array.isArray(value))
    return value.flatMap((child) => valuesForKey(child, key));
  if (!isObject(value)) return [];
  return [
    ...(key in value && isObject(value[key]) ? [value[key]] : []),
    ...Object.values(value).flatMap((child) => valuesForKey(child, key)),
  ];
}

function objectValue(value: unknown): JsonObject {
  if (!isObject(value)) throw new Error('Expected an object query node');
  return value;
}

function arrayValue(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error('Expected an array query node');
  return value;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
