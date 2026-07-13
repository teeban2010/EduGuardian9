import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Chip, Grid, LinearProgress,
  useTheme, alpha, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, ToggleButton, ToggleButtonGroup, Skeleton, Fade,
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, LineChart, Line,
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import StarIcon from '@mui/icons-material/Star';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';

interface GradeRecord {
  id: string;
  subject_name: string;
  score: number;
  max_score: number;
  grade_letter: string;
  term: string;
  exam_type: string;
  recorded_at: string;
}

interface SubjectStat {
  subject: string;
  code: string;
  score: number;
  prev: number;
  color: string;
  grade: string;
}

const SUBJECT_COLORS = ['#2563EB','#10B981','#8B5CF6','#F59E0B','#EF4444','#0891B2','#EC4899'];

export default function Progress() {
  const theme = useTheme();
  const { profile } = useAuth();
  const { school } = useSchool();

  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'semester'>('monthly');

  useEffect(() => {
    const load = async () => {
      if (!profile?.id || !school?.id) return;
      setLoading(true);

      const { data: students } = await supabase
        .from('students').select('id').eq('parent_id', profile.id).eq('school_id', school.id).limit(1);
      const studentId = students?.[0]?.id;
      if (!studentId) { setLoading(false); return; }

      const { data } = await supabase
        .from('grades')
        .select('*')
        .eq('student_id', studentId)
        .order('recorded_at', { ascending: false });

      setGrades((data ?? []) as GradeRecord[]);
      setLoading(false);
    };
    load();
  }, [profile?.id, school?.id]);

  // Derive subject stats from grades
  const subjectMap = new Map<string, GradeRecord[]>();
  grades.forEach((g) => {
    if (!subjectMap.has(g.subject_name)) subjectMap.set(g.subject_name, []);
    subjectMap.get(g.subject_name)!.push(g);
  });

  const subjectStats: SubjectStat[] = Array.from(subjectMap.entries()).map(([subject, recs], idx) => {
    const sorted = recs.sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
    const latest = sorted[0];
    const prev = sorted[1];
    const score = latest ? Math.round((latest.score / latest.max_score) * 100) : 0;
    const prevScore = prev ? Math.round((prev.score / prev.max_score) * 100) : score;
    return {
      subject,
      code: subject.slice(0, 4).toUpperCase(),
      score,
      prev: prevScore,
      color: SUBJECT_COLORS[idx % SUBJECT_COLORS.length],
      grade: latest?.grade_letter ?? '—',
    };
  });

  const overallAverage = subjectStats.length
    ? Math.round(subjectStats.reduce((a, s) => a + s.score, 0) / subjectStats.length)
    : 0;

  const bestSubject = subjectStats.length ? subjectStats.reduce((a, b) => a.score > b.score ? a : b) : null;
  const worstSubject = subjectStats.length ? subjectStats.reduce((a, b) => a.score < b.score ? a : b) : null;

  // Monthly trend from grades
  const monthlyData = (() => {
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push(d.toLocaleString('en-US', { month: 'short', year: '2-digit' }));
    }
    return months.map((month) => {
      const monthGrades = grades.filter((g) => {
        const d = new Date(g.recorded_at);
        return d.toLocaleString('en-US', { month: 'short', year: '2-digit' }) === month;
      });
      const avg = monthGrades.length
        ? Math.round(monthGrades.reduce((a, g) => a + (g.score / g.max_score) * 100, 0) / monthGrades.length)
        : 0;
      return { month: month.split(' ')[0], average: avg || null };
    });
  })();

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return theme.palette.success.main;
    if (grade.startsWith('B')) return theme.palette.primary.main;
    return theme.palette.warning.main;
  };

  if (loading) {
    return (
      <Fade in>
        <Box>
          <Box sx={{ mb: 4 }}>
            <Skeleton variant="text" width={200} height={36} />
            <Skeleton variant="text" width={300} />
          </Box>
          <Grid container spacing={3}>
            {[1,2,3].map((i) => <Grid size={{ xs: 12, sm: 4 }} key={i}><Skeleton variant="rounded" height={120} sx={{ borderRadius: 3 }} /></Grid>)}
          </Grid>
        </Box>
      </Fade>
    );
  }

  const hasData = subjectStats.length > 0;

  return (
    <Fade in>
      <Box>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: 3, bgcolor: alpha(theme.palette.info.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUpIcon sx={{ color: 'info.main', fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={800}>Academic Progress</Typography>
              <Typography variant="body2" color="text.secondary">Track your child's academic performance and growth</Typography>
            </Box>
          </Box>
        </Box>

        {!hasData ? (
          <Card sx={{ textAlign: 'center', p: 6 }}>
            <TrendingUpIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" fontWeight={700} gutterBottom>No Grade Records Yet</Typography>
            <Typography variant="body2" color="text.secondary">Academic scores will appear here once teachers post results.</Typography>
          </Card>
        ) : (
          <>
            {/* Overview */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Card sx={{ background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`, color: 'white', textAlign: 'center' }}>
                  <CardContent sx={{ py: 4 }}>
                    <Typography variant="h2" fontWeight={900}>{overallAverage}%</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.85 }}>Overall Average</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Card sx={{ background: `linear-gradient(135deg, ${alpha('#10B981', 0.1)} 0%, ${alpha('#10B981', 0.03)} 100%)`, border: '1px solid', borderColor: alpha('#10B981', 0.2) }}>
                  <CardContent sx={{ py: 3, textAlign: 'center' }}>
                    <EmojiEventsIcon sx={{ fontSize: 40, color: '#10B981', mb: 1 }} />
                    <Typography variant="h5" fontWeight={800} color="#10B981">{bestSubject?.subject}</Typography>
                    <Typography variant="body2" color="text.secondary">Best Subject ({bestSubject?.score}%)</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Card sx={{ background: `linear-gradient(135deg, ${alpha('#F59E0B', 0.1)} 0%, ${alpha('#F59E0B', 0.03)} 100%)`, border: '1px solid', borderColor: alpha('#F59E0B', 0.2) }}>
                  <CardContent sx={{ py: 3, textAlign: 'center' }}>
                    <WarningAmberIcon sx={{ fontSize: 40, color: '#F59E0B', mb: 1 }} />
                    <Typography variant="h5" fontWeight={800} color="#F59E0B">{worstSubject?.subject}</Typography>
                    <Typography variant="body2" color="text.secondary">Needs Attention ({worstSubject?.score}%)</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              {/* Subject bar chart */}
              <Grid size={{ xs: 12, md: 7 }}>
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom>Subject Scores</Typography>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={subjectStats.map((s) => ({ subject: s.code, Current: s.score, Previous: s.prev }))} barSize={18}>
                        <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                        <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                        <ReTooltip contentStyle={{ borderRadius: 12, border: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.background.paper }} formatter={(v) => [`${v}%`]} />
                        <Bar dataKey="Previous" fill={alpha('#94A3B8', 0.5)} radius={[4, 4, 0, 0]} name="Previous" />
                        <Bar dataKey="Current"  fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} name="Current" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Radar */}
              <Grid size={{ xs: 12, md: 5 }}>
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom>Skill Balance</Typography>
                    <ResponsiveContainer width="100%" height={220}>
                      <RadarChart data={subjectStats.map((s) => ({ subject: s.code, score: s.score }))}>
                        <PolarGrid stroke={theme.palette.divider} />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <Radar name="Score" dataKey="score" stroke={theme.palette.primary.main} fill={alpha(theme.palette.primary.main, 0.2)} fillOpacity={0.6} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Trend */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" fontWeight={700}>Performance Trend</Typography>
                      <ToggleButtonGroup value={period} exclusive onChange={(_, v) => v && setPeriod(v)} size="small">
                        <ToggleButton value="weekly" sx={{ fontSize: '0.7rem', py: 0.5 }}>Weekly</ToggleButton>
                        <ToggleButton value="monthly" sx={{ fontSize: '0.7rem', py: 0.5 }}>Monthly</ToggleButton>
                        <ToggleButton value="semester" sx={{ fontSize: '0.7rem', py: 0.5 }}>Semester</ToggleButton>
                      </ToggleButtonGroup>
                    </Box>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                        <ReTooltip contentStyle={{ borderRadius: 12, border: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.background.paper }} formatter={(v) => [`${v}%`, 'Average']} />
                        <Line type="monotone" dataKey="average" stroke={theme.palette.primary.main} strokeWidth={3} dot={{ fill: theme.palette.primary.main, r: 4 }} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Grades table */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom>Subject Breakdown</Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Score</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Grade</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Change</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {subjectStats.map((s) => (
                            <TableRow key={s.subject} hover>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color }} />
                                  <Typography variant="body2">{s.subject}</Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <LinearProgress
                                  variant="determinate" value={s.score}
                                  sx={{ height: 6, width: 60, borderRadius: 3, bgcolor: alpha(s.color, 0.15), '& .MuiLinearProgress-bar': { bgcolor: s.color } }}
                                />
                                <Typography variant="caption">{s.score}%</Typography>
                              </TableCell>
                              <TableCell>
                                <Chip size="small" label={s.grade}
                                  sx={{ bgcolor: alpha(getGradeColor(s.grade), 0.12), color: getGradeColor(s.grade), fontWeight: 700, height: 20, fontSize: '0.7rem' }} />
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: s.score >= s.prev ? '#10B981' : '#EF4444' }}>
                                  {s.score >= s.prev ? <TrendingUpIcon sx={{ fontSize: 16 }} /> : <TrendingDownIcon sx={{ fontSize: 16 }} />}
                                  <Typography variant="caption" fontWeight={600}>{Math.abs(s.score - s.prev)}%</Typography>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* AI Analysis */}
              <Grid size={12}>
                <Card sx={{ background: theme.palette.mode === 'light' ? 'linear-gradient(135deg, #EFF6FF 0%, #EDE9FE 100%)' : `linear-gradient(135deg, ${alpha('#2563EB', 0.1)} 0%, ${alpha('#7C3AED', 0.1)} 100%)`, borderColor: alpha(theme.palette.primary.main, 0.15) }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                      <AutoAwesomeIcon sx={{ color: 'primary.main' }} />
                      <Typography variant="h6" fontWeight={700}>AI Analysis & Recommendations</Typography>
                      <Chip label="AI" size="small" color="primary" sx={{ fontSize: '0.65rem', height: 20 }} />
                    </Box>
                    <Grid container spacing={2}>
                      {[
                        { icon: <CheckCircleIcon sx={{ color: '#10B981', fontSize: 20 }} />, color: '#10B981', title: 'Strengths',
                          text: bestSubject ? `Excellent in ${bestSubject.subject} (${bestSubject.score}%). Keep maintaining this standard with consistent study habits and practice.` : 'Keep up the good work!' },
                        { icon: <WarningAmberIcon sx={{ color: '#F59E0B', fontSize: 20 }} />, color: '#F59E0B', title: 'Areas to Improve',
                          text: worstSubject ? `${worstSubject.subject} needs attention at ${worstSubject.score}%. Focus on practice and consider extra sessions with the teacher.` : 'All subjects are performing well.' },
                        { icon: <StarIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />, color: theme.palette.primary.main, title: 'Recommendations',
                          text: `Target an overall average above ${Math.min(overallAverage + 5, 95)}%. Schedule 30-45 minutes of focused study per subject daily. Use practice tests weekly to build confidence.` },
                      ].map((item) => (
                        <Grid size={{ xs: 12, md: 4 }} key={item.title}>
                          <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: alpha(item.color, 0.08), border: '1px solid', borderColor: alpha(item.color, 0.2) }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                              {item.icon}
                              <Typography variant="subtitle2" fontWeight={700} sx={{ color: item.color }}>{item.title}</Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary" lineHeight={1.7}>{item.text}</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
      </Box>
    </Fade>
  );
}
