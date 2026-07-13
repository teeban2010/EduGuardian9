import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({ message = 'Loading...', fullScreen = false }: LoadingSpinnerProps) {
  return (
    <Box
      sx={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 2,
        ...(fullScreen && { minHeight: '100vh' }),
        ...(!fullScreen && { py: 8 }),
      }}
    >
      <CircularProgress size={40} thickness={4} />
      <Typography variant="body2" color="text.secondary">{message}</Typography>
    </Box>
  );
}
