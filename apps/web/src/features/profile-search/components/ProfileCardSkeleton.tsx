import { Card, CardContent, Skeleton, Stack } from '@mui/material';
export function ProfileCardSkeleton() {
  return (
    <Card>
      <CardContent>
        <Stack spacing={1}>
          <Skeleton width="40%" />
          <Skeleton width="65%" />
          <Skeleton height={50} />
          <Skeleton width="55%" />
        </Stack>
      </CardContent>
    </Card>
  );
}
