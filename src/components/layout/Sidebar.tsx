import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Typography, Avatar, Divider, Chip, IconButton, useTheme,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EventNoteIcon from '@mui/icons-material/EventNote';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import SearchIcon from '@mui/icons-material/Search';
import ShieldIcon from '@mui/icons-material/Shield';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import InfoIcon from '@mui/icons-material/Info';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { alpha } from '@mui/material';

export const DRAWER_WIDTH = 260;

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
}

const parentNav: NavItem[] = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { label: 'AI Assistant', icon: <SmartToyIcon />, path: '/ai' },
  { label: 'Homework', icon: <AssignmentIcon />, path: '/homework' },
  { label: 'Attendance', icon: <EventNoteIcon />, path: '/attendance' },
  { label: 'Progress', icon: <TrendingUpIcon />, path: '/progress' },
  { label: 'Calendar', icon: <CalendarMonthIcon />, path: '/calendar' },
  { label: 'Discipline Record', icon: <ShieldIcon />, path: '/discipline' },
  { label: 'Resources', icon: <MenuBookIcon />, path: '/resources' },
  { label: 'Canteen Menu', icon: <RestaurantIcon />, path: '/canteen' },
  { label: 'School Info', icon: <InfoIcon />, path: '/school-info' },
  { label: 'Notifications', icon: <NotificationsIcon />, path: '/notifications' },
  { label: 'Child Profile', icon: <PersonIcon />, path: '/profile' },
];

const teacherNav: NavItem[] = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { label: 'Homework', icon: <AssignmentIcon />, path: '/homework' },
  { label: 'Attendance', icon: <EventNoteIcon />, path: '/attendance' },
  { label: 'Announcements', icon: <AnnouncementIcon />, path: '/announcements' },
  { label: 'Students', icon: <PeopleIcon />, path: '/students' },
  { label: 'Resources', icon: <MenuBookIcon />, path: '/resources' },
];

const adminNav: NavItem[] = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { label: 'Users', icon: <PeopleIcon />, path: '/users' },
  { label: 'Students', icon: <SchoolIcon />, path: '/students' },
  { label: 'School Info', icon: <InfoIcon />, path: '/school-info' },
  { label: 'Announcements', icon: <AnnouncementIcon />, path: '/announcements' },
  { label: 'Reports', icon: <BarChartIcon />, path: '/reports' },
  { label: 'Resources', icon: <MenuBookIcon />, path: '/resources' },
];

const superAdminNav: NavItem[] = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { label: 'Students', icon: <PeopleIcon />, path: '/students' },
  { label: 'All Schools', icon: <SchoolIcon />, path: '/schools' },
];

const bottomNav: NavItem[] = [
  { label: 'Search', icon: <SearchIcon />, path: '/search' },
  { label: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  variant?: 'permanent' | 'temporary';
}

export default function Sidebar({ open, onClose, variant = 'permanent' }: SidebarProps) {
  const { profile } = useAuth();
  const { school } = useSchool();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  // Use super admin nav for super admins
  const isSuperAdmin = profile?.is_super_admin === true;
  const role = isSuperAdmin ? 'admin' : profile?.role ?? 'parent';
  const navItems = isSuperAdmin ? superAdminNav : role === 'admin' ? adminNav : role === 'teacher' ? teacherNav : parentNav;

  const handleNavigate = (path: string) => {
    navigate(path);
    if (variant === 'temporary') onClose();
  };

  const roleColor: Record<string, string> = {
    parent: theme.palette.primary.main,
    teacher: theme.palette.secondary.main,
    admin: theme.palette.error.main,
  };

  const roleLabel: Record<string, string> = {
    parent: 'Parent',
    teacher: 'Teacher',
    admin: isSuperAdmin ? 'SuperAdmin' : 'Admin',
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* School branding */}
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, position: 'relative' }}>
        {variant === 'temporary' && (
          <IconButton size="small" onClick={onClose} sx={{ position: 'absolute', top: 8, right: 8 }}>
            <ChevronLeftIcon />
          </IconButton>
        )}
        <Box
          sx={{
            width: 64, height: 64, borderRadius: 3,
            bgcolor: alpha(theme.palette.primary.main, 0.06),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid',
            borderColor: alpha(theme.palette.primary.main, 0.1),
            overflow: 'hidden',
          }}
          onClick={() => navigate('/school-info')}
        >
          {school?.logo_url ? (
            <Box
              component="img"
              src={school.logo_url}
              alt={school.school_name}
              sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 1.5, cursor: 'pointer' }}
            />
          ) : (
            <SchoolIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          )}
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="subtitle2" fontWeight={800} lineHeight={1.1} sx={{ color: 'primary.main' }}>
            {school?.school_name || 'EduGuardian AI'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block', lineHeight: 1.2 }}>
            {school?.city ? `${school.city}, ` : ''}{school?.state || 'Malaysia'}
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* User info */}
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            p: 2, borderRadius: 3,
            bgcolor: theme.palette.mode === 'light' ? 'primary.50' : 'rgba(37,99,235,0.12)',
            border: '1px solid',
            borderColor: theme.palette.mode === 'light' ? 'primary.100' : 'rgba(37,99,235,0.2)',
            display: 'flex', alignItems: 'center', gap: 1.5,
          }}
        >
          <Avatar
            src={profile?.avatar_url ?? undefined}
            sx={{ width: 40, height: 40, bgcolor: roleColor[role] }}
          >
            {profile?.full_name?.[0] ?? 'U'}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {profile?.full_name ?? 'User'}
            </Typography>
            <Chip
              label={roleLabel[role]}
              size="small"
              sx={{
                height: 18, fontSize: '0.65rem', fontWeight: 600,
                bgcolor: roleColor[role], color: 'white',
              }}
            />
          </Box>
        </Box>
      </Box>

      <Divider />

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
        <List dense disablePadding>
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <ListItem key={item.path} disablePadding sx={{ px: 1.5, mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavigate(item.path)}
                  sx={{
                    borderRadius: 2.5,
                    py: 1,
                    ...(active && {
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' },
                      '& .MuiListItemIcon-root': { color: 'white' },
                    }),
                    ...(!active && {
                      '&:hover': {
                        bgcolor: theme.palette.mode === 'light' ? 'rgba(37,99,235,0.06)' : 'rgba(37,99,235,0.12)',
                      },
                      '& .MuiListItemIcon-root': { color: 'text.secondary' },
                    }),
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: active ? 600 : 500 }}
                  />
                  {item.badge != null && item.badge > 0 && (
                    <Chip
                      label={item.badge}
                      size="small"
                      color="error"
                      sx={{ height: 20, '& .MuiChip-label': { px: 0.75, fontSize: '0.7rem' } }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      <Divider />

      {/* Bottom nav */}
      <Box sx={{ py: 1 }}>
        <List dense disablePadding>
          {bottomNav.map((item) => {
            const active = location.pathname === item.path;
            return (
              <ListItem key={item.path} disablePadding sx={{ px: 1.5, mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavigate(item.path)}
                  sx={{
                    borderRadius: 2.5, py: 1,
                    ...(active && {
                      bgcolor: 'primary.main', color: 'white',
                      '& .MuiListItemIcon-root': { color: 'white' },
                    }),
                    ...(!active && {
                      '& .MuiListItemIcon-root': { color: 'text.secondary' },
                    }),
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: active ? 600 : 500 }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Box>
  );

  if (variant === 'temporary') {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      open
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', position: 'fixed', height: '100vh' },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
