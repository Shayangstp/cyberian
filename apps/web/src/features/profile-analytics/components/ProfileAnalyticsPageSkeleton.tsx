import {
  Box,
  Card,
  CardContent,
  Grid,
  Paper,
  Skeleton,
  Stack,
} from '@mui/material';

export function ProfileAnalyticsPageSkeleton() {
  return (
    <Stack
      spacing={4}
      sx={{ maxWidth: 1200, mx: 'auto' }}
      role="status"
      aria-label="Loading profile analytics"
      aria-busy="true"
    >
      <Box>
        <Skeleton variant="text" width={280} height={52} />
        <Skeleton variant="text" width="min(520px, 85%)" />
      </Box>
      <Grid container spacing={2}>
        {[1, 2, 3, 4].map((item) => (
          <Grid item xs={6} md={3} key={item}>
            <Card variant="outlined">
              <CardContent>
                <Skeleton width="55%" />
                <Skeleton width="40%" height={48} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            md: 'repeat(2, minmax(0, 1fr))',
          },
          gap: 3,
        }}
      >
        {[1, 2].map((item) => (
          <Paper variant="outlined" sx={{ p: 3 }} key={item}>
            <Skeleton width="42%" height={38} />
            <Skeleton width="72%" />
            <Skeleton variant="rounded" height={300} sx={{ mt: 2 }} />
          </Paper>
        ))}
      </Box>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Skeleton width={180} height={38} />
        {[1, 2, 3, 4].map((item) => (
          <Skeleton key={item} height={42} />
        ))}
      </Paper>
    </Stack>
  );
}
