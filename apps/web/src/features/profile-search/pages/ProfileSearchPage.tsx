import { Alert, Box, Typography } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { useProfileSearch } from '../hooks/use-profile-search';
import { parseProfileSearchParams } from '../model/profile-search-url';
export function ProfileSearchPage() {
  const [searchParams] = useSearchParams();
  const params = parseProfileSearchParams(searchParams);
  const search = useProfileSearch(params);
  return (
    <main>
      <Typography variant="h1">Profile search</Typography>
      <Typography>Search the professional profile index.</Typography>
      <Box component="section" aria-label="Search controls" sx={{ mt: 3 }}>
        <Typography>Search controls will be available here.</Typography>
      </Box>
      <Box component="section" aria-label="Search results" sx={{ mt: 3 }}>
        {search.isLoading && (
          <Typography role="status">Loading profiles…</Typography>
        )}
        {search.isError && (
          <Alert severity="error">
            Profile search is temporarily unavailable.
          </Alert>
        )}
        {search.data && (
          <Typography>{search.data.meta.total} profiles found.</Typography>
        )}
        <Typography>Results presentation will be available here.</Typography>
      </Box>
    </main>
  );
}
