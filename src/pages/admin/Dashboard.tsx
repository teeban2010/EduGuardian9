import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Chip, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  alpha, CircularProgress, Fade,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';

interface AdminStats {
  students: number;
  parents: number;
  announcements: number;
  resources: number;
  homework: number;
}

interface RecentUser {
  id: string;
  full_name: string | null;
  role: string;
  email: string | null;
  created_at: string;
}

export default function AdminDashboard() {
  useAuth();
  const { school } = useSchool();
  const [stats, setStats] = useState<AdminStats>({ students: 0, parents: 0, announcements: 0, resources: 0, homework: 0 });
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!school?.id) return;
    const load = async () => {
      setLoading(true);
      const [
        { count: students },
        { count: parents },
        { count: announcements },
        { count: resources },
        { count: homework },
        { data: recent },
      ] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', school.id),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('school_id', school.id).eq('role', 'parent'),
        supabase.from('announcements').select('*', { count: 'exact', head: true }).eq('school_id', school.id),
        supabase.from('resources').select('*', { count: 'exact', head: true }),
        supabase.from('homework').select('*', { count: 'exact', head: true }).eq('school_id', school.id),
        supabase.from('profiles').select('id, full_name, role, email, created_at').eq('school_id', school.id).order('created_at', { ascending: false }).limit(5),
      ]);
      setStats({ students: students ?? 0, parents: parents ?? 0, announcements: announcements ?? 0, resources: resources ?? 0, homework: homework ?? 0 });
      setRecentUsers((recent ?? []) as RecentUser[]);
      setLoading(false);
    };
    load();
  }, [school?.id]);

  const STATS = [
    { label: 'Total Students', value: stats.students, icon: <SchoolIcon />, color: '#2563EB', change: `enrolled at ${school?.school_name ?? ''}` },
    { label: 'Active Parents', value: stats.parents, icon: <PeopleIcon />, color: '#10B981', change: 'registered parents' },
    { label: 'Announcements', value: stats.announcements, icon: <AnnouncementIcon />, color: '#8B5CF6', change: 'posted to school' },
    { label: 'Resources', value: stats.resources, icon: <MenuBookIcon />, color: '#F59E0B', change: 'study materials' },
  ];

  const ROLE_COLORS: Record<string, string> = {
    parent: '#10B981', teacher: '#2563EB', admin: '#8B5CF6', student: '#F59E0B',
  };

  return (
    <Fade in>
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" fontWeight={800}>Admin Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">
            {school?.school_name} — System overview and management
          </Typography>
        </Box>

        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          {STATS.map((s) => (
            <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={s.label}>
              <Card sx={{ background: `linear-gradient(135deg, ${alpha(s.color, 0.08)} 0%, ${alpha(s.color, 0.02)} 100%)`, border: '1px solid', borderColor: alpha(s.color, 0.15) }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1.5 }}>
                    <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: alpha(s.color, 0.15), display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                      {s.icon}
                    </Box>
                    <Box>
                      {loading ? <CircularProgress size={24} />
                        : <Typography variant="h4" fontWeight={800} sx={{ color: s.color, lineHeight: 1 }}>{s.value}</Typography>}
                      <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                    </Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TrendingUpIcon sx={{ fontSize: 13 }} /> {s.change}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          {/* Recent users */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>Recent Users</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Joined</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loading ? [1,2,3].map((i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={3}><CircularProgress size={16} /></TableCell>
                        </TableRow>
                      )) : recentUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} align="center">
                            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>No users yet</Typography>
                          </TableCell>
                        </TableRow>
                      ) : recentUsers.map((u) => (
                        <TableRow key={u.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar sx={{ width: 32, height: 32, bgcolor: ROLE_COLORS[u.role] ?? '#64748B', fontSize: '0.85rem', fontWeight: 700 }}>
                                {u.full_name?.[0] ?? u.email?.[0] ?? '?'}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={600}>{u.full_name ?? 'No name'}</Typography>
                                <Typography variant="caption" color="text.secondary">{u.email ?? '—'}</Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip size="small" label={u.role}
                              sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600, bgcolor: alpha(ROLE_COLORS[u.role] ?? '#64748B', 0.12), color: ROLE_COLORS[u.role] ?? '#64748B' }} />
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(u.created_at).toLocaleDateString('en-MY', { month: 'short', day: 'numeric', year: '2-digit' })}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* School summary */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>School Info</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[
                    { label: 'School Code', value: school?.school_code ?? '—' },
                    { label: 'Type', value: school?.school_type ?? '—' },
                    { label: 'Principal', value: school?.principal_name ?? '—' },
                    { label: 'Enrolled', value: school?.enrollment_count ? `${school.enrollment_count}` : '—' },
                    { label: 'State', value: school?.state ?? '—' },
                    { label: 'Tier', value: school?.subscription_tier?.toUpperCase() ?? '—' },
                  ].map((item) => (
                    <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                      <Typography variant="body2" fontWeight={600}>{item.value}</Typography>
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
