import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { AnalyticsBarChart } from '../components/AnalyticsBarChart';
import { AnalyticsOverview } from '../components/AnalyticsOverview';
import {
  CountriesRanking,
  CountriesRankingSkeleton,
} from '../components/CountriesRanking';
import { useProfileAnalytics } from '../hooks/use-profile-analytics';

export function ProfileAnalyticsPage() {
  const analytics = useProfileAnalytics();
  const data = analytics.data;
  const noProfiles = data?.totals.profiles === 0;
  return (
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
            <Box>
              <AnalyticsBarChart
                title="Top Industries"
                buckets={data?.topIndustries}
                loading={analytics.isLoading}
              />
            </Box>
            <Box>
              <AnalyticsBarChart
                title="Top Skills"
                buckets={data?.topSkills}
                loading={analytics.isLoading}
              />
            </Box>
          </Box>
          {analytics.isLoading ? (
            <CountriesRankingSkeleton />
          ) : (
            <CountriesRanking buckets={data?.countries ?? []} />
          )}
        </>
      )}
    </Stack>
  );
}
