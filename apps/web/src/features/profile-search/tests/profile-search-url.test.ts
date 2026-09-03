import { describe, expect, it } from 'vitest';
import {
  parseProfileSearchParams,
  serializeProfileSearchParams,
  withSearchChange,
} from '../model/profile-search-url';
describe('profile search URL state', () => {
  it('normalizes and serializes deterministically', () => {
    const value = parseProfileSearchParams(
      new URLSearchParams(
        'q= engineer &skills=PostgreSQL, TypeScript,PostgreSQL&jobTitle= Engineer &industry= Technology &page=no&limit=99',
      ),
    );
    expect(value).toEqual({
      q: 'engineer',
      skills: ['PostgreSQL', 'TypeScript'],
      jobTitle: 'Engineer',
      industry: 'Technology',
      page: 1,
      limit: 10,
    });
    expect(serializeProfileSearchParams(value)).toBe(
      'q=engineer&skills=PostgreSQL%2CTypeScript&jobTitle=Engineer&industry=Technology',
    );
  });
  it('resets page when query changes', () =>
    expect(
      withSearchChange(
        { ...parseProfileSearchParams(new URLSearchParams('page=3')) },
        { q: 'x' },
      ).page,
    ).toBe(1));
});
