
-- Canteen menu table
CREATE TABLE IF NOT EXISTS canteen_menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  day_of_week text NOT NULL CHECK (day_of_week IN ('monday','tuesday','wednesday','thursday','friday')),
  item_name text NOT NULL,
  category text NOT NULL DEFAULT 'main' CHECK (category IN ('main','drink','snack','dessert')),
  price numeric(6,2) NOT NULL DEFAULT 0,
  description text,
  is_available boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE canteen_menus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "canteen_select" ON canteen_menus FOR SELECT TO authenticated USING (true);
CREATE POLICY "canteen_insert" ON canteen_menus FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "canteen_update" ON canteen_menus FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "canteen_delete" ON canteen_menus FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- Discipline records table
CREATE TABLE IF NOT EXISTS discipline_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  category text NOT NULL DEFAULT 'misconduct',
  severity text NOT NULL DEFAULT 'minor' CHECK (severity IN ('minor','moderate','serious')),
  title text NOT NULL,
  description text,
  action_taken text,
  resolved boolean NOT NULL DEFAULT false,
  reported_by text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE discipline_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "discipline_select" ON discipline_records FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM students s WHERE s.id = discipline_records.student_id AND s.parent_id = auth.uid())
    OR auth.uid() IN (SELECT id FROM profiles WHERE role IN ('teacher','admin') AND school_id = discipline_records.school_id));
CREATE POLICY "discipline_insert" ON discipline_records FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "discipline_update" ON discipline_records FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "discipline_delete" ON discipline_records FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- Add school_id to homework if not present
ALTER TABLE homework ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE homework ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','late'));
ALTER TABLE homework ADD COLUMN IF NOT EXISTS subject_color text DEFAULT '#2563EB';

-- homework_submissions: track per-student completion
CREATE TABLE IF NOT EXISTS homework_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  homework_id uuid REFERENCES homework(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  parent_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','submitted','late')),
  submitted_at timestamptz,
  attachment_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(homework_id, student_id)
);

ALTER TABLE homework_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hw_submissions_select" ON homework_submissions FOR SELECT TO authenticated
  USING (parent_id = auth.uid());
CREATE POLICY "hw_submissions_insert" ON homework_submissions FOR INSERT TO authenticated
  WITH CHECK (parent_id = auth.uid());
CREATE POLICY "hw_submissions_update" ON homework_submissions FOR UPDATE TO authenticated
  USING (parent_id = auth.uid());
CREATE POLICY "hw_submissions_delete" ON homework_submissions FOR DELETE TO authenticated
  USING (parent_id = auth.uid());
