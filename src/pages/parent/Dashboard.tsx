import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  alpha,
  Typography,
} from '@mui/material';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ShieldIcon from '@mui/icons-material/Shield';
import InfoIcon from '@mui/icons-material/Info';
import CampaignIcon from '@mui/icons-material/Campaign';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import MessageIcon from '@mui/icons-material/Message';
import PhoneIcon from '@mui/icons-material/Phone';
import SyncIcon from '@mui/icons-material/Sync';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { supabase } from '../../lib/supabase';
import type { Student } from '../../types';

const UPCOMING_EVENTS = [
  { title: 'Latihan Rumah Sukan', subtitle: 'Blue House - Practice', date: '6 Jun', day: 'THU', color: '#2563EB' },
  { title: 'Peperiksaan Pertengahan Tahun', subtitle: '10 - 14 Jun 2026', date: '10 Jun', day: 'MON', color: '#10B981' },
  { title: 'Hari Kokurikulum', subtitle: 'Aktiviti Kelab & Persatuan', date: '20 Jun', day: 'FRI', color: '#EC4899' },
];

interface CircleScoreProps {
  value: number;
  max: number;
  color: string;
  size?: number;
}

function CircleScore({ value, max, color, size = 80 }: CircleScoreProps) {
  const pct = (value / max) * 100;
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', width: size, height: size }}>
      <CircularProgress variant="determinate" value={100} size={size} thickness={4} sx={{ color: alpha(color, 0.15), position: 'absolute' }} />
      <CircularProgress variant="determinate" value={pct} size={size} thickness={4} sx={{ color, '& .MuiCircularProgress-circle': { strokeLinecap: 'round' } }} />
      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ fontWeight: 800, fontSize: size * 0.22, lineHeight: 1, color }}>{value}</Typography>
        <Typography sx={{ fontSize: size * 0.13, color: 'text.secondary', lineHeight: 1 }}>/{max}</Typography>
      </Box>
    </Box>
  );
}

interface ExploreItemProps {
  icon: React.ReactNode;
  label: string;
  color: string;
  bgColor: string;
  onClick: () => void;
  disabled?: boolean;
}

function ExploreItem({ icon, label, color, bgColor, onClick, disabled = false }: ExploreItemProps) {
  return (
    <Box
      onClick={disabled ? undefined : onClick}
      sx={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75,
        cursor: disabled ? 'default' : 'pointer', p: 1, borderRadius: 2,
        opacity: disabled ? 0.45 : 1,
        transition: 'transform 0.15s, background 0.15s',
        '&:hover': disabled ? undefined : { transform: 'translateY(-2px)', bgcolor: alpha(color, 0.06) },
      }}
    >
      <Box sx={{ width: 52, height: 52, borderRadius: 2.5, bgcolor: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ color, '& svg': { fontSize: 26 } }}>{icon}</Box>
      </Box>
      <Typography variant="caption" fontWeight={600} textAlign="center" sx={{ lineHeight: 1.2, whiteSpace: 'pre-line' }}>{label}</Typography>
    </Box>
  );
}

