import type { Profile } from '@prisma/client';
import { mapProfileToSearchDocument } from '../src/search/profile-document.mapper';
import { expectNoPublicPii } from './public-response-pii.assertion';

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    sourceKey: 'linkedin-id:synthetic',
    linkedinId: 'synthetic',
    linkedinUrl: 'https://www.linkedin.com/in/synthetic',
    fullName: 'Synthetic Person',
    firstName: 'Synthetic',
    lastName: 'Person',
    industry: 'Software',
    jobTitle: 'Engineer',
    jobTitleRole: null,
    currentCompanyName: 'Synthetic Company',
    locationName: 'Synthetic City, Example Region',
    country: 'Canada',
    summary: 'Synthetic professional summary',
    inferredYearsExperience: 5,
    skills: ['TypeScript'],
    experience: null,
    education: null,
    sourceUpdatedAt: null,
    importedAt: new Date(0),
    createdAt: new Date(0),
    updatedAt: new Date(0),
    ...overrides,
  };
}

describe('profile search document privacy', () => {
  it('indexes only whitelisted clean fields and omits persistence metadata', () => {
    const document = mapProfileToSearchDocument(profile());
    expect(document).not.toHaveProperty('sourceKey');
    expect(document).not.toHaveProperty('linkedinId');
    expect(document).not.toHaveProperty('importedAt');
    expectNoPublicPii(document);
  });

  it('refuses to produce a document containing PII-like values', () => {
    expect(() =>
      mapProfileToSearchDocument(
        profile({
          experience: [{ location: '123 Example Street' }],
        }),
      ),
    ).toThrow('Unsafe public profile document');
  });
});
