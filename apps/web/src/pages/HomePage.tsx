import { Paper, Stack, Typography } from '@mui/material';

export function HomePage() {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 3, sm: 5 } }}>
      <Stack spacing={2}>
        <Typography variant="h3" component="h1" fontWeight={600}>
          LinkedIn Profile Search
        </Typography>
        <Typography color="text.secondary" variant="body1">
          Search interface will be implemented in a later card.
        </Typography>
      </Stack>
    </Paper>
  );
}
