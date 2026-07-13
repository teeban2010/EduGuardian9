/*
# EduParent AI - Core Schema (simplified)
Creates all tables and basic RLS for EduParent AI.
*/

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  avatar_url text,
  role text NOT NULL DEFAULT 'parent',
  phone text,
  school_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_delete" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_delete" ON profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- STUDENTS
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  date_of_birth date,
  school_name text,
  class_name text,
  grade_level text,
  avatar_url text,
  student_id_number text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "students_select" ON students;
DROP POLICY IF EXISTS "students_insert" ON students;
DROP POLICY IF EXISTS "students_update" ON students;
DROP POLICY IF EXISTS "students_delete" ON students;
CREATE POLICY "students_select" ON students FOR SELECT TO authenticated USING (auth.uid() = parent_id);
CREATE POLICY "students_insert" ON students FOR INSERT TO authenticated WITH CHECK (auth.uid() = parent_id);
CREATE POLICY "students_update" ON students FOR UPDATE TO authenticated USING (auth.uid() = parent_id) WITH CHECK (auth.uid() = parent_id);
CREATE POLICY "students_delete" ON students FOR DELETE TO authenticated USING (auth.uid() = parent_id);

-- SUBJECTS (public read, any auth can write)
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text,
  color text DEFAULT '#2563EB',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subjects_select" ON subjects;
DROP POLICY IF EXISTS "subjects_insert" ON subjects;
DROP POLICY IF EXISTS "subjects_update" ON subjects;
DROP POLICY IF EXISTS "subjects_delete" ON subjects;
CREATE POLICY "subjects_select" ON subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "subjects_insert" ON subjects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "subjects_update" ON subjects FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "subjects_delete" ON subjects FOR DELETE TO authenticated USING (true);

-- ATTENDANCE
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text NOT NULL DEFAULT 'present',
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, date)
);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "attendance_select" ON attendance;
DROP POLICY IF EXISTS "attendance_insert" ON attendance;
DROP POLICY IF EXISTS "attendance_update" ON attendance;
DROP POLICY IF EXISTS "attendance_delete" ON attendance;
CREATE POLICY "attendance_select" ON attendance FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM students s WHERE s.id = attendance.student_id AND s.parent_id = auth.uid()));
CREATE POLICY "attendance_insert" ON attendance FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM students s WHERE s.id = student_id AND s.parent_id = auth.uid()));
CREATE POLICY "attendance_update" ON attendance FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM students s WHERE s.id = attendance.student_id AND s.parent_id = auth.uid()));
CREATE POLICY "attendance_delete" ON attendance FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM students s WHERE s.id = attendance.student_id AND s.parent_id = auth.uid()));

-- HOMEWORK
CREATE TABLE IF NOT EXISTS homework (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  subject_name text,
  due_date timestamptz,
  teacher_id uuid DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE SET NULL,
  attachment_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE homework ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "homework_select" ON homework;
DROP POLICY IF EXISTS "homework_insert" ON homework;
DROP POLICY IF EXISTS "homework_update" ON homework;
DROP POLICY IF EXISTS "homework_delete" ON homework;
CREATE POLICY "homework_select" ON homework FOR SELECT TO authenticated USING (true);
CREATE POLICY "homework_insert" ON homework FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "homework_update" ON homework FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "homework_delete" ON homework FOR DELETE TO authenticated USING (true);

-- HOMEWORK SUBMISSIONS
CREATE TABLE IF NOT EXISTS homework_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  homework_id uuid NOT NULL REFERENCES homework(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  parent_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  submission_url text,
  notes text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(homework_id, student_id)
);

ALTER TABLE homework_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "submissions_select" ON homework_submissions;
DROP POLICY IF EXISTS "submissions_insert" ON homework_submissions;
DROP POLICY IF EXISTS "submissions_update" ON homework_submissions;
DROP POLICY IF EXISTS "submissions_delete" ON homework_submissions;
CREATE POLICY "submissions_select" ON homework_submissions FOR SELECT TO authenticated USING (auth.uid() = parent_id);
CREATE POLICY "submissions_insert" ON homework_submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = parent_id);
CREATE POLICY "submissions_update" ON homework_submissions FOR UPDATE TO authenticated USING (auth.uid() = parent_id) WITH CHECK (auth.uid() = parent_id);
CREATE POLICY "submissions_delete" ON homework_submissions FOR DELETE TO authenticated USING (auth.uid() = parent_id);

