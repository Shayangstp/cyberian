import type { AnalyticsBucket } from '@cyberian/shared';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';

export function AnalyticsDataTable({
  buckets,
}: {
  buckets: AnalyticsBucket[];
}) {
  return (
    <Table size="small" aria-label="Chart data">
      <TableHead>
        <TableRow>
          <TableCell>Category</TableCell>
          <TableCell align="right">Profiles</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {buckets.map((bucket) => (
          <TableRow key={bucket.key}>
            <TableCell>{bucket.key}</TableCell>
            <TableCell align="right">{bucket.count.toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
