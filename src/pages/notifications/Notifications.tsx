import { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, List, ListItem,
  Chip, IconButton, Button, Divider, alpha, Tabs, Tab,
  Skeleton, Fade,
} from '@mui/material';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EventNoteIcon from '@mui/icons-material/EventNote';
import CampaignIcon from '@mui/icons-material/Campaign';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import SchoolIcon from '@mui/icons-material/School';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import EmptyState from '../../components/common/EmptyState';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  source: 'notification' | 'announcement';
  priority?: string;
  category?: string;
  author_name?: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  homework:    { icon: <AssignmentIcon fontSize="small" />,       color: '#2563EB', label: 'Homework' },
  attendance:  { icon: <EventNoteIcon fontSize="small" />,        color: '#F59E0B', label: 'Attendance' },
  academic:    { icon: <SchoolIcon fontSize="small" />,           color: '#8B5CF6', label: 'Academic' },
  event:       { icon: <CampaignIcon fontSize="small" />,         color: '#10B981', label: 'Event' },
  general:     { icon: <AnnouncementIcon fontSize="small" />,     color: '#0891B2', label: 'General' },
  announcement: { icon: <AnnouncementIcon fontSize="small" />,    color: '#10B981', label: 'Announcement' },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-MY', { month: 'short', day: 'numeric' });
}

