export const PROFILE_INDEX_VERSION = 3;
export const profileIndexMapping = {
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0,
    analysis: {
      normalizer: {
        lowercase_keyword: {
          type: 'custom',
          filter: ['lowercase', 'asciifolding'],
        },
      },
    },
  },
  mappings: {
    dynamic: 'strict' as const,
    properties: {
      id: { type: 'keyword' },
      linkedinUrl: { type: 'keyword', index: false },
      fullName: textKeyword(),
      firstName: textKeyword(),
      lastName: textKeyword(),
      jobTitle: textKeyword(),
      currentCompanyName: textKeyword(),
      summary: { type: 'text' },
      industry: textKeyword(),
      jobTitleRole: textKeyword(),
      country: textKeyword(),
      skills: textKeyword(),
      locationName: textKeyword(),
      inferredYearsExperience: { type: 'float' },
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
    fields: {
      keyword: {
        type: 'keyword',
        ignore_above: 256,
        normalizer: 'lowercase_keyword',
      },
    },
  };
}
function nestedProperties(keys: string[]) {
  return Object.fromEntries(keys.map((key) => [key, textKeyword()]));
}
