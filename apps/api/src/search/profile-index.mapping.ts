export const PROFILE_INDEX_VERSION = 1;
export const profileIndexMapping = {
  settings: { number_of_shards: 1, number_of_replicas: 0 },
  mappings: {
    dynamic: 'strict' as const,
    properties: {
      id: { type: 'keyword' },
      sourceKey: { type: 'keyword' },
      linkedinId: { type: 'keyword' },
      linkedinUrl: { type: 'keyword', index: false },
      fullName: textKeyword(),
      firstName: textKeyword(),
      lastName: textKeyword(),
      jobTitle: textKeyword(),
      currentCompanyName: textKeyword(),
      summary: { type: 'text' },
      industry: textKeyword(),
      jobTitleRole: textKeyword(),
      country: { type: 'keyword' },
      skills: textKeyword(),
      locationName: textKeyword(),
      inferredYearsExperience: { type: 'float' },
      sourceUpdatedAt: { type: 'date' },
      importedAt: { type: 'date' },
      updatedAt: { type: 'date' },
      experience: {
        type: 'nested',
        properties: nestedProperties([
          'title',
          'company',
          'companyname',
          'location',
          'description',
          'startdate',
          'enddate',
          'duration',
        ]),
      },
      education: {
        type: 'nested',
        properties: nestedProperties([
          'school',
          'schoolname',
          'degree',
          'fieldofstudy',
          'startdate',
          'enddate',
          'description',
        ]),
      },
    },
  },
};
function textKeyword() {
  return {
    type: 'text',
    fields: { keyword: { type: 'keyword', ignore_above: 256 } },
  };
}
function nestedProperties(keys: string[]) {
  return Object.fromEntries(keys.map((key) => [key, textKeyword()]));
}
