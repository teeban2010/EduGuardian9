import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Select,
  MenuItem, FormControl, InputLabel, IconButton, useTheme, alpha,
  Divider, List, ListItem, Skeleton, Fade,
} from '@mui/material';
import QuizIcon from '@mui/icons-material/Quiz';
import EventIcon from '@mui/icons-material/Event';
import PeopleIcon from '@mui/icons-material/People';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SchoolIcon from '@mui/icons-material/School';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import StarIcon from '@mui/icons-material/Star';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { supabase } from '../../lib/supabase';
import { useSchool } from '../../contexts/SchoolContext';

interface CalEvent {
  id: string;
  title: string;
  type: string;
  date: string;
  color: string;
  description?: string;
  location?: string;
  is_important?: boolean;
}

const EVENT_TYPE_META: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  homework:  { color: '#2563EB', icon: <AssignmentIcon fontSize="small" />, label: 'Homework' },
  exam:      { color: '#EF4444', icon: <QuizIcon fontSize="small" />,       label: 'Exam' },
  meeting:   { color: '#8B5CF6', icon: <PeopleIcon fontSize="small" />,     label: 'Meeting' },
  holiday:   { color: '#10B981', icon: <BeachAccessIcon fontSize="small" />, label: 'Holiday' },
  academic:  { color: '#2563EB', icon: <SchoolIcon fontSize="small" />,      label: 'Academic' },
  sports:    { color: '#10B981', icon: <StarIcon fontSize="small" />,        label: 'Sports' },
  cultural:  { color: '#8B5CF6', icon: <EventIcon fontSize="small" />,       label: 'Cultural' },
  general:   { color: '#F59E0B', icon: <EventIcon fontSize="small" />,       label: 'General' },
};

const newEventDefault = { title: '', type: 'general', date: '' };

