import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Box, Card, CardContent, Typography, TextField, Button,
  Divider, Alert, Avatar, Grid, Switch,
  List, ListItem, alpha, Select, MenuItem,
  FormControl, InputLabel,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PaletteIcon from '@mui/icons-material/Palette';
import LanguageIcon from '@mui/icons-material/Language';
import SecurityIcon from '@mui/icons-material/Security';
import EditIcon from '@mui/icons-material/Edit';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import SchoolIcon from '@mui/icons-material/School';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { useColorMode } from '../../contexts/ColorModeContext';

interface TabPanelProps { children?: React.ReactNode; index: number; value: number; }
function TabPanel({ children, value, index }: TabPanelProps) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

export default function Settings() {
  const { profile, updateProfile } = useAuth();
  const { school } = useSchool();
  const { mode, toggleColorMode } = useColorMode();
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? '',
    phone: profile?.phone ?? '',
  });
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState({
    homework: true, attendance: true, exams: true, announcements: true, messages: false,
  });
  const [language, setLanguage] = useState('en');

  const handleSaveProfile = async () => {
    setSaving(true);
    setSuccess('');
    setError('');
    const { error } = await updateProfile(form);
    setSaving(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess('Profile updated successfully!');
    }
  };

  const tabs = [
    { label: 'Profile', icon: <PersonIcon fontSize="small" /> },
    { label: 'Appearance', icon: <PaletteIcon fontSize="small" /> },
    { label: 'Notifications', icon: <NotificationsIcon fontSize="small" /> },
    { label: 'Language', icon: <LanguageIcon fontSize="small" /> },
    { label: 'Security', icon: <SecurityIcon fontSize="small" /> },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>Settings</Typography>
        <Typography variant="body2" color="text.secondary">Manage your account and preferences</Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Tab list */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <List disablePadding>
              {tabs.map((t, i) => (
                <Box key={t.label}>
                  {i > 0 && <Divider />}
                  <ListItem
                    onClick={() => setTab(i)}
                    sx={{
                      cursor: 'pointer', py: 1.5,
                      bgcolor: tab === i ? alpha('#2563EB', 0.08) : 'transparent',
                      borderLeft: tab === i ? '3px solid' : '3px solid transparent',
                      borderColor: tab === i ? 'primary.main' : 'transparent',
                      '&:hover': { bgcolor: alpha('#2563EB', 0.05) },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ color: tab === i ? 'primary.main' : 'text.secondary' }}>{t.icon}</Box>
                      <Typography variant="body2" fontWeight={tab === i ? 700 : 500} color={tab === i ? 'primary.main' : 'text.primary'}>
                        {t.label}
                      </Typography>
                    </Box>
                  </ListItem>
                </Box>
              ))}
            </List>
          </Card>
        </Grid>

        {/* Tab content */}
        <Grid size={{ xs: 12, md: 9 }}>
          <Card>
            <CardContent sx={{ p: 4 }}>
              {/* Profile */}
              <TabPanel value={tab} index={0}>
                <Typography variant="h6" fontWeight={700} gutterBottom>Profile Information</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Update your personal information</Typography>

                {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>{success}</Alert>}
                {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4, p: 3, borderRadius: 3, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                  <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '2rem' }}>
                    {profile?.full_name?.[0] ?? 'U'}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>{profile?.full_name ?? 'User'}</Typography>
                    <Typography variant="body2" color="text.secondary">{profile?.email}</Typography>
                    <Typography variant="caption" sx={{ textTransform: 'capitalize', color: 'primary.main', fontWeight: 600 }}>{profile?.role}</Typography>
                  </Box>
                  <Button startIcon={<EditIcon />} size="small" sx={{ ml: 'auto' }}>Change Photo</Button>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <TextField
                    fullWidth label="Full Name" value={form.full_name}
                    onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                  />
                  <TextField fullWidth label="Email" value={profile?.email ?? ''} disabled helperText="Email cannot be changed" />
                  <TextField
                    fullWidth label="Phone Number" value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+60 12-345 6789"
                  />
                  <Box sx={{
                    p: 2, borderRadius: 2, bgcolor: alpha('#2563EB', 0.04),
                    border: '1px solid', borderColor: alpha('#2563EB', 0.12),
                    display: 'flex', alignItems: 'center', gap: 2,
                  }}>
                    {school?.logo_url ? (
                      <Avatar src={school.logo_url} sx={{ width: 48, height: 48 }} />
                    ) : (
                      <Avatar sx={{ width: 48, height: 48, bgcolor: alpha('#2563EB', 0.1) }}>
                        <SchoolIcon sx={{ color: 'primary.main' }} />
                      </Avatar>
                    )}
                    <Box>
                      <Typography variant="body2" fontWeight={700}>{school?.school_name ?? 'No school'}</Typography>
                      <Typography variant="caption" color="text.secondary">{school?.state ?? ''}</Typography>
                    </Box>
                  </Box>
                  <Button variant="contained" onClick={handleSaveProfile} disabled={saving} sx={{ alignSelf: 'flex-start', px: 4 }}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Box>
              </TabPanel>

              {/* Appearance */}
              <TabPanel value={tab} index={1}>
                <Typography variant="h6" fontWeight={700} gutterBottom>Appearance</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Customize how EduGuardian AI looks</Typography>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Light Mode', value: 'light', icon: <LightModeIcon sx={{ fontSize: 32 }} /> },
                    { label: 'Dark Mode', value: 'dark', icon: <DarkModeIcon sx={{ fontSize: 32 }} /> },
                  ].map((option) => (
                    <Box
                      key={option.value}
                      onClick={() => { if (mode !== option.value) toggleColorMode(); }}
                      sx={{
                        width: 160, p: 3, borderRadius: 3, textAlign: 'center',
                        cursor: 'pointer', border: '2px solid',
                        borderColor: mode === option.value ? 'primary.main' : 'divider',
                        bgcolor: mode === option.value ? alpha('#2563EB', 0.05) : 'transparent',
                        transition: 'all 0.2s',
                        '&:hover': { borderColor: 'primary.main' },
                      }}
                    >
                      <Box sx={{ color: mode === option.value ? 'primary.main' : 'text.secondary', mb: 1 }}>
                        {option.icon}
                      </Box>
                      <Typography variant="body2" fontWeight={mode === option.value ? 700 : 500}>
                        {option.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </TabPanel>

              {/* Notifications */}
              <TabPanel value={tab} index={2}>
                <Typography variant="h6" fontWeight={700} gutterBottom>Notification Preferences</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Choose what you want to be notified about</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {Object.entries(notifications).map(([key, value], i) => (
                    <Box key={key}>
                      {i > 0 && <Divider />}
                      <Box sx={{ py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="body2" fontWeight={600} sx={{ textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {key === 'homework' ? 'When homework is assigned or due' :
                              key === 'attendance' ? 'When attendance is recorded' :
                              key === 'exams' ? 'Exam reminders and results' :
                              key === 'announcements' ? 'New school announcements' :
                              'Messages from teachers'}
                          </Typography>
                        </Box>
                        <Switch
                          checked={value}
                          onChange={() => setNotifications((p) => ({ ...p, [key]: !value }))}
                          color="primary"
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </TabPanel>

              {/* Language */}
              <TabPanel value={tab} index={3}>
                <Typography variant="h6" fontWeight={700} gutterBottom>Language & Region</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Set your preferred language</Typography>
                <FormControl fullWidth sx={{ maxWidth: 300 }}>
                  <InputLabel>Language</InputLabel>
                  <Select value={language} onChange={(e) => setLanguage(e.target.value)} label="Language">
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="ms">Bahasa Malaysia</MenuItem>
                    <MenuItem value="zh">中文 (Chinese)</MenuItem>
                    <MenuItem value="ta">தமிழ் (Tamil)</MenuItem>
                  </Select>
                </FormControl>
              </TabPanel>

              {/* Security */}
              <TabPanel value={tab} index={4}>
                <Typography variant="h6" fontWeight={700} gutterBottom>Security</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Manage your account security</Typography>
                {pwSuccess && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setPwSuccess('')}>{pwSuccess}</Alert>}
                {pwError && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setPwError('')}>{pwError}</Alert>}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 400 }}>
                  <TextField fullWidth label="New Password" type="password" value={pwForm.newPw} onChange={(e) => setPwForm((p) => ({ ...p, newPw: e.target.value }))} />
                  <TextField fullWidth label="Confirm New Password" type="password" value={pwForm.confirm} onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))} error={!!pwForm.confirm && pwForm.confirm !== pwForm.newPw} helperText={pwForm.confirm && pwForm.confirm !== pwForm.newPw ? 'Passwords do not match' : ''} />
                  <Button variant="contained" startIcon={<LockIcon />} disabled={!pwForm.newPw || pwForm.newPw !== pwForm.confirm || pwSaving}
                    onClick={async () => {
                      setPwSaving(true); setPwError(''); setPwSuccess('');
                      const { error } = await supabase.auth.updateUser({ password: pwForm.newPw });
                      setPwSaving(false);
                      if (error) { setPwError(error.message); }
                      else { setPwSuccess('Password updated successfully!'); setPwForm({ current: '', newPw: '', confirm: '' }); }
                    }}
                    sx={{ alignSelf: 'flex-start', px: 4 }}>
                    {pwSaving ? 'Updating...' : 'Update Password'}
                  </Button>
                </Box>
              </TabPanel>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