-- GRADES
CREATE TABLE IF NOT EXISTS grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_name text NOT NULL,
  score numeric(5,2),
  max_score numeric(5,2) DEFAULT 100,
  grade_letter text,
  term text,
  exam_type text DEFAULT 'monthly',
  recorded_at date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "grades_select" ON grades;
DROP POLICY IF EXISTS "grades_insert" ON grades;
DROP POLICY IF EXISTS "grades_update" ON grades;
DROP POLICY IF EXISTS "grades_delete" ON grades;
CREATE POLICY "grades_select" ON grades FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM students s WHERE s.id = grades.student_id AND s.parent_id = auth.uid()));
CREATE POLICY "grades_insert" ON grades FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "grades_update" ON grades FOR UPDATE TO authenticated USING (true);
CREATE POLICY "grades_delete" ON grades FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM students s WHERE s.id = grades.student_id AND s.parent_id = auth.uid()));

-- ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text DEFAULT 'general',
  priority text DEFAULT 'normal',
  author_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  author_name text,
  published_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "announcements_select" ON announcements;
DROP POLICY IF EXISTS "announcements_insert" ON announcements;
DROP POLICY IF EXISTS "announcements_update" ON announcements;
DROP POLICY IF EXISTS "announcements_delete" ON announcements;
CREATE POLICY "announcements_select" ON announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "announcements_insert" ON announcements FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "announcements_update" ON announcements FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "announcements_delete" ON announcements FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info',
  is_read boolean DEFAULT false,
  link text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_select" ON notifications;
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
DROP POLICY IF EXISTS "notifications_update" ON notifications;
DROP POLICY IF EXISTS "notifications_delete" ON notifications;
CREATE POLICY "notifications_select" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert" ON notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notifications_update" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notifications_delete" ON notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- CHAT HISTORY
CREATE TABLE IF NOT EXISTS chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  session_id uuid DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "chat_select" ON chat_history;
DROP POLICY IF EXISTS "chat_insert" ON chat_history;
DROP POLICY IF EXISTS "chat_update" ON chat_history;
DROP POLICY IF EXISTS "chat_delete" ON chat_history;
CREATE POLICY "chat_select" ON chat_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "chat_insert" ON chat_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "chat_update" ON chat_history FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "chat_delete" ON chat_history FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RESOURCES
CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  subject text NOT NULL,
  type text NOT NULL,
  url text,
  uploaded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  downloads integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "resources_select" ON resources;
DROP POLICY IF EXISTS "resources_insert" ON resources;
DROP POLICY IF EXISTS "resources_update" ON resources;
DROP POLICY IF EXISTS "resources_delete" ON resources;
CREATE POLICY "resources_select" ON resources FOR SELECT TO authenticated USING (true);
CREATE POLICY "resources_insert" ON resources FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "resources_update" ON resources FOR UPDATE TO authenticated USING (true);
CREATE POLICY "resources_delete" ON resources FOR DELETE TO authenticated USING (true);

-- EVENTS
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type text DEFAULT 'general',
  start_date timestamptz NOT NULL,
  end_date timestamptz,
  all_day boolean DEFAULT false,
  color text DEFAULT '#2563EB',
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "events_select" ON events;
DROP POLICY IF EXISTS "events_insert" ON events;
DROP POLICY IF EXISTS "events_update" ON events;
DROP POLICY IF EXISTS "events_delete" ON events;
CREATE POLICY "events_select" ON events FOR SELECT TO authenticated USING (true);
CREATE POLICY "events_insert" ON events FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "events_update" ON events FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "events_delete" ON events FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_students_parent_id ON students(parent_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_submissions_parent_id ON homework_submissions(parent_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);

-- SEED SUBJECTS
INSERT INTO subjects (name, code, color) VALUES
  ('Mathematics', 'MATH', '#2563EB'),
  ('Science', 'SCI', '#10B981'),
  ('English', 'ENG', '#8B5CF6'),
  ('Bahasa Melayu', 'BM', '#F59E0B'),
  ('History', 'HIST', '#EF4444')
ON CONFLICT DO NOTHING;
