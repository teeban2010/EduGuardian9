import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Chip, Button, TextField,
  InputAdornment, IconButton, useTheme, alpha, Dialog, DialogTitle,
  DialogContent, DialogActions, Divider, Fade, Skeleton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import QuizIcon from '@mui/icons-material/Quiz';
import EditNoteIcon from '@mui/icons-material/EditNote';
import DownloadIcon from '@mui/icons-material/Download';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CloseIcon from '@mui/icons-material/Close';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { supabase } from '../../lib/supabase';
import { useSchool } from '../../contexts/SchoolContext';
import { useAuth } from '../../contexts/AuthContext';
import EmptyState from '../../components/common/EmptyState';

interface Resource {
  id: string;
  title: string;
  subject: string;
  type: 'pdf' | 'video' | 'quiz' | 'practice' | string;
  description: string | null;
  url: string | null;
  downloads: number;
}

const TYPE_META: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  pdf:      { icon: <PictureAsPdfIcon />, color: '#EF4444', label: 'PDF' },
  video:    { icon: <PlayCircleIcon />,   color: '#2563EB', label: 'Video' },
  quiz:     { icon: <QuizIcon />,         color: '#8B5CF6', label: 'Quiz' },
  practice: { icon: <EditNoteIcon />,     color: '#10B981', label: 'Practice' },
};

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: '#2563EB',
  Science: '#10B981',
  English: '#8B5CF6',
  'Bahasa Melayu': '#F59E0B',
  History: '#EF4444',
  Physics: '#0891B2',
  Chemistry: '#EA580C',
  Biology: '#059669',
};

function getSubjectColor(subject: string) {
  return SUBJECT_COLORS[subject] ?? '#64748B';
}