function groupByDate(items: NotificationItem[]) {
  const today = new Date();
  today.setHours(0,0,0,0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const groups: { label: string; items: NotificationItem[] }[] = [
    { label: 'Today', items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'Earlier', items: [] },
  ];
  items.forEach((n) => {
    const d = new Date(n.created_at);
    d.setHours(0,0,0,0);
    if (d.getTime() === today.getTime()) groups[0].items.push(n);
    else if (d.getTime() === yesterday.getTime()) groups[1].items.push(n);
    else groups[2].items.push(n);
  });
  return groups.filter((g) => g.items.length > 0);
}

export default function Notifications() {
  const { user } = useAuth();
  const { school } = useSchool();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  const load = useCallback(async () => {
    if (!user || !school?.id) return;
    setLoading(true);

    // Load personal notifications
    const { data: notifs } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Load school announcements (treat as notifications)
    const { data: announcements } = await supabase
      .from('announcements')
      .select('*')
      .eq('school_id', school.id)
      .order('published_at', { ascending: false })
      .limit(20);

    const notifItems: NotificationItem[] = (notifs ?? []).map((n: {
      id: string; title: string; message: string; type: string; is_read: boolean; created_at: string;
    }) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type ?? 'general',
      is_read: n.is_read,
      created_at: n.created_at,
      source: 'notification' as const,
    }));

    const announcementItems: NotificationItem[] = (announcements ?? []).map((a: {
      id: string; title: string; content: string; category: string; priority: string;
      author_name: string; published_at: string;
    }) => ({
      id: `ann-${a.id}`,
      title: a.title,
      message: a.content,
      type: a.category ?? 'announcement',
      is_read: false,
      created_at: a.published_at ?? new Date().toISOString(),
      source: 'announcement' as const,
      priority: a.priority,
      author_name: a.author_name,
    }));

    // Merge and sort
    const merged = [...notifItems, ...announcementItems]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setItems(merged);
    setLoading(false);
  }, [user, school?.id]);

  useEffect(() => { load(); }, [load]);

  const unreadCount = items.filter((n) => !n.is_read).length;

  const filtered = tab === 0 ? items : tab === 1 ? items.filter((n) => !n.is_read) : items.filter((n) => n.is_read);

  const markRead = async (id: string) => {
    if (id.startsWith('ann-')) {
      setItems((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
      return;
    }
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    const ids = items.filter((n) => !n.is_read && !n.id.startsWith('ann-')).map((n) => n.id);
    if (ids.length > 0) {
      await supabase.from('notifications').update({ is_read: true }).in('id', ids);
    }
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const deleteItem = async (id: string) => {
    if (!id.startsWith('ann-')) {
      await supabase.from('notifications').delete().eq('id', id);
    }
    setItems((prev) => prev.filter((n) => n.id !== id));
  };

  const groups = groupByDate(filtered);

  return (
    <Fade in>
      <Box>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 48, height: 48, borderRadius: 3, bgcolor: alpha('#8B5CF6', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <NotificationsNoneIcon sx={{ color: '#8B5CF6', fontSize: 26 }} />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h5" fontWeight={800}>Notifications</Typography>
                  {unreadCount > 0 && <Chip label={`${unreadCount} new`} size="small" color="error" sx={{ height: 22, fontWeight: 700, borderRadius: '8px' }} />}
                </Box>
                <Typography variant="body2" color="text.secondary">Stay updated with school activities</Typography>
              </Box>
            </Box>
          </Box>
          {unreadCount > 0 && (
            <Button startIcon={<DoneAllIcon />} size="small" onClick={markAllRead} variant="outlined">
              Mark all read
            </Button>
          )}
        </Box>

        <Card>
          <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2 }}>
              <Tab label={`All (${items.length})`} />
              <Tab label={`Unread (${unreadCount})`} />
              <Tab label="Read" />
            </Tabs>
          </Box>

          {loading ? (
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[1,2,3,4,5].map((i) => <Skeleton key={i} variant="rounded" height={72} sx={{ borderRadius: 2 }} />)}
            </Box>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No notifications"
              description="You're all caught up!"
              icon={<NotificationsNoneIcon sx={{ fontSize: 36 }} />}
            />
          ) : (
            <Box>
              {groups.map((group) => (
                <Box key={group.label}>
                  <Box sx={{ px: 3, py: 1.5, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.75 }}>
                      {group.label}
                    </Typography>
                  </Box>
                  <List disablePadding>
                    {group.items.map((notif, i) => {
                      const conf = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.general;
                      return (
                        <Box key={notif.id}>
                          {i > 0 && <Divider />}
                          <ListItem
                            sx={{
                              py: 2, px: 3,
                              bgcolor: notif.is_read ? 'transparent' : alpha(conf.color, 0.03),
                              borderLeft: notif.is_read ? '3px solid transparent' : `3px solid ${conf.color}`,
                              transition: 'background 0.2s',
                              '&:hover': { bgcolor: alpha(conf.color, 0.04) },
                            }}
                            secondaryAction={
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                {!notif.is_read && (
                                  <IconButton size="small" onClick={() => markRead(notif.id)} title="Mark as read">
                                    <CheckCircleIcon fontSize="small" sx={{ color: 'success.main' }} />
                                  </IconButton>
                                )}
                                <IconButton size="small" onClick={() => deleteItem(notif.id)}>
                                  <DeleteIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                                </IconButton>
                              </Box>
                            }
                          >
                            <Box sx={{ display: 'flex', gap: 2, mr: 7 }}>
                              <Box sx={{
                                width: 44, height: 44, borderRadius: 2.5,
                                bgcolor: alpha(conf.color, 0.12),
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: conf.color, flexShrink: 0, position: 'relative',
                              }}>
                                {conf.icon}
                                {notif.priority === 'high' && (
                                  <Box sx={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, borderRadius: '50%', bgcolor: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <PriorityHighIcon sx={{ fontSize: 10, color: 'white' }} />
                                  </Box>
                                )}
                              </Box>
                              <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                  <Typography variant="body2" fontWeight={notif.is_read ? 500 : 700}>{notif.title}</Typography>
                                  {!notif.is_read && <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: conf.color, flexShrink: 0 }} />}
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                  {notif.message}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, mt: 0.75, alignItems: 'center', flexWrap: 'wrap' }}>
                                  <Typography variant="caption" color="text.disabled">{timeAgo(notif.created_at)}</Typography>
                                  <Chip size="small" label={conf.label}
                                    sx={{ height: 18, fontSize: '0.62rem', bgcolor: alpha(conf.color, 0.1), color: conf.color, fontWeight: 600, borderRadius: '6px' }} />
                                  {notif.author_name && <Typography variant="caption" color="text.disabled">by {notif.author_name}</Typography>}
                                </Box>
                              </Box>
                            </Box>
                          </ListItem>
                        </Box>
                      );
                    })}
                  </List>
                </Box>
              ))}
            </Box>
          )}
        </Card>
      </Box>
    </Fade>
  );
}
