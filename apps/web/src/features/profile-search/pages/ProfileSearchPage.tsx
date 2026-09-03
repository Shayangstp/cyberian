import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
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
  const hasCriteria = Boolean(
    params.q || params.skills.length || params.jobTitle,
  );
  const highlightTerms = [params.q, ...params.skills, params.jobTitle];
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
            slotProps={{
              input: {
                endAdornment: params.q ? (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="Clear search"
                      edge="end"
                      onClick={() => {
                        setDraft('');
                        update({ q: '' });
                      }}
                    >
                      ×
                    </IconButton>
                  </InputAdornment>
                ) : undefined,
              },
            }}
          />
          <Button type="submit" sx={{ mt: 1 }} variant="contained">
            Search
          </Button>
        </Box>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: '1fr 3fr' },
            gap: 3,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <SearchFilters
              params={params}
              onApply={(skills, jobTitle) => update({ skills, jobTitle })}
              onClear={() => update({ skills: [], jobTitle: '' })}
            />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Stack spacing={2} aria-label="Search results">
              {hasCriteria && (
                <Stack
                  direction="row"
                  flexWrap="wrap"
                  gap={0.5}
                  aria-label="Applied search criteria"
                >
                  {params.q && (
                    <Chip
                      label={`Keyword: ${params.q}`}
                      onDelete={() => update({ q: '' })}
                    />
                  )}
                  {params.skills.map((skill) => (
                    <Chip
                      key={skill}
                      label={`Skill: ${skill}`}
                      onDelete={() =>
                        update({
                          skills: params.skills.filter(
                            (item) => item !== skill,
                          ),
                        })
                      }
                    />
                  ))}
                  {params.jobTitle && (
                    <Chip
                      label={`Title: ${params.jobTitle}`}
                      onDelete={() => update({ jobTitle: '' })}
                    />
                  )}
                  <Button
                    size="small"
                    onClick={() => {
                      setDraft('');
                      update({ q: '', skills: [], jobTitle: '' });
                    }}
                  >
                    Clear all
                  </Button>
                </Stack>
              )}
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
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  highlightTerms={highlightTerms}
                />
              ))}
              {search.data?.data.length === 0 && (
                <Alert severity="info">No profiles match your search.</Alert>
              )}
              {search.data && search.data.meta.totalPages > 1 && (
                <Pagination
                  page={params.page}
                  count={search.data.meta.totalPages}
                  onChange={(_, page) => {
                    update({ page });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              )}
            </Stack>
          </Box>
        </Box>
      </Stack>
    </main>
  );
}
