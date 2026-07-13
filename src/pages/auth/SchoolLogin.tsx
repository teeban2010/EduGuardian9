import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Alert,
  IconButton,
  InputAdornment,
  CircularProgress,
  alpha,
  useTheme,
  FormControlLabel,
  Checkbox,
  Link,
  Divider,
  Fade,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SchoolIcon from '@mui/icons-material/School';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';

export default function SchoolLogin() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { signIn, loading: authLoading, profile } = useAuth();
  const { school, clearSchool, enterGuestMode } = useSchool();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!school && !authLoading) navigate('/');
  }, [school, authLoading, navigate]);

  useEffect(() => {
    if (profile && school) navigate('/dashboard');
  }, [profile, school, navigate]);

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('eduguardian_remember_email');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleBack = () => {
    clearSchool();
    navigate('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!school) {
        setError('No school selected.');
        return;
      }

      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        setError(signInError.message || 'Invalid email or password');
        return;
      }

      if (rememberMe) {
        localStorage.setItem('eduguardian_remember_email', email);
      } else {
        localStorage.removeItem('eduguardian_remember_email');
      }

      navigate('/dashboard');
    } catch (err: unknown) {
      setError((err as Error).message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAccess = () => {
    enterGuestMode();
    navigate('/dashboard');
  };

  if (!school) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: { xs: 'flex-start', sm: 'center' },
      p: { xs: 1.5, sm: 3 },
      pt: { xs: 3, sm: 3 },
      pb: { xs: 3, sm: 3 },
      bgcolor: 'background.default',
      background: `linear-gradient(135deg, ${alpha('#2563EB', 0.04)} 0%, ${alpha('#7C3AED', 0.03)} 100%)`,
    }}>
      <Fade in timeout={500}>
        <Card elevation={0} sx={{
          maxWidth: 480, width: '100%', borderRadius: { xs: 4, sm: 5 },
          border: '1px solid', borderColor: 'divider',
          boxShadow: `0 24px 80px ${alpha(theme.palette.primary.main, 0.08)}`,
        }}>
          <CardContent sx={{ p: { xs: 2.5, sm: 5 } }}>
            {/* Back button */}
            <Button startIcon={<ArrowBackIcon />} onClick={handleBack}
              sx={{ mb: 2, px: 0, fontWeight: 600, color: 'text.secondary', textTransform: 'none' }}>
              Back
            </Button>

            {/* School branding */}
            <Box sx={{ textAlign: 'center', mb: { xs: 2.5, sm: 4 } }}>
              <Box sx={{
                width: { xs: 72, sm: 88 },
                height: { xs: 72, sm: 88 },
                borderRadius: 4, mx: 'auto', mb: 1.5,
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid', borderColor: alpha(theme.palette.primary.main, 0.1),
                overflow: 'hidden',
              }}>
                {school.logo_url ? (
                  <Box component="img" src={school.logo_url} alt={school.school_name}
                    sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 1.5 }} />
                ) : (
                  <SchoolIcon sx={{ fontSize: { xs: 36, sm: 44 }, color: 'primary.main' }} />
                )}
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600, letterSpacing: 1 }}>
                WELCOME TO
              </Typography>
              <Typography variant="h6" fontWeight={800} sx={{
                color: 'primary.main', mb: 0.75,
                fontSize: { xs: '1rem', sm: '1.25rem' },
                lineHeight: 1.3,
              }}>
                {school.school_name}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.5 }}>
                <LocationOnIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                <Typography variant="caption" color="text.secondary">
                  {school.city ? `${school.city}, ` : ''}{school.state}
                </Typography>
              </Box>

              <Typography variant="caption" sx={{
                fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.1em', color: 'text.disabled',
              }}>
                {school.school_code}
              </Typography>
            </Box>

            <Divider sx={{ mb: 2.5 }}><Typography variant="caption" color="text.secondary">Continue with Login</Typography></Divider>

            {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2.5 }}>{error}</Alert>}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth label="Email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)} sx={{ mb: 1.5 }} required
                InputProps={{ startAdornment: (<InputAdornment position="start"><EmailIcon color="action" /></InputAdornment>) }}
              />

              <TextField
                fullWidth label="Password" type={showPassword ? 'text' : 'password'} value={password}
                onChange={(e) => setPassword(e.target.value)} sx={{ mb: 1 }} required
                InputProps={{
                  startAdornment: (<InputAdornment position="start"><LockIcon color="action" /></InputAdornment>),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <FormControlLabel
                  control={<Checkbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} size="small" />}
                  label={<Typography variant="body2">Remember Me</Typography>}
                />
                <Link component="button" type="button" variant="body2"
                  onClick={() => navigate('/forgot-password')}
                  sx={{ textDecoration: 'none', cursor: 'pointer', fontWeight: 500 }}>
                  Forgot Password?
                </Link>
              </Box>

              <Button fullWidth type="submit" variant="contained" size="large" disabled={loading}
                sx={{ py: { xs: 1.5, sm: 2 }, borderRadius: 3, fontWeight: 800, fontSize: '1rem', textTransform: 'none', mb: 1.5 }}>
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
              </Button>

              {/* Google Login */}
              <Button fullWidth variant="outlined" size="large"
                sx={{ py: { xs: 1.5, sm: 2 }, borderRadius: 3, fontWeight: 700, textTransform: 'none', mb: 2.5 }}
                startIcon={
                  <Box sx={{ width: 20, height: 20 }}>
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  </Box>
                }>
                Continue with Google
              </Button>

              {/* Guest mode */}
              <Divider sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">OR</Typography>
              </Divider>

              <Button
                fullWidth
                variant="text"
                size="large"
                onClick={handleGuestAccess}
                startIcon={<VisibilityOutlinedIcon />}
                sx={{
                  py: 1.25, borderRadius: 3, fontWeight: 700, textTransform: 'none', mb: 2,
                  color: 'text.secondary',
                  border: '1px dashed', borderColor: 'divider',
                  '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.5), borderColor: 'text.disabled' },
                }}
              >
                Continue as Guest
              </Button>

              {/* Register link */}
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Don't have an account?{' '}
                  <Link component="button" type="button" onClick={() => navigate('/register')}
                    sx={{ fontWeight: 700, cursor: 'pointer' }}>
                    Register
                  </Link>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Fade>

      <Typography variant="caption" color="text.disabled" sx={{ mt: 2 }}>
        © 2026 EduGuardian AI. All rights reserved.
      </Typography>
    </Box>
  );
}
