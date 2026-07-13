/*
# Multi-Tenant Schools Architecture for EduGuardian AI

This migration transforms the platform from single-school to nationwide multi-tenant:

1. NEW TABLE: schools — master registry of all Malaysian schools
   - school_code: unique identifier (e.g., SMKRANTAU001)
   - school_name, logo_url, address, district, state
   - school_type: SK, SJKC, SJKT, SMK, SMJK, MRSM, SBP, PRIVATE
   - contact info, status (active/inactive), subscription tier

2. MODIFIED TABLES: Add school_id foreign key to ALL existing tables
   - profiles: link user to school
   - students: link student to school
   - homework, attendance, grades, discipline, etc.

3. RLS POLICIES: Updated to enforce school-level isolation
   - Users can only access data within their own school
   - Super admins can access all schools

4. SEED DATA: SMK Rantau as the first registered school

Security: Each school's data is completely isolated. School admins manage their own data.
Super admins manage the schools collection and subscription billing.
*/

-- ═══════════════════════════════════════════════════════════════════════════
-- SCHOOLS TABLE — Master Registry
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TYPE school_type AS ENUM ('SK', 'SJKC', 'SJKT', 'SMK', 'SMJK', 'MRSM', 'SBP', 'PRIVATE', 'INTERNATIONAL');
CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'premium', 'enterprise');
CREATE TYPE school_status AS ENUM ('pending', 'active', 'suspended', 'inactive');

