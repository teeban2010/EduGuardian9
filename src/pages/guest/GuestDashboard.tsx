import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Card, CardContent, Grid,
  alpha, useTheme, Chip, Stack, Divider,
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import SchoolIcon from '@mui/icons-material/School';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShieldIcon from '@mui/icons-material/Shield';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LockIcon from '@mui/icons-material/Lock';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useSchool } from '../../contexts/SchoolContext';

const FEATURES = [
  { icon: <EventNoteIcon />, label: 'Attendance', color: '#2563EB', locked: true },
  { icon: <AssignmentIcon />, label: 'Homework', color: '#10B981', locked: true },
  { icon: <TrendingUpIcon />, label: 'Progress', color: '#8B5CF6', locked: true },
  { icon: <ShieldIcon />, label: 'Discipline', color: '#EF4444', locked: true },
  { icon: <NotificationsActiveIcon />, label: 'Notifications', color: '#F59E0B', locked: true },
  { icon: <CalendarMonthIcon />, label: 'Calendar', color: '#0891B2', locked: false },
  { icon: <SmartToyIcon />, label: 'AI Assistant', color: '#7C3AED', locked: true },
  { icon: <SchoolIcon />, label: 'School Info', color: '#64748B', locked: false },
];

const ROLES = ['Parent', 'Teacher', 'Student', 'Counselor', 'Administrator'];

export default function GuestDashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { school, exitGuestMode } = useSchool();

  const handleSignIn = () => {
    exitGuestMode();
    navigate('/school-login');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  return (
    <Box sx={{ pb: 4, maxWidth: 680, mx: 'auto' }}>

      {/* School welcome card */}
      <Card
        elevation={0}
        sx={{
          mb: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha('#7C3AED', 0.04)} 100%)`,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              width: 64, height: 64, borderRadius: 3, flexShrink: 0,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              border: '2px solid', borderColor: alpha(theme.palette.primary.main, 0.15),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}>
              {school?.logo_url ? (
                <Box component="img" src={school.logo_url} alt={school.school_name}
                  sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 1 }} />
              ) : (
                <SchoolIcon sx={{ fontSize: 32, color: 'primary.main' }} />
              )}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1, lineHeight: 1 }}>
                Welcome to
              </Typography>
              <Typography variant="h6" fontWeight={800} noWrap sx={{ color: 'primary.main', lineHeight: 1.2, mt: 0.25 }}>
                {school?.school_name ?? 'EduGuardian AI'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <LocationOnIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                <Typography variant="caption" color="text.secondary">
                  {school?.city ? `${school.city}, ` : ''}{school?.state ?? 'Malaysia'}
                </Typography>
                {school?.school_type && (
                  <Chip label={school.school_type} size="small" sx={{
                    height: 16, fontSize: '0.6rem', fontWeight: 700, ml: 0.5,
                    bgcolor: alpha(theme.palette.primary.main, 0.08), color: 'primary.main',
                  }} />
                )}
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Sign in CTA */}
      <Card
        elevation={0}
        sx={{
          mb: 3, borderRadius: 4, border: '2px solid', borderColor: alpha(theme.palette.primary.main, 0.2),
          boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={800} gutterBottom>
            Sign in to access your dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.7 }}>
            You are currently browsing as a guest. Sign in or create an account to track attendance, homework, grades, and connect with your school community.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2.5 }}>
            <Button
              variant="contained" size="large" fullWidth
              startIcon={<LoginIcon />} onClick={handleSignIn}
              sx={{ py: 1.5, borderRadius: 3, fontWeight: 800, textTransform: 'none', fontSize: '1rem' }}
            >
              Sign In
            </Button>
            <Button
              variant="outlined" size="large" fullWidth
              startIcon={<PersonAddIcon />} onClick={handleRegister}
              sx={{ py: 1.5, borderRadius: 3, fontWeight: 700, textTransform: 'none', fontSize: '1rem' }}
            >
              Create Account
            </Button>
          </Stack>

          <Divider sx={{ mb: 2 }} />

          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
              Available for:
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
              {ROLES.map((role) => (
                <Chip key={role} label={role} size="small" sx={{
                  fontWeight: 600,
                  bgcolor: alpha(theme.palette.primary.main, 0.06),
                  color: 'text.primary',
                  border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.1),
                }} />
              ))}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Features preview */}
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
        Features available after sign in
      </Typography>

      <Grid container spacing={1.5}>
        {FEATURES.map((f) => (
          <Grid size={{ xs: 3 }} key={f.label}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3, border: '1px solid', borderColor: 'divider',
                textAlign: 'center', position: 'relative', overflow: 'visible',
                opacity: f.locked ? 0.6 : 1,
                transition: 'opacity 0.2s',
                cursor: f.locked ? 'default' : 'pointer',
                '&:hover': f.locked ? {} : {
                  borderColor: alpha(f.color, 0.3),
                  boxShadow: `0 4px 16px ${alpha(f.color, 0.1)}`,
                },
              }}
              onClick={f.locked ? handleSignIn : undefined}
            >
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{
                  width: 40, height: 40, borderRadius: 2.5, mx: 'auto', mb: 1,
                  bgcolor: alpha(f.color, 0.1), color: f.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  '& svg': { fontSize: 20 },
                  position: 'relative',
                }}>
                  {f.locked ? (
                    <LockIcon sx={{ fontSize: '16px !important', color: 'text.disabled' }} />
                  ) : (
                    f.icon
                  )}
                </Box>
                <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.68rem', lineHeight: 1.2 }}>
                  {f.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Powered by{' '}
          <Typography component="span" variant="body2" fontWeight={700} color="primary.main">
            EduGuardian AI
          </Typography>
          {' '}— Malaysia's Smart AI School Management Platform
        </Typography>
      </Box>
    </Box>
  );
}
