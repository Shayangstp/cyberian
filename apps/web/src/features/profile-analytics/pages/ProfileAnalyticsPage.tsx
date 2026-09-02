import { Alert, Box, Button, Grid, Stack, Typography } from '@mui/material';
import { AnalyticsBarChart } from '../components/AnalyticsBarChart';
import { AnalyticsOverview } from '../components/AnalyticsOverview';
import { CountriesRanking } from '../components/CountriesRanking';
import { useProfileAnalytics } from '../hooks/use-profile-analytics';

export function ProfileAnalyticsPage() {
  const analytics = useProfileAnalytics();
  const data = analytics.data;
  const noProfiles = data?.totals.profiles === 0;
  return (
    <main>
      <Stack spacing={4} sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Box>
          <Typography variant="h1">Profile analytics</Typography>
          <Typography color="text.secondary">
            Aggregate insights from the indexed professional profile dataset.
          </Typography>
        </Box>
        {analytics.isError && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" onClick={() => void analytics.refetch()}>
                Retry
              </Button>
            }
          >
            Profile analytics are temporarily unavailable. Please try again.
          </Alert>
        )}
        <AnalyticsOverview totals={data?.totals} />
        {noProfiles ? (
          <Alert severity="info">
            No indexed profile data is available for analytics.
          </Alert>
        ) : (
          <>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <AnalyticsBarChart
                  title="Top Industries"
                  buckets={data?.topIndustries}
                  loading={analytics.isLoading}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <AnalyticsBarChart
                  title="Top Skills"
                  buckets={data?.topSkills}
                  loading={analytics.isLoading}
                />
              </Grid>
            </Grid>
            {analytics.isLoading ? (
              <Box sx={{ height: 220 }} aria-label="Loading country ranking" />
            ) : (
              <CountriesRanking buckets={data?.countries ?? []} />
            )}
          </>
        )}
      </Stack>
    </main>
  );
}