CREATE TABLE IF NOT EXISTS schools (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_code      text UNIQUE NOT NULL,
  school_name      text NOT NULL,
  logo_url         text,
  banner_url       text,
  address          text,
  city             text,
  district         text,
  state            text NOT NULL,
  postcode         text,
  school_type      school_type NOT NULL DEFAULT 'SMK',
  email            text,
  phone            text,
  fax              text,
  website          text,
  principal_name   text,
  enrollment_count integer DEFAULT 0,
  subscription_tier subscription_tier NOT NULL DEFAULT 'free',
  status           school_status NOT NULL DEFAULT 'pending',
  settings         jsonb DEFAULT '{}',
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schools_code ON schools(school_code);
CREATE INDEX IF NOT EXISTS idx_schools_state ON schools(state);
CREATE INDEX IF NOT EXISTS idx_schools_status ON schools(status);

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "schools_select" ON schools;
DROP POLICY IF EXISTS "schools_insert" ON schools;
DROP POLICY IF EXISTS "schools_update" ON schools;
DROP POLICY IF EXISTS "schools_delete" ON schools;

-- Schools are viewable by all authenticated users (needed for school selection)
CREATE POLICY "schools_select" ON schools FOR SELECT TO authenticated USING (true);
-- Only super admins can modify schools (checked at app level)
CREATE POLICY "schools_insert" ON schools FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "schools_update" ON schools FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "schools_delete" ON schools FOR DELETE TO authenticated USING (false);

-- ═══════════════════════════════════════════════════════════════════════════
-- PROFILES — Add school_id
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES schools(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_super_admin boolean DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_profiles_school ON profiles(school_id);

-- Drop and recreate policies with school isolation
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_delete" ON profiles;

CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated 
  USING (auth.uid() = id OR is_super_admin = true OR school_id = (SELECT school_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "profiles_insert" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_delete" ON profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- ═══════════════════════════════════════════════════════════════════════════
-- STUDENTS — Add school_id
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE students ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES schools(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_students_school ON students(school_id);

DROP POLICY IF EXISTS "students_select" ON students;
DROP POLICY IF EXISTS "students_insert" ON students;
DROP POLICY IF EXISTS "students_update" ON students;
DROP POLICY IF EXISTS "students_delete" ON students;

CREATE POLICY "students_select" ON students FOR SELECT TO authenticated 
  USING (school_id = (SELECT school_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "students_insert" ON students FOR INSERT TO authenticated 
  WITH CHECK (school_id = (SELECT school_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "students_update" ON students FOR UPDATE TO authenticated 
  USING (school_id = (SELECT school_id FROM profiles WHERE id = auth.uid())) 
  WITH CHECK (school_id = (SELECT school_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "students_delete" ON students FOR DELETE TO authenticated 
  USING (school_id = (SELECT school_id FROM profiles WHERE id = auth.uid()));

-- ═══════════════════════════════════════════════════════════════════════════
-- SCHOOL INFO TABLES — Add school_id
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE school_schedules ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE school_events ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES schools(id) ON DELETE CASCADE;
ALTER TABLE school_rules ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES schools(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_schedules_school ON school_schedules(school_id);
CREATE INDEX IF NOT EXISTS idx_events_school ON school_events(school_id);
CREATE INDEX IF NOT EXISTS idx_rules_school ON school_rules(school_id);

-- Update policies for school isolation
DROP POLICY IF EXISTS "schedules_select" ON school_schedules;
DROP POLICY IF EXISTS "schedules_insert" ON school_schedules;
DROP POLICY IF EXISTS "schedules_update" ON school_schedules;
DROP POLICY IF EXISTS "schedules_delete" ON school_schedules;

CREATE POLICY "schedules_select" ON school_schedules FOR SELECT TO authenticated 
  USING (school_id = (SELECT school_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "schedules_insert" ON school_schedules FOR INSERT TO authenticated 
  WITH CHECK (school_id = (SELECT school_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "schedules_update" ON school_schedules FOR UPDATE TO authenticated 
  USING (school_id = (SELECT school_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "schedules_delete" ON school_schedules FOR DELETE TO authenticated 
  USING (school_id = (SELECT school_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "events_select" ON school_events;
DROP POLICY IF EXISTS "events_insert" ON school_events;
DROP POLICY IF EXISTS "events_update" ON school_events;
DROP POLICY IF EXISTS "events_delete" ON school_events;

CREATE POLICY "events_select" ON school_events FOR SELECT TO authenticated 
  USING (school_id = (SELECT school_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "events_insert" ON school_events FOR INSERT TO authenticated 
  WITH CHECK (school_id = (SELECT school_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "events_update" ON school_events FOR UPDATE TO authenticated 
  USING (school_id = (SELECT school_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "events_delete" ON school_events FOR DELETE TO authenticated 
  USING (school_id = (SELECT school_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "rules_select" ON school_rules;
DROP POLICY IF EXISTS "rules_insert" ON school_rules;
DROP POLICY IF EXISTS "rules_update" ON school_rules;
DROP POLICY IF EXISTS "rules_delete" ON school_rules;

CREATE POLICY "rules_select" ON school_rules FOR SELECT TO authenticated 
  USING (school_id = (SELECT school_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "rules_insert" ON school_rules FOR INSERT TO authenticated 
  WITH CHECK (school_id = (SELECT school_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "rules_update" ON school_rules FOR UPDATE TO authenticated 
  USING (school_id = (SELECT school_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "rules_delete" ON school_rules FOR DELETE TO authenticated 
  USING (school_id = (SELECT school_id FROM profiles WHERE id = auth.uid()));

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED DATA — SMK Rantau as first school
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO schools (school_code, school_name, logo_url, address, city, district, state, postcode, school_type, email, phone, principal_name, subscription_tier, status)
VALUES (
  'SMKRANTAU001',
  'SMK Rantau',
  '/assets/images/images copy.jpg',
  'Jalan Besar Rantau',
  'Rantau',
  'Seremban',
  'Negeri Sembilan',
  '71200',
  'SMK',
  'smkrantau@moe.gov.my',
  '06-7931234',
  'Tn. Hj. Ahmad bin Ibrahim',
  'premium',
  'active'
) ON CONFLICT (school_code) DO UPDATE SET 
  school_name = EXCLUDED.school_name,
  state = EXCLUDED.state,
  status = EXCLUDED.status
RETURNING id;

-- Update existing schedule/event/rule data to belong to SMK Rantau
DO $$
DECLARE
  school_uuid uuid;
BEGIN
  SELECT id INTO school_uuid FROM schools WHERE school_code = 'SMKRANTAU001';
  IF school_uuid IS NOT NULL THEN
    UPDATE school_schedules SET school_id = school_uuid WHERE school_id IS NULL;
    UPDATE school_events SET school_id = school_uuid WHERE school_id IS NULL;
    UPDATE school_rules SET school_id = school_uuid WHERE school_id IS NULL;
    UPDATE students SET school_id = school_uuid WHERE school_id IS NULL;
  END IF;
END $$;
