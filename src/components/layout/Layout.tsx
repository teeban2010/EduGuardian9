import { Box, Toolbar, useMediaQuery, useTheme, Alert, Button, alpha } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import LoginIcon from '@mui/icons-material/Login';
import Sidebar, { DRAWER_WIDTH } from './Sidebar';
import TopNav from './TopNav';
import { useSchool } from '../../contexts/SchoolContext';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isGuest, exitGuestMode } = useSchool();
  const navigate = useNavigate();

  const handleSignIn = () => {
    exitGuestMode();
    navigate('/school-login');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {isMobile ? (
        <Sidebar open={mobileOpen} onClose={() => setMobileOpen(false)} variant="temporary" />
      ) : (
        <Sidebar open onClose={() => {}} variant="permanent" />
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          ml: isMobile ? 0 : `${DRAWER_WIDTH}px`,
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
      >
        <TopNav onMenuClick={() => setMobileOpen(true)} showMenu={isMobile} />
        <Toolbar />

        {/* Guest mode banner */}
        {isGuest && (
          <Box
            sx={{
              px: { xs: 2, sm: 3 },
              pt: 1.5,
              pb: 0,
            }}
          >
            <Alert
              icon={<VisibilityOutlinedIcon fontSize="small" />}
              severity="warning"
              sx={{
                borderRadius: 3,
                alignItems: 'center',
                bgcolor: alpha(theme.palette.warning.main, 0.08),
                border: '1px solid',
                borderColor: alpha(theme.palette.warning.main, 0.2),
                '& .MuiAlert-message': { flex: 1 },
              }}
              action={
                <Button
                  size="small"
                  variant="contained"
                  color="warning"
                  startIcon={<LoginIcon />}
                  onClick={handleSignIn}
                  sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2, whiteSpace: 'nowrap' }}
                >
                  Sign In
                </Button>
              }
            >
              You are browsing as a Guest. Some features are limited. Sign in for full access.
            </Alert>
          </Box>
        )}

        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
