export interface ProfileSearchParams {
  q: string;
  skills: string[];
  jobTitle: string;
  page: number;
  limit: number;
}
export const defaultProfileSearchParams: ProfileSearchParams = {
  q: '',
  skills: [],
  jobTitle: '',
  page: 1,
  limit: 20,
};
