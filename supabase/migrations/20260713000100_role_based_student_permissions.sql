/*
  Competition-ready student permissions

  - Parents can view and manage only their own children.
  - Teachers and admins can view and manage students in their own school.
  - Super admins can view and manage all students.
  - Student/counselor accounts are read-only unless they are the linked parent account.
*/

DROP POLICY IF EXISTS "students_select" ON public.students;
DROP POLICY IF EXISTS "students_insert" ON public.students;
DROP POLICY IF EXISTS "students_update" ON public.students;
DROP POLICY IF EXISTS "students_delete" ON public.students;

CREATE POLICY "students_select" ON public.students
FOR SELECT TO authenticated
USING (
  parent_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (
        p.is_super_admin = true
        OR (p.role IN ('admin', 'teacher') AND p.school_id = students.school_id)
      )
  )
);

CREATE POLICY "students_insert" ON public.students
FOR INSERT TO authenticated
WITH CHECK (
  parent_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (
        p.is_super_admin = true
        OR (p.role IN ('admin', 'teacher') AND p.school_id = students.school_id)
      )
  )
);

CREATE POLICY "students_update" ON public.students
FOR UPDATE TO authenticated
USING (
  parent_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (
        p.is_super_admin = true
        OR (p.role IN ('admin', 'teacher') AND p.school_id = students.school_id)
      )
  )
)
WITH CHECK (
  parent_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (
        p.is_super_admin = true
        OR (p.role IN ('admin', 'teacher') AND p.school_id = students.school_id)
      )
  )
);

CREATE POLICY "students_delete" ON public.students
FOR DELETE TO authenticated
USING (
  parent_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (
        p.is_super_admin = true
        OR (p.role IN ('admin', 'teacher') AND p.school_id = students.school_id)
      )
  )
);