export default function ResourceLibrary() {
  const theme = useTheme();
  useSchool();
  useAuth();

  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [selected, setSelected] = useState<Resource | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('resources')
        .select('*')
        .order('downloads', { ascending: false });
      setResources((data ?? []) as Resource[]);
      setLoading(false);
    };
    load();
  }, []);

  const subjects = ['All', ...Array.from(new Set(resources.map((r) => r.subject).filter(Boolean)))];

  const filtered = resources.filter((r) => {
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.subject.toLowerCase().includes(search.toLowerCase());
    const matchSubject = subjectFilter === 'All' || r.subject === subjectFilter;
    return matchSearch && matchSubject;
  });

  const handleDownload = async (resource: Resource) => {
    await supabase.from('resources').update({ downloads: (resource.downloads ?? 0) + 1 }).eq('id', resource.id);
    setResources((prev) => prev.map((r) => r.id === resource.id ? { ...r, downloads: r.downloads + 1 } : r));
    if (resource.url) window.open(resource.url, '_blank');
    setSelected(null);
  };

  return (
    <Fade in>
      <Box>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MenuBookIcon sx={{ color: 'primary.main', fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={800}>Resource Library</Typography>
              <Typography variant="body2" color="text.secondary">Study materials and learning resources</Typography>
            </Box>
          </Box>
        </Box>

        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Resources', value: loading ? '--' : resources.length, color: theme.palette.primary.main },
            { label: 'PDFs', value: loading ? '--' : resources.filter((r) => r.type === 'pdf').length, color: '#EF4444' },
            { label: 'Videos', value: loading ? '--' : resources.filter((r) => r.type === 'video').length, color: '#2563EB' },
            { label: 'Practice', value: loading ? '--' : resources.filter((r) => r.type === 'practice').length, color: '#10B981' },
          ].map((s) => (
            <Card key={s.label} sx={{ px: 2.5, py: 1.75, borderColor: alpha(s.color, 0.15), flex: 1, minWidth: 110 }}>
              <Typography variant="h5" fontWeight={800} sx={{ color: s.color }}>{s.value}</Typography>
              <Typography variant="caption" color="text.secondary">{s.label}</Typography>
            </Card>
          ))}
        </Box>

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment>,
            }}
          />
        </Box>

        {/* Subject chips */}
        <Box sx={{ display: 'flex', gap: 0.75, mb: 3, flexWrap: 'wrap' }}>
          {subjects.map((s) => (
            <Chip
              key={s}
              label={s}
              onClick={() => setSubjectFilter(s)}
              variant={subjectFilter === s ? 'filled' : 'outlined'}
              color={subjectFilter === s ? 'primary' : 'default'}
              size="small"
              sx={subjectFilter !== s && s !== 'All' ? { borderColor: alpha(getSubjectColor(s), 0.4), color: getSubjectColor(s) } : {}}
            />
          ))}
        </Box>

        {/* Grid */}
        {loading ? (
          <Grid container spacing={2.5}>
            {[1,2,3,4,5,6].map((i) => <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}><Skeleton variant="rounded" height={168} sx={{ borderRadius: 3 }} /></Grid>)}
          </Grid>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No resources found"
            description={resources.length === 0 ? 'No study materials have been uploaded yet.' : 'No resources match your search.'}
            icon={<MenuBookIcon sx={{ fontSize: 36 }} />}
          />
        ) : (
          <Grid container spacing={2.5}>
            {filtered.map((r) => {
              const meta = TYPE_META[r.type] ?? TYPE_META.pdf;
              const subColor = getSubjectColor(r.subject);
              return (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={r.id}>
                  <Card
                    sx={{
                      height: '100%', cursor: 'pointer',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                      '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 8px 24px ${alpha(meta.color, 0.2)}`, borderColor: alpha(meta.color, 0.3) },
                    }}
                    onClick={() => setSelected(r)}
                  >
                    <CardContent sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: alpha(meta.color, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.color }}>
                          {meta.icon}
                        </Box>
                        <Chip size="small" label={meta.label}
                          sx={{ bgcolor: alpha(meta.color, 0.1), color: meta.color, height: 22, fontSize: '0.7rem', fontWeight: 700 }} />
                      </Box>
                      <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ flex: 1 }}>{r.title}</Typography>
                      {r.description && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', mb: 1.5, lineHeight: 1.5 }}>
                          {r.description}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                        <Chip size="small" label={r.subject}
                          sx={{ height: 20, fontSize: '0.65rem', bgcolor: alpha(subColor, 0.1), color: subColor }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <DownloadIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                          <Typography variant="caption" color="text.secondary">{r.downloads}</Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {/* Detail dialog */}
        <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
          {selected && (() => {
            const meta = TYPE_META[selected.type] ?? TYPE_META.pdf;
            return (
              <>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: alpha(meta.color, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.color, flexShrink: 0 }}>
                    {meta.icon}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={700}>{selected.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{selected.subject}</Typography>
                  </Box>
                  <IconButton onClick={() => setSelected(null)} size="small"><CloseIcon /></IconButton>
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ py: 3 }}>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2.5 }}>
                    <Chip size="small" label={meta.label} sx={{ bgcolor: alpha(meta.color, 0.1), color: meta.color }} />
                    <Chip size="small" label={selected.subject} sx={{ bgcolor: alpha(getSubjectColor(selected.subject), 0.1), color: getSubjectColor(selected.subject) }} />
                  </Box>
                  {selected.description && (
                    <Box sx={{ p: 2.5, borderRadius: 3, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="body2" lineHeight={1.8}>{selected.description}</Typography>
                    </Box>
                  )}
                  <Box sx={{ mt: 3, p: 2.5, borderRadius: 2.5, bgcolor: alpha('#8B5CF6', 0.06), border: '1px solid', borderColor: alpha('#8B5CF6', 0.15) }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SmartToyIcon sx={{ color: '#8B5CF6' }} />
                      <Typography variant="body2" fontWeight={700} color="#8B5CF6">AI Learning Tip</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>
                      Use this resource in combination with the AI Assistant. Ask the AI to explain difficult concepts, quiz you, or create practice questions based on this material.
                    </Typography>
                  </Box>
                </DialogContent>
                <Divider />
                <DialogActions sx={{ p: 2.5 }}>
                  <Button variant="outlined" onClick={() => setSelected(null)}>Close</Button>
                  <Button variant="contained" startIcon={selected.url ? <OpenInNewIcon /> : <DownloadIcon />} onClick={() => handleDownload(selected)}>
                    {selected.url ? 'Open Resource' : 'Download'}
                  </Button>
                </DialogActions>
              </>
            );
          })()}
        </Dialog>
      </Box>
    </Fade>
  );
}
