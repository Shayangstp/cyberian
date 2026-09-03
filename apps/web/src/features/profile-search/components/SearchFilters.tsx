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
  const [skillInput, setSkillInput] = useState('');
  const [jobTitle, setJobTitle] = useState(params.jobTitle);
  useEffect(() => {
    setSkills(params.skills);
    setJobTitle(params.jobTitle);
  }, [params]);
  const normalized = (values: string[]) => {
    const unique = new Map<string, string>();
    for (const value of values.flatMap((item) => item.split(','))) {
      const skill = value.trim();
      if (skill && !unique.has(skill.toLocaleLowerCase())) {
        unique.set(skill.toLocaleLowerCase(), skill);
      }
    }
    return [...unique.values()].slice(0, 10);
  };
  const commitInput = () => {
    const next = normalized([...skills, skillInput]);
    setSkills(next);
    setSkillInput('');
    return next;
  };
  return (
    <Box
      component="form"
      aria-label="Search filters"
      onSubmit={(e) => {
        e.preventDefault();
        onApply(
          skillInput.trim() ? commitInput() : normalized(skills),
          jobTitle.trim(),
        );
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
          inputValue={skillInput}
          onInputChange={(_, value, reason) => {
            if (reason === 'input') setSkillInput(value);
          }}
          onKeyDown={(event) => {
            if (
              (event.key === 'Enter' || event.key === ',') &&
              skillInput.trim()
            ) {
              event.preventDefault();
              commitInput();
            }
          }}
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
        <Button
          onClick={() => {
            setSkillInput('');
            onClear();
          }}
        >
          Clear filters
        </Button>
      </Stack>
    </Box>
  );
}
