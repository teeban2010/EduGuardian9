import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  InputAdornment,
  CircularProgress,
  alpha,
  useTheme,
  Fade,
  Container,
  Grid,
  Chip,
  Divider,
  Stack,
  Paper,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SchoolIcon from '@mui/icons-material/School';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ShieldIcon from '@mui/icons-material/Shield';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import GroupsIcon from '@mui/icons-material/Groups';
import LockIcon from '@mui/icons-material/Lock';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { supabase } from '../lib/supabase';
import type { School } from '../types';
import { useSchool } from '../contexts/SchoolContext';


const FEATURES = [
  { icon: <SmartToyIcon />, title: 'AI-Powered Assistant', desc: 'Intelligent insights, homework help, and personalized recommendations for student success', color: '#2563EB' },
  { icon: <FamilyRestroomIcon />, title: 'Parent Connect', desc: 'Real-time updates on attendance, grades, homework, and school announcements', color: '#7C3AED' },
  { icon: <TrendingUpIcon />, title: 'Progress Tracking', desc: 'Visual dashboards showing academic progress, attendance trends, and growth', color: '#059669' },
  { icon: <ShieldIcon />, title: 'Secure & Isolated', desc: 'Each school has completely isolated, protected data with enterprise-grade security', color: '#DC2626' },
  { icon: <NotificationsActiveIcon />, title: 'Smart Notifications', desc: 'Instant alerts for homework, exams, events, and important school updates', color: '#EA580C' },
  { icon: <CalendarMonthIcon />, title: 'Calendar & Events', desc: 'Stay updated with school calendars, exam schedules, and important dates', color: '#0891B2' },
];

const ROLES = [
  { icon: <FamilyRestroomIcon />, label: 'Parents' },
  { icon: <GroupsIcon />, label: 'Teachers' },
  { icon: <MenuBookIcon />, label: 'Students' },
  { icon: <ShieldIcon />, label: 'Counselors' },
  { icon: <SchoolIcon />, label: 'Administrators' },
];

const STEPS = [
  { num: '01', title: 'Enter School Code', desc: 'Find your school using a unique school code or search by name' },
  { num: '02', title: 'School Identified', desc: 'Your school\'s logo, name, and branding load automatically' },
  { num: '03', title: 'Login & Connect', desc: 'Sign in with your email or Google account to access your dashboard' },
];

const STATS = [
  { value: '10,000+', label: 'Schools Nationwide' },
  { value: '2M+', label: 'Students Connected' },
  { value: '500K+', label: 'Active Parents' },
  { value: '99.9%', label: 'Uptime Guarantee' },
];

