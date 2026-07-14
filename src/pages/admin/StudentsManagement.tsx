import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ChangeEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
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
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import type { Student } from '../../types';

interface StudentWithParentDetails extends Student {
  parent_full_name?: string | null;
  parent_phone?: string | null;
  parent_link_status?: string | null;
}

interface StudentForm {
  full_name: string;
  student_id_number: string;
  class_name: string;
  grade_level: string;
  date_of_birth: string;
  parent_full_name: string;
  parent_phone: string;
}

interface ParentProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
}

interface CsvStudentRow {
  rowNumber: number;
  full_name: string;
  student_id_number: string;
  class_name: string;
  grade_level: string;
  date_of_birth: string;
  parent_full_name: string;
  parent_phone: string;
  parent_id: string | null;
  parent_link_status: 'Linked' | 'Pending' | 'Needs Verification';
  validationErrors: string[];
}

const emptyForm: StudentForm = {
  full_name: '',
  student_id_number: '',
  class_name: '',
  grade_level: '',
  date_of_birth: '',
  parent_full_name: '',
  parent_phone: '',
};

const REQUIRED_CSV_HEADERS = [
  'full_name',
  'student_id_number',
  'class_name',
  'grade_level',
  'date_of_birth',
  'parent_full_name',
  'parent_phone',
] as const;

const normalisePhone = (phone: string | null | undefined) => {
  let value = (phone ?? '').replace(/\D/g, '');

  if (value.startsWith('60')) {
    value = `0${value.slice(2)}`;
  }

  return value;
};

const normaliseName = (name: string | null | undefined) =>
  (name ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

const isValidIsoDate = (value: string) => {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime());
};

const parseCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"' && insideQuotes && nextCharacter === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (character === ',' && !insideQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += character;
  }

  values.push(current.trim());
  return values;
};

type RawCsvRow = { rowNumber: number } & Record<string, string>;

const parseCsvText = (csvText: string): RawCsvRow[] => {
  const cleanText = csvText.replace(/^\uFEFF/, '').trim();

  if (!cleanText) {
    throw new Error('The selected CSV file is empty.');
  }

  const lines = cleanText
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    throw new Error('The CSV must contain a header row and at least one student row.');
  }

  const headers = parseCsvLine(lines[0]).map((header) =>
    header.trim().toLowerCase(),
  );

  const missingHeaders = REQUIRED_CSV_HEADERS.filter(
    (requiredHeader) => !headers.includes(requiredHeader),
  );

  if (missingHeaders.length > 0) {
    throw new Error(
      `Missing CSV column(s): ${missingHeaders.join(', ')}`,
    );
  }

  return lines.slice(1).map((line, index): RawCsvRow => {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};

    headers.forEach((header, headerIndex) => {
      row[header] = values[headerIndex]?.trim() ?? '';
    });

    return {
      ...row,
      rowNumber: index + 2,
    } as RawCsvRow;
  });
};

