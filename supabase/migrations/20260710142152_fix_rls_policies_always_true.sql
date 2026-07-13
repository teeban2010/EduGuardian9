
/*
# Fix RLS Policies - Remove Always-True Clauses

## Summary
Replaces all "always true" RLS policies with proper ownership-scoped predicates across
clubs_societies, grades, homework, library_resources, resources, schools, and subjects tables.

## Changes

### clubs_societies
- INSERT: only users whose profile.school_id matches the row's school_id
- UPDATE: only users whose profile.school_id matches the row's school_id
- DELETE: only users whose profile.school_id matches the row's school_id

### grades
- INSERT: only the parent of the student (students.parent_id = auth.uid())
- UPDATE: only the parent of the student (students.parent_id = auth.uid())

### homework
- INSERT: only the teacher who owns the homework (teacher_id = auth.uid())
- UPDATE: only the teacher who owns the homework (teacher_id = auth.uid())
- DELETE: only the teacher who owns the homework (teacher_id = auth.uid())

### library_resources
- INSERT: only users whose profile.school_id matches the row's school_id
- UPDATE: only users whose profile.school_id matches the row's school_id
- DELETE: only users whose profile.school_id matches the row's school_id

### resources
- INSERT: only the uploader (uploaded_by = auth.uid())
- UPDATE: only the uploader (uploaded_by = auth.uid())
- DELETE: only the uploader (uploaded_by = auth.uid())

### schools
- INSERT: only super admins (profiles.is_super_admin = true)
- UPDATE: only super admins (profiles.is_super_admin = true)

### subjects
- INSERT: only authenticated users belonging to a school (profiles.school_id IS NOT NULL)
- UPDATE: only authenticated users belonging to a school (profiles.school_id IS NOT NULL)
- DELETE: only authenticated users belonging to a school (profiles.school_id IS NOT NULL)

## Security
- Removes all USING(true) / WITH CHECK(true) from write policies
- All write operations now require proper ownership or admin membership
*/

-- ============================================================
-- clubs_societies
-- ============================================================
DROP POLICY IF EXISTS "insert_clubs_societies" ON clubs_societies;
CREATE POLICY "insert_clubs_societies" ON clubs_societies FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.school_id = clubs_societies.school_id
    )
  );

DROP POLICY IF EXISTS "update_clubs_societies" ON clubs_societies;
CREATE POLICY "update_clubs_societies" ON clubs_societies FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.school_id = clubs_societies.school_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.school_id = clubs_societies.school_id
    )
  );

DROP POLICY IF EXISTS "delete_clubs_societies" ON clubs_societies;
CREATE POLICY "delete_clubs_societies" ON clubs_societies FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.school_id = clubs_societies.school_id
    )
  );

-- ============================================================
-- grades
-- ============================================================
DROP POLICY IF EXISTS "grades_insert" ON grades;
CREATE POLICY "grades_insert" ON grades FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = grades.student_id
        AND s.parent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "grades_update" ON grades;
CREATE POLICY "grades_update" ON grades FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = grades.student_id
        AND s.parent_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = grades.student_id
        AND s.parent_id = auth.uid()
    )
  );

-- ============================================================
-- homework
-- ============================================================
DROP POLICY IF EXISTS "homework_insert" ON homework;
CREATE POLICY "homework_insert" ON homework FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "homework_update" ON homework;
CREATE POLICY "homework_update" ON homework FOR UPDATE
  TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "homework_delete" ON homework;
CREATE POLICY "homework_delete" ON homework FOR DELETE
  TO authenticated
  USING (auth.uid() = teacher_id);

-- ============================================================
-- library_resources
-- ============================================================
DROP POLICY IF EXISTS "insert_library_resources" ON library_resources;
CREATE POLICY "insert_library_resources" ON library_resources FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.school_id = library_resources.school_id
    )
  );

DROP POLICY IF EXISTS "update_library_resources" ON library_resources;
CREATE POLICY "update_library_resources" ON library_resources FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.school_id = library_resources.school_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.school_id = library_resources.school_id
    )
  );

DROP POLICY IF EXISTS "delete_library_resources" ON library_resources;
CREATE POLICY "delete_library_resources" ON library_resources FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.school_id = library_resources.school_id
    )
  );

-- ============================================================
-- resources
-- ============================================================
DROP POLICY IF EXISTS "resources_insert" ON resources;
CREATE POLICY "resources_insert" ON resources FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

DROP POLICY IF EXISTS "resources_update" ON resources;
CREATE POLICY "resources_update" ON resources FOR UPDATE
  TO authenticated
  USING (auth.uid() = uploaded_by)
  WITH CHECK (auth.uid() = uploaded_by);

DROP POLICY IF EXISTS "resources_delete" ON resources;
CREATE POLICY "resources_delete" ON resources FOR DELETE
  TO authenticated
  USING (auth.uid() = uploaded_by);

-- ============================================================
-- schools
-- ============================================================
DROP POLICY IF EXISTS "schools_insert" ON schools;
CREATE POLICY "schools_insert" ON schools FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_super_admin = true
    )
  );

DROP POLICY IF EXISTS "schools_update" ON schools;
CREATE POLICY "schools_update" ON schools FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_super_admin = true
    )
  );

-- ============================================================
-- subjects
-- ============================================================
DROP POLICY IF EXISTS "subjects_insert" ON subjects;
CREATE POLICY "subjects_insert" ON subjects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.school_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "subjects_update" ON subjects;
CREATE POLICY "subjects_update" ON subjects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.school_id IS NOT NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.school_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "subjects_delete" ON subjects;
CREATE POLICY "subjects_delete" ON subjects FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.school_id IS NOT NULL
    )
  );
