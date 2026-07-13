import {
  AppBar, Toolbar, IconButton, Typography, Box, Avatar,
  Badge, Tooltip, useTheme, alpha, Menu, MenuItem, Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import SearchIcon from '@mui/icons-material/Search';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import SchoolIcon from '@mui/icons-material/School';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { useColorMode } from '../../contexts/ColorModeContext';
import { DRAWER_WIDTH } from './Sidebar';
import { supabase } from '../../lib/supabase';

interface TopNavProps {
  onMenuClick: () => void;
  showMenu?: boolean;
}

export default function TopNav({ onMenuClick, showMenu = false }: TopNavProps) {
  const theme = useTheme();
  const { profile, signOut } = useAuth();
  const { school } = useSchool();
  const { mode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!profile?.id) return;
    supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', profile.id).eq('is_read', false)
      .then(({ count }) => setUnreadCount(count ?? 0));
  }, [profile?.id]);

  const handleSignOut = async () => {
    setAnchorEl(null);
    await signOut();
    navigate('/');
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: showMenu ? '100%' : `calc(100% - ${DRAWER_WIDTH}px)`,
        ml: showMenu ? 0 : `${DRAWER_WIDTH}px`,
        bgcolor: theme.palette.mode === 'light'
          ? alpha(theme.palette.background.default, 0.9)
          : alpha(theme.palette.background.default, 0.9),
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid',
        borderColor: 'divider',
        color: 'text.primary',
      }}
    >
      <Toolbar sx={{ gap: 1.5 }}>
        {showMenu && (
          <IconButton edge="start" onClick={onMenuClick} color="inherit">
            <MenuIcon />
          </IconButton>
        )}

        {/* School branding */}
        {school && (
          <Tooltip title={school.school_name}>
            <Box
              sx={{
                display: 'flex', alignItems: 'center', gap: 1.25, cursor: 'pointer',
                mr: 2, borderRadius: 2.5, px: 1.5, py: 0.75,
                bgcolor: alpha(theme.palette.primary.main, 0.04),
                border: '1px solid',
                borderColor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
              }}
              onClick={() => navigate('/school-info')}
            >
              <Avatar
                src={school.logo_url || undefined}
                sx={{
                  width: 32, height: 32, borderRadius: 1.5,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                }}
              >
                <SchoolIcon sx={{ fontSize: 18, color: 'primary.main' }} />
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  sx={{
                    maxWidth: 140,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {school.school_name}
                </Typography>
              </Box>
            </Box>
          </Tooltip>
        )}

        {/* Search bar */}
        <Box
          sx={{
            display: 'flex', alignItems: 'center',
            bgcolor: theme.palette.mode === 'light' ? alpha(theme.palette.grey[500], 0.1) : alpha(theme.palette.grey[500], 0.15),
            borderRadius: 3, px: 2, py: 0.5, flex: 1, maxWidth: 400,
            cursor: 'pointer', transition: 'all 0.2s',
            '&:hover': { bgcolor: theme.palette.mode === 'light' ? alpha(theme.palette.grey[500], 0.15) : alpha(theme.palette.grey[500], 0.2) },
          }}
          onClick={() => navigate('/search')}
        >
          <SearchIcon sx={{ color: 'text.secondary', fontSize: 18, mr: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Search students, homework...
          </Typography>
        </Box>

        <Box sx={{ flex: 1 }} />

        {/* Dark mode toggle */}
        <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
          <IconButton onClick={toggleColorMode} color="inherit" size="small">
            {mode === 'light' ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
          </IconButton>
        </Tooltip>

        {/* Notifications */}
        <Tooltip title="Notifications">
          <IconButton color="inherit" size="small" onClick={() => navigate('/notifications')}>
            <Badge badgeContent={unreadCount} color="error" max={9}>
              <NotificationsNoneIcon fontSize="small" />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* Profile */}
        <Tooltip title="Account">
          <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
            <Avatar
              src={profile?.avatar_url ?? undefined}
              sx={{ width: 34, height: 34, bgcolor: theme.palette.primary.main, fontSize: '0.875rem' }}
            >
              {profile?.full_name?.[0] ?? 'U'}
            </Avatar>
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{ sx: { mt: 1, minWidth: 200, borderRadius: 3 } }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={600}>{profile?.full_name ?? 'User'}</Typography>
            <Typography variant="caption" color="text.secondary">{profile?.email}</Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => { setAnchorEl(null); navigate('/profile'); }}>
            <PersonIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
            Profile
          </MenuItem>
          <MenuItem onClick={() => { setAnchorEl(null); navigate('/settings'); }}>
            <SettingsIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
            Settings
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleSignOut} sx={{ color: 'error.main' }}>
            <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
            Sign Out
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
