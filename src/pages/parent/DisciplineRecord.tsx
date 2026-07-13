import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Chip, Grid, alpha,
  LinearProgress, Skeleton, Fade,
} from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import GppBadIcon from '@mui/icons-material/GppBad';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PersonIcon from '@mui/icons-material/Person';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';

interface DisciplineRecord {
  id: string;
  date: string;
  category: string;
  severity: 'minor' | 'moderate' | 'serious';
  title: string;
  description: string | null;
  action_taken: string | null;
  resolved: boolean;
  reported_by: string | null;
}

const SEVERITY_META = {
  minor:    { color: '#F59E0B', label: 'Minor',    icon: <ReportProblemIcon sx={{ fontSize: 18 }} /> },
  moderate: { color: '#EF4444', label: 'Moderate', icon: <GppBadIcon sx={{ fontSize: 18 }} /> },
  serious:  { color: '#7F1D1D', label: 'Serious',  icon: <GppBadIcon sx={{ fontSize: 18 }} /> },
};

export default function DisciplineRecord() {
  const { profile } = useAuth();
  const { school } = useSchool();

  const [records, setRecords] = useState<DisciplineRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!profile?.id || !school?.id) return;
      setLoading(true);

      const { data: students } = await supabase
        .from('students').select('id').eq('parent_id', profile.id).eq('school_id', school.id).limit(1);
      const studentId = students?.[0]?.id;

      if (studentId) {
        const { data } = await supabase
          .from('discipline_records')
          .select('*')
          .eq('student_id', studentId)
          .order('date', { ascending: false });
        setRecords((data ?? []) as DisciplineRecord[]);
      }
      setLoading(false);
    };
    load();
  }, [profile?.id, school?.id]);

  const total = records.length;
  const resolved = records.filter((r) => r.resolved).length;
  const pending = total - resolved;
  const serious = records.filter((r) => r.severity === 'serious').length;
  const isClean = total === 0;

  return (
    <Fade in>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <Box sx={{ width: 48, height: 48, borderRadius: 3, bgcolor: alpha('#EF4444', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldIcon sx={{ color: '#EF4444', fontSize: 26 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800}>Discipline Record</Typography>
            <Typography variant="body2" color="text.secondary">Your child's disciplinary history</Typography>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Grid container spacing={2.5}>
              {[1,2,3,4].map((i) => <Grid size={{ xs: 6, md: 3 }} key={i}><Skeleton variant="rounded" height={100} sx={{ borderRadius: 3 }} /></Grid>)}
            </Grid>
            {[1,2,3].map((i) => <Skeleton key={i} variant="rounded" height={100} sx={{ borderRadius: 3 }} />)}
          </Box>
        ) : isClean ? (
          <Card sx={{ textAlign: 'center', py: 8, px: 4, background: `linear-gradient(135deg, ${alpha('#10B981', 0.06)} 0%, ${alpha('#10B981', 0.02)} 100%)`, borderColor: alpha('#10B981', 0.2) }}>
            <VerifiedUserIcon sx={{ fontSize: 80, color: '#10B981', mb: 2 }} />
            <Typography variant="h5" fontWeight={800} color="#10B981" gutterBottom>Perfect Discipline Record!</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto', lineHeight: 1.8 }}>
              No discipline issues have been recorded. Keep encouraging good behaviour and positive school participation.
            </Typography>
          </Card>
        ) : (
          <>
            {/* Summary cards */}
            <Grid container spacing={2.5} sx={{ mb: 4 }}>
              {[
                { label: 'Total Records', value: total,    icon: <ShieldIcon />,         color: '#2563EB' },
                { label: 'Resolved',      value: resolved, icon: <CheckCircleIcon />,    color: '#10B981' },
                { label: 'Pending',       value: pending,  icon: <HourglassEmptyIcon />, color: '#F59E0B' },
                { label: 'Serious',       value: serious,  icon: <GppBadIcon />,         color: '#EF4444' },
              ].map((s) => (
                <Grid size={{ xs: 6, md: 3 }} key={s.label}>
                  <Card sx={{ background: `linear-gradient(135deg, ${alpha(s.color, 0.08)} 0%, ${alpha(s.color, 0.02)} 100%)`, borderColor: alpha(s.color, 0.15) }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 1.5 }}>
                        <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(s.color, 0.15), display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                          {s.icon}
                        </Box>
                        <Typography variant="caption" fontWeight={600} color="text.secondary">{s.label}</Typography>
                      </Box>
                      <Typography variant="h5" fontWeight={800} sx={{ color: s.color }}>{s.value}</Typography>
                      {s.label === 'Resolved' && total > 0 && (
                        <LinearProgress variant="determinate" value={(resolved / total) * 100}
                          sx={{ mt: 1, height: 4, bgcolor: alpha(s.color, 0.1), '& .MuiLinearProgress-bar': { bgcolor: s.color } }} />
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Timeline */}
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Incident History</Typography>
            <Box sx={{ position: 'relative' }}>
              {records.map((rec, idx) => {
                const meta = SEVERITY_META[rec.severity] ?? SEVERITY_META.minor;
                const date = new Date(rec.date);
                return (
                  <Box key={rec.id} sx={{ display: 'flex', gap: 2, mb: idx === records.length - 1 ? 0 : 2, position: 'relative' }}>
                    {/* Timeline line */}
                    {idx < records.length - 1 && (
                      <Box sx={{ position: 'absolute', left: 19, top: 40, bottom: -20, width: 2, bgcolor: 'divider' }} />
                    )}
                    {/* Dot */}
                    <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: alpha(meta.color, 0.15), border: `2px solid ${meta.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1, color: meta.color }}>
                      {meta.icon}
                    </Box>
                    {/* Card */}
                    <Card sx={{ flex: 1, borderColor: alpha(meta.color, 0.2) }}>
                      <CardContent sx={{ p: 2.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={700}>{rec.title}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {date.toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip size="small" label={meta.label}
                              sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700, bgcolor: alpha(meta.color, 0.12), color: meta.color }} />
                            <Chip size="small" label={rec.resolved ? 'Resolved' : 'Pending'}
                              sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700,
                                bgcolor: rec.resolved ? alpha('#10B981', 0.12) : alpha('#F59E0B', 0.12),
                                color: rec.resolved ? '#10B981' : '#F59E0B' }} />
                          </Box>
                        </Box>
                        {rec.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, lineHeight: 1.7 }}>{rec.description}</Typography>
                        )}
                        {rec.action_taken && (
                          <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha('#10B981', 0.06), border: '1px solid', borderColor: alpha('#10B981', 0.15) }}>
                            <Typography variant="caption" fontWeight={700} color="#10B981">Action Taken: </Typography>
                            <Typography variant="caption" color="text.secondary">{rec.action_taken}</Typography>
                          </Box>
                        )}
                        {rec.reported_by && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1 }}>
                            <PersonIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                            <Typography variant="caption" color="text.secondary">Reported by: <strong>{rec.reported_by}</strong></Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Box>
                );
              })}
            </Box>
          </>
        )}
      </Box>
    </Fade>
  );
}
