import {
  adaptLinkedinProfileSource,
  LINKEDIN_PROFILE_COLLECTION_STARTS,
  LINKEDIN_PROFILE_SOURCE_HEADERS,
  LINKEDIN_PROFILE_SOURCE_POSITIONS,
} from '../src/data/linkedin-profile-source-layout';

function supportedRow(): Record<string, string> {
  const row = Object.fromEntries(
    LINKEDIN_PROFILE_SOURCE_HEADERS.map((key) => [key, '']),
  );
  for (const key of LINKEDIN_PROFILE_SOURCE_HEADERS.slice(45, 58))
    row[key] = '[]';
  row.version_status = '{}';
  row.full_name = 'Synthetic Person';
  row.job_title = 'Engineer';
  row.job_company_name = 'Synthetic Company';
  row.location_name = 'Synthetic City, Example Region';
  row.location_country = 'Canada';
  return row;
}

function alternateLayoutRow(collectionStart: number): Record<string, string> {
  const values = LINKEDIN_PROFILE_SOURCE_HEADERS.map(() => 'scalar');
  for (let index = collectionStart; index < collectionStart + 13; index += 1)
    values[index] = '[]';
  values[collectionStart + 13] = '{}';
  values[0] = 'Synthetic Person';
  values[1] = 'Synthetic';
  values[2] = 'Person';
  values[4] = 'linkedin.com/in/synthetic-person';
  values[6] = 'synthetic-id';
  values[collectionStart + 3] = "['TypeScript']";
  values[collectionStart + 8] =
    "[{'title':'Synthetic Engineer','end_date':None}]";
  values[collectionStart + 9] = "[{'school':'Synthetic University'}]";
  return Object.fromEntries(
    LINKEDIN_PROFILE_SOURCE_HEADERS.map((header, index) => [
      header,
      values[index] ?? '',
    ]),
  );
}

describe('LinkedIn profile source layout', () => {
  it('maps only application fields from the known source positions', () => {
    const result = adaptLinkedinProfileSource(supportedRow());
    expect(result.record).toMatchObject({
      full_name: 'Synthetic Person',
      job_title: 'Engineer',
      current_company_name: 'Synthetic Company',
      location_name: 'Synthetic City, Example Region',
      country: 'Canada',
    });
    expect(result.record).not.toHaveProperty('emails');
    expect(result.record).not.toHaveProperty('street_addresses');
    expect(LINKEDIN_PROFILE_SOURCE_POSITIONS).toEqual(
      expect.objectContaining({
        fullName: 0,
        linkedinUrl: 4,
        linkedinId: 6,
        industry: 10,
        currentJobTitle: 11,
        currentCompanyName: 15,
        sourceUpdatedAt: 31,
        locationName: 33,
        country: 37,
        inferredYearsExperience: 43,
        summary: 44,
        skills: 48,
        experience: 53,
        education: 54,
      }),
    );
  });

  it.each(LINKEDIN_PROFILE_COLLECTION_STARTS)(
    'recognizes deterministic collection layout starting at %i',
    (collectionStart) => {
      const result = adaptLinkedinProfileSource(
        alternateLayoutRow(collectionStart),
      );
      expect(result.layoutId).toBe(
        `linkedin-77-collections-${collectionStart}`,
      );
      expect(result.record).toMatchObject({
        full_name: 'Synthetic Person',
        linkedin_id: 'synthetic-id',
        skills: "['TypeScript']",
        experience: "[{'title':'Synthetic Engineer','end_date':None}]",
        education: "[{'school':'Synthetic University'}]",
      });
      if (collectionStart !== 45) {
        expect(result.record).toMatchObject({
          industry: '',
          job_title: '',
          current_company_name: '',
          location_name: '',
          country: '',
          summary: '',
          inferred_years_experience: '',
          source_updated_at: '',
        });
      }
    },
  );

  it('rejects a header/value layout mismatch of the same width', () => {
    const row = supportedRow();
    row.job_title = "['manager']";
    row.version_status = 'not-an-object';
    expect(adaptLinkedinProfileSource(row)).toEqual({
      record: null,
      rejectionCode: 'ambiguous_value_layout',
    });
  });

  it('rejects an unknown header layout', () => {
    const row = supportedRow();
    const changed = Object.fromEntries(
      Object.entries(row).map(([key, value], index) => [
        index === 0 ? 'unknown' : key,
        value,
      ]),
    );
    expect(adaptLinkedinProfileSource(changed).rejectionCode).toBe(
      'unknown_header_layout',
    );
  });
});
