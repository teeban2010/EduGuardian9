import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  useTheme, alpha, CircularProgress, Fade,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';

interface Stats {
  students: number;
  homework: number;
  todayPresent: number;
  announcements: number;
}

interface RecentStudent {
  id: string;
  full_name: string;
  class_name: string | null;
  created_at: string;
}

export default function TeacherDashboard() {
  const theme = useTheme();
  const { profile } = useAuth();
  const { school } = useSchool();
  const [stats, setStats] = useState<Stats>({ students: 0, homework: 0, todayPresent: 0, announcements: 0 });
  const [recentStudents, setRecentStudents] = useState<RecentStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!school?.id) return;
    const load = async () => {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const [
        { count: students },
        { count: homework },
        { count: todayPresent },
        { count: announcements },
        { data: recent },
      ] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', school.id),
        supabase.from('homework').select('*', { count: 'exact', head: true }).eq('school_id', school.id).eq('status', 'pending'),
        supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('date', today).eq('status', 'present'),
        supabase.from('announcements').select('*', { count: 'exact', head: true }).eq('school_id', school.id),
        supabase.from('students').select('id, full_name, class_name, created_at').eq('school_id', school.id).order('created_at', { ascending: false }).limit(5),
      ]);
      setStats({ students: students ?? 0, homework: homework ?? 0, todayPresent: todayPresent ?? 0, announcements: announcements ?? 0 });
      setRecentStudents((recent ?? []) as RecentStudent[]);
      setLoading(false);
    };
    load();
  }, [school?.id]);

  const statCards = [
    { label: 'Total Students', value: stats.students, icon: <PeopleIcon />, color: '#2563EB', sub: `at ${school?.school_name ?? ''}` },
    { label: 'Pending Homework', value: stats.homework, icon: <AssignmentIcon />, color: '#F59E0B', sub: 'assignments pending' },
    { label: 'Present Today', value: stats.todayPresent, icon: <EventNoteIcon />, color: '#10B981', sub: "today's attendance" },
    { label: 'Announcements', value: stats.announcements, icon: <AnnouncementIcon />, color: '#8B5CF6', sub: 'total posted' },
  ];

  return (
    <Fade in>
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" fontWeight={800}>Teacher Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome back, {profile?.full_name ?? 'Teacher'} — {school?.school_name}
          </Typography>
        </Box>

        {/* Stats */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          {statCards.map((s) => (
            <Grid size={{ xs: 6, md: 3 }} key={s.label}>
              <Card sx={{ background: `linear-gradient(135deg, ${alpha(s.color, 0.08)} 0%, ${alpha(s.color, 0.02)} 100%)`, borderColor: alpha(s.color, 0.15) }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 1.5 }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(s.color, 0.15), display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                      {s.icon}
                    </Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>{s.label}</Typography>
                  </Box>
                  {loading ? <CircularProgress size={24} /> : <Typography variant="h4" fontWeight={800} sx={{ color: s.color }}>{s.value}</Typography>}
                  <Typography variant="caption" color="text.secondary">{s.sub}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          {/* Recent students */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>Recent Students</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Student</TableCell>
                        <TableCell>Class</TableCell>
                        <TableCell>Joined</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loading ? (
                        [1,2,3].map((i) => (
                          <TableRow key={i}>
                            <TableCell colSpan={3}><CircularProgress size={16} /></TableCell>
                          </TableRow>
                        ))
                      ) : recentStudents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} align="center">
                            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>No students yet</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        recentStudents.map((s) => (
                          <TableRow key={s.id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main, fontSize: '0.85rem', fontWeight: 700 }}>
                                  {s.full_name?.[0]}
                                </Avatar>
                                <Typography variant="body2" fontWeight={600}>{s.full_name}</Typography>
                              </Box>
                            </TableCell>
                            <TableCell>{s.class_name ?? '—'}</TableCell>
                            <TableCell>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(s.created_at).toLocaleDateString('en-MY', { month: 'short', day: 'numeric' })}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick actions */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>School Overview</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[
                    { label: 'School Code', value: school?.school_code ?? '—', color: theme.palette.primary.main },
                    { label: 'Type', value: school?.school_type ?? '—', color: '#8B5CF6' },
                    { label: 'Enrolled', value: school?.enrollment_count ? `${school.enrollment_count} students` : '—', color: '#10B981' },
                    { label: 'State', value: school?.state ?? '—', color: '#F59E0B' },
                  ].map((item) => (
                    <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, borderRadius: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                      <Typography variant="body2" fontWeight={700} sx={{ color: item.color }}>{item.value}</Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Fade>
  );
}
