import { ProfileNormalizer } from '../src/data/profile-normalizer';
import {
  adaptLinkedinProfileSource,
  LINKEDIN_PROFILE_SOURCE_HEADERS,
} from '../src/data/linkedin-profile-source-layout';

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

  it('maps the actual fixed source layout by documented position', () => {
    const row = Object.fromEntries(
      LINKEDIN_PROFILE_SOURCE_HEADERS.map((key) => [key, '']),
    );
    Object.assign(row, {
      linkedin_id: 'layout-id',
      full_name: 'Layout Person',
      first_name: 'Layout',
      last_name: 'Person',
      linkedin_url: 'linkedin.com/in/layout-person',
      industry: 'Software',
      job_title: 'Software Engineer',
      job_company_name: 'Example Systems',
      location_name: 'Example City',
      location_country: 'US',
      summary: 'Public professional summary',
      inferred_years_experience: '7',
      skills: "['TypeScript', 'SQL']",
      experience: "[{'title':'Software Engineer','company':'Example Systems'}]",
      education: "[{'school':'Example University','degree':'BS'}]",
      work_email: 'private@example.invalid',
      location_street_address: '100 Example Street',
      phone_numbers: '[]',
      emails: '[]',
      interests: '[]',
      location_names: '[]',
      regions: '[]',
      countries: '[]',
      street_addresses: '[]',
      profiles: '[]',
      certifications: '[]',
      languages: '[]',
      version_status: '{}',
    });
    const adapted = adaptLinkedinProfileSource(row);
    expect(adapted.rejectionCode).toBeUndefined();
    const result = normalizer.normalize(adapted.record ?? {});
    expect(result.profile).toMatchObject({
      fullName: 'Layout Person',
      jobTitle: 'Software Engineer',
      currentCompanyName: 'Example Systems',
      locationName: 'Example City',
      country: 'US',
      skills: ['TypeScript', 'SQL'],
    });
    expect(JSON.stringify(result.profile)).not.toContain(
      'private@example.invalid',
    );
    expect(JSON.stringify(result.profile)).not.toContain('100 Example Street');
  });

  it('nulls semantically shifted public values and rejects unsafe skill entries', () => {
    const result = normalizer.normalize({
      linkedin_id: 'bad-layout',
      full_name: 'Synthetic Person',
      job_title: "['manager']",
      current_company_name: '100-500 employees',
      location: '123 Example Street',
      country: '2020-01-01',
      skills: "['SQL']",
    });
    expect(result.profile).toMatchObject({
      jobTitle: null,
      currentCompanyName: null,
      locationName: null,
      country: null,
      skills: ['SQL'],
    });
    expect(result.warningCodes).toEqual(
      expect.arrayContaining([
        'invalid_job_title',
        'invalid_company_name',
        'invalid_location',
        'invalid_country',
      ]),
    );
  });

  it('extracts only one unambiguous current experience title', () => {
    const current = normalizer.normalize({
      linkedin_id: 'current-title',
      job_title: "['manager']",
      experience:
        "[{'title':'Current Engineer','end_date':None},{'title':'Former Engineer','end_date':'2020-01-01'}]",
    });
    expect(current.profile?.jobTitle).toBe('Current Engineer');
    const ambiguous = normalizer.normalize({
      linkedin_id: 'ambiguous-title',
      experience:
        "[{'title':'One','end_date':None},{'title':'Two','end_date':None}]",
    });
    expect(ambiguous.profile?.jobTitle).toBeNull();

    const primary = normalizer.normalize({
      linkedin_id: 'primary-title',
      experience:
        "[{'title':'Primary Engineer','is_primary':True},{'title':'Undated Contractor','end_date':None}]",
    });
    expect(primary.profile?.jobTitle).toBe('Primary Engineer');
  });

  it('removes value-based PII from public fields and structured records', () => {
    const result = normalizer.normalize({
      linkedin_id: 'pii-values',
      location: '123 Example Street',
      summary: 'Contact person@example.invalid',
      skills: "['TypeScript','person@example.invalid','United States']",
      experience:
        "[{'title':'Engineer','location':'123 Example Street','description':'Call +1 202 555 0100'}]",
    });
    expect(result.profile).toMatchObject({
      locationName: null,
      summary: null,
      skills: ['TypeScript'],
      experience: [{ title: 'Engineer' }],
    });
  });

  it('rejects birth and private social identifiers embedded in safe fields', () => {
    const result = normalizer.normalize({
      linkedin_id: 'embedded-private-values',
      summary: 'Born: 1985',
      skills: "['GitHub username: private-handle', 'TypeScript']",
    });
    expect(result.profile).toMatchObject({
      summary: null,
      skills: ['TypeScript'],
    });
  });
});
