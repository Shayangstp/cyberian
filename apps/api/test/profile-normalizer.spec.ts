import { ProfileNormalizer } from '../src/data/profile-normalizer';

describe('ProfileNormalizer', () => {
  const normalizer = new ProfileNormalizer();

  it('normalizes whitelisted professional fields and excludes sensitive fields', () => {
    const result = normalizer.normalize({
      linkedin_id: ' Example-ID ',
      full_name: '  Example   Person  ',
      job_title: '  Principal Engineer ',
      industry: ' Software ',
      current_company_name: ' Example Company ',
      location: ' Example City ',
      country_code: 'us',
      years_experience: '12.5',
      skills: '["TypeScript", "typescript", " SQL "]',
      experience:
        "[{'title':'Engineer','company':'Example Company','email':'private@example.invalid',}]",
      education: '[{"school":"Example University","degree":"Degree"}]',
      email: 'private@example.invalid',
      phone_number: '000-000-0000',
      street_address: 'Private address',
      birth_date: '2000-01-01',
      facebook_id: 'private-social-id',
    });

    expect(result.profile).toMatchObject({
      linkedinId: 'example-id',
      fullName: 'Example Person',
      firstName: 'Example',
      lastName: 'Person',
      jobTitle: 'Principal Engineer',
      industry: 'Software',
      currentCompanyName: 'Example Company',
      locationName: 'Example City',
      country: 'US',
      inferredYearsExperience: 12.5,
      skills: ['TypeScript', 'SQL'],
    });
    expect(result.profile?.experience).toEqual([
      { title: 'Engineer', company: 'Example Company' },
    ]);

    const persistenceObject = JSON.stringify(result.profile);
    expect(persistenceObject).not.toContain('private@example.invalid');
    expect(persistenceObject).not.toContain('000-000-0000');
    expect(persistenceObject).not.toContain('Private address');
    expect(persistenceObject).not.toContain('private-social-id');
    expect(persistenceObject).not.toContain('birth_date');
  });

  it('uses deterministic identifiers and a professional fallback fingerprint', () => {
    const identified = { linkedin_id: 'same-id', job_title: 'Engineer' };
    const first = normalizer.normalize(identified);
    const second = normalizer.normalize(identified);
    expect(first.profile?.sourceKey).toBe(second.profile?.sourceKey);
    expect(first.profile?.sourceKey).toMatch(/^linkedin-id:[a-f0-9]{64}$/);

    const fallback = normalizer.normalize({
      full_name: 'Synthetic Person',
      job_title: 'Engineer',
      current_company_name: 'Synthetic Company',
    });
    expect(fallback.profile?.sourceKey).toMatch(/^professional:[a-f0-9]{64}$/);
  });

  it('maps empty and invalid optional values safely', () => {
    const result = normalizer.normalize({
      linkedin_id: 'synthetic-id',
      full_name: '   ',
      years_experience: 'many years',
      experience: 'not-json',
      education: '',
      skills: '',
      source_updated_at: '54016',
    });

    expect(result.profile).toMatchObject({
      fullName: null,
      inferredYearsExperience: null,
      experience: null,
      education: null,
      skills: [],
      sourceUpdatedAt: null,
    });
    expect(result.warningCodes).toContain('invalid_experience');
  });

  it('accepts Python literals while retaining only allowed structured fields', () => {
    const result = normalizer.normalize({
      linkedin_id: 'synthetic-python-literal-id',
      experience:
        "[{'title':'Engineer','company':'Example','end_date':None,'email':'private@example.invalid','phone':'000-000-0000','description':'None of these'}]",
    });

    expect(result.warningCodes).not.toContain('invalid_experience');
    expect(result.profile?.experience).toEqual([
      {
        title: 'Engineer',
        company: 'Example',
        description: 'None of these',
      },
    ]);
    expect(JSON.stringify(result.profile?.experience)).not.toContain(
      'private@example.invalid',
    );
    expect(JSON.stringify(result.profile?.experience)).not.toContain(
      '000-000-0000',
    );
    expect(JSON.stringify(result.profile?.experience)).not.toContain('enddate');
  });
});
