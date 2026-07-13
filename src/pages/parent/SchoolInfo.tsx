import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Tabs, Tab, Chip,
  Accordion, AccordionSummary, AccordionDetails, Divider,
  alpha, useTheme, CircularProgress, Grid, Avatar,
  TextField, InputAdornment, Stack,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import GavelIcon from '@mui/icons-material/Gavel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import StarIcon from '@mui/icons-material/Star';
import SchoolIcon from '@mui/icons-material/School';
import SportsIcon from '@mui/icons-material/Sports';
import PaletteIcon from '@mui/icons-material/Palette';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import GroupsIcon from '@mui/icons-material/Groups';
import InfoIcon from '@mui/icons-material/Info';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LanguageIcon from '@mui/icons-material/Language';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import SearchIcon from '@mui/icons-material/Search';
import BookIcon from '@mui/icons-material/Book';
import ArticleIcon from '@mui/icons-material/Article';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import ComputerIcon from '@mui/icons-material/Computer';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { supabase } from '../../lib/supabase';
import { useSchool } from '../../contexts/SchoolContext';

interface Schedule {
  id: string; period_name: string; start_time: string; end_time: string;
  description: string | null; day_applies: string; sort_order: number; is_active: boolean;
}
interface SchoolEvent {
  id: string; title: string; description: string | null; event_date: string;
  event_end_date: string | null; category: string; location: string | null; is_important: boolean;
}
interface Rule {
  id: string; category: string; rule_number: number; title: string;
  description: string | null; sort_order: number;
}
interface LibraryResource {
  id: string; title: string; author: string | null; category: string;
  resource_type: string; quantity_total: number; quantity_available: number;
  location: string | null; description: string | null; is_available: boolean;
}
interface Club {
  id: string; name: string; category: string; description: string | null;
  teacher_advisor: string | null; president_name: string | null;
  meeting_schedule: string | null; meeting_location: string | null;
  member_count: number; achievements: string | null; logo_url: string | null; is_active: boolean;
}

const EVENT_CATEGORY_META: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  academic: { color: '#2563EB', icon: <SchoolIcon />, label: 'Akademik' },
  sports:   { color: '#10B981', icon: <SportsIcon />, label: 'Sukan' },
  cultural: { color: '#8B5CF6', icon: <PaletteIcon />, label: 'Kebudayaan' },
  holiday:  { color: '#F59E0B', icon: <BeachAccessIcon />, label: 'Cuti' },
  general:  { color: '#64748B', icon: <EventIcon />, label: 'Umum' },
};

const RULE_CATEGORY_COLORS: Record<string, string> = {
  'Pakaian & Penampilan': '#2563EB',
  'Kehadiran & Masa':     '#10B981',
  'Tingkah Laku':         '#EF4444',
  'Telefon & Gajet':      '#F59E0B',
  'Akademik':             '#8B5CF6',
};

const LIBRARY_TYPE_META: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  buku:         { color: '#2563EB', icon: <BookIcon />, label: 'Buku' },
  novel:        { color: '#8B5CF6', icon: <AutoStoriesIcon />, label: 'Novel' },
  majalah:      { color: '#10B981', icon: <ArticleIcon />, label: 'Majalah' },
  akhbar:       { color: '#64748B', icon: <NewspaperIcon />, label: 'Akhbar' },
  digital:      { color: '#0891B2', icon: <ComputerIcon />, label: 'Digital' },
  rujukan:      { color: '#EA580C', icon: <MenuBookIcon />, label: 'Rujukan' },
  ensiklopedia: { color: '#DC2626', icon: <MenuBookIcon />, label: 'Ensiklopedia' },
};

const CLUB_CATEGORY_COLORS: Record<string, string> = {
  'Kelab':              '#2563EB',
  'Persatuan':          '#10B981',
  'Unit Beruniform':    '#EF4444',
  'Sukan & Permainan':  '#F59E0B',
  'Badan Pelajar':      '#8B5CF6',
};

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h < 12 ? 'AM' : 'PM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

