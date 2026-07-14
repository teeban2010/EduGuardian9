import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CampaignIcon from '@mui/icons-material/Campaign';
import { supabase } from '../../lib/supabase';
import { useSchool } from '../../contexts/SchoolContext';
import type { Announcement } from '../../types';

interface SchoolAnnouncement extends Announcement {
  school_id?: string | null;
}

export default function AnnouncementsManagement() {
  const { school } = useSchool();

  const [announcements, setAnnouncements] = useState<SchoolAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnnouncements = useCallback(async () => {
    if (!school?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    const { data, error: announcementsError } = await supabase
      .from('announcements')
      .select('*')
      .eq('school_id', school.id)
      .order('published_at', { ascending: false })
      .limit(10);

    if (announcementsError) {
      setError(announcementsError.message);
      setAnnouncements([]);
    } else {
      setAnnouncements((data as SchoolAnnouncement[]) ?? []);
    }

    setLoading(false);
  }, [school?.id]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const getPriorityColour = (
    priority: string,
  ): 'default' | 'info' | 'warning' | 'error' | 'success' => {
    if (priority === 'urgent') return 'error';
    if (priority === 'high') return 'warning';
    if (priority === 'low') return 'info';
    return 'default';
  };

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        gap={2}
        mb={3}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            School Announcements
          </Typography>

          <Typography color="text.secondary">
            View announcements published by{' '}
            {school?.school_name ?? 'this school'}.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          disabled
          title="Announcement creation will be added in the next phase"
        >
          New Announcement
        </Button>
      </Stack>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Announcements could not be loaded. This module may not yet be fully
          configured in the database.
        </Alert>
      )}

      {loading ? (
        <Box
          sx={{
            minHeight: 220,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress />
        </Box>
      ) : announcements.length === 0 ? (
        <Card
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <CardContent
            sx={{
              minHeight: 240,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <CampaignIcon
              sx={{
                fontSize: 56,
                color: 'primary.main',
                mb: 2,
              }}
            />

            <Typography variant="h6" fontWeight={700}>
              No announcements published
            </Typography>

            <Typography
              color="text.secondary"
              sx={{ maxWidth: 480, mt: 1 }}
            >
              School announcements and parent notifications will appear here
              once they have been published by the administrator.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {announcements.map((announcement) => (
            <Card
              key={announcement.id}
              sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <CardContent>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  gap={1}
                  mb={1.5}
                >
                  <Typography variant="h6" fontWeight={700}>
                    {announcement.title}
                  </Typography>

                  <Chip
                    size="small"
                    label={announcement.priority}
                    color={getPriorityColour(announcement.priority)}
                    variant="outlined"
                  />
                </Stack>

                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  {announcement.content}
                </Typography>

                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  gap={1}
                  justifyContent="space-between"
                >
                  <Typography variant="caption" color="text.secondary">
                    Published by {announcement.author_name ?? 'School Admin'}
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    {announcement.published_at
                      ? new Date(
                          announcement.published_at,
                        ).toLocaleDateString()
                      : ''}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Alert severity="info" sx={{ mt: 3 }}>
        Creating announcements and sending notifications will be implemented in
        the next development phase.
      </Alert>
    </Box>
  );
}