import { Box, Skeleton, Card, CardContent } from '@mui/material';

export function StatCardSkeleton() {
  return (
    <Card>
      <CardContent>
        <Skeleton variant="text" width="60%" height={20} />
        <Skeleton variant="text" width="40%" height={40} sx={{ mt: 1 }} />
        <Skeleton variant="text" width="80%" height={16} sx={{ mt: 1 }} />
      </CardContent>
    </Card>
  );
}

export function TableRowSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Skeleton variant="circular" width={36} height={36} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" height={14} />
          </Box>
          <Skeleton variant="rounded" width={80} height={28} />
        </Box>
      ))}
    </>
  );
}

export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 2 }}>
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </Box>
  );
}
