import type { ProfileSearchDocument } from '../../search/profile-search-document';
export function mapPublicProfile(source: ProfileSearchDocument) {
  const {
    id,
    fullName,
    jobTitle,
    currentCompanyName,
    industry,
    locationName,
    country,
    summary,
    skills,
    linkedinUrl,
  } = source;
  return {
    id,
    fullName,
    jobTitle,
    currentCompanyName,
    industry,
    locationName,
    country,
    summary,
    skills,
    linkedinUrl,
  };
}
