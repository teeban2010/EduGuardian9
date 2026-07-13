import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Chip, Button, TextField,
  InputAdornment, Select, MenuItem, FormControl, InputLabel,
  LinearProgress, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Divider, useTheme, alpha, Skeleton, Fade,
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import WarningIcon from '@mui/icons-material/Warning';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import EmptyState from '../../components/common/EmptyState';

interface HomeworkItem {
  id: string;
  title: string;
  subject_name: string;
  due_date: string;
  status: 'pending' | 'completed' | 'late';
  description: string | null;
  subject_color: string | null;
  attachment_url: string | null;
}

const STATUS_CONFIG = {
  completed: { label: 'Completed', color: 'success' as const, icon: <CheckCircleIcon fontSize="small" /> },
  pending:   { label: 'Pending',   color: 'info' as const,    icon: <ScheduleIcon fontSize="small" /> },
  late:      { label: 'Late',      color: 'error' as const,   icon: <WarningIcon fontSize="small" /> },
};

function getColor(hw: HomeworkItem) {
  return hw.subject_color ?? '#2563EB';
}

function isOverdue(dueDate: string) {
  return new Date(dueDate) < new Date();
}

export default function Homework() {
  const theme = useTheme();
  const { profile } = useAuth();
  const { school } = useSchool();

  const [homework, setHomework] = useState<HomeworkItem[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<HomeworkItem | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!school?.id) return;
    const load = async () => {
      setLoading(true);
      const { data: hw } = await supabase
        .from('homework')
        .select('*')
        .eq('school_id', school.id)
        .order('due_date', { ascending: true });

      const items = (hw ?? []) as HomeworkItem[];

      // Auto-mark past-due items as late if still pending
      const now = new Date();
      const updated = items.map((h) =>
        h.status === 'pending' && new Date(h.due_date) < now ? { ...h, status: 'late' as const } : h
      );
      setHomework(updated);

      // Load submissions by parent
      if (profile?.id) {
        const { data: subs } = await supabase
          .from('homework_submissions')
          .select('homework_id, status')
          .eq('parent_id', profile.id);
        const map: Record<string, string> = {};
        (subs ?? []).forEach((s: { homework_id: string; status: string }) => { map[s.homework_id] = s.status; });
        setSubmissions(map);
      }

      setLoading(false);
    };
    load();
  }, [school?.id, profile?.id]);

  const effectiveStatus = (hw: HomeworkItem): 'pending' | 'completed' | 'late' => {
    if (submissions[hw.id] === 'submitted') return 'completed';
    return hw.status;
  };

  const markComplete = async (id: string) => {
    if (!profile?.id) return;
    setSaving(true);

    const homework_item = homework.find((h) => h.id === id);
    if (!homework_item) { setSaving(false); return; }

    // Find first student for this parent
    const { data: students } = await supabase
      .from('students')
      .select('id')
      .eq('parent_id', profile.id)
      .limit(1);
    const studentId = students?.[0]?.id;

    const { error } = await supabase.from('homework_submissions').upsert({
      homework_id: id,
      student_id: studentId ?? '00000000-0000-0000-0000-000000000000',
      parent_id: profile.id,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    }, { onConflict: 'homework_id,student_id' });

    if (!error) {
      setSubmissions((prev) => ({ ...prev, [id]: 'submitted' }));
    }
    setSaving(false);
    setSelected(null);
  };

  const subjects = ['all', ...Array.from(new Set(homework.map((h) => h.subject_name).filter(Boolean)))];

  const filtered = homework.filter((h) => {
    const eff = effectiveStatus(h);
    const matchSearch = h.title.toLowerCase().includes(search.toLowerCase()) ||
      h.subject_name.toLowerCase().includes(search.toLowerCase());
    const matchSubject = subjectFilter === 'all' || h.subject_name === subjectFilter;
    const matchStatus = statusFilter === 'all' || eff === statusFilter;
    return matchSearch && matchSubject && matchStatus;
  });

  const completedCount = homework.filter((h) => effectiveStatus(h) === 'completed').length;
  const progress = homework.length ? (completedCount / homework.length) * 100 : 0;

  return (
    <Fade in>
      <Box>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
            <Box sx={{
              width: 48, height: 48, borderRadius: 3,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AssignmentIcon sx={{ color: 'primary.main', fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={800}>Homework</Typography>
              <Typography variant="body2" color="text.secondary">Track and manage your child's assignments</Typography>
            </Box>
          </Box>
        </Box>

        {/* Progress summary */}
        <Card sx={{ mb: 3, background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`, borderColor: alpha(theme.palette.primary.main, 0.15) }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight={700}>This Week's Progress</Typography>
                <Typography variant="body2" color="text.secondary">
                  {loading ? '...' : `${completedCount} of ${homework.length} assignments completed`}
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight={800} color="primary.main">
                {loading ? '--' : `${Math.round(progress)}%`}
              </Typography>
            </Box>
            <LinearProgress
              variant={loading ? 'indeterminate' : 'determinate'}
              value={progress}
              sx={{ height: 10, borderRadius: 5 }}
            />
            {!loading && (
              <Box sx={{ display: 'flex', gap: 2.5, mt: 2, flexWrap: 'wrap' }}>
                {(['completed', 'pending', 'late'] as const).map((s) => {
                  const count = homework.filter((h) => effectiveStatus(h) === s).length;
                  const color = s === 'completed' ? '#10B981' : s === 'pending' ? theme.palette.primary.main : '#EF4444';
                  return (
                    <Box key={s} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: color }} />
                      <Typography variant="caption" fontWeight={600} sx={{ color }}>
                        {count} {s.charAt(0).toUpperCase() + s.slice(1)}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Search homework..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment>,
            }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Subject</InputLabel>
            <Select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} label="Subject">
              {subjects.map((s) => <MenuItem key={s} value={s}>{s === 'all' ? 'All Subjects' : s}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status">
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="late">Late</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* List */}
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} variant="rounded" height={76} sx={{ borderRadius: 3 }} />)}
          </Box>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No homework found"
            description={homework.length === 0 ? 'No assignments have been posted yet.' : 'No assignments match your current filters.'}
            icon={<AssignmentIcon sx={{ fontSize: 40 }} />}
          />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filtered.map((hw) => {
              const eff = effectiveStatus(hw);
              const color = getColor(hw);
              return (
                <Card
                  key={hw.id}
                  sx={{
                    cursor: 'pointer',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 6px 24px ${alpha(color, 0.18)}`,
                      borderColor: alpha(color, 0.3),
                    },
                    borderLeft: `4px solid ${color}`,
                  }}
                  onClick={() => setSelected(hw)}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{
                        width: 44, height: 44, borderRadius: 2.5,
                        bgcolor: alpha(color, 0.12),
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <AssignmentIcon sx={{ color }} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body1" fontWeight={700} noWrap>{hw.title}</Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5, flexWrap: 'wrap' }}>
                          <Chip size="small" label={hw.subject_name}
                            sx={{ height: 20, fontSize: '0.68rem', bgcolor: alpha(color, 0.1), color, fontWeight: 700, borderRadius: '6px' }} />
                          <Typography variant="caption"
                            sx={{ color: isOverdue(hw.due_date) && eff !== 'completed' ? 'error.main' : 'text.secondary', fontWeight: 500 }}>
                            Due {new Date(hw.due_date).toLocaleDateString('en-MY', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        size="small"
                        label={STATUS_CONFIG[eff].label}
                        color={STATUS_CONFIG[eff].color}
                        icon={STATUS_CONFIG[eff].icon}
                        sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}

        {/* Detail Dialog */}
        <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
          {selected && (() => {
            const eff = effectiveStatus(selected);
            const color = getColor(selected);
            return (
              <>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
                  <Box sx={{ width: 42, height: 42, borderRadius: 2.5, bgcolor: alpha(color, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AssignmentIcon sx={{ color }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={700}>{selected.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{selected.subject_name}</Typography>
                  </Box>
                  <IconButton onClick={() => setSelected(null)} size="small"><CloseIcon /></IconButton>
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ py: 3 }}>
                  <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
                    <Chip size="small" label={STATUS_CONFIG[eff].label} color={STATUS_CONFIG[eff].color} icon={STATUS_CONFIG[eff].icon} />
                    <Chip size="small" label={`Due ${new Date(selected.due_date).toLocaleDateString('en-MY', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}`} variant="outlined" />
                  </Box>
                  {selected.description && (
                    <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', mb: 3 }}>
                      <Typography variant="body2" lineHeight={1.8}>{selected.description}</Typography>
                    </Box>
                  )}
                  {selected.attachment_url && (
                    <Button variant="outlined" startIcon={<CloudUploadIcon />} fullWidth href={selected.attachment_url} target="_blank" sx={{ mb: 2 }}>
                      View Attached File
                    </Button>
                  )}
                </DialogContent>
                <Divider />
                <DialogActions sx={{ p: 2.5 }}>
                  <Button onClick={() => setSelected(null)} variant="outlined">Close</Button>
                  {eff !== 'completed' && (
                    <Button
                      variant="contained" startIcon={<CheckCircleIcon />} color="success"
                      onClick={() => markComplete(selected.id)} disabled={saving}
                    >
                      Mark as Complete
                    </Button>
                  )}
                </DialogActions>
              </>
            );
          })()}
        </Dialog>
      </Box>
    </Fade>
  );
}
