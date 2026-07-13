import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TextField, Button,
  Divider, Alert, IconButton, InputAdornment, Link, useTheme, Fade, alpha,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import SchoolIcon from '@mui/icons-material/School';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { school } = useSchool();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: theme.palette.mode === 'light'
          ? 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 50%, #EDE9FE 100%)'
          : 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
      }}
    >
      {/* Left panel */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          width: '45%',
          background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 50%, #7C3AED 100%)',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 6,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)', top: -100, right: -100 }} />
        <Box sx={{ position: 'absolute', width: 250, height: 250, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)', bottom: 50, left: -50 }} />

        <Box sx={{ zIndex: 1, textAlign: 'center' }}>
          <Box
            sx={{
              width: 110, height: 110, borderRadius: 3,
              mx: 'auto', mb: 3, display: 'block',
              bgcolor: 'rgba(255,255,255,0.95)', p: 1,
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              overflow: 'hidden',
            }}
          >
            {school?.logo_url ? (
              <Box component="img" src={school.logo_url} alt={school.school_name} sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SchoolIcon sx={{ fontSize: 56, color: 'primary.main' }} />
              </Box>
            )}
          </Box>
          <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.6)', letterSpacing: 2, display: 'block', mb: 0.5 }}>
            {school?.school_type ?? 'School'}
          </Typography>
          <Typography variant="h4" fontWeight={800} color="white" gutterBottom>
            {school?.school_name ?? 'EduGuardian AI'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', fontStyle: 'italic', display: 'block', mb: 2 }}>
            {school?.state ? `${school.state}, Malaysia` : 'Malaysia'}
          </Typography>
          <Box sx={{ width: 40, height: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.25)', mx: 'auto', mb: 2 }} />
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', maxWidth: 300, mb: 0.5 }}>
            Powered by <strong>EduGuardian AI</strong>
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', maxWidth: 300 }}>
            Connecting parents, teachers & students
          </Typography>

          <Box sx={{ mt: 6, display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left' }}>
            {['Track homework & attendance', 'AI-powered learning assistant', 'Real-time progress analytics', 'Direct teacher communication'].map((f) => (
              <Box key={f} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10B981', flexShrink: 0 }} />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>{f}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Right panel */}
      <Box
        sx={{
          flex: 1, display: 'flex',
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'center',
          p: { xs: 2, sm: 4 },
          pt: { xs: 4, sm: 4 },
          pb: { xs: 4, sm: 4 },
        }}
      >
        <Fade in timeout={600}>
          <Card sx={{ width: '100%', maxWidth: 440, p: { xs: 0, sm: 2 } }}>
            <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
              <Box sx={{ mb: 4 }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    display: { xs: 'flex', md: 'none' },
                    mb: 2,
                    borderRadius: 1.5,
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {school?.logo_url ? (
                    <Box component="img" src={school.logo_url} alt={school.school_name} sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 0.5 }} />
                  ) : (
                    <SchoolIcon sx={{ color: 'primary.main' }} />
                  )}
                </Box>
                <Typography variant="h5" fontWeight={700} gutterBottom>Welcome back</Typography>
                <Typography variant="body2" color="text.secondary">
                  Sign in to your EduGuardian AI account
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField
                  fullWidth
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowPassword((s) => !s)}>
                          {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Box sx={{ textAlign: 'right' }}>
                  <Link component={RouterLink} to="/forgot-password" variant="body2" underline="hover">
                    Forgot password?
                  </Link>
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={loading}
                  sx={{ py: 1.5, mt: 0.5 }}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </Box>

              <Divider sx={{ my: 3 }}>
                <Typography variant="caption" color="text.secondary">OR</Typography>
              </Divider>

              <Typography variant="body2" textAlign="center" color="text.secondary">
                Don't have an account?{' '}
                <Link component={RouterLink} to="/register" fontWeight={600} underline="hover">
                  Create one
                </Link>
              </Typography>
            </CardContent>
          </Card>
        </Fade>
      </Box>
    </Box>
  );
}
