import type { AnalyticsBucket } from '@cyberian/shared';
import { Bar } from 'react-chartjs-2';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { Box, Paper, Skeleton, Typography } from '@mui/material';
import { AnalyticsDataTable } from './AnalyticsDataTable';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export function analyticsChartData(buckets: AnalyticsBucket[]) {
  return {
    labels: buckets.map((bucket) => bucket.key),
    datasets: [
      {
        data: buckets.map((bucket) => bucket.count),
        backgroundColor: '#1976d2',
        borderRadius: 4,
      },
    ],
  };
}

export function AnalyticsBarChart({
  title,
  buckets,
  loading,
}: {
  title: string;
  buckets?: AnalyticsBucket[];
  loading?: boolean;
}) {
  if (loading)
    return (
      <Skeleton
        variant="rounded"
        height={320}
        aria-label={`Loading ${title}`}
      />
    );
  if (!buckets?.length)
    return (
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h2">{title}</Typography>
        <Typography color="text.secondary">
          No aggregation data is available for this section.
        </Typography>
      </Paper>
    );
  return (
    <Paper
      component="section"
      variant="outlined"
      sx={{ p: { xs: 2, sm: 3 } }}
      aria-labelledby={`${title}-heading`}
    >
      <Typography id={`${title}-heading`} variant="h2">
        {title}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        The ten most common categories in indexed profiles.
      </Typography>
      <Box sx={{ height: 300 }}>
        <Bar
          data={analyticsChartData(buckets)}
          options={{
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: { legend: { display: false } },
            scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
          }}
        />
      </Box>
      <details>
        <summary>View chart data</summary>
        <AnalyticsDataTable buckets={buckets} />
      </details>
    </Paper>
  );
}