export default function StudentsManagement() {
  const { profile } = useAuth();
  const { school } = useSchool();

  const [students, setStudents] = useState<StudentWithParentDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] =
    useState<StudentWithParentDetails | null>(null);
  const [form, setForm] = useState<StudentForm>(emptyForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importRows, setImportRows] = useState<CsvStudentRow[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const role = profile?.role?.toLowerCase();

  const canManage = useMemo(
    () =>
      profile?.is_super_admin ||
      role === 'admin' ||
      role === 'teacher',
    [profile?.is_super_admin, role],
  );

  const canBulkImport = useMemo(
    () => profile?.is_super_admin || role === 'admin',
    [profile?.is_super_admin, role],
  );

  const loadData = useCallback(async () => {
    if (!school?.id || !canManage) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    const { data, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .eq('school_id', school.id)
      .order('created_at', { ascending: false });

    if (studentsError) {
      setError(studentsError.message);
    } else {
      setStudents((data as StudentWithParentDetails[]) ?? []);
    }

    setLoading(false);
  }, [school?.id, canManage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateDialog = () => {
    setEditingStudent(null);
    setForm(emptyForm);
    setError('');
    setDialogOpen(true);
  };

  const openEditDialog = (student: StudentWithParentDetails) => {
    setEditingStudent(student);
    setForm({
      full_name: student.full_name ?? '',
      student_id_number: student.student_id_number ?? '',
      class_name: student.class_name ?? '',
      grade_level: student.grade_level ?? '',
      date_of_birth: student.date_of_birth ?? '',
      parent_full_name: student.parent_full_name ?? '',
      parent_phone: student.parent_phone ?? '',
    });
    setError('');
    setDialogOpen(true);
  };

  const findMatchingParent = async (
    parentFullName: string,
    parentPhone: string,
  ) => {
    if (!school?.id) {
      return {
        parentId: null as string | null,
        status: 'Pending' as const,
      };
    }

    const { data, error: parentSearchError } = await supabase
      .from('profiles')
      .select('id, full_name, phone')
      .eq('school_id', school.id)
      .eq('role', 'parent')
      .ilike('full_name', parentFullName.trim());

    if (parentSearchError) {
      throw parentSearchError;
    }

    const enteredPhone = normalisePhone(parentPhone);

    const exactMatches = (data ?? []).filter(
      (parent) =>
        normaliseName(parent.full_name) === normaliseName(parentFullName) &&
        normalisePhone(parent.phone) === enteredPhone,
    );

    if (exactMatches.length === 1) {
      return {
        parentId: exactMatches[0].id as string,
        status: 'Linked' as const,
      };
    }

    if (exactMatches.length > 1) {
      return {
        parentId: null as string | null,
        status: 'Needs Verification' as const,
      };
    }

    return {
      parentId: null as string | null,
      status: 'Pending' as const,
    };
  };

  const handleSave = async () => {
    if (!school?.id) return;

    if (
      !form.full_name.trim() ||
      !form.parent_full_name.trim() ||
      !form.parent_phone.trim()
    ) {
      setError(
        'Student name, parent full name and parent phone number are required.',
      );
      return;
    }

    setSaving(true);
    setError('');

    try {
      const { parentId, status } = await findMatchingParent(
        form.parent_full_name,
        form.parent_phone,
      );

      const payload = {
        full_name: form.full_name.trim(),
        student_id_number: form.student_id_number.trim() || null,
        class_name: form.class_name.trim() || null,
        grade_level: form.grade_level.trim() || null,
        date_of_birth: form.date_of_birth || null,
        parent_full_name: form.parent_full_name.trim(),
        parent_phone: form.parent_phone.trim(),
        parent_id: parentId,
        parent_link_status: status,
        school_id: school.id,
        school_name: school.school_name ?? null,
      };

      const result = editingStudent
        ? await supabase
            .from('students')
            .update(payload)
            .eq('id', editingStudent.id)
        : await supabase.from('students').insert(payload);

      if (result.error) {
        setError(result.error.message);
        return;
      }

      setDialogOpen(false);
      setSuccess(
        `${editingStudent ? 'Student updated' : 'Student added'} successfully. Parent status: ${status}.`,
      );
      await loadData();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to match the parent account.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (student: StudentWithParentDetails) => {
    const confirmed = window.confirm(
      `Remove ${student.full_name}? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setError('');

    const { error: deleteError } = await supabase
      .from('students')
      .delete()
      .eq('id', student.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setSuccess('Student removed successfully.');
    await loadData();
  };

  const handleDownloadTemplate = () => {
    const template =
      'full_name,student_id_number,class_name,grade_level,date_of_birth,parent_full_name,parent_phone\n';

    const blob = new Blob([`\uFEFF${template}`], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'EduGuardian_Student_Bulk_Import_Template.csv';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const handleCsvFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file || !school?.id) return;

    setError('');
    setImportRows([]);
    setImportFileName(file.name);

    try {
      const csvText = await file.text();
      const rawRows = parseCsvText(csvText);

      const { data: parentProfiles, error: parentError } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .eq('school_id', school.id)
        .eq('role', 'parent');

      if (parentError) {
        throw parentError;
      }

      const existingStudentIds = new Set(
        students
          .map((student) => student.student_id_number?.trim().toLowerCase())
          .filter(Boolean) as string[],
      );

      const studentIdsWithinFile = new Map<string, number>();
      rawRows.forEach((row) => {
        const studentId = (row.student_id_number ?? '').trim().toLowerCase();

        if (studentId) {
          studentIdsWithinFile.set(
            studentId,
            (studentIdsWithinFile.get(studentId) ?? 0) + 1,
          );
        }
      });

      const previewRows: CsvStudentRow[] = rawRows.map((row) => {
        const fullName = (row.full_name ?? '').trim();
        const studentIdNumber = (row.student_id_number ?? '').trim();
        const className = (row.class_name ?? '').trim();
        const gradeLevel = (row.grade_level ?? '').trim();
        const dateOfBirth = (row.date_of_birth ?? '').trim();
        const parentFullName = (row.parent_full_name ?? '').trim();
        const parentPhone = (row.parent_phone ?? '').trim();

        const validationErrors: string[] = [];

        if (!fullName) validationErrors.push('Student name is required.');
        if (!studentIdNumber) {
          validationErrors.push('Student ID is required.');
        }
        if (!className) validationErrors.push('Class is required.');
        if (!gradeLevel) validationErrors.push('Grade/Form is required.');
        if (!parentFullName) {
          validationErrors.push('Parent full name is required.');
        }
        if (!normalisePhone(parentPhone)) {
          validationErrors.push('Parent phone is required.');
        }
        if (!isValidIsoDate(dateOfBirth)) {
          validationErrors.push('Date must use YYYY-MM-DD.');
        }

        const normalisedStudentId = studentIdNumber.toLowerCase();

        if (
          normalisedStudentId &&
          existingStudentIds.has(normalisedStudentId)
        ) {
          validationErrors.push('Student ID already exists in this school.');
        }

        if (
          normalisedStudentId &&
          (studentIdsWithinFile.get(normalisedStudentId) ?? 0) > 1
        ) {
          validationErrors.push('Student ID is duplicated within this CSV.');
        }

        const matchingParents = (parentProfiles as ParentProfile[] | null ?? [])
          .filter(
            (parent) =>
              normaliseName(parent.full_name) === normaliseName(parentFullName) &&
              normalisePhone(parent.phone) === normalisePhone(parentPhone),
          );

        let parentId: string | null = null;
        let parentLinkStatus:
          | 'Linked'
          | 'Pending'
          | 'Needs Verification' = 'Pending';

        if (matchingParents.length === 1) {
          parentId = matchingParents[0].id;
          parentLinkStatus = 'Linked';
        } else if (matchingParents.length > 1) {
          parentLinkStatus = 'Needs Verification';
        }

        return {
          rowNumber: Number(row.rowNumber),
          full_name: fullName,
          student_id_number: studentIdNumber,
          class_name: className,
          grade_level: gradeLevel,
          date_of_birth: dateOfBirth,
          parent_full_name: parentFullName,
          parent_phone: parentPhone,
          parent_id: parentId,
          parent_link_status: parentLinkStatus,
          validationErrors,
        };
      });

      setImportRows(previewRows);
      setImportDialogOpen(true);
    } catch (caughtError) {
      setImportFileName('');
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to read the selected CSV file.',
      );
    }
  };

  const handleConfirmImport = async () => {
    if (!school?.id) return;

    const validRows = importRows.filter(
      (row) => row.validationErrors.length === 0,
    );

    if (validRows.length === 0) {
      setError('There are no valid rows available to import.');
      return;
    }

    setImporting(true);
    setError('');

    const payload = validRows.map((row) => ({
      full_name: row.full_name,
      student_id_number: row.student_id_number,
      class_name: row.class_name,
      grade_level: row.grade_level,
      date_of_birth: row.date_of_birth || null,
      parent_full_name: row.parent_full_name,
      parent_phone: row.parent_phone,
      parent_id: row.parent_id,
      parent_link_status: row.parent_link_status,
      school_id: school.id,
      school_name: school.school_name ?? null,
    }));

    const { error: importError } = await supabase
      .from('students')
      .insert(payload);

    setImporting(false);

    if (importError) {
      setError(importError.message);
      return;
    }

    const rejectedCount = importRows.length - validRows.length;

    setImportDialogOpen(false);
    setImportRows([]);
    setImportFileName('');
    setSuccess(
      `${validRows.length} student(s) imported successfully.${
        rejectedCount > 0
          ? ` ${rejectedCount} invalid row(s) were not imported.`
          : ''
      }`,
    );

    await loadData();
  };

  const getStatusColour = (
    status: string | null | undefined,
  ): 'success' | 'warning' | 'error' | 'default' => {
    if (status === 'Linked') return 'success';
    if (status === 'Needs Verification') return 'error';
    if (status === 'Pending') return 'warning';
    return 'default';
  };

  const validImportCount = importRows.filter(
    (row) => row.validationErrors.length === 0,
  ).length;

  const invalidImportCount = importRows.length - validImportCount;

  if (!canManage) {
    return (
      <Alert severity="error">
        You do not have permission to manage student records.
      </Alert>
    );
  }

  return (
    <Box>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        hidden
        onChange={handleCsvFileChange}
      />

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        gap={2}
        mb={3}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Student Information Management
          </Typography>

          <Typography color="text.secondary">
            Add, edit, remove, or import student records for{' '}
            {school?.school_name ?? 'this school'}.
          </Typography>
        </Box>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          gap={1}
        >
          <Tooltip title="Refresh">
            <IconButton onClick={loadData} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>

          {canBulkImport && (
            <>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadTemplate}
              >
                Download Template
              </Button>

              <Button
                variant="outlined"
                startIcon={<UploadFileIcon />}
                onClick={() => fileInputRef.current?.click()}
              >
                Import Student List
              </Button>
            </>
          )}

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreateDialog}
          >
            Add Student
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccess('')}
        >
          {success}
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
                  <TableCell>Parent</TableCell>
                  <TableCell>Parent Phone</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {!loading && students.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No student records found.
                    </TableCell>
                  </TableRow>
                )}

                {students.map((student) => (
                  <TableRow key={student.id} hover>
                    <TableCell>
                      <Typography fontWeight={600}>
                        {student.full_name}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      {student.student_id_number || '—'}
                    </TableCell>

                    <TableCell>{student.class_name || '—'}</TableCell>
                    <TableCell>{student.grade_level || '—'}</TableCell>
                    <TableCell>{student.parent_full_name || '—'}</TableCell>
                    <TableCell>{student.parent_phone || '—'}</TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={student.parent_link_status || 'Not Set'}
                        color={getStatusColour(student.parent_link_status)}
                        variant="outlined"
                      />
                    </TableCell>

                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton
                          onClick={() => openEditDialog(student)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Remove">
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(student)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editingStudent ? 'Edit Student' : 'Add Student'}
        </DialogTitle>

        <DialogContent>
          <Stack gap={2} mt={1}>
            <TextField
              label="Student Full Name"
              value={form.full_name}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  full_name: event.target.value,
                }))
              }
              required
              fullWidth
            />

            <TextField
              label="Student ID Number"
              value={form.student_id_number}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  student_id_number: event.target.value,
                }))
              }
              fullWidth
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
              <TextField
                label="Class"
                value={form.class_name}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    class_name: event.target.value,
                  }))
                }
                fullWidth
              />

              <TextField
                label="Grade / Form"
                value={form.grade_level}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    grade_level: event.target.value,
                  }))
                }
                fullWidth
              />
            </Stack>

            <TextField
              label="Date of Birth"
              type="date"
              value={form.date_of_birth}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  date_of_birth: event.target.value,
                }))
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              label="Parent Full Name"
              value={form.parent_full_name}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  parent_full_name: event.target.value,
                }))
              }
              required
              fullWidth
              helperText="Enter the same full name used by the parent during registration."
            />

            <TextField
              label="Parent Phone Number"
              value={form.parent_phone}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  parent_phone: event.target.value,
                }))
              }
              required
              fullWidth
              helperText="Spaces and dashes are ignored during matching."
            />

            <Alert severity="info">
              EduGuardian automatically links the student when the parent’s
              full name, phone number and school match an existing parent
              account. Otherwise, the record is saved as Pending.
            </Alert>

            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setDialogOpen(false)}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={importDialogOpen}
        onClose={() => !importing && setImportDialogOpen(false)}
        fullWidth
        maxWidth="xl"
      >
        <DialogTitle>Preview Student Import</DialogTitle>

        <DialogContent>
          <Stack gap={2} mt={1}>
            <Alert severity="info">
              File: <strong>{importFileName}</strong>. Only rows without
              validation errors will be imported.
            </Alert>

            <Stack direction={{ xs: 'column', sm: 'row' }} gap={1}>
              <Chip
                label={`${validImportCount} ready to import`}
                color="success"
                variant="outlined"
              />
              <Chip
                label={`${invalidImportCount} need correction`}
                color={invalidImportCount > 0 ? 'error' : 'default'}
                variant="outlined"
              />
            </Stack>

            <TableContainer sx={{ maxHeight: 520 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>CSV Row</TableCell>
                    <TableCell>Student</TableCell>
                    <TableCell>Student ID</TableCell>
                    <TableCell>Class</TableCell>
                    <TableCell>Level</TableCell>
                    <TableCell>Parent</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Link Status</TableCell>
                    <TableCell>Validation</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {importRows.map((row) => (
                    <TableRow
                      key={`${row.rowNumber}-${row.student_id_number}`}
                      sx={{
                        bgcolor:
                          row.validationErrors.length > 0
                            ? 'error.lighter'
                            : undefined,
                      }}
                    >
                      <TableCell>{row.rowNumber}</TableCell>
                      <TableCell>{row.full_name || '—'}</TableCell>
                      <TableCell>
                        {row.student_id_number || '—'}
                      </TableCell>
                      <TableCell>{row.class_name || '—'}</TableCell>
                      <TableCell>{row.grade_level || '—'}</TableCell>
                      <TableCell>{row.parent_full_name || '—'}</TableCell>
                      <TableCell>{row.parent_phone || '—'}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={row.parent_link_status}
                          color={getStatusColour(row.parent_link_status)}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {row.validationErrors.length === 0 ? (
                          <Chip
                            size="small"
                            label="Valid"
                            color="success"
                            variant="outlined"
                          />
                        ) : (
                          <Typography
                            variant="caption"
                            color="error"
                            sx={{ whiteSpace: 'pre-line' }}
                          >
                            {row.validationErrors.join('\n')}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setImportDialogOpen(false)}
            disabled={importing}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleConfirmImport}
            disabled={importing || validImportCount === 0}
          >
            {importing
              ? 'Importing...'
              : `Import ${validImportCount} Student(s)`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}