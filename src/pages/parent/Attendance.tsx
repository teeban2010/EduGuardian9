import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Chip, Grid, LinearProgress,
  useTheme, alpha, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Skeleton, Fade,
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer,
} from 'recharts';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EventNoteIcon from '@mui/icons-material/EventNote';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';

interface AttendanceRecord {
  id: string;
  student_id: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  notes: string | null;
}

interface MonthStat {
  month: string;
  present: number;
  absent: number;
  late: number;
}

const STATUS_COLORS = {
  present: '#10B981',
  absent:  '#EF4444',
  late:    '#F59E0B',
  weekend: 'transparent',
};

export default function Attendance() {
  const theme = useTheme();
  const { profile } = useAuth();
  const { school } = useSchool();

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, _setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const load = async () => {
      if (!profile?.id || !school?.id) return;
      setLoading(true);

      const { data: students } = await supabase
        .from('students').select('id').eq('parent_id', profile.id).eq('school_id', school.id).limit(1);
      const studentId = students?.[0]?.id;
      if (!studentId) { setLoading(false); return; }

      const { data } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', studentId)
        .order('date', { ascending: false });

      setRecords((data ?? []) as AttendanceRecord[]);
      setLoading(false);
    };
    load();
  }, [profile?.id, school?.id]);

  // Calendar days for current month
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun

  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dow = new Date(year, month, day).getDay();
    const isWeekend = dow === 0 || dow === 6;
    const rec = records.find((r) => r.date === dateStr);
    return { day, status: isWeekend ? 'weekend' : rec?.status ?? null };
  });

  // Monthly stats for chart (last 6 months)
  const monthlyStats: MonthStat[] = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const mYear = d.getFullYear();
    const mMonth = d.getMonth();
    const monthRecs = records.filter((r) => {
      const rd = new Date(r.date);
      return rd.getFullYear() === mYear && rd.getMonth() === mMonth;
    });
    return {
      month: d.toLocaleString('en-US', { month: 'short' }),
      present: monthRecs.filter((r) => r.status === 'present').length,
      absent:  monthRecs.filter((r) => r.status === 'absent').length,
      late:    monthRecs.filter((r) => r.status === 'late').length,
    };
  });

  const totalPresent = records.filter((r) => r.status === 'present').length;
  const totalAbsent  = records.filter((r) => r.status === 'absent').length;
  const totalLate    = records.filter((r) => r.status === 'late').length;
  const total = records.length;
  const attendanceRate = total > 0 ? ((totalPresent / total) * 100).toFixed(1) : '0';
  const recentRecords = records.slice(0, 8);

  const monthName = currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <Fade in>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <Box sx={{ width: 48, height: 48, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <EventNoteIcon sx={{ color: 'primary.main', fontSize: 26 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800}>Attendance</Typography>
            <Typography variant="body2" color="text.secondary">Monitor your child's attendance records</Typography>
          </Box>
        </Box>

        {/* Summary cards */}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          {[
            { label: 'Present', value: loading ? null : totalPresent, icon: <CheckCircleIcon />, color: '#10B981', sub: 'Days this year' },
            { label: 'Absent',  value: loading ? null : totalAbsent,  icon: <CancelIcon />,       color: '#EF4444', sub: 'Days missed' },
            { label: 'Late',    value: loading ? null : totalLate,    icon: <AccessTimeIcon />,   color: '#F59E0B', sub: 'Late arrivals' },
            { label: 'Rate',    value: loading ? null : `${attendanceRate}%`, icon: <TrendingUpIcon />, color: '#2563EB', sub: 'Attendance rate', progress: loading ? 0 : parseFloat(attendanceRate) },
          ].map((item) => (
            <Grid size={{ xs: 6, md: 3 }} key={item.label}>
              <Card sx={{ background: `linear-gradient(135deg, ${alpha(item.color, 0.08)} 0%, ${alpha(item.color, 0.02)} 100%)`, borderColor: alpha(item.color, 0.15) }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 1.5 }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(item.color, 0.15), display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color }}>
                      {item.icon}
                    </Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>{item.label}</Typography>
                  </Box>
                  {item.value === null
                    ? <Skeleton width={60} height={32} />
                    : <Typography variant="h5" fontWeight={800} sx={{ color: item.color }}>{item.value}</Typography>
                  }
                  <Typography variant="caption" color="text.secondary">{item.sub}</Typography>
                  {item.progress !== undefined && (
                    <LinearProgress
                      variant="determinate" value={item.progress}
                      sx={{ mt: 1, height: 5, bgcolor: alpha(item.color, 0.1), '& .MuiLinearProgress-bar': { bgcolor: item.color } }}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          {/* Calendar */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>{monthName}</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 1 }}>
                  {['S','M','T','W','T','F','S'].map((d, i) => (
                    <Box key={i} sx={{ textAlign: 'center', py: 0.5 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>{d}</Typography>
                    </Box>
                  ))}
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
                  {Array.from({ length: firstDay }).map((_, i) => <Box key={`e${i}`} />)}
                  {calendarDays.map(({ day, status }) => {
                    const c = status && status !== 'weekend' ? STATUS_COLORS[status as keyof typeof STATUS_COLORS] : undefined;
                    return (
                      <Box key={day} sx={{
                        aspectRatio: '1', borderRadius: 1.5,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: c ? alpha(c, 0.15) : 'transparent',
                        border: c ? `1px solid ${alpha(c, 0.3)}` : '1px solid transparent',
                      }}>
                        <Typography variant="caption" fontWeight={status && status !== 'weekend' ? 600 : 400}
                          sx={{ color: status === 'weekend' ? 'text.disabled' : c ?? 'text.secondary', fontSize: '0.7rem' }}>
                          {day}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
                <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                  {[['#10B981','Present'],['#EF4444','Absent'],['#F59E0B','Late']].map(([color, label]) => (
                    <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Box sx={{ width: 11, height: 11, borderRadius: 0.5, bgcolor: alpha(color, 0.3), border: `1px solid ${alpha(color, 0.5)}` }} />
                      <Typography variant="caption">{label}</Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Monthly chart */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>Monthly Overview</Typography>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyStats} barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <ReTooltip contentStyle={{ borderRadius: 12, border: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.background.paper }} />
                    <Bar dataKey="present" fill="#10B981" radius={[4, 4, 0, 0]} name="Present" />
                    <Bar dataKey="late"    fill="#F59E0B" radius={[4, 4, 0, 0]} name="Late" />
                    <Bar dataKey="absent"  fill="#EF4444" radius={[4, 4, 0, 0]} name="Absent" />
                  </BarChart>
                </ResponsiveContainer>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                  {[['#10B981','Present'],['#F59E0B','Late'],['#EF4444','Absent']].map(([c, l]) => (
                    <Box key={l} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: c }} />
                      <Typography variant="caption">{l}</Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent records */}
          <Grid size={12}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>Recent Records</Typography>
                {loading ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {[1,2,3,4,5].map((i) => <Skeleton key={i} height={40} />)}
                  </Box>
                ) : recentRecords.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                    No attendance records found.
                  </Typography>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Day</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Notes</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {recentRecords.map((r) => {
                          const d = new Date(r.date);
                          const color = STATUS_COLORS[r.status] ?? '#64748B';
                          return (
                            <TableRow key={r.id} hover>
                              <TableCell>{d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}</TableCell>
                              <TableCell>{d.toLocaleDateString('en-MY', { weekday: 'long' })}</TableCell>
                              <TableCell>
                                <Chip size="small" label={r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                                  sx={{ bgcolor: alpha(color, 0.12), color, fontWeight: 700, height: 22, fontSize: '0.72rem', borderRadius: '6px' }} />
                              </TableCell>
                              <TableCell><Typography variant="body2" color="text.secondary">{r.notes || '—'}</Typography></TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Fade>
  );
}