export default function Calendar() {
  const theme = useTheme();
  const { school } = useSchool();

  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [addOpen, setAddOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<null | { day: number; events: CalEvent[] }>(null);
  const [newEvent, setNewEvent] = useState(newEventDefault);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!school?.id) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('school_events')
        .select('*')
        .eq('school_id', school.id)
        .order('event_date');

      const mapped: CalEvent[] = (data ?? []).map((e: {
        id: string; title: string; category: string; event_date: string;
        description?: string; location?: string; is_important?: boolean;
      }) => ({
        id: e.id,
        title: e.title,
        type: e.category ?? 'general',
        date: e.event_date,
        color: (EVENT_TYPE_META[e.category] ?? EVENT_TYPE_META.general).color,
        description: e.description,
        location: e.location,
        is_important: e.is_important,
      }));
      setEvents(mapped);
      setLoading(false);
    };
    load();
  }, [school?.id]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const monthName = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const eventsInMonth = events.filter((e) => {
    const d = new Date(e.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const upcomingEvents = events.filter((e) => new Date(e.date) >= new Date()).slice(0, 8);

  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.date || !school?.id) return;
    setSaving(true);
    const meta = EVENT_TYPE_META[newEvent.type] ?? EVENT_TYPE_META.general;
    const { data, error } = await supabase.from('school_events').insert({
      school_id: school.id,
      title: newEvent.title,
      category: newEvent.type,
      event_date: newEvent.date,
      is_important: false,
    }).select().single();

    if (!error && data) {
      setEvents((prev) => [...prev, {
        id: data.id, title: data.title, type: data.category, date: data.event_date,
        color: meta.color, description: data.description,
      }]);
    }
    setNewEvent(newEventDefault);
    setAddOpen(false);
    setSaving(false);
  };

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayEvents = eventsInMonth.filter((e) => e.date === dateStr);
    setSelectedDay({ day, events: dayEvents });
  };

  return (
    <Fade in>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: 3, bgcolor: alpha('#0891B2', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CalendarMonthIcon sx={{ color: '#0891B2', fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={800}>Calendar</Typography>
              <Typography variant="body2" color="text.secondary">School events and important dates</Typography>
            </Box>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>Add Event</Button>
        </Box>

        <Grid container spacing={3}>
          {/* Calendar grid */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <IconButton onClick={() => { const d = new Date(currentDate); d.setMonth(d.getMonth() - 1); setCurrentDate(d); }}><ChevronLeftIcon /></IconButton>
                  <Typography variant="h6" fontWeight={700}>{monthName}</Typography>
                  <IconButton onClick={() => { const d = new Date(currentDate); d.setMonth(d.getMonth() + 1); setCurrentDate(d); }}><ChevronRightIcon /></IconButton>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 1 }}>
                  {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
                    <Box key={d} sx={{ textAlign: 'center', py: 0.75 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>{d}</Typography>
                    </Box>
                  ))}
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
                  {Array.from({ length: firstDay }).map((_, i) => <Box key={`e${i}`} />)}
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const dayEvents = eventsInMonth.filter((e) => e.date === dateStr);
                    const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
                    const isWeekend = new Date(year, month, day).getDay() === 0 || new Date(year, month, day).getDay() === 6;
                    return (
                      <Box
                        key={day}
                        onClick={() => dayEvents.length > 0 && handleDayClick(day)}
                        sx={{
                          minHeight: 52, borderRadius: 2, p: 0.5, cursor: dayEvents.length > 0 ? 'pointer' : 'default',
                          border: isToday ? `2px solid ${theme.palette.primary.main}` : '1px solid transparent',
                          bgcolor: isToday ? alpha(theme.palette.primary.main, 0.06) : 'transparent',
                          '&:hover': dayEvents.length > 0 ? { bgcolor: alpha(theme.palette.primary.main, 0.05) } : {},
                          transition: 'background 0.15s',
                        }}
                      >
                        <Typography variant="caption" fontWeight={isToday ? 800 : 400}
                          sx={{ color: isToday ? 'primary.main' : isWeekend ? 'text.disabled' : 'text.primary', display: 'block', mb: 0.5, fontSize: '0.75rem', px: 0.5 }}>
                          {day}
                        </Typography>
                        {dayEvents.slice(0, 2).map((e) => (
                          <Box key={e.id} sx={{
                            bgcolor: alpha(e.color, 0.15), borderLeft: `2px solid ${e.color}`,
                            px: 0.5, py: 0.15, borderRadius: '0 4px 4px 0', mb: 0.25,
                          }}>
                            <Typography variant="caption" fontWeight={600} noWrap sx={{ fontSize: '0.62rem', color: e.color, display: 'block' }}>{e.title}</Typography>
                          </Box>
                        ))}
                        {dayEvents.length > 2 && (
                          <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary', pl: 0.5 }}>+{dayEvents.length - 2} more</Typography>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Upcoming events */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>Upcoming Events</Typography>
                {loading ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {[1,2,3,4].map((i) => <Skeleton key={i} variant="rounded" height={60} sx={{ borderRadius: 2 }} />)}
                  </Box>
                ) : upcomingEvents.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>No upcoming events</Typography>
                ) : (
                  <List disablePadding>
                    {upcomingEvents.map((e) => {
                      const meta = EVENT_TYPE_META[e.type] ?? EVENT_TYPE_META.general;
                      const d = new Date(e.date);
                      return (
                        <ListItem key={e.id} disablePadding sx={{ mb: 1.5 }}>
                          <Box sx={{ display: 'flex', gap: 1.5, width: '100%', p: 1.5, borderRadius: 2.5, border: '1px solid', borderColor: alpha(meta.color, 0.2), bgcolor: alpha(meta.color, 0.04) }}>
                            <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: alpha(meta.color, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: meta.color }}>
                              {meta.icon}
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={700} noWrap>{e.title}</Typography>
                              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.25, flexWrap: 'wrap' }}>
                                <Typography variant="caption" color="text.secondary">
                                  {d.toLocaleDateString('en-MY', { month: 'short', day: 'numeric' })}
                                </Typography>
                                {e.location && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                                    <LocationOnIcon sx={{ fontSize: 11, color: 'text.disabled' }} />
                                    <Typography variant="caption" color="text.secondary">{e.location}</Typography>
                                  </Box>
                                )}
                              </Box>
                            </Box>
                            {e.is_important && <StarIcon sx={{ fontSize: 14, color: '#F59E0B', flexShrink: 0, mt: 0.25 }} />}
                          </Box>
                        </ListItem>
                      );
                    })}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Day detail dialog */}
        <Dialog open={Boolean(selectedDay)} onClose={() => setSelectedDay(null)} maxWidth="xs" fullWidth>
          {selectedDay && (
            <>
              <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography fontWeight={700}>
                  {new Date(year, month, selectedDay.day).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </Typography>
                <IconButton onClick={() => setSelectedDay(null)} size="small"><CloseIcon /></IconButton>
              </DialogTitle>
              <Divider />
              <DialogContent sx={{ py: 2 }}>
                {selectedDay.events.map((e) => {
                  const meta = EVENT_TYPE_META[e.type] ?? EVENT_TYPE_META.general;
                  return (
                    <Box key={e.id} sx={{ p: 2, mb: 1.5, borderRadius: 2.5, border: '1px solid', borderColor: alpha(meta.color, 0.2), bgcolor: alpha(meta.color, 0.04) }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Box sx={{ color: meta.color }}>{meta.icon}</Box>
                        <Typography variant="subtitle2" fontWeight={700}>{e.title}</Typography>
                      </Box>
                      {e.description && <Typography variant="body2" color="text.secondary">{e.description}</Typography>}
                      {e.location && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          <LocationOnIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                          <Typography variant="caption" color="text.secondary">{e.location}</Typography>
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </DialogContent>
            </>
          )}
        </Dialog>

        {/* Add event dialog */}
        <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography fontWeight={700}>Add Event</Typography>
            <IconButton onClick={() => setAddOpen(false)} size="small"><CloseIcon /></IconButton>
          </DialogTitle>
          <Divider />
          <DialogContent sx={{ py: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField label="Event Title" fullWidth value={newEvent.title} onChange={(e) => setNewEvent((p) => ({ ...p, title: e.target.value }))} />
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select value={newEvent.type} onChange={(e) => setNewEvent((p) => ({ ...p, type: e.target.value }))} label="Type">
                  {Object.entries(EVENT_TYPE_META).map(([k, v]) => (
                    <MenuItem key={k} value={k}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ color: v.color }}>{v.icon}</Box>
                        {v.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField label="Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={newEvent.date} onChange={(e) => setNewEvent((p) => ({ ...p, date: e.target.value }))} />
            </Box>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setAddOpen(false)} variant="outlined">Cancel</Button>
            <Button variant="contained" onClick={handleAddEvent} disabled={!newEvent.title || !newEvent.date || saving}>
              {saving ? 'Saving...' : 'Add Event'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Fade>
  );
}
