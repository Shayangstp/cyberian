import {
  Alert,
  Box,
  Button,
  Grid,
  Pagination,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProfileCard } from '../components/ProfileCard';
import { ProfileCardSkeleton } from '../components/ProfileCardSkeleton';
import { SearchFilters } from '../components/SearchFilters';
import { useProfileSearch } from '../hooks/use-profile-search';
import {
  parseProfileSearchParams,
  serializeProfileSearchParams,
  withSearchChange,
} from '../model/profile-search-url';
export function ProfileSearchPage() {
  const [url, setUrl] = useSearchParams();
  const params = parseProfileSearchParams(url);
  const [draft, setDraft] = useState(params.q);
  useEffect(() => setDraft(params.q), [params.q]);
  const search = useProfileSearch(params);
  const update = (change: Partial<typeof params>) =>
    setUrl(serializeProfileSearchParams(withSearchChange(params, change)));
  return (
    <main>
      <Stack spacing={3} sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Box>
          <Typography variant="h1">Profile search</Typography>
          <Typography color="text.secondary">
            Find professionals by expertise, role, and industry.
          </Typography>
        </Box>
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            update({ q: draft.trim() });
          }}
        >
          <TextField
            fullWidth
            label="Search profiles"
            placeholder="Search by name, title, company, skill, or industry"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <Button type="submit" sx={{ mt: 1 }} variant="contained">
            Search
          </Button>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <SearchFilters
              params={params}
              onApply={(skills, jobTitle) => update({ skills, jobTitle })}
              onClear={() => update({ skills: [], jobTitle: '' })}
            />
          </Grid>
          <Grid item xs={12} md={9}>
            <Stack spacing={2} aria-label="Search results">
              {search.isLoading &&
                [1, 2, 3].map((i) => <ProfileCardSkeleton key={i} />)}
              {search.isError && (
                <Alert
                  severity="error"
                  action={
                    <Button onClick={() => void search.refetch()}>Retry</Button>
                  }
                >
                  Profile search is temporarily unavailable. Please try again.
                </Alert>
              )}
              {search.data && (
                <Typography aria-live="polite">
                  {search.data.meta.total} profiles found.
                </Typography>
              )}
              {search.data?.data.map((profile) => (
                <ProfileCard key={profile.id} profile={profile} />
              ))}
              {search.data?.data.length === 0 && (
                <Alert severity="info">No profiles match your search.</Alert>
              )}
              {search.data && search.data.meta.totalPages > 1 && (
                <Pagination
                  page={params.page}
                  count={search.data.meta.totalPages}
                  onChange={(_, page) => update({ page })}
                />
              )}
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </main>
  );
}