export default function Landing() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { setSchool } = useSchool();

  const [schoolCode, setSchoolCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [schools, setSchools] = useState<School[]>([]);
  const [searching, setSearching] = useState(false);
  const [schoolCount, setSchoolCount] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from('schools')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .then(({ count }) => setSchoolCount(count ?? 0));
  }, []);

  const handleContinue = useCallback(async () => {
    if (!schoolCode.trim()) {
      setError('Please enter your school code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('schools')
        .select('*')
        .eq('school_code', schoolCode.toUpperCase().trim())
        .eq('status', 'active')
        .maybeSingle();

      if (fetchError) {
        setError('Failed to verify school code. Please try again.');
        return;
      }

      if (!data) {
        setError('School code not found. Please check and try again.');
        return;
      }

      setSchool(data as School);
      navigate('/school-login');
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [schoolCode, setSchool, navigate]);

  const handleSchoolSelect = useCallback((school: School) => {
    setSchool(school);
    navigate('/school-login');
  }, [setSchool, navigate]);

  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSchools([]);
      return;
    }

    setSearching(true);
    try {
      const { data } = await supabase
        .from('schools')
        .select('*')
        .eq('status', 'active')
        .or(`school_name.ilike.%${query}%,school_code.ilike.%${query}%`)
        .order('school_name')
        .limit(10);
      setSchools((data as School[]) ?? []);
    } catch {
      setSchools([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* ═══════════════════════════════════════════════════════════════
          NAV BAR
          ═══════════════════════════════════════════════════════════════ */}
      <Box
        sx={{
          position: 'sticky', top: 0, zIndex: 100,
          backdropFilter: 'blur(12px)',
          bgcolor: alpha(theme.palette.background.default, 0.85),
          borderBottom: '1px solid', borderColor: 'divider',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={800} sx={{
                display: { xs: 'none', sm: 'block' },
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, #7C3AED 100%)`,
                backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                EduGuardian AI
              </Typography>
            </Box>
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
              <Button variant="text" onClick={() => scrollTo('features-section')} sx={{ fontWeight: 600, textTransform: 'none' }}>Features</Button>
              <Button variant="text" onClick={() => scrollTo('how-it-works')} sx={{ fontWeight: 600, textTransform: 'none' }}>How It Works</Button>
              <Button variant="text" onClick={() => scrollTo('school-code-section')} sx={{ fontWeight: 600, textTransform: 'none' }}>Schools</Button>
              <Button variant="contained" onClick={() => scrollTo('school-code-section')} sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2.5, ml: 1 }}>
                Get Started
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ═══════════════════════════════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════════════════════════════ */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${alpha('#2563EB', 0.06)} 0%, ${alpha('#7C3AED', 0.04)} 50%, ${alpha('#2563EB', 0.03)} 100%)`,
          pt: { xs: 6, md: 10 },
          pb: { xs: 4, md: 6 },
        }}
      >
        {/* Animated gradient blobs */}
        <Box sx={{
          position: 'absolute', top: -150, right: -100, width: 500, height: 500, borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha('#2563EB', 0.12)} 0%, transparent 70%)`,
          animation: 'floatBlob 8s ease-in-out infinite',
          '@keyframes floatBlob': {
            '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
            '50%': { transform: 'translate(-30px, 30px) scale(1.08)' },
          },
        }} />
        <Box sx={{
          position: 'absolute', bottom: -120, left: -80, width: 400, height: 400, borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha('#7C3AED', 0.1)} 0%, transparent 70%)`,
          animation: 'floatBlob 10s ease-in-out infinite reverse',
        }} />
        <Box sx={{
          position: 'absolute', top: '30%', left: '50%', width: 300, height: 300, borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha('#4F46E5', 0.06)} 0%, transparent 70%)`,
          animation: 'floatBlob 12s ease-in-out infinite',
        }} />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={4} alignItems="center">
            {/* Left: Hero content */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Fade in timeout={600}>
                <Box>
                  <Chip
                    icon={<AutoAwesomeIcon />}
                    label={schoolCount ? `${schoolCount} schools registered nationwide` : 'Nationwide School Platform'}
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      color: 'primary.main', fontWeight: 700, mb: 3,
                      '& .MuiChip-icon': { color: 'primary.main' },
                    }}
                  />

                  <Typography
                    variant="h1"
                    sx={{
                      fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.05, mb: 2,
                      fontSize: { xs: '2.75rem', sm: '3.5rem', md: '4rem' },
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, #4F46E5 50%, #7C3AED 100%)`,
                      backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}
                  >
                    EduGuardian AI
                  </Typography>

                  <Typography variant="h5" color="text.primary" sx={{ fontWeight: 700, mb: 2 }}>
                    Malaysia's Smart AI School Management Platform
                  </Typography>

                  <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, lineHeight: 1.8, fontSize: '1.1rem' }}>
                    Helping schools, parents and students connect through Artificial Intelligence.
                    One platform for every school in Malaysia.
                  </Typography>

                  {/* CTA Buttons */}
                  <Stack direction="row" spacing={2} sx={{ mb: 4, flexWrap: 'wrap', gap: 2 }}>
                    <Button
                      variant="contained" size="large"
                      onClick={() => scrollTo('school-code-section')}
                      endIcon={<ArrowForwardIcon />}
                      sx={{ py: 1.5, px: 4, borderRadius: 3, fontWeight: 800, fontSize: '1rem', textTransform: 'none' }}
                    >
                      Get Started
                    </Button>
                    <Button
                      variant="outlined" size="large"
                      onClick={() => { scrollTo('school-code-section'); setShowSearch(true); }}
                      sx={{ py: 1.5, px: 4, borderRadius: 3, fontWeight: 800, fontSize: '1rem', textTransform: 'none', borderWidth: 2, '&:hover': { borderWidth: 2 } }}
                    >
                      School Login
                    </Button>
                    <Button
                      variant="text" size="large"
                      onClick={() => scrollTo('features-section')}
                      sx={{ py: 1.5, px: 3, borderRadius: 3, fontWeight: 700, fontSize: '1rem', textTransform: 'none' }}
                    >
                      Learn More
                    </Button>
                  </Stack>

                  {/* Roles */}
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {ROLES.map((role) => (
                      <Chip
                        key={role.label} icon={role.icon} label={role.label} size="small"
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.06), color: 'text.primary', fontWeight: 600,
                          border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.1),
                          '& .MuiChip-icon': { color: 'primary.main' },
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </Fade>
            </Grid>

            {/* Right: Hero illustration */}
            <Grid size={{ xs: 12, md: 6 }} sx={{ order: { xs: -1, md: 0 } }}>
              <Fade in timeout={800}>
                <Box sx={{ textAlign: 'center', px: { xs: 1, sm: 2, md: 0 } }}>
                  <Box
                    component="img"
                    src="/WhatsApp_Image_2026-07-07_at_11.10.02_AM.jpeg"
                    alt="EduGuardian AI - Students, Teachers, and AI"
                    sx={{
                      width: '100%',
                      maxWidth: { xs: 340, sm: 440, md: '100%' },
                      maxHeight: { xs: 300, sm: 400, md: 480 },
                      objectFit: 'contain',
                      borderRadius: { xs: 3, md: 4 },
                      filter: 'drop-shadow(0 16px 40px rgba(37, 99, 235, 0.18))',
                    }}
                  />
                </Box>
              </Fade>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ═══════════════════════════════════════════════════════════════
          STATS BAR
          ═══════════════════════════════════════════════════════════════ */}
      <Box sx={{ py: { xs: 4, md: 6 }, borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Grid container spacing={2}>
            {STATS.map((stat, i) => (
              <Grid size={{ xs: 6, md: 3 }} key={i}>
                <Fade in timeout={400 + i * 100}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" fontWeight={900} sx={{
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, #7C3AED 100%)`,
                      backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>{stat.label}</Typography>
                  </Box>
                </Fade>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ═══════════════════════════════════════════════════════════════
          SCHOOL CODE / SEARCH SECTION
          ═══════════════════════════════════════════════════════════════ */}
      <Container maxWidth="sm" id="school-code-section" sx={{ py: { xs: 6, md: 8 }, scrollMarginTop: 80 }}>
        <Fade in timeout={500}>
          <Card elevation={0} sx={{
            borderRadius: 5, border: '1px solid', borderColor: 'divider',
            boxShadow: `0 24px 80px ${alpha(theme.palette.primary.main, 0.08)}`,
          }}>
            <CardContent sx={{ p: { xs: 4, sm: 6 } }}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Box sx={{
                  width: 56, height: 56, borderRadius: 3, mx: 'auto', mb: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'primary.main',
                }}>
                  {showSearch ? <SearchIcon sx={{ fontSize: 28 }} /> : <SchoolIcon sx={{ fontSize: 28 }} />}
                </Box>
                <Typography variant="h5" fontWeight={800} gutterBottom>
                  {showSearch ? 'Find Your School' : 'Enter School Code'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {showSearch ? 'Search by school name or code to find your school' : "Enter your school's unique code to continue"}
                </Typography>
              </Box>

              {!showSearch ? (
                <>
                  <Box sx={{ mb: 3 }}>
                    <TextField
                      fullWidth placeholder="Enter school code" value={schoolCode}
                      onChange={(e) => { setSchoolCode(e.target.value.toUpperCase()); setError(null); }}
                      error={!!error} helperText={error || ' '} disabled={loading}
                      onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
                      InputProps={{
                        sx: {
                          fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.15em',
                          '& input': { textAlign: 'center' },
                        },
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 }, '& .MuiFormHelperText-root': { color: error ? 'error.main' : 'text.disabled' } }}
                    />
                  </Box>

                  <Button
                    fullWidth variant="contained" size="large" onClick={handleContinue} disabled={loading}
                    endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ArrowForwardIcon />}
                    sx={{ py: 2, borderRadius: 3, fontWeight: 800, fontSize: '1rem', textTransform: 'none', mb: 3 }}
                  >
                    Continue
                  </Button>


<Divider sx={{ mb: 3 }}>
  <Typography
    variant="caption"
    color="text.secondary"
  >
    OR
  </Typography>
</Divider>

<Box sx={{ textAlign: 'center' }}>
  <Button
    variant="text"
    onClick={() => setShowSearch(true)}
    startIcon={<SearchIcon />}
    sx={{
      color: 'text.secondary',
      fontWeight: 600,
      textTransform: 'none',
    }}
  >
    Don't know your school code? Search your school
  </Button>
</Box>
                </>
              ) : (
                <>
                  <Box sx={{ mb: 3 }}>
                    <TextField
                      fullWidth placeholder="Type school name or code..." value={searchQuery} autoFocus
                      onChange={(e) => { setSearchQuery(e.target.value); handleSearch(e.target.value); }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            {searching ? <CircularProgress size={18} /> : <SearchIcon color="action" />}
                          </InputAdornment>
                        ),
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />
                  </Box>

                  {/* Search Results */}
                  <Box sx={{ minHeight: 200, maxHeight: 320, overflow: 'auto' }}>
                    {searchQuery.length < 2 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                        Type at least 2 characters to search
                      </Typography>
                    ) : schools.length === 0 && !searching ? (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                        No schools found
                      </Typography>
                    ) : (
                      <Stack spacing={1}>
                        {schools.map((school) => (
                          <Box
                            key={school.id} onClick={() => handleSchoolSelect(school)}
                            sx={{
                              display: 'flex', alignItems: 'center', gap: 2, p: 2,
                              borderRadius: 2.5, cursor: 'pointer',
                              border: '1px solid', borderColor: 'divider',
                              transition: theme.transitions.create(['background-color', 'border-color', 'box-shadow']),
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.04),
                                borderColor: alpha(theme.palette.primary.main, 0.2),
                                boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.08)}`,
                              },
                            }}
                          >
                            <Box sx={{
                              width: 44, height: 44, borderRadius: 2, flexShrink: 0,
                              bgcolor: alpha(theme.palette.primary.main, 0.08),
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              {school.logo_url ? (
                                <Box component="img" src={school.logo_url} alt={school.school_name} sx={{ width: 32, height: 32, objectFit: 'contain' }} />
                              ) : (
                                <SchoolIcon sx={{ fontSize: 24, color: 'primary.main' }} />
                              )}
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={700} noWrap>{school.school_name}</Typography>
                              <Typography variant="caption" color="text.secondary" noWrap>
                                {school.state} • {school.school_type} • {school.school_code}
                              </Typography>
                            </Box>
                            <ArrowForwardIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </Box>

                  <Box sx={{ textAlign: 'center', mt: 3 }}>
                    <Button variant="text" onClick={() => { setShowSearch(false); setSearchQuery(''); setSchools([]); }}
                      startIcon={<ArrowBackIcon />} sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'none' }}>
                      Back to School Code
                    </Button>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Fade>
      </Container>

      {/* ═══════════════════════════════════════════════════════════════
          HOW IT WORKS
          ═══════════════════════════════════════════════════════════════ */}
      <Box id="how-it-works" sx={{ py: { xs: 6, md: 10 }, scrollMarginTop: 80, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h4" fontWeight={800} gutterBottom>How It Works</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto' }}>
              Get started in three simple steps. Your school's branding loads automatically.
            </Typography>
          </Box>
          <Grid container spacing={4}>
            {STEPS.map((step, i) => (
              <Grid size={{ xs: 12, md: 4 }} key={i}>
                <Fade in timeout={400 + i * 150}>
                  <Box sx={{ textAlign: 'center', position: 'relative' }}>
                    <Typography variant="h2" fontWeight={900} sx={{
                      color: alpha(theme.palette.primary.main, 0.12), mb: -1, lineHeight: 1,
                    }}>
                      {step.num}
                    </Typography>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 1, position: 'relative' }}>{step.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 280, mx: 'auto' }}>{step.desc}</Typography>
                    {i < STEPS.length - 1 && (
                      <Box sx={{ display: { xs: 'none', md: 'block' }, position: 'absolute', top: '30%', right: -20, color: 'text.disabled' }}>
                        <ArrowForwardIcon />
                      </Box>
                    )}
                  </Box>
                </Fade>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ═══════════════════════════════════════════════════════════════
          FEATURES SECTION
          ═══════════════════════════════════════════════════════════════ */}
      <Container maxWidth="lg" id="features-section" sx={{ py: { xs: 6, md: 10 }, scrollMarginTop: 80 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Chip
            icon={<AutoAwesomeIcon />} label="Why EduGuardian AI?"
            sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), color: 'primary.main', fontWeight: 700, mb: 2, '& .MuiChip-icon': { color: 'primary.main' } }}
          />
          <Typography variant="h4" fontWeight={800} gutterBottom>Everything Your School Needs</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            A complete platform connecting parents, teachers, students, counselors, and administrators through the power of AI.
          </Typography>
        </Box>
        <Grid container spacing={3}>
          {FEATURES.map((feature, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <Fade in timeout={400 + i * 100}>
                <Card sx={{
                  height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 4,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': { transform: 'translateY(-6px)', boxShadow: `0 16px 40px ${alpha(feature.color, 0.15)}` },
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{
                      width: 56, height: 56, borderRadius: 3, mb: 2,
                      bgcolor: alpha(feature.color, 0.1), color: feature.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      '& svg': { fontSize: 28 },
                    }}>
                      {feature.icon}
                    </Box>
                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>{feature.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{feature.desc}</Typography>
                  </CardContent>
                </Card>
              </Fade>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* ═══════════════════════════════════════════════════════════════
          SECURITY SECTION
          ═══════════════════════════════════════════════════════════════ */}
      <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
        <Container maxWidth="md">
          <Paper elevation={0} sx={{
            p: { xs: 4, md: 6 }, borderRadius: 5, border: '1px solid', borderColor: 'divider',
            background: `linear-gradient(135deg, ${alpha('#2563EB', 0.04)} 0%, ${alpha('#7C3AED', 0.03)} 100%)`,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
              <Box sx={{
                width: 64, height: 64, borderRadius: 4, flexShrink: 0,
                bgcolor: alpha('#DC2626', 0.1), color: '#DC2626',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <LockIcon sx={{ fontSize: 32 }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={800} gutterBottom>Multi-Tenant Security</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7, mb: 2 }}>
                  Every school has completely isolated data. Users can only access information belonging to their selected school.
                  No school can access another school's information. All data is protected with enterprise-grade row-level security.
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  <Chip label="Row-Level Security" size="small" sx={{ fontWeight: 600, bgcolor: alpha('#DC2626', 0.08), color: '#DC2626' }} />
                  <Chip label="School Isolation" size="small" sx={{ fontWeight: 600, bgcolor: alpha('#DC2626', 0.08), color: '#DC2626' }} />
                  <Chip label="Secure Auth" size="small" sx={{ fontWeight: 600, bgcolor: alpha('#DC2626', 0.08), color: '#DC2626' }} />
                </Stack>
              </Box>
            </Box>
          </Paper>
        </Container>
      </Box>

      {/* ═══════════════════════════════════════════════════════════════
          CTA SECTION
          ═══════════════════════════════════════════════════════════════ */}
      <Box sx={{
        py: { xs: 8, md: 10 },
        background: `linear-gradient(135deg, ${alpha('#2563EB', 0.06)} 0%, ${alpha('#7C3AED', 0.04)} 100%)`,
      }}>
        <Container maxWidth="sm">
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={800} gutterBottom>Ready to Get Started?</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 450, mx: 'auto' }}>
              Enter your school code or search for your school to begin. Join thousands of Malaysian schools already on EduGuardian AI.
            </Typography>
            <Button
              variant="contained" size="large" onClick={() => scrollTo('school-code-section')} endIcon={<ArrowForwardIcon />}
              sx={{ py: 1.5, px: 5, borderRadius: 3, fontWeight: 800, fontSize: '1.1rem', textTransform: 'none' }}
            >
              Find Your School
            </Button>
          </Box>
        </Container>
      </Box>

      {/* ═══════════════════════════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════════════════════════ */}
      <Box sx={{ py: 4, borderTop: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box component="img" src="/eduguardian-hero.webp" alt="EduGuardian AI" sx={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 1.5 }} />
              <Typography variant="body2" fontWeight={700} color="primary.main">EduGuardian AI</Typography>
            </Box>
            <Typography variant="caption" color="text.disabled">
              © 2026 EduGuardian AI. Malaysia's Smart AI School Management Platform.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