export default function ParentDashboard() {
  const { profile, user } = useAuth();
  const { school } = useSchool();
  const navigate = useNavigate();

  const [students, setStudents] = useState<Student[]>([]);
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const loadChildren = async () => {
      if (!user || !school?.id) {
        setStudents([]);
        setActiveStudentId(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError('');

      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('school_id', school.id)
        .eq('parent_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Unable to load linked children:', error);
        setStudents([]);
        setActiveStudentId(null);
        setLoadError(error.message);
        setLoading(false);
        return;
      }

      const linkedChildren = (data as Student[]) ?? [];
      setStudents(linkedChildren);
      setActiveStudentId(linkedChildren.length > 0 ? linkedChildren[0].id : null);
      setLoading(false);
    };

    loadChildren();
  }, [user, school?.id]);

  const activeStudent = useMemo(
    () => students.find((student) => student.id === activeStudentId) ?? students[0] ?? null,
    [students, activeStudentId],
  );

  const hasLinkedChild = Boolean(activeStudent);

  const handleSwitchChild = () => {
    if (students.length <= 1) return;
    const currentIndex = students.findIndex((student) => student.id === activeStudent?.id);
    const nextIndex = currentIndex >= students.length - 1 ? 0 : currentIndex + 1;
    setActiveStudentId(students[nextIndex].id);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Parent';

  const exploreItems: ExploreItemProps[] = [
    { icon: <EventNoteIcon />, label: 'Attendance', color: '#2563EB', bgColor: alpha('#2563EB', 0.12), onClick: () => navigate('/attendance'), disabled: !hasLinkedChild },
    { icon: <AssignmentIcon />, label: 'Homework', color: '#10B981', bgColor: alpha('#10B981', 0.12), onClick: () => navigate('/homework'), disabled: !hasLinkedChild },
    { icon: <ShieldIcon />, label: 'Discipline', color: '#EF4444', bgColor: alpha('#EF4444', 0.12), onClick: () => navigate('/discipline'), disabled: !hasLinkedChild },
    { icon: <TrendingUpIcon />, label: 'Academic\nProgress', color: '#8B5CF6', bgColor: alpha('#8B5CF6', 0.12), onClick: () => navigate('/progress'), disabled: !hasLinkedChild },
    { icon: <InfoIcon />, label: 'School Info', color: '#2563EB', bgColor: alpha('#2563EB', 0.1), onClick: () => navigate('/school-info') },
    { icon: <CampaignIcon />, label: 'School\nPrograms', color: '#F59E0B', bgColor: alpha('#F59E0B', 0.12), onClick: () => navigate('/calendar') },
    { icon: <RestaurantIcon />, label: 'Canteen\nMenu', color: '#14B8A6', bgColor: alpha('#14B8A6', 0.12), onClick: () => navigate('/canteen') },
    { icon: <MessageIcon />, label: 'Messages', color: '#3B82F6', bgColor: alpha('#3B82F6', 0.12), onClick: () => navigate('/notifications') },
  ];

  if (loading) {
    return <Box sx={{ minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="body1" color="text.secondary">{greeting},</Typography>
        <Typography variant="h5" fontWeight={800}>{firstName} {'\u{1F44B}'}</Typography>
      </Box>

      {loadError && <Alert severity="error" sx={{ mb: 2.5 }}>Unable to load your linked children: {loadError}</Alert>}

      {!hasLinkedChild && !loadError && (
        <Alert severity="info" sx={{ mb: 2.5 }}>
          No child is currently linked to your account. Please ensure that your full name and phone number match the information recorded by the school. Contact the school administrator if the issue continues.
        </Alert>
      )}

      <Grid container spacing={2.5}>
        <Grid size={12}>
          <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={activeStudent?.avatar_url ?? undefined}
                  sx={{
                    width: 56, height: 56,
                    bgcolor: hasLinkedChild ? 'primary.main' : 'grey.400',
                    fontSize: '1.4rem', border: '3px solid',
                    borderColor: hasLinkedChild ? 'primary.light' : 'grey.300',
                    flexShrink: 0,
                  }}
                >
                  {activeStudent?.full_name?.[0] ?? '?'}
                </Avatar>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle1" fontWeight={700} noWrap>
                    {activeStudent?.full_name ?? 'No linked child'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {activeStudent?.class_name ?? 'Waiting for school verification'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {school?.school_name ?? 'EduGuardian AI'}
                  </Typography>
                </Box>

                {students.length > 1 && (
                  <Button
                    size="small"
                    startIcon={<SyncIcon sx={{ fontSize: '14px !important' }} />}
                    onClick={handleSwitchChild}
                    sx={{ color: 'primary.main', fontWeight: 600, fontSize: '0.75rem', '&:hover': { bgcolor: alpha('#2563EB', 0.08) }, flexShrink: 0 }}
                  >
                    Switch Child
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={12}>
          <Card
            sx={{
              borderRadius: 3,
              background: 'linear-gradient(135deg, #EEF2FF 0%, #E8F4FD 100%)',
              border: '1px solid', borderColor: alpha('#2563EB', 0.15),
              cursor: hasLinkedChild ? 'pointer' : 'default',
              opacity: hasLinkedChild ? 1 : 0.6,
              '&:hover': hasLinkedChild ? { boxShadow: `0 4px 20px ${alpha('#2563EB', 0.15)}` } : undefined,
              transition: 'box-shadow 0.2s',
            }}
            onClick={hasLinkedChild ? () => navigate('/ai') : undefined}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0, bgcolor: alpha('#2563EB', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <SmartToyIcon sx={{ color: '#2563EB', fontSize: 26 }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" fontWeight={700} color="primary.main">AI Summary Today</Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {hasLinkedChild ? `${activeStudent?.full_name?.split(' ')[0]} is doing well! \u{1F604}` : 'A linked child is required before a summary can be shown.'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {hasLinkedChild ? "Keep it up! You're on the right track." : 'Please verify the parent-child relationship first.'}
                  </Typography>
                </Box>
                {hasLinkedChild && <ArrowForwardIosIcon sx={{ fontSize: 14, color: 'text.secondary', flexShrink: 0 }} />}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {hasLinkedChild && (
          <>
            <Grid size={12}>
              <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="subtitle1" fontWeight={700}>Well-being Status</Typography>
                    <Button size="small" endIcon={<ArrowForwardIosIcon sx={{ fontSize: '11px !important' }} />} sx={{ fontSize: '0.75rem', color: 'primary.main' }}>View Details</Button>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <SentimentSatisfiedAltIcon sx={{ fontSize: 40, color: '#10B981' }} />
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700} color="#10B981">Doing Well</Typography>
                        <Typography variant="caption" color="text.secondary">No major concerns detected.</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ ml: 'auto', textAlign: 'center' }}>
                      <CircleScore value={85} max={100} color="#10B981" size={72} />
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>Well-being Score</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={12}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>Quick Overview</Typography>
              <Grid container spacing={1.5}>
                {[
                  { icon: <EventNoteIcon />, label: 'Attendance', value: '95%', color: '#2563EB', onClick: () => navigate('/attendance') },
                  { icon: <AssignmentIcon />, label: 'Homework', value: '8/9', sub: 'Submitted', color: '#10B981', onClick: () => navigate('/homework') },
                  { icon: <ShieldIcon />, label: 'Discipline', value: 'Good', color: '#EF4444', onClick: () => navigate('/discipline') },
                  { icon: <TrendingUpIcon />, label: 'Academics', value: 'A-', color: '#8B5CF6', onClick: () => navigate('/progress') },
                ].map((item) => (
                  <Grid size={3} key={item.label}>
                    <Card
                      sx={{
                        borderRadius: 3, cursor: 'pointer', textAlign: 'center',
                        border: '1px solid', borderColor: alpha(item.color, 0.15),
                        bgcolor: alpha(item.color, 0.04),
                        transition: 'transform 0.15s, box-shadow 0.15s',
                        '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 4px 16px ${alpha(item.color, 0.2)}` },
                      }}
                      onClick={item.onClick}
                    >
                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(item.color, 0.15), display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1, color: item.color }}>
                          {item.icon}
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>{item.label}</Typography>
                        <Typography variant="subtitle2" fontWeight={800} sx={{ color: item.color, mt: 0.25 }}>{item.value}</Typography>
                        {item.sub && <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>{item.sub}</Typography>}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </>
        )}

        <Grid size={12}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>Explore</Typography>
          <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 2 }}>
              <Grid container columns={4} spacing={0.5}>
                {exploreItems.map((item) => (
                  <Grid size={1} key={item.label}>
                    <ExploreItem {...item} />
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={700}>Upcoming Events</Typography>
            <Button size="small" endIcon={<ArrowForwardIosIcon sx={{ fontSize: '11px !important' }} />} sx={{ fontSize: '0.75rem', color: 'primary.main' }} onClick={() => navigate('/calendar')}>View All</Button>
          </Box>
          <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 0 }}>
              {UPCOMING_EVENTS.map((ev, i) => (
                <Box key={ev.title}>
                  {i > 0 && <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }} />}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2.5, py: 1.75 }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(ev.color, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <EventNoteIcon sx={{ color: ev.color, fontSize: 20 }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>{ev.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{ev.subtitle}</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                      <Typography variant="body2" fontWeight={700}>{ev.date}</Typography>
                      <Typography variant="caption" color="text.secondary">{ev.day}</Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={12}>
          <Card sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', cursor: 'pointer', '&:hover': { boxShadow: `0 6px 24px ${alpha('#EF4444', 0.4)}`, transform: 'translateY(-1px)' }, transition: 'box-shadow 0.2s, transform 0.2s' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 44, height: 44, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <PhoneIcon sx={{ color: 'white', fontSize: 22 }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight={800} color="white">Emergency / SOS</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>Tap to alert the school & your contacts</Typography>
                </Box>
                <ArrowForwardIosIcon sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}