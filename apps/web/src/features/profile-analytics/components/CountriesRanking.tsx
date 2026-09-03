import type { AnalyticsBucket } from '@cyberian/shared';
import {
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

export function CountriesRankingSkeleton() {
  return (
    <Paper
      component="section"
      variant="outlined"
      aria-label="Loading country ranking"
      aria-busy="true"
      sx={{ p: { xs: 2, sm: 3 }, overflow: 'hidden' }}
    >
      <Skeleton variant="text" width={180} height={38} sx={{ mb: 1 }} />
      <Table size="small" aria-hidden="true">
        <TableHead>
          <TableRow>
            <TableCell>
              <Skeleton width={40} />
            </TableCell>
            <TableCell>
              <Skeleton width={90} />
            </TableCell>
            <TableCell align="right">
              <Skeleton width={55} sx={{ ml: 'auto' }} />
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {[72, 58, 66, 48, 62].map((width) => (
            <TableRow key={width}>
              <TableCell>
                <Skeleton width={20} />
              </TableCell>
              <TableCell>
                <Skeleton width={`${width}%`} />
              </TableCell>
              <TableCell align="right">
                <Skeleton width={44} sx={{ ml: 'auto' }} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}

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
