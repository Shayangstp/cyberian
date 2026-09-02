import type { AnalyticsBucket } from '@cyberian/shared';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

export function CountriesRanking({ buckets }: { buckets: AnalyticsBucket[] }) {
  return (
    <Paper
      component="section"
      variant="outlined"
      sx={{ p: { xs: 2, sm: 3 }, overflowX: 'auto' }}
      aria-labelledby="countries-heading"
    >
      <Typography id="countries-heading" variant="h2" sx={{ mb: 2 }}>
        Top Countries
      </Typography>
      {buckets.length ? (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Rank</TableCell>
              <TableCell>Country</TableCell>
              <TableCell align="right">Profiles</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {buckets.map((bucket, index) => (
              <TableRow key={bucket.key}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{bucket.key}</TableCell>
                <TableCell align="right">
                  {bucket.count.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Typography color="text.secondary">
          No country aggregation data is available.
        </Typography>
      )}
    </Paper>
  );
}