function isRecess(name: string) {
  return name.toLowerCase().includes('rehat') || name.toLowerCase().includes('recess');
}

function isSpecial(name: string) {
  return isRecess(name) || ['assembly', 'perhimpunan', 'tamat', 'school ends', 'solat'].some(k => name.toLowerCase().includes(k));
}

interface TabPanelProps { children: React.ReactNode; value: number; index: number }
function TabPanel({ children, value, index }: TabPanelProps) {
  return value === index ? <Box sx={{ pt: 2.5 }}>{children}</Box> : null;
}

export default function SchoolInfo() {
  const theme = useTheme();
  const { school } = useSchool();
  const [tab, setTab] = useState(0);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [library, setLibrary] = useState<LibraryResource[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayFilter, setDayFilter] = useState<'all' | 'mon-thu' | 'friday'>('all');
  const [librarySearch, setLibrarySearch] = useState('');
  const [libraryTypeFilter, setLibraryTypeFilter] = useState<string>('all');
  const [clubCategoryFilter, setClubCategoryFilter] = useState<string>('all');

  useEffect(() => {
    const load = async () => {
      if (!school?.id) return;
      const [{ data: s }, { data: e }, { data: r }, { data: l }, { data: c }] = await Promise.all([
        supabase.from('school_schedules').select('*').eq('school_id', school.id).eq('is_active', true).order('sort_order'),
        supabase.from('school_events').select('*').eq('school_id', school.id).gte('event_date', new Date().toISOString().split('T')[0]).order('event_date').limit(20),
        supabase.from('school_rules').select('*').eq('school_id', school.id).eq('is_active', true).order('sort_order'),
        supabase.from('library_resources').select('*').eq('school_id', school.id).order('category').order('title'),
        supabase.from('clubs_societies').select('*').eq('school_id', school.id).eq('is_active', true).order('category').order('name'),
      ]);
      setSchedules((s as Schedule[]) ?? []);
      setEvents((e as SchoolEvent[]) ?? []);
      setRules((r as Rule[]) ?? []);
      setLibrary((l as LibraryResource[]) ?? []);
      setClubs((c as Club[]) ?? []);
      setLoading(false);
    };
    load();
  }, [school?.id]);

  const filteredSchedules = schedules.filter((s) =>
    dayFilter === 'all' ? true : s.day_applies === 'all' || s.day_applies === dayFilter
  );

  const groupedRules = rules.reduce<Record<string, Rule[]>>((acc, rule) => {
    if (!acc[rule.category]) acc[rule.category] = [];
    acc[rule.category].push(rule);
    return acc;
  }, {});

  const filteredLibrary = library.filter((l) => {
    const matchesSearch = !librarySearch ||
      l.title.toLowerCase().includes(librarySearch.toLowerCase()) ||
      (l.author ?? '').toLowerCase().includes(librarySearch.toLowerCase()) ||
      l.category.toLowerCase().includes(librarySearch.toLowerCase());
    const matchesType = libraryTypeFilter === 'all' || l.resource_type === libraryTypeFilter;
    return matchesSearch && matchesType;
  });

  const filteredClubs = clubs.filter((c) =>
    clubCategoryFilter === 'all' || c.category === clubCategoryFilter
  );

  const clubCategories = ['all', ...Array.from(new Set(clubs.map((c) => c.category)))];
  const libraryTypes = ['all', ...Array.from(new Set(library.map((l) => l.resource_type)))];

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Box sx={{
          width: 56, height: 56, borderRadius: 3,
          bgcolor: alpha(theme.palette.primary.main, 0.08),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', border: '2px solid', borderColor: alpha(theme.palette.primary.main, 0.1),
          flexShrink: 0,
        }}>
          {school?.logo_url ? (
            <Box component="img" src={school.logo_url} alt={school.school_name}
              sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 1 }} />
          ) : (
            <SchoolIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          )}
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={800} lineHeight={1.2}>Maklumat Sekolah</Typography>
          <Typography variant="caption" color="text.secondary">
            {school?.school_name || 'Loading...'}, {school?.state || ''}
          </Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          <Tabs
            value={tab} onChange={(_, v) => setTab(v)}
            variant="scrollable" scrollButtons="auto"
            sx={{
              '& .MuiTab-root': { fontWeight: 600, fontSize: '0.75rem', minHeight: 48, minWidth: 'auto', px: 2 },
              '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' },
            }}
          >
            <Tab icon={<InfoIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Sekolah" />
            <Tab icon={<AccessTimeIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Jadual" />
            <Tab icon={<EventIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Acara" />
            <Tab icon={<GavelIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Peraturan" />
            <Tab icon={<MenuBookIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Perpustakaan" />
            <Tab icon={<GroupsIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Kelab & Persatuan" />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 2 }}>

          {/* ── TAB 0: MAKLUMAT SEKOLAH ── */}
          <TabPanel value={tab} index={0}>
            <Stack spacing={2}>
              {/* School card */}
              <Box sx={{
                p: 3, borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha('#7C3AED', 0.04)} 100%)`,
                border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.1),
                display: 'flex', alignItems: 'center', gap: 2.5,
              }}>
                <Box sx={{
                  width: 80, height: 80, borderRadius: 3, flexShrink: 0, overflow: 'hidden',
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  border: '2px solid', borderColor: alpha(theme.palette.primary.main, 0.15),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {school?.logo_url ? (
                    <Box component="img" src={school.logo_url} alt={school?.school_name}
                      sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 1 }} />
                  ) : (
                    <SchoolIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                  )}
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={800} color="primary.main" sx={{ lineHeight: 1.2, mb: 0.5 }}>
                    {school?.school_name ?? '—'}
                  </Typography>
                  <Chip label={school?.school_type ?? ''} size="small" sx={{
                    fontWeight: 700, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main',
                  }} />
                </Box>
              </Box>

              {/* Details grid */}
              <Grid container spacing={1.5}>
                {[
                  { icon: <PersonIcon />, label: 'Pengetua', value: school?.principal_name, color: '#2563EB' },
                  { icon: <BusinessIcon />, label: 'Jenis Sekolah', value: school?.school_type, color: '#7C3AED' },
                  { icon: <LocationOnIcon />, label: 'Alamat', value: [school?.address, school?.city, school?.postcode, school?.state].filter(Boolean).join(', '), color: '#10B981' },
                  { icon: <PhoneIcon />, label: 'Telefon', value: school?.phone, color: '#F59E0B' },
                  { icon: <EmailIcon />, label: 'E-mel', value: school?.email, color: '#EF4444' },
                  { icon: <LanguageIcon />, label: 'Laman Web', value: school?.website, color: '#0891B2' },
                  { icon: <GroupsIcon />, label: 'Bilangan Pelajar', value: school?.enrollment_count ? `${school.enrollment_count} pelajar` : '—', color: '#8B5CF6' },
                  { icon: <SchoolIcon />, label: 'Kod Sekolah', value: school?.school_code, color: '#64748B' },
                ].map((item) => (
                  <Grid size={{ xs: 12, sm: 6 }} key={item.label}>
                    <Box sx={{
                      display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 1.75,
                      borderRadius: 2.5, border: '1px solid', borderColor: 'divider',
                      bgcolor: 'background.paper',
                    }}>
                      <Box sx={{
                        width: 36, height: 36, borderRadius: 2, flexShrink: 0,
                        bgcolor: alpha(item.color, 0.1), color: item.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        '& svg': { fontSize: 18 },
                      }}>
                        {item.icon}
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', lineHeight: 1 }}>
                          {item.label}
                        </Typography>
                        <Typography variant="body2" fontWeight={600} sx={{ mt: 0.25, wordBreak: 'break-all' }}>
                          {item.value ?? '—'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              {/* School images from documents */}
              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Maklumat Terkini Sekolah</Typography>
                <Grid container spacing={1.5}>
                  {[
                    '/WhatsApp_Image_2026-07-07_at_11.30.14_AM.jpeg',
                    '/WhatsApp_Image_2026-07-07_at_11.30.15_AM.jpeg',
                    '/WhatsApp_Image_2026-07-07_at_11.30.15_AM_(1).jpeg',
                    '/WhatsApp_Image_2026-07-07_at_11.30.15_AM_(2).jpeg',
                  ].map((img, i) => (
                    <Grid size={{ xs: 6, sm: 3 }} key={i}>
                      <Box
                        component="img" src={img} alt={`Maklumat Sekolah ${i + 1}`}
                        sx={{
                          width: '100%', borderRadius: 2.5, objectFit: 'cover',
                          border: '1px solid', borderColor: 'divider',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          cursor: 'pointer',
                          '&:hover': { transform: 'scale(1.02)', boxShadow: `0 8px 24px ${alpha('#000', 0.15)}` },
                        }}
                        onClick={() => window.open(img, '_blank')}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Stack>
          </TabPanel>

          {/* ── TAB 1: JADUAL ── */}
          <TabPanel value={tab} index={1}>
            <Box sx={{ display: 'flex', gap: 1, mb: 2.5, flexWrap: 'wrap' }}>
              {(['all', 'mon-thu', 'friday'] as const).map((d) => (
                <Chip key={d} label={d === 'all' ? 'Semua Hari' : d === 'mon-thu' ? 'Isnin – Khamis' : 'Jumaat'}
                  onClick={() => setDayFilter(d)} variant={dayFilter === d ? 'filled' : 'outlined'}
                  color={dayFilter === d ? 'primary' : 'default'} size="small" sx={{ fontWeight: 600 }} />
              ))}
            </Box>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>
            ) : (
              <Box sx={{ position: 'relative' }}>
                <Box sx={{
                  position: 'absolute', left: 36, top: 20, bottom: 20,
                  width: 2, bgcolor: alpha(theme.palette.primary.main, 0.12), borderRadius: 1,
                }} />
                {filteredSchedules.map((s, i) => {
                  const special = isSpecial(s.period_name);
                  const recess = isRecess(s.period_name);
                  const color = recess ? '#10B981' : special ? '#F59E0B' : theme.palette.primary.main;
                  return (
                    <Box key={s.id} sx={{ display: 'flex', gap: 2, mb: i === filteredSchedules.length - 1 ? 0 : 1.5, position: 'relative' }}>
                      <Box sx={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, bgcolor: color, mt: 1.5, border: '3px solid', borderColor: alpha(color, 0.25), zIndex: 1 }} />
                      <Box sx={{ flex: 1, bgcolor: special ? alpha(color, 0.07) : alpha(theme.palette.primary.main, 0.03), border: '1px solid', borderColor: special ? alpha(color, 0.2) : 'divider', borderRadius: 2.5, px: 2, py: 1.25 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                          <Typography variant="body2" fontWeight={special ? 700 : 600} sx={{ color: special ? color : 'text.primary' }}>
                            {s.period_name}
                          </Typography>
                          <Typography variant="caption" fontWeight={700} sx={{ color, flexShrink: 0, bgcolor: alpha(color, 0.1), px: 1, py: 0.25, borderRadius: 1.5 }}>
                            {formatTime(s.start_time)} – {formatTime(s.end_time)}
                          </Typography>
                        </Box>
                        {s.description && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                            {s.description}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </TabPanel>

          {/* ── TAB 2: ACARA ── */}
          <TabPanel value={tab} index={2}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>
            ) : events.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <EventIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">Tiada acara akan datang</Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {events.map((ev) => {
                  const meta = EVENT_CATEGORY_META[ev.category] ?? EVENT_CATEGORY_META.general;
                  const dateObj = new Date(ev.event_date);
                  const month = dateObj.toLocaleString('ms-MY', { month: 'short' }).toUpperCase();
                  const day = dateObj.getDate();
                  return (
                    <Box key={ev.id} sx={{ display: 'flex', gap: 2, p: 1.75, borderRadius: 2.5, border: '1px solid', borderColor: ev.is_important ? alpha(meta.color, 0.3) : 'divider', bgcolor: ev.is_important ? alpha(meta.color, 0.04) : 'transparent', alignItems: 'flex-start' }}>
                      <Box sx={{ width: 48, flexShrink: 0, textAlign: 'center', bgcolor: alpha(meta.color, 0.1), borderRadius: 2, py: 0.75, border: '1px solid', borderColor: alpha(meta.color, 0.2) }}>
                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: meta.color, lineHeight: 1, letterSpacing: 0.5 }}>{month}</Typography>
                        <Typography sx={{ fontSize: '1.25rem', fontWeight: 800, color: meta.color, lineHeight: 1.1 }}>{day}</Typography>
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
                          {ev.is_important && <StarIcon sx={{ fontSize: 14, color: '#F59E0B' }} />}
                          <Typography variant="body2" fontWeight={700} noWrap>{ev.title}</Typography>
                        </Box>
                        {ev.description && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>{ev.description}</Typography>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Chip label={meta.label} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: alpha(meta.color, 0.12), color: meta.color }} />
                          {ev.location && <Typography variant="caption" color="text.secondary">📍 {ev.location}</Typography>}
                          {ev.event_end_date && ev.event_end_date !== ev.event_date && (
                            <Typography variant="caption" color="text.secondary">
                              hingga {new Date(ev.event_end_date).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' })}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </TabPanel>

          {/* ── TAB 3: PERATURAN ── */}
          <TabPanel value={tab} index={3}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>
            ) : (
              <Box>
                <Box sx={{ display: 'flex', gap: 1.5, p: 1.75, mb: 2.5, borderRadius: 2.5, bgcolor: alpha('#F59E0B', 0.08), border: '1px solid', borderColor: alpha('#F59E0B', 0.2) }}>
                  <GavelIcon sx={{ color: '#F59E0B', fontSize: 20, flexShrink: 0, mt: 0.1 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                    Peraturan-peraturan ini dikuatkuasakan di bawah Kod Disiplin {school?.school_name}. Ibu bapa dinasihatkan untuk membaca semua peraturan bersama anak masing-masing.
                  </Typography>
                </Box>
                {Object.entries(groupedRules).map(([category, categoryRules], catIdx) => {
                  const color = RULE_CATEGORY_COLORS[category] ?? '#64748B';
                  return (
                    <Accordion key={category} defaultExpanded={catIdx === 0} disableGutters elevation={0}
                      sx={{ mb: 1.5, border: '1px solid', borderColor: alpha(color, 0.2), borderRadius: '12px !important', '&:before': { display: 'none' }, '&.Mui-expanded': { borderColor: alpha(color, 0.35) } }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}
                        sx={{ borderRadius: 3, bgcolor: alpha(color, 0.06), '&.Mui-expanded': { borderRadius: '12px 12px 0 0' }, minHeight: 52 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: alpha(color, 0.15), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FiberManualRecordIcon sx={{ fontSize: 12, color }} />
                          </Box>
                          <Typography variant="subtitle2" fontWeight={700} sx={{ color }}>{category}</Typography>
                          <Chip label={`${categoryRules.length} peraturan`} size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: alpha(color, 0.12), color, fontWeight: 700 }} />
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails sx={{ p: 0 }}>
                        {categoryRules.map((rule, idx) => (
                          <Box key={rule.id}>
                            {idx > 0 && <Divider />}
                            <Box sx={{ px: 2.5, py: 1.75, display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                              <Box sx={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, bgcolor: alpha(color, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 0.1 }}>
                                <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color }}>{rule.rule_number}</Typography>
                              </Box>
                              <Box>
                                <Typography variant="body2" fontWeight={700} gutterBottom>{rule.title}</Typography>
                                {rule.description && <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>{rule.description}</Typography>}
                              </Box>
                            </Box>
                          </Box>
                        ))}
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </Box>
            )}
          </TabPanel>

          {/* ── TAB 4: SUMBER PERPUSTAKAAN ── */}
          <TabPanel value={tab} index={4}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>
            ) : (
              <Box>
                {/* Summary stats */}
                <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                  {[
                    { label: 'Jumlah Koleksi', value: library.length, color: '#2563EB' },
                    { label: 'Tersedia', value: library.filter(l => l.is_available).length, color: '#10B981' },
                    { label: 'Jumlah Naskah', value: library.reduce((s, l) => s + l.quantity_total, 0), color: '#8B5CF6' },
                  ].map((stat) => (
                    <Grid size={{ xs: 4 }} key={stat.label}>
                      <Box sx={{ textAlign: 'center', p: 1.5, borderRadius: 2.5, border: '1px solid', borderColor: alpha(stat.color, 0.15), bgcolor: alpha(stat.color, 0.04) }}>
                        <Typography variant="h6" fontWeight={800} sx={{ color: stat.color }}>{stat.value}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{stat.label}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>

                {/* Search */}
                <TextField fullWidth size="small" placeholder="Cari tajuk, pengarang, kategori..."
                  value={librarySearch} onChange={(e) => setLibrarySearch(e.target.value)}
                  InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon color="action" fontSize="small" /></InputAdornment>) }}
                  sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }} />

                {/* Type filter */}
                <Box sx={{ display: 'flex', gap: 0.75, mb: 2.5, flexWrap: 'wrap' }}>
                  {libraryTypes.map((t) => {
                    const meta = t === 'all' ? null : LIBRARY_TYPE_META[t];
                    return (
                      <Chip key={t} label={t === 'all' ? 'Semua' : (meta?.label ?? t)}
                        onClick={() => setLibraryTypeFilter(t)}
                        variant={libraryTypeFilter === t ? 'filled' : 'outlined'}
                        color={libraryTypeFilter === t ? 'primary' : 'default'}
                        size="small" sx={{ fontWeight: 600 }} />
                    );
                  })}
                </Box>

                {/* Library items */}
                <Stack spacing={1}>
                  {filteredLibrary.map((item) => {
                    const meta = LIBRARY_TYPE_META[item.resource_type] ?? LIBRARY_TYPE_META.buku;
                    const availPct = item.quantity_total > 0 ? (item.quantity_available / item.quantity_total) * 100 : 0;
                    const availColor = availPct > 60 ? '#10B981' : availPct > 30 ? '#F59E0B' : '#EF4444';
                    return (
                      <Box key={item.id} sx={{ display: 'flex', gap: 2, p: 1.75, borderRadius: 2.5, border: '1px solid', borderColor: 'divider', alignItems: 'flex-start' }}>
                        <Box sx={{ width: 40, height: 40, borderRadius: 2, flexShrink: 0, bgcolor: alpha(meta.color, 0.1), color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', '& svg': { fontSize: 20 } }}>
                          {meta.icon}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={700} noWrap>{item.title}</Typography>
                          {item.author && <Typography variant="caption" color="text.secondary">{item.author}</Typography>}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5, flexWrap: 'wrap' }}>
                            <Chip label={meta.label} size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, bgcolor: alpha(meta.color, 0.1), color: meta.color }} />
                            <Chip label={item.category} size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 600 }} />
                            {item.location && <Typography variant="caption" color="text.secondary">{item.location}</Typography>}
                          </Box>
                        </Box>
                        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                          <Typography variant="caption" fontWeight={700} sx={{ color: availColor, display: 'block' }}>
                            {item.quantity_available}/{item.quantity_total}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>tersedia</Typography>
                        </Box>
                      </Box>
                    );
                  })}
                  {filteredLibrary.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <MenuBookIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">Tiada rekod ditemui</Typography>
                    </Box>
                  )}
                </Stack>
              </Box>
            )}
          </TabPanel>

          {/* ── TAB 5: KELAB & PERSATUAN ── */}
          <TabPanel value={tab} index={5}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>
            ) : (
              <Box>
                {/* Summary stats */}
                <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                  {clubCategories.filter(c => c !== 'all').map((cat) => {
                    const count = clubs.filter(c => c.category === cat).length;
                    const color = CLUB_CATEGORY_COLORS[cat] ?? '#64748B';
                    return (
                      <Grid size={{ xs: 6, sm: 4 }} key={cat}>
                        <Box sx={{ p: 1.5, borderRadius: 2.5, border: '1px solid', borderColor: alpha(color, 0.15), bgcolor: alpha(color, 0.04), textAlign: 'center' }}>
                          <Typography variant="h6" fontWeight={800} sx={{ color }}>{count}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.65rem' }}>{cat}</Typography>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>

                {/* Category filter */}
                <Box sx={{ display: 'flex', gap: 0.75, mb: 2.5, flexWrap: 'wrap' }}>
                  {clubCategories.map((cat) => (
                    <Chip key={cat} label={cat === 'all' ? 'Semua' : cat}
                      onClick={() => setClubCategoryFilter(cat)}
                      variant={clubCategoryFilter === cat ? 'filled' : 'outlined'}
                      color={clubCategoryFilter === cat ? 'primary' : 'default'}
                      size="small" sx={{ fontWeight: 600 }} />
                  ))}
                </Box>

                {/* Club cards */}
                <Stack spacing={1.5}>
                  {filteredClubs.map((club) => {
                    const color = CLUB_CATEGORY_COLORS[club.category] ?? '#64748B';
                    return (
                      <Card key={club.id} elevation={0} sx={{ border: '1px solid', borderColor: alpha(color, 0.15), borderRadius: 3, overflow: 'visible' }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                            <Avatar sx={{ width: 44, height: 44, bgcolor: alpha(color, 0.15), color, flexShrink: 0, borderRadius: 2.5, fontSize: '1rem', fontWeight: 800 }}>
                              {club.logo_url ? (
                                <Box component="img" src={club.logo_url} sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                              ) : (
                                club.name[0]
                              )}
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                                <Typography variant="subtitle2" fontWeight={700} noWrap>{club.name}</Typography>
                                <Chip label={club.category} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: alpha(color, 0.12), color }} />
                              </Box>
                              {club.description && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, lineHeight: 1.5 }}>{club.description}</Typography>
                              )}
                              <Grid container spacing={0.75}>
                                {club.teacher_advisor && (
                                  <Grid size={12}>
                                    <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
                                      <PersonIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                                      <Typography variant="caption" color="text.secondary">Penasihat: <strong>{club.teacher_advisor}</strong></Typography>
                                    </Box>
                                  </Grid>
                                )}
                                {club.president_name && (
                                  <Grid size={12}>
                                    <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
                                      <EmojiEventsIcon sx={{ fontSize: 13, color: '#F59E0B' }} />
                                      <Typography variant="caption" color="text.secondary">Presiden: <strong>{club.president_name}</strong></Typography>
                                    </Box>
                                  </Grid>
                                )}
                                {club.meeting_schedule && (
                                  <Grid size={12}>
                                    <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
                                      <AccessTimeIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                                      <Typography variant="caption" color="text.secondary">{club.meeting_schedule} • {club.meeting_location}</Typography>
                                    </Box>
                                  </Grid>
                                )}
                                {club.achievements && (
                                  <Grid size={12}>
                                    <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'flex-start' }}>
                                      <StarIcon sx={{ fontSize: 13, color: '#F59E0B', mt: 0.1, flexShrink: 0 }} />
                                      <Typography variant="caption" sx={{ color: '#B45309', fontWeight: 600, lineHeight: 1.4 }}>{club.achievements}</Typography>
                                    </Box>
                                  </Grid>
                                )}
                              </Grid>
                            </Box>
                            {club.member_count > 0 && (
                              <Box sx={{ textAlign: 'center', flexShrink: 0 }}>
                                <Typography variant="subtitle1" fontWeight={800} sx={{ color, lineHeight: 1 }}>{club.member_count}</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>ahli</Typography>
                              </Box>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}
                  {filteredClubs.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <GroupsIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">Tiada kelab/persatuan ditemui</Typography>
                    </Box>
                  )}
                </Stack>
              </Box>
            )}
          </TabPanel>

        </CardContent>
      </Card>
    </Box>
  );
}
