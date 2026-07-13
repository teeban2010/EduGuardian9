import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, Dialog, DialogTitle, DialogContent, DialogActions,
  Avatar, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, InputAdornment, alpha, useTheme, Alert, LinearProgress, Grid, CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  School as SchoolIcon,
  Map as MapIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Language as WebsiteIcon,
  AutoAwesome as AutoAwesomeIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { supabase } from '../../lib/supabase';
import type { School, SchoolType, SchoolStatus, SubscriptionTier } from '../../types';

const SCHOOL_TYPES: { value: SchoolType; label: string }[] = [
  { value: 'SK', label: 'Sekolah Kebangsaan' },
  { value: 'SJKC', label: 'SJK(C)' },
  { value: 'SJKT', label: 'SJK(T)' },
  { value: 'SMK', label: 'Sekolah Menengah Kebangsaan' },
  { value: 'SMJK', label: 'SMJK' },
  { value: 'MRSM', label: 'MRSM' },
  { value: 'SBP', label: 'Sekolah Berasrama Penuh' },
  { value: 'PRIVATE', label: 'Private School' },
  { value: 'INTERNATIONAL', label: 'International School' },
];

const SUBSCRIPTION_TIERS: { value: SubscriptionTier; label: string; color: string }[] = [
  { value: 'free', label: 'Free', color: '#64748B' },
  { value: 'basic', label: 'Basic', color: '#2563EB' },
  { value: 'premium', label: 'Premium', color: '#8B5CF6' },
  { value: 'enterprise', label: 'Enterprise', color: '#059669' },
];

const STATUS_COLORS: Record<SchoolStatus, string> = {
  pending: '#F59E0B',
  active: '#10B981',
  suspended: '#EF4444',
  inactive: '#64748B',
};

const MALAYSIAN_STATES = [
  'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan', 'Pahang',
  'Perak', 'Perlis', 'Pulau Pinang', 'Sabah', 'Sarawak', 'Selangor',
  'Terengganu', 'Kuala Lumpur', 'Labuan', 'Putrajaya',
];

