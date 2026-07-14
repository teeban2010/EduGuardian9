import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import SchoolIcon from '@mui/icons-material/School';
import CampaignIcon from '@mui/icons-material/Campaign';
import LinkIcon from '@mui/icons-material/Link';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import { supabase } from '../../lib/supabase';
import { useSchool } from '../../contexts/SchoolContext';

interface ReportCounts {
  students: number;
  parents: number;
  teachers: number;
  announcements: number;
  linkedStudents: number;
  pendingStudents: number;
}

const emptyCounts: ReportCounts = {
  students: 0,
  parents: 0,
  teachers: 0,
  announcements: 0,
  linkedStudents: 0,
  pendingStudents: 0,
};

interface SummaryCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  helperText?: string;
}

function SummaryCard({
  label,
  value,
  icon,
  helperText,
}: SummaryCardProps) {
  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <CardContent>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          gap={2}
        >
          <Box>
            <Typography
              variant="body2"
              color="text.secondary"
              fontWeight={600}
            >
              {label}
            </Typography>

            <Typography
              variant="h3"
              fontWeight={800}
              sx={{ mt: 1 }}
            >
              {value}
            </Typography>

            {helperText && (
              <Typography
                variant="caption"
                color="text.secondary"
              >
                {helperText}
              </Typography>
            )}
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
              flexShrink: 0,
              '& svg': {
                fontSize: 28,
              },
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function ReportsDashboard() {
  const { school } = useSchool();

  const [counts, setCounts] =
    useState<ReportCounts>(emptyCounts);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const loadReportData = useCallback(async () => {
    if (!school?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    const [
      studentsResult,
      profilesResult,
      announcementsResult,
    ] = await Promise.all([
      supabase
        .from('students')
        .select(
          'id, parent_link_status',
        )
        .eq('school_id', school.id),

      supabase
        .from('profiles')
        .select('role')
        .eq('school_id', school.id),

      supabase
        .from('announcements')
        .select(
          'id',
          {
            count: 'exact',
            head: true,
          },
        )
        .eq('school_id', school.id),
    ]);

    if (studentsResult.error) {
      setError(
        studentsResult.error.message,
      );
      setLoading(false);
      return;
    }

    if (profilesResult.error) {
      setError(
        profilesResult.error.message,
      );
      setLoading(false);
      return;
    }

    const students =
      studentsResult.data ?? [];

    const profiles =
      profilesResult.data ?? [];

    setCounts({
      students: students.length,

      parents: profiles.filter(
        (profile) =>
          profile.role === 'parent',
      ).length,

      teachers: profiles.filter(
        (profile) =>
          profile.role === 'teacher',
      ).length,

      announcements:
        announcementsResult.count ?? 0,

      linkedStudents: students.filter(
        (student) =>
          student.parent_link_status ===
          'Linked',
      ).length,

      pendingStudents: students.filter(
        (student) =>
          student.parent_link_status ===
            'Pending' ||
          !student.parent_link_status,
      ).length,
    });

    setLoading(false);
  }, [school?.id]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  const parentLinkRate = useMemo(() => {
    if (counts.students === 0) {
      return 0;
    }

    return Math.round(
      (counts.linkedStudents /
        counts.students) *
        100,
    );
  }, [
    counts.linkedStudents,
    counts.students,
  ]);

  /*
    These two indicators are clearly marked
    as competition demo indicators because
    the current project does not yet have
    complete attendance and submission data.
  */
  const attendanceRate = 95;
  const homeworkCompletionRate = 89;

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 320,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          fontWeight={800}
        >
          School Reports
        </Typography>

        <Typography color="text.secondary">
          Overview and performance indicators
          for{' '}
          {school?.school_name ??
            'this school'}.
        </Typography>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      )}

      <Grid
        container
        spacing={2.5}
      >
        <Grid
          size={{
            xs: 12,
            sm: 6,
            lg: 3,
          }}
        >
          <SummaryCard
            label="Total Students"
            value={counts.students}
            icon={<SchoolIcon />}
            helperText="Registered student records"
          />
        </Grid>

        <Grid
          size={{
            xs: 12,
            sm: 6,
            lg: 3,
          }}
        >
          <SummaryCard
            label="Registered Parents"
            value={counts.parents}
            icon={<FamilyRestroomIcon />}
            helperText="Parent user accounts"
          />
        </Grid>

        <Grid
          size={{
            xs: 12,
            sm: 6,
            lg: 3,
          }}
        >
          <SummaryCard
            label="Registered Teachers"
            value={counts.teachers}
            icon={<PeopleIcon />}
            helperText="Teacher user accounts"
          />
        </Grid>

        <Grid
          size={{
            xs: 12,
            sm: 6,
            lg: 3,
          }}
        >
          <SummaryCard
            label="Announcements"
            value={counts.announcements}
            icon={<CampaignIcon />}
            helperText="Published school notices"
          />
        </Grid>

        <Grid
          size={{
            xs: 12,
            md: 6,
          }}
        >
          <Card
            sx={{
              height: '100%',
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Box>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                  >
                    Parent Linking Status
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Students successfully
                    connected to parent
                    accounts
                  </Typography>
                </Box>

                <LinkIcon
                  sx={{
                    color: 'primary.main',
                    fontSize: 34,
                  }}
                />
              </Stack>

              <Typography
                variant="h3"
                fontWeight={800}
              >
                {parentLinkRate}%
              </Typography>

              <LinearProgress
                variant="determinate"
                value={parentLinkRate}
                sx={{
                  height: 10,
                  borderRadius: 10,
                  mt: 2,
                  mb: 2,
                }}
              />

              <Stack
                direction="row"
                justifyContent="space-between"
                gap={2}
              >
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Linked
                  </Typography>

                  <Typography
                    variant="h6"
                    fontWeight={700}
                  >
                    {counts.linkedStudents}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    textAlign: 'right',
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Pending
                  </Typography>

                  <Typography
                    variant="h6"
                    fontWeight={700}
                  >
                    {counts.pendingStudents}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid
          size={{
            xs: 12,
            md: 6,
          }}
        >
          <Card
            sx={{
              height: '100%',
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Box>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                  >
                    Pending Verification
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Records requiring updated
                    parent information
                  </Typography>
                </Box>

                <PendingActionsIcon
                  sx={{
                    color: 'warning.main',
                    fontSize: 34,
                  }}
                />
              </Stack>

              <Typography
                variant="h3"
                fontWeight={800}
              >
                {counts.pendingStudents}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 2 }}
              >
                Administrators can review these
                records and verify the parent’s
                full name or phone number.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid
          size={{
            xs: 12,
            md: 6,
          }}
        >
          <Card
            sx={{
              height: '100%',
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
              >
                <Box>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                  >
                    Attendance Rate
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Competition demonstration
                    indicator
                  </Typography>
                </Box>

                <TrendingUpIcon
                  sx={{
                    color: 'success.main',
                    fontSize: 34,
                  }}
                />
              </Stack>

              <Typography
                variant="h3"
                fontWeight={800}
              >
                {attendanceRate}%
              </Typography>

              <LinearProgress
                variant="determinate"
                value={attendanceRate}
                color="success"
                sx={{
                  height: 10,
                  borderRadius: 10,
                  mt: 2,
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid
          size={{
            xs: 12,
            md: 6,
          }}
        >
          <Card
            sx={{
              height: '100%',
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
              >
                <Box>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                  >
                    Homework Completion
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Competition demonstration
                    indicator
                  </Typography>
                </Box>

                <AssignmentTurnedInIcon
                  sx={{
                    color: 'primary.main',
                    fontSize: 34,
                  }}
                />
              </Stack>

              <Typography
                variant="h3"
                fontWeight={800}
              >
                {homeworkCompletionRate}%
              </Typography>

              <LinearProgress
                variant="determinate"
                value={
                  homeworkCompletionRate
                }
                sx={{
                  height: 10,
                  borderRadius: 10,
                  mt: 2,
                }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Alert
        severity="info"
        sx={{ mt: 3 }}
      >
        Student, parent, teacher, announcement
        and parent-linking figures are retrieved
        from the live Supabase database.
        Attendance and homework percentages are
        demonstration indicators until those
        modules are fully connected.
      </Alert>
    </Box>
  );
}