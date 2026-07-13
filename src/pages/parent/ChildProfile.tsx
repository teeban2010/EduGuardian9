import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Avatar, Button, Grid, Chip,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Divider, LinearProgress, Tab, Tabs, IconButton, alpha,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import SchoolIcon from '@mui/icons-material/School';
import CakeIcon from '@mui/icons-material/Cake';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { supabase } from '../../lib/supabase';
import type { Student } from '../../types';

const ACHIEVEMENTS = [
  { title: "Math Wizard", icon: "🏆", desc: "Scored 100% in Math Quiz" },
  { title: "Perfect Attendance", icon: "⭐", desc: "30 days without absence" },
  { title: "Science Star", icon: "🔬", desc: "Best Science project" },
  { title: "Reading Champion", icon: "📚", desc: "Read 20 books this term" },
];

const SUBJECT_COLORS = ['#2563EB','#10B981','#8B5CF6','#F59E0B','#EF4444','#0891B2'];

interface GradeSummary { subject: string; grade: string; score: number; color: string; }

interface TabPanelProps { children?: React.ReactNode; index: number; value: number; }
function TabPanel({ children, value, index }: TabPanelProps) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

export default function ChildProfile() {
  const { user } = useAuth();
  const { school } = useSchool();
  const [students, setStudents] = useState<Student[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState({ full_name: '', class_name: '', grade_level: '', date_of_birth: '', student_id_number: '' });
  const [saving, setSaving] = useState(false);
  const [grades, setGrades] = useState<GradeSummary[]>([]);  const [gradesLoading, setGradesLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('students').select('*').order('created_at').then(({ data }) => {
      const s = (data as Student[]) ?? [];
      setStudents(s);
      if (s.length > 0) setActiveStudent(s[0]);
    });
  }, [user]);

  const handleSaveStudent = async () => {
    if (!form.full_name || !user || !school) return;
    setSaving(true);
    if (editOpen && activeStudent) {
      await supabase.from('students').update(form).eq('id', activeStudent.id);
    } else {
      await supabase.from('students').insert({ ...form, parent_id: user.id, school_id: school.id });
    }
    const { data } = await supabase.from('students').select('*').eq('school_id', school.id).order('created_at');
    const s = (data as Student[]) ?? [];
    setStudents(s);
    if (s.length > 0 && !activeStudent) setActiveStudent(s[0]);
    setSaving(false);
    setAddOpen(false);
    setEditOpen(false);
    setForm({ full_name: '', class_name: '', grade_level: '', date_of_birth: '', student_id_number: '' });
  };

  const openEdit = (student: Student) => {
    setActiveStudent(student);
    setForm({
      full_name: student.full_name ?? '',
      class_name: student.class_name ?? '',
      grade_level: student.grade_level ?? '',
      date_of_birth: student.date_of_birth ?? '',
      student_id_number: student.student_id_number ?? '',
    });
    setEditOpen(true);
  };

  // Load grades when active student changes
  useEffect(() => {
    if (!activeStudent?.id) return;
    setGradesLoading(true);
    supabase.from('grades').select('subject_name, score, max_score, grade_letter').eq('student_id', activeStudent.id).then(({ data }) => {
      const subjectMap = new Map<string, { score: number; max: number; grade: string }>();
      (data ?? []).forEach((g: { subject_name: string; score: number; max_score: number; grade_letter: string }) => {
        if (!subjectMap.has(g.subject_name) || g.score > (subjectMap.get(g.subject_name)!.score)) {
          subjectMap.set(g.subject_name, { score: g.score, max: g.max_score, grade: g.grade_letter });
        }
      });
      const summary: GradeSummary[] = Array.from(subjectMap.entries()).map(([subject, v], idx) => ({
        subject, score: Math.round((v.score / v.max) * 100), grade: v.grade, color: SUBJECT_COLORS[idx % SUBJECT_COLORS.length],
      }));
      setGrades(summary);
      setGradesLoading(false);
    });
  }, [activeStudent?.id]);

  const gradeData = grades.length > 0 ? grades : [];
  const overallGrade = gradeData.length ? Math.round(gradeData.reduce((a, s) => a + s.score, 0) / gradeData.length) : 0;

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>Child Profile</Typography>
          <Typography variant="body2" color="text.secondary">Manage your child's information</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
          Add Child
        </Button>
      </Box>

      {students.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <SchoolIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" gutterBottom>No child added yet</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Add your child's profile to start tracking their education
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
              Add Child Profile
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {/* Profile header */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <Box sx={{ height: 80, background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)' }} />
              <CardContent sx={{ pt: 0, textAlign: 'center' }}>
                <Avatar
                  src={activeStudent?.avatar_url ?? undefined}
                  sx={{
                    width: 80, height: 80, mx: 'auto', mt: -5,
                    bgcolor: '#2563EB', fontSize: '2rem',
                    border: '4px solid', borderColor: 'background.paper',
                  }}
                >
                  {activeStudent?.full_name?.[0]}
                </Avatar>
                <Typography variant="h6" fontWeight={700} sx={{ mt: 1.5 }}>{activeStudent?.full_name}</Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {activeStudent?.class_name ?? 'Class not set'} • {activeStudent?.grade_level ?? 'Grade not set'}
                </Typography>
                <Chip label={`ID: ${activeStudent?.student_id_number ?? 'Not set'}`} size="small" variant="outlined" sx={{ mt: 0.5 }} />
                <Button
                  startIcon={<EditIcon />} size="small" sx={{ mt: 2 }}
                  onClick={() => activeStudent && openEdit(activeStudent)}
                >
                  Edit Profile
                </Button>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, textAlign: 'left' }}>
                  {[
                    { icon: <SchoolIcon sx={{ fontSize: 18 }} />, label: 'School', value: school?.school_name ?? 'Not set' },
                    { icon: <CakeIcon sx={{ fontSize: 18 }} />, label: 'Date of Birth', value: activeStudent?.date_of_birth ? new Date(activeStudent.date_of_birth).toLocaleDateString() : 'Not set' },
                  ].map((item) => (
                    <Box key={item.label} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                      <Box sx={{ color: 'text.secondary' }}>{item.icon}</Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                        <Typography variant="body2" fontWeight={600}>{item.value}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>

                {/* Overall grade */}
                <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: alpha('#2563EB', 0.08), border: '1px solid', borderColor: alpha('#2563EB', 0.15) }}>
                  <Typography variant="caption" color="text.secondary">Overall Grade</Typography>
                  <Typography variant="h4" fontWeight={800} color="primary.main">{overallGrade}%</Typography>
                  <LinearProgress variant="determinate" value={overallGrade} sx={{ mt: 1, height: 6, borderRadius: 3, bgcolor: alpha('#2563EB', 0.1), '& .MuiLinearProgress-bar': { bgcolor: '#2563EB' } }} />
                </Box>
              </CardContent>
            </Card>

            {/* Child selector */}
            {students.length > 1 && (
              <Card sx={{ mt: 2 }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="body2" fontWeight={600} gutterBottom>Switch Child</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {students.map((s) => (
                      <Box
                        key={s.id}
                        onClick={() => setActiveStudent(s)}
                        sx={{
                          display: 'flex', alignItems: 'center', gap: 1.5, p: 1, borderRadius: 2, cursor: 'pointer',
                          bgcolor: activeStudent?.id === s.id ? alpha('#2563EB', 0.08) : 'transparent',
                          border: '1px solid', borderColor: activeStudent?.id === s.id ? 'primary.main' : 'transparent',
                          '&:hover': { bgcolor: alpha('#2563EB', 0.05) },
                        }}
                      >
                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#2563EB', fontSize: '0.875rem' }}>{s.full_name?.[0]}</Avatar>
                        <Typography variant="body2" fontWeight={600}>{s.full_name}</Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Details tabs */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardContent sx={{ p: 0 }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Tab label="Grades" />
                  <Tab label="Achievements" />
                  <Tab label="Learning Goals" />
                </Tabs>
                <Box sx={{ p: 3 }}>
                  <TabPanel value={tab} index={0}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {gradesLoading ? <Typography variant="body2" color="text.secondary">Loading grades...</Typography> : gradeData.length === 0 ? <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 2 }}>No grade records yet.</Typography> : null}
                      {gradeData.map((g) => (
                        <Box key={g.subject}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: g.color }} />
                              <Typography variant="body2" fontWeight={600}>{g.subject}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip size="small" label={g.grade} sx={{ height: 20, fontSize: '0.7rem', bgcolor: alpha(g.color, 0.12), color: g.color, fontWeight: 700 }} />
                              <Typography variant="body2" fontWeight={700}>{g.score}%</Typography>
                            </Box>
                          </Box>
                          <LinearProgress variant="determinate" value={g.score} sx={{ height: 8, borderRadius: 4, bgcolor: alpha(g.color, 0.1), '& .MuiLinearProgress-bar': { bgcolor: g.color, borderRadius: 4 } }} />
                        </Box>
                      ))}
                    </Box>
                  </TabPanel>
                  <TabPanel value={tab} index={1}>
                    <Grid container spacing={2}>
                      {ACHIEVEMENTS.map((a) => (
                        <Grid size={{ xs: 12, sm: 6 }} key={a.title}>
                          <Box sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Typography sx={{ fontSize: '2rem' }}>{a.icon}</Typography>
                            <Box>
                              <Typography variant="body2" fontWeight={700}>{a.title}</Typography>
                              <Typography variant="caption" color="text.secondary">{a.desc}</Typography>
                            </Box>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </TabPanel>
                  <TabPanel value={tab} index={2}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {[
                        { goal: 'Achieve A+ in Science this semester', progress: 75, color: '#10B981' },
                        { goal: 'Improve History grade to B+', progress: 40, color: '#EF4444' },
                        { goal: 'Complete all homework on time', progress: 85, color: '#2563EB' },
                        { goal: 'Read 2 books per month', progress: 60, color: '#8B5CF6' },
                      ].map((g, i) => (
                        <Box key={i}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                            <Typography variant="body2" fontWeight={500}>{g.goal}</Typography>
                            <Typography variant="body2" fontWeight={700} sx={{ color: g.color }}>{g.progress}%</Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={g.progress} sx={{ height: 8, borderRadius: 4, bgcolor: alpha(g.color, 0.1), '& .MuiLinearProgress-bar': { bgcolor: g.color } }} />
                        </Box>
                      ))}
                    </Box>
                  </TabPanel>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={addOpen || editOpen} onClose={() => { setAddOpen(false); setEditOpen(false); }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight={700}>{editOpen ? 'Edit Child Profile' : 'Add Child'}</Typography>
          <IconButton size="small" onClick={() => { setAddOpen(false); setEditOpen(false); }}><CloseIcon /></IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ py: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField fullWidth label="Full Name *" value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} />
          <TextField fullWidth label="School" value={school?.school_name || ''} disabled />
          <Grid container spacing={2}>
            <Grid size={6}>
              <TextField fullWidth label="Class" value={form.class_name} onChange={(e) => setForm((p) => ({ ...p, class_name: e.target.value }))} placeholder="e.g. 3A" />
            </Grid>
            <Grid size={6}>
              <TextField fullWidth label="Grade/Form" value={form.grade_level} onChange={(e) => setForm((p) => ({ ...p, grade_level: e.target.value }))} placeholder="e.g. Form 3" />
            </Grid>
          </Grid>
          <TextField fullWidth label="Date of Birth" type="date" value={form.date_of_birth} onChange={(e) => setForm((p) => ({ ...p, date_of_birth: e.target.value }))} InputLabelProps={{ shrink: true }} />
          <TextField fullWidth label="Student ID" value={form.student_id_number} onChange={(e) => setForm((p) => ({ ...p, student_id_number: e.target.value }))} />
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => { setAddOpen(false); setEditOpen(false); }}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveStudent} disabled={!form.full_name || saving}>
            {saving ? 'Saving...' : editOpen ? 'Save Changes' : 'Add Child'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
