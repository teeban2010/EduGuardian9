import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, InputAdornment,
  List, ListItemText, ListItemButton,
  Chip, Divider, useTheme, alpha, Tab, Tabs,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SchoolIcon from '@mui/icons-material/School';
import EmptyState from '../../components/common/EmptyState';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'student' | 'homework' | 'announcement' | 'resource' | 'teacher';
  extra?: string;
}

const ALL_RESULTS: SearchResult[] = [
  { id: '1', title: 'Ahmad Faris bin Malik', subtitle: 'Class 3A • Student ID: 2024-001', type: 'student' },
  { id: '2', title: 'Nurul Ain binti Hassan', subtitle: 'Class 3A • Student ID: 2024-002', type: 'student' },
  { id: '3', title: 'Kevin Tan Wei Ming', subtitle: 'Class 3B • Student ID: 2024-015', type: 'student' },
  { id: '4', title: 'Chapter 5: Algebraic Expressions', subtitle: 'Mathematics • Due Jul 6, 2026', type: 'homework', extra: 'Pending' },
  { id: '5', title: 'Science Lab Report: Osmosis', subtitle: 'Science • Due Jul 10, 2026', type: 'homework', extra: 'Pending' },
  { id: '6', title: 'Sports Day Announcement', subtitle: 'Posted 2 days ago • General', type: 'announcement', extra: 'High' },
  { id: '7', title: 'Mid-Year Exam Schedule', subtitle: 'Posted 1 week ago • Academic', type: 'announcement', extra: 'Urgent' },
  { id: '8', title: 'Algebraic Expressions Notes', subtitle: 'Mathematics • PDF • 24 pages', type: 'resource', extra: '156 downloads' },
  { id: '9', title: 'Science Quiz: Forces & Motion', subtitle: 'Science • Quiz • 15 questions', type: 'resource', extra: '89 downloads' },
  { id: '10', title: 'Cikgu Siti Rahayu', subtitle: 'Mathematics Teacher • Class 3A', type: 'teacher' },
  { id: '11', title: 'Mr. James Wong', subtitle: 'Science Teacher • Class 4A', type: 'teacher' },
];

const typeConfig = {
  student: { icon: <PersonIcon />, color: '#2563EB', label: 'Student' },
  homework: { icon: <AssignmentIcon />, color: '#8B5CF6', label: 'Homework' },
  announcement: { icon: <AnnouncementIcon />, color: '#10B981', label: 'Announcement' },
  resource: { icon: <MenuBookIcon />, color: '#F59E0B', label: 'Resource' },
  teacher: { icon: <SchoolIcon />, color: '#EF4444', label: 'Teacher' },
};

export default function Search() {
  useTheme();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState(0);

  const types = ['all', 'student', 'homework', 'announcement', 'resource', 'teacher'] as const;

  const filtered = ALL_RESULTS.filter((r) => {
    const matchQuery = !query || r.title.toLowerCase().includes(query.toLowerCase()) || r.subtitle.toLowerCase().includes(query.toLowerCase());
    const matchTab = tab === 0 || r.type === types[tab];
    return matchQuery && matchTab;
  });

  const counts = types.map((t, i) => i === 0 ? ALL_RESULTS.length : ALL_RESULTS.filter((r) => r.type === t).length);

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>Search</Typography>
        <Typography variant="body2" color="text.secondary">Find students, homework, announcements, and more</Typography>
      </Box>

      {/* Search bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <TextField
            fullWidth
            placeholder="Search for students, homework, announcements, resources, teachers..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, fontSize: '1rem' } }}
          />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        {types.map((type, i) => (
          <Tab
            key={type}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <span style={{ textTransform: 'capitalize' }}>{type === 'all' ? 'All' : typeConfig[type as keyof typeof typeConfig].label + 's'}</span>
                <Chip label={counts[i]} size="small" sx={{ height: 18, fontSize: '0.68rem', bgcolor: i === tab ? 'primary.main' : 'action.hover', color: i === tab ? 'white' : 'text.secondary' }} />
              </Box>
            }
          />
        ))}
      </Tabs>

      {/* Results */}
      {filtered.length === 0 ? (
        <EmptyState
          title={query ? `No results for "${query}"` : 'Start typing to search'}
          description={query ? 'Try different keywords or check your spelling.' : 'Search for students, homework, announcements, and more.'}
          icon={<SearchIcon sx={{ fontSize: 36 }} />}
        />
      ) : (
        <Card>
          <List disablePadding>
            {filtered.map((result, i) => {
              const conf = typeConfig[result.type];
              return (
                <Box key={result.id}>
                  {i > 0 && <Divider />}
                  <ListItemButton sx={{ py: 2, px: 3, '&:hover': { bgcolor: alpha(conf.color, 0.04) } }}>
                    <Box
                      sx={{
                        width: 44, height: 44, borderRadius: 2,
                        bgcolor: alpha(conf.color, 0.12),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: conf.color, mr: 2, flexShrink: 0,
                      }}
                    >
                      {conf.icon}
                    </Box>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight={600}>{result.title}</Typography>
                        </Box>
                      }
                      secondary={result.subtitle}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                    <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                      <Chip size="small" label={conf.label} sx={{ height: 20, fontSize: '0.68rem', bgcolor: alpha(conf.color, 0.1), color: conf.color, fontWeight: 600 }} />
                      {result.extra && (
                        <Chip size="small" label={result.extra} variant="outlined" sx={{ height: 20, fontSize: '0.68rem' }} />
                      )}
                    </Box>
                  </ListItemButton>
                </Box>
              );
            })}
          </List>
        </Card>
      )}
    </Box>
  );
}