export default function SuperAdminDashboard() {
  const theme = useTheme();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    school_name: '',
    school_code: '',
    school_type: 'SMK' as SchoolType,
    address: '',
    city: '',
    district: '',
    state: 'Negeri Sembilan',
    postcode: '',
    email: '',
    phone: '',
    website: '',
    principal_name: '',
    enrollment_count: 0,
    subscription_tier: 'free' as SubscriptionTier,
    status: 'pending' as SchoolStatus,
    logo_url: '' as string | null,
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('schools')
      .select('*')
      .order('created_at', { ascending: false });
    setSchools((data as School[]) ?? []);
    setLoading(false);
  };

  const generateSchoolCode = (name: string) => {
    const prefix = name.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 6);
    const suffix = String(Math.floor(Math.random() * 900) + 100);
    return `${prefix}${suffix}`;
  };

  const handleLogoUpload = async (file: File) => {
    if (!file) return;
    setUploadingLogo(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `school-logos/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('school-assets')
        .upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('school-assets').getPublicUrl(fileName);
      setForm((f) => ({ ...f, logo_url: urlData.publicUrl }));
      setSuccess('Logo uploaded successfully');
    } catch (err: unknown) {
      setError(`Logo upload failed: ${(err as Error).message}`);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleOpenDialog = (school?: School) => {
    if (school) {
      setEditingSchool(school);
      setForm({
        school_name: school.school_name,
        school_code: school.school_code,
        school_type: school.school_type,
        address: school.address || '',
        city: school.city || '',
        district: school.district || '',
        state: school.state,
        postcode: school.postcode || '',
        email: school.email || '',
        phone: school.phone || '',
        website: school.website || '',
        principal_name: school.principal_name || '',
        enrollment_count: school.enrollment_count || 0,
        subscription_tier: school.subscription_tier,
        status: school.status,
        logo_url: school.logo_url,
      });
    } else {
      setEditingSchool(null);
      setForm({
        school_name: '',
        school_code: '',
        school_type: 'SMK',
        address: '',
        city: '',
        district: '',
        state: 'Negeri Sembilan',
        postcode: '',
        email: '',
        phone: '',
        website: '',
        principal_name: '',
        enrollment_count: 0,
        subscription_tier: 'free',
        status: 'pending',
        logo_url: null,
      });
    }
    setDialogOpen(true);
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    if (!form.school_name || !form.school_code || !form.state) {
      setError('School name, code, and state are required');
      setSaving(false);
      return;
    }

    try {
      if (editingSchool) {
        const { error: updateError } = await supabase
          .from('schools')
          .update({
            ...form,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingSchool.id);

        if (updateError) throw updateError;
        setSuccess(`${form.school_name} updated successfully`);
      } else {
        const { error: insertError } = await supabase
          .from('schools')
          .insert([form]);

        if (insertError) throw insertError;
        setSuccess(`${form.school_name} registered successfully`);
      }

      setDialogOpen(false);
      loadSchools();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (schoolId: string, newStatus: SchoolStatus) => {
    await supabase
      .from('schools')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', schoolId);
    loadSchools();
  };

  const filteredSchools = schools.filter((s) => {
    const matchesSearch = s.school_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.school_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.state.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: schools.length,
    active: schools.filter((s) => s.status === 'active').length,
    pending: schools.filter((s) => s.status === 'pending').length,
    premium: schools.filter((s) => ['premium', 'enterprise'].includes(s.subscription_tier)).length,
  };

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Typography variant="h5" fontWeight={800} sx={{ mb: 3 }}>
        Super Admin Dashboard
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Manage all schools registered on EduGuardian AI
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[
          { label: 'Total Schools', value: stats.total, IconComp: SchoolIcon, color: theme.palette.primary.main },
          { label: 'Active', value: stats.active, IconComp: CheckCircleIcon, color: '#10B981' },
          { label: 'Pending Approval', value: stats.pending, IconComp: BlockIcon, color: '#F59E0B' },
          { label: 'Premium Schools', value: stats.premium, IconComp: WebsiteIcon, color: '#8B5CF6' },
        ].map(({ label, value, IconComp, color }) => (
          <Grid key={label} size={{ xs: 12, sm: 6, md: 3 } as const}>
            <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 48, height: 48, borderRadius: 2.5,
                      bgcolor: alpha(color, 0.1),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color,
                    }}
                  >
                    {(() => {
                      const I = IconComp as React.ComponentType<{ sx?: { fontSize: number } }>;
                      return <I sx={{ fontSize: 24 }} />;
                    })()}
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight={800}>{value}</Typography>
                    <Typography variant="body2" color="text.secondary">{label}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2.5 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2.5 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Actions */}
      <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              placeholder="Search schools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              sx={{ minWidth: 280 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ flex: 1 }} />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{ borderRadius: 2.5, fontWeight: 700 }}
            >
              Add School
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Schools Table */}
      <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
        {loading && <LinearProgress />}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                <TableCell sx={{ fontWeight: 700 }}>School</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>State</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Plan</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSchools.map((s) => (
                <TableRow
                  key={s.id}
                  hover
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        src={s.logo_url || undefined}
                        sx={{
                          width: 44, height: 44, borderRadius: 2,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                        }}
                      >
                        <SchoolIcon sx={{ color: 'primary.main' }} />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>{s.school_name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {s.email || 'No email'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                      {s.school_code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <MapIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2">{s.state}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{s.school_type}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={SUBSCRIPTION_TIERS.find((t) => t.value === s.subscription_tier)?.label || s.subscription_tier}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        bgcolor: alpha(SUBSCRIPTION_TIERS.find((t) => t.value === s.subscription_tier)?.color || '#64748B', 0.12),
                        color: SUBSCRIPTION_TIERS.find((t) => t.value === s.subscription_tier)?.color || '#64748B',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={s.status}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        bgcolor: alpha(STATUS_COLORS[s.status], 0.12),
                        color: STATUS_COLORS[s.status],
                        textTransform: 'capitalize',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>
                    <IconButton size="small" onClick={() => handleOpenDialog(s)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    {s.status !== 'active' && (
                      <IconButton
                        size="small"
                        onClick={() => handleStatusChange(s.id, 'active')}
                        sx={{ color: '#10B981' }}
                      >
                        <CheckCircleIcon fontSize="small" />
                      </IconButton>
                    )}
                    {s.status === 'active' && (
                      <IconButton
                        size="small"
                        onClick={() => handleStatusChange(s.id, 'suspended')}
                        sx={{ color: '#EF4444' }}
                      >
                        <BlockIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editingSchool ? 'Edit School' : 'Register New School'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 8 }}>
                <TextField
                  fullWidth
                  label="School Name"
                  value={form.school_name}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, school_name: e.target.value }));
                    if (!editingSchool && !form.school_code) {
                      setForm((f) => ({ ...f, school_code: generateSchoolCode(e.target.value) }));
                    }
                  }}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="School Code"
                  value={form.school_code}
                  onChange={(e) => setForm((f) => ({ ...f, school_code: e.target.value.toUpperCase() }))}
                  required
                  inputProps={{ style: { fontFamily: 'monospace', fontWeight: 700 } }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setForm((f) => ({ ...f, school_code: generateSchoolCode(form.school_name || 'SCH') }))}
                          title="Generate code"
                        >
                          <AutoAwesomeIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Logo Upload */}
              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 64, height: 64, borderRadius: 2, flexShrink: 0,
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '2px dashed', borderColor: 'divider', overflow: 'hidden',
                    }}
                  >
                    {form.logo_url ? (
                      <Box component="img" src={form.logo_url} alt="Logo" sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 1 }} />
                    ) : (
                      <SchoolIcon sx={{ color: 'text.disabled' }} />
                    )}
                  </Box>
                  <Box>
                    <Button
                      variant="outlined" size="small" startIcon={uploadingLogo ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                      component="label" disabled={uploadingLogo}
                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                    >
                      {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                      <input type="file" hidden accept="image/*" onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])} />
                    </Button>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      PNG, JPG, or WebP. Max 2MB.
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>School Type</InputLabel>
                  <Select
                    value={form.school_type}
                    label="School Type"
                    onChange={(e) => setForm((f) => ({ ...f, school_type: e.target.value as SchoolType }))}
                  >
                    {SCHOOL_TYPES.map((t) => (
                      <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>State</InputLabel>
                  <Select
                    value={form.state}
                    label="State"
                    onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                  >
                    {MALAYSIAN_STATES.map((s) => (
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Address"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  multiline
                  rows={2}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="City"
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="District"
                  value={form.district}
                  onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Postcode"
                  value={form.postcode}
                  onChange={(e) => setForm((f) => ({ ...f, postcode: e.target.value }))}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><EmailIcon color="action" /></InputAdornment>,
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><PhoneIcon color="action" /></InputAdornment>,
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Website"
                  value={form.website}
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><WebsiteIcon color="action" /></InputAdornment>,
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Principal Name"
                  value={form.principal_name}
                  onChange={(e) => setForm((f) => ({ ...f, principal_name: e.target.value }))}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="Enrollment Count"
                  type="number"
                  value={form.enrollment_count}
                  onChange={(e) => setForm((f) => ({ ...f, enrollment_count: parseInt(e.target.value) || 0 }))}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Subscription</InputLabel>
                  <Select
                    value={form.subscription_tier}
                    label="Subscription"
                    onChange={(e) => setForm((f) => ({ ...f, subscription_tier: e.target.value as SubscriptionTier }))}
                  >
                    {SUBSCRIPTION_TIERS.map((t) => (
                      <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={form.status}
                    label="Status"
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as SchoolStatus }))}
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="suspended">Suspended</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : editingSchool ? 'Update School' : 'Register School'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
