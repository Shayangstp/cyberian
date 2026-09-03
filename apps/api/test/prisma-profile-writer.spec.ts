import type { NormalizedProfile } from '../src/data/dataset.types';
import { profilesMatch, toPrismaData } from '../src/data/prisma-profile-writer';

describe('Prisma profile replacement data', () => {
  it('overwrites previously corrupted values with nulls and an empty skill array', () => {
    const incoming: NormalizedProfile = {
      sourceKey: 'linkedin-id:synthetic',
      linkedinId: 'synthetic',
      linkedinUrl: null,
      fullName: 'Synthetic Person',
      firstName: 'Synthetic',
      lastName: 'Person',
      industry: null,
      jobTitle: null,
      jobTitleRole: null,
      currentCompanyName: null,
      locationName: null,
      country: null,
      summary: null,
      inferredYearsExperience: null,
      skills: [],
      experience: null,
      education: null,
      sourceUpdatedAt: null,
    };
    const old = {
      ...incoming,
      jobTitle: "['manager']",
      currentCompanyName: '201-500',
      country: '2020-12-01',
      skills: ['person@example.invalid'],
    };
    expect(profilesMatch(old, incoming)).toBe(false);
    expect(toPrismaData(incoming, new Date(0))).toMatchObject({
      jobTitle: null,
      currentCompanyName: null,
      country: null,
      skills: [],
    });
  });
});
