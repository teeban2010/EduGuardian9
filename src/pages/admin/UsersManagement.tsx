import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SchoolIcon from '@mui/icons-material/School';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import BadgeIcon from '@mui/icons-material/Badge';
import { supabase } from '../../lib/supabase';
import { useSchool } from '../../contexts/SchoolContext';

interface UserCounts {
  admins: number;
  teachers: number;
  parents: number;
  students: number;
}

const emptyCounts: UserCounts = {
  admins: 0,
  teachers: 0,
  parents: 0,
  students: 0,
};

export default function UsersManagement() {
  const { school } = useSchool();

  const [counts, setCounts] = useState<UserCounts>(emptyCounts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUserCounts = useCallback(async () => {
    if (!school?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    const { data, error: profilesError } = await supabase
      .from('profiles')
      .select('role')
      .eq('school_id', school.id);

    if (profilesError) {
      setError(profilesError.message);
      setLoading(false);
      return;
    }

    const roles = data ?? [];

    setCounts({
      admins: roles.filter((profile) => profile.role === 'admin').length,
      teachers: roles.filter((profile) => profile.role === 'teacher').length,
      parents: roles.filter((profile) => profile.role === 'parent').length,
      students: roles.filter((profile) => profile.role === 'student').length,
    });

    setLoading(false);
  }, [school?.id]);

  useEffect(() => {
    loadUserCounts();
  }, [loadUserCounts]);

  const cards = [
    {
      label: 'Administrators',
      value: counts.admins,
      icon: <AdminPanelSettingsIcon />,
    },
    {
      label: 'Teachers',
      value: counts.teachers,
      icon: <SchoolIcon />,
    },
    {
      label: 'Parents',
      value: counts.parents,
      icon: <FamilyRestroomIcon />,
    },
    {
      label: 'Student Accounts',
      value: counts.students,
      icon: <BadgeIcon />,
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800}>
          User Management
        </Typography>

        <Typography color="text.secondary">
          View registered users for {school?.school_name ?? 'this school'}.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
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
      ) : (
        <>
          <Grid container spacing={2.5}>
            {cards.map((card) => (
              <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={card.label}>
                <Card
                  sx={{
                    height: '100%',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 3,
                  }}
                >
                  <CardContent>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      gap={2}
                    >
                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          fontWeight={600}
                        >
                          {card.label}
                        </Typography>

                        <Typography variant="h3" fontWeight={800} mt={1}>
                          {card.value}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          width: 52,
                          height: 52,
                          borderRadius: 2.5,
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          '& svg': {
                            fontSize: 28,
                          },
                        }}
                      >
                        {card.icon}
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Card
            sx={{
              mt: 3,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Planned User Functions
              </Typography>

              <Typography color="text.secondary" sx={{ mb: 2 }}>
                This competition version currently provides user statistics and
                role-based access control.
              </Typography>

              <Stack spacing={1}>
                <Typography>• Add and approve staff accounts</Typography>
                <Typography>• Change user roles</Typography>
                <Typography>• Deactivate accounts</Typography>
                <Typography>• Reset user access</Typography>
              </Stack>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
}