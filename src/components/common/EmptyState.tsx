import { Box, Typography, Button } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', py: 8, px: 3, textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: 80, height: 80, borderRadius: '50%',
          bgcolor: 'primary.50', display: 'flex',
          alignItems: 'center', justifyContent: 'center', mb: 3,
          color: 'primary.main',
        }}
      >
        {icon ?? <InboxIcon sx={{ fontSize: 36 }} />}
      </Box>
      <Typography variant="h6" fontWeight={600} gutterBottom>{title}</Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360, mb: 3 }}>
          {description}
        </Typography>
      )}
      {action && (
        <Button variant="contained" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </Box>
  );
}
