export interface ProfileSearchParams {
  q: string;
  skills: string[];
  jobTitle: string;
  industry: string;
  page: number;
  limit: number;
}
export const defaultProfileSearchParams: ProfileSearchParams = {
  q: '',
  skills: [],
  jobTitle: '',
  industry: '',
  page: 1,
  limit: 10,
};
