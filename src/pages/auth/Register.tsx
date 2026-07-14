import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  IconButton,
  InputAdornment,
  Link,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
  Fade,
  alpha,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import SchoolIcon from '@mui/icons-material/School';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';

type RegistrationRole =
  | 'parent'
  | 'teacher'
  | 'student'
  | 'counselor';

interface RegistrationForm {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const normalisePhone = (phone: string) => {
  let value = phone.replace(/\D/g, '');

  if (value.startsWith('60')) {
    value = `0${value.slice(2)}`;
  }

  return value;
};

export default function Register() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { school } = useSchool();
  const theme = useTheme();

  const [form, setForm] = useState<RegistrationForm>({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [role, setRole] =
    useState<RegistrationRole>('parent');

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const handleChange =
    (field: keyof RegistrationForm) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((previous) => ({
        ...previous,
        [field]: event.target.value,
      }));
    };

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();
    setError('');

    if (!school?.id) {
      setError(
        'School information could not be identified. Please return to the school login page and try again.',
      );
      return;
    }

    if (!form.fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    const phone = normalisePhone(form.phone);

    if (!phone) {
      setError('Please enter a valid phone number.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (form.password.length < 6) {
      setError(
        'Password must be at least 6 characters.',
      );
      return;
    }

    setLoading(true);

    const { error: signUpError } = await signUp(
      form.email.trim(),
      form.password,
      form.fullName.trim(),
      role,
      phone,
      school.id,
      school.school_name,
    );

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    navigate('/dashboard');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          theme.palette.mode === 'light'
            ? 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 50%, #EDE9FE 100%)'
            : 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
        p: 2,
      }}
    >
      <Fade in timeout={600}>
        <Card
          sx={{
            width: '100%',
            maxWidth: 480,
            p: { xs: 1, sm: 2 },
          }}
        >
          <CardContent
            sx={{
              p: { xs: 2, sm: 4 },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                mb: 4,
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 1.5,
                  flexShrink: 0,
                  bgcolor: alpha(
                    theme.palette.primary.main,
                    0.08,
                  ),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {school?.logo_url ? (
                  <Box
                    component="img"
                    src={school.logo_url}
                    alt={
                      school.school_name ??
                      'School logo'
                    }
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      p: 0.5,
                    }}
                  />
                ) : (
                  <SchoolIcon
                    sx={{ color: 'primary.main' }}
                  />
                )}
              </Box>

              <Box>
                <Typography
                  variant="subtitle2"
                  fontWeight={700}
                  lineHeight={1.2}
                >
                  {school?.school_name ??
                    'EduGuardian AI'}
                </Typography>

                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  Create your EduGuardian AI account
                </Typography>
              </Box>
            </Box>

            {error && (
              <Alert
                severity="error"
                sx={{ mb: 3 }}
                onClose={() => setError('')}
              >
                {error}
              </Alert>
            )}

            <Box sx={{ mb: 3 }}>
              <Typography
                variant="body2"
                fontWeight={600}
                gutterBottom
                color="text.secondary"
              >
                I am a
              </Typography>

              <ToggleButtonGroup
                value={role}
                exclusive
                onChange={(_, value) => {
                  if (value) {
                    setRole(value);
                  }
                }}
                fullWidth
                size="small"
                sx={{
                  '& .MuiToggleButton-root': {
                    borderRadius: 2,
                    py: 1,
                    fontSize: '0.75rem',
                  },
                }}
              >
                <ToggleButton value="parent">
                  Parent
                </ToggleButton>

                <ToggleButton value="teacher">
                  Teacher
                </ToggleButton>

                <ToggleButton value="student">
                  Student
                </ToggleButton>

                <ToggleButton value="counselor">
                  Counselor
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2.5,
              }}
            >
              <TextField
                fullWidth
                label="Full Name"
                value={form.fullName}
                onChange={handleChange('fullName')}
                required
                helperText={
                  role === 'parent'
                    ? 'Use the same full name recorded by the school.'
                    : undefined
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon
                        sx={{
                          fontSize: 18,
                          color: 'text.secondary',
                        }}
                      />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Phone Number"
                value={form.phone}
                onChange={handleChange('phone')}
                required
                placeholder="0123456789"
                helperText={
                  role === 'parent'
                    ? 'Use the current phone number registered with the school.'
                    : 'Enter your current phone number.'
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon
                        sx={{
                          fontSize: 18,
                          color: 'text.secondary',
                        }}
                      />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Email address"
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                required
              />

              <TextField
                fullWidth
                label="Password"
                type={
                  showPassword
                    ? 'text'
                    : 'password'
                }
                value={form.password}
                onChange={handleChange('password')}
                required
                helperText="Minimum 6 characters"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() =>
                          setShowPassword(
                            (current) => !current,
                          )
                        }
                        edge="end"
                        aria-label={
                          showPassword
                            ? 'Hide password'
                            : 'Show password'
                        }
                      >
                        {showPassword ? (
                          <VisibilityOffIcon fontSize="small" />
                        ) : (
                          <VisibilityIcon fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Confirm Password"
                type={
                  showPassword
                    ? 'text'
                    : 'password'
                }
                value={form.confirmPassword}
                onChange={handleChange(
                  'confirmPassword',
                )}
                required
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading || !school?.id}
                sx={{
                  py: 1.5,
                  mt: 0.5,
                }}
              >
                {loading
                  ? 'Creating account...'
                  : 'Create Account'}
              </Button>
            </Box>

            <Typography
              variant="body2"
              textAlign="center"
              color="text.secondary"
              sx={{ mt: 3 }}
            >
              Already have an account?{' '}
              <Link
                component={RouterLink}
                to="/school-login"
                fontWeight={600}
                underline="hover"
              >
                Sign in
              </Link>
            </Typography>
          </CardContent>
        </Card>
      </Fade>
    </Box>
  );
}