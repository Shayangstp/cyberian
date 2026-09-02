import {
  Autocomplete,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import type { ProfileSearchParams } from '../model/profile-search-params';
export function SearchFilters({
  params,
  onApply,
  onClear,
}: {
  params: ProfileSearchParams;
  onApply: (skills: string[], jobTitle: string) => void;
  onClear: () => void;
}) {
  const [skills, setSkills] = useState(params.skills);
  const [jobTitle, setJobTitle] = useState(params.jobTitle);
  useEffect(() => {
    setSkills(params.skills);
    setJobTitle(params.jobTitle);
  }, [params]);
  const normalized = (values: string[]) =>
    [
      ...new Map(
        values
          .flatMap((v) => v.split(','))
          .map((v) => v.trim())
          .filter(Boolean)
          .map((v) => [v.toLowerCase(), v]),
      ).values(),
    ].slice(0, 10);
  return (
    <Box
      component="form"
      aria-label="Search filters"
      onSubmit={(e) => {
        e.preventDefault();
        onApply(normalized(skills), jobTitle.trim());
      }}
    >
      <Stack spacing={2}>
        <Typography variant="h2" fontSize="1rem">
          Filters
        </Typography>
        <Autocomplete
          multiple
          freeSolo
          options={[]}
          value={skills}
          onChange={(_, value) => setSkills(normalized(value))}
          renderInput={(p) => (
            <TextField
              {...p}
              label="Skills"
              helperText="Enter up to 10 skills"
            />
          )}
        />
        <TextField
          label="Job title"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
        />
        <Button type="submit" variant="contained">
          Apply filters
        </Button>
        <Button onClick={onClear}>Clear filters</Button>
      </Stack>
    </Box>
  );
}
