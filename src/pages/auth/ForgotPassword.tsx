import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TextField, Button,
  Alert, Link, useTheme, Fade,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { supabase } from '../../lib/supabase';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: theme.palette.mode === 'light'
          ? 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 50%, #EDE9FE 100%)'
          : 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
        p: 2,
      }}
    >
      <Fade in timeout={600}>
        <Card sx={{ width: '100%', maxWidth: 420, p: { xs: 1, sm: 2 } }}>
          <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
              <Box
                sx={{
                  width: 48, height: 48, borderRadius: 2,
                  background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <SchoolIcon sx={{ color: 'white', fontSize: 26 }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700} lineHeight={1.2}>Reset Password</Typography>
                <Typography variant="caption" color="text.secondary">EduGuardian AI</Typography>
              </Box>
            </Box>

            {success ? (
              <Box>
                <Alert severity="success" sx={{ mb: 3 }}>
                  Password reset email sent! Check your inbox.
                </Alert>
                <Button
                  fullWidth variant="contained"
                  onClick={() => navigate('/login')}
                  startIcon={<ArrowBackIcon />}
                >
                  Back to Login
                </Button>
              </Box>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Enter your email address and we'll send you a link to reset your password.
                </Typography>

                {error && (
                  <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <TextField
                    fullWidth label="Email address" type="email"
                    value={email} onChange={(e) => setEmail(e.target.value)} required
                  />
                  <Button type="submit" variant="contained" fullWidth size="large" disabled={loading} sx={{ py: 1.5 }}>
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                </Box>

                <Typography variant="body2" textAlign="center" color="text.secondary" sx={{ mt: 3 }}>
                  <Link component={RouterLink} to="/login" underline="hover" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                    <ArrowBackIcon fontSize="small" /> Back to login
                  </Link>
                </Typography>
              </>
            )}
          </CardContent>
        </Card>
      </Fade>
    </Box>
  );
}
