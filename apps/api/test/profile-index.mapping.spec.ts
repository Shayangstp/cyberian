import { profileIndexMapping } from '../src/search/profile-index.mapping';
describe('profile index mapping', () => {
  it('is strict and private-field free', () => {
    const p = profileIndexMapping.mappings.properties;
    expect(profileIndexMapping.mappings.dynamic).toBe('strict');
    expect(p.skills).toMatchObject({
      type: 'text',
      fields: { keyword: { type: 'keyword' } },
    });
    expect(p.inferredYearsExperience).toEqual({ type: 'float' });
    expect(p.sourceUpdatedAt).toEqual({ type: 'date' });
    expect(p).not.toHaveProperty('email');
    expect(p).not.toHaveProperty('phone');
  });
});
