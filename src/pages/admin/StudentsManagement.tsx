import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import type { Student } from '../../types';

interface ParentOption {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface StudentForm {
  full_name: string;
  student_id_number: string;
  class_name: string;
  grade_level: string;
  date_of_birth: string;
  parent_id: string;
}

const emptyForm: StudentForm = {
  full_name: '',
  student_id_number: '',
  class_name: '',
  grade_level: '',
  date_of_birth: '',
  parent_id: '',
};

export default function StudentsManagement() {
  const { profile } = useAuth();
  const { school } = useSchool();
  const [students, setStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<ParentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [form, setForm] = useState<StudentForm>(emptyForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const canManage = useMemo(
    () => profile?.is_super_admin || profile?.role === 'admin' || profile?.role === 'teacher',
    [profile],
  );

  const loadData = useCallback(async () => {
    if (!school?.id || !canManage) return;
    setLoading(true);
    setError('');

    const [studentsResult, parentsResult] = await Promise.all([
      supabase.from('students').select('*').eq('school_id', school.id).order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('school_id', school.id)
        .eq('role', 'parent')
        .order('full_name'),
    ]);

    if (studentsResult.error) {
      setError(studentsResult.error.message);
    } else {
      setStudents((studentsResult.data as Student[]) ?? []);
    }

    if (!parentsResult.error) {
      setParents((parentsResult.data as ParentOption[]) ?? []);
    }

    setLoading(false);
  }, [school?.id, canManage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateDialog = () => {
    setEditingStudent(null);
    setForm({ ...emptyForm, parent_id: parents[0]?.id ?? '' });
    setError('');
    setDialogOpen(true);
  };

  const openEditDialog = (student: Student) => {
    setEditingStudent(student);
    setForm({
      full_name: student.full_name ?? '',
      student_id_number: student.student_id_number ?? '',
      class_name: student.class_name ?? '',
      grade_level: student.grade_level ?? '',
      date_of_birth: student.date_of_birth ?? '',
      parent_id: student.parent_id ?? '',
    });
    setError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!school?.id) return;
    if (!form.full_name.trim() || !form.parent_id) {
      setError('Student name and parent account are required.');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      full_name: form.full_name.trim(),
      student_id_number: form.student_id_number.trim() || null,
      class_name: form.class_name.trim() || null,
      grade_level: form.grade_level.trim() || null,
      date_of_birth: form.date_of_birth || null,
      parent_id: form.parent_id,
      school_id: school.id,
    };

    const result = editingStudent
      ? await supabase.from('students').update(payload).eq('id', editingStudent.id)
      : await supabase.from('students').insert(payload);

    setSaving(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    setDialogOpen(false);
    setSuccess(editingStudent ? 'Student updated successfully.' : 'Student added successfully.');
    await loadData();
  };

  const handleDelete = async (student: Student) => {
    const confirmed = window.confirm(`Remove ${student.full_name}? This action cannot be undone.`);
    if (!confirmed) return;

    setError('');
    const { error: deleteError } = await supabase.from('students').delete().eq('id', student.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setSuccess('Student removed successfully.');
    await loadData();
  };

  if (!canManage) {
    return <Alert severity="error">You do not have permission to manage student records.</Alert>;
  }

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2} mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Students</Typography>
          <Typography color="text.secondary">
            Add, edit, or remove student records for {school?.school_name ?? 'this school'}.
          </Typography>
        </Box>
        <Stack direction="row" gap={1}>
          <Tooltip title="Refresh">
            <IconButton onClick={loadData} disabled={loading}><RefreshIcon /></IconButton>
          </Tooltip>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
            Add Student
          </Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      {parents.length === 0 && !loading && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No parent account is linked to this school yet. Create a parent account before adding students.
        </Alert>
      )}

      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Student ID</TableCell>
                  <TableCell>Class</TableCell>
                  <TableCell>Level</TableCell>
                  <TableCell>Date of Birth</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!loading && students.length === 0 && (
                  <TableRow><TableCell colSpan={6} align="center">No student records found.</TableCell></TableRow>
                )}
                {students.map((student) => (
                  <TableRow key={student.id} hover>
                    <TableCell><Typography fontWeight={600}>{student.full_name}</Typography></TableCell>
                    <TableCell>{student.student_id_number || '—'}</TableCell>
                    <TableCell>{student.class_name || '—'}</TableCell>
                    <TableCell>{student.grade_level || '—'}</TableCell>
                    <TableCell>{student.date_of_birth || '—'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit"><IconButton onClick={() => openEditDialog(student)}><EditIcon /></IconButton></Tooltip>
                      <Tooltip title="Remove"><IconButton color="error" onClick={() => handleDelete(student)}><DeleteIcon /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingStudent ? 'Edit Student' : 'Add Student'}</DialogTitle>
        <DialogContent>
          <Stack gap={2} mt={1}>
            <TextField
              label="Full Name"
              value={form.full_name}
              onChange={(e) => setForm((previous) => ({ ...previous, full_name: e.target.value }))}
              required
              fullWidth
            />
            <TextField
              label="Student ID Number"
              value={form.student_id_number}
              onChange={(e) => setForm((previous) => ({ ...previous, student_id_number: e.target.value }))}
              fullWidth
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
              <TextField
                label="Class"
                value={form.class_name}
                onChange={(e) => setForm((previous) => ({ ...previous, class_name: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Grade / Form"
                value={form.grade_level}
                onChange={(e) => setForm((previous) => ({ ...previous, grade_level: e.target.value }))}
                fullWidth
              />
            </Stack>
            <TextField
              label="Date of Birth"
              type="date"
              value={form.date_of_birth}
              onChange={(e) => setForm((previous) => ({ ...previous, date_of_birth: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              select
              label="Parent Account"
              value={form.parent_id}
              onChange={(e) => setForm((previous) => ({ ...previous, parent_id: e.target.value }))}
              required
              fullWidth
              helperText="The student must be linked to an existing parent account."
            >
              {parents.map((parent) => (
                <MenuItem key={parent.id} value={parent.id}>
                  {parent.full_name || parent.email || parent.id}
                </MenuItem>
              ))}
            </TextField>
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || parents.length === 0}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
