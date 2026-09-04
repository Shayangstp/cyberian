import type { ProfileAnalyticsTotals } from '@cyberian/shared';
import { Card, CardContent, Grid, Skeleton, Typography } from '@mui/material';

const labels: Array<[keyof ProfileAnalyticsTotals, string]> = [
  ['profiles', 'Profiles'],
  ['industries', 'Industries'],
  ['skills', 'Skills'],
  ['countries', 'Countries'],
];

export function AnalyticsOverview({
  totals,
}: {
  totals?: ProfileAnalyticsTotals;
}) {
  return (
    <section aria-labelledby="dataset-overview-heading">
      <Typography id="dataset-overview-heading" variant="h2" sx={{ mb: 2 }}>
        Dataset Overview
      </Typography>
      <Grid container spacing={2}>
        {labels.map(([key, label]) => (
          <Grid item xs={6} md={3} key={key}>
            <Card variant="outlined">
              <CardContent>
                <Typography color="text.secondary">{label}</Typography>
                {totals ? (
                  <Typography
                    variant="h4"
                    aria-label={`${label}: ${totals[key]}`}
                  >
                    {totals[key].toLocaleString()}
                  </Typography>
                ) : (
                  <Skeleton
                    aria-label={`Loading ${label}`}
                    width="50%"
                    height={48}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </section>
  );
}
