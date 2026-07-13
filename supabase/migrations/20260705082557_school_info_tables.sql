/*
# School Information Tables - SMK Rantau

Creates three tables to store key school information visible to all authenticated users:

1. school_schedules — daily bell schedule (periods, recess, assembly)
2. school_events — upcoming and past school events (exams, sports, programs)
3. school_rules — school rules and code of conduct, grouped by category

Security:
- All three tables use RLS with SELECT open to authenticated users.
- INSERT/UPDATE/DELETE restricted to authenticated users (admin role enforcement done at app level).

Initial seed data for SMK Rantau, Negeri Sembilan is inserted.
*/

-- ─── SCHOOL SCHEDULES ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS school_schedules (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_name text NOT NULL,
  start_time  time NOT NULL,
  end_time    time NOT NULL,
  description text,
  day_applies text NOT NULL DEFAULT 'all',  -- 'all', 'mon-thu', 'friday'
  sort_order  integer NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE school_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "schedules_select" ON school_schedules;
DROP POLICY IF EXISTS "schedules_insert" ON school_schedules;
DROP POLICY IF EXISTS "schedules_update" ON school_schedules;
DROP POLICY IF EXISTS "schedules_delete" ON school_schedules;

CREATE POLICY "schedules_select" ON school_schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "schedules_insert" ON school_schedules FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "schedules_update" ON school_schedules FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "schedules_delete" ON school_schedules FOR DELETE TO authenticated USING (true);

-- ─── SCHOOL EVENTS ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS school_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  description   text,
  event_date    date NOT NULL,
  event_end_date date,
  category      text NOT NULL DEFAULT 'general',  -- academic/sports/cultural/holiday/general
  location      text,
  is_important  boolean NOT NULL DEFAULT false,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE school_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events_select" ON school_events;
DROP POLICY IF EXISTS "events_insert" ON school_events;
DROP POLICY IF EXISTS "events_update" ON school_events;
DROP POLICY IF EXISTS "events_delete" ON school_events;

CREATE POLICY "events_select" ON school_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "events_insert" ON school_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "events_update" ON school_events FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "events_delete" ON school_events FOR DELETE TO authenticated USING (true);

-- ─── SCHOOL RULES ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS school_rules (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category    text NOT NULL,
  rule_number integer NOT NULL DEFAULT 1,
  title       text NOT NULL,
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE school_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rules_select" ON school_rules;
DROP POLICY IF EXISTS "rules_insert" ON school_rules;
DROP POLICY IF EXISTS "rules_update" ON school_rules;
DROP POLICY IF EXISTS "rules_delete" ON school_rules;

CREATE POLICY "rules_select" ON school_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "rules_insert" ON school_rules FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "rules_update" ON school_rules FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "rules_delete" ON school_rules FOR DELETE TO authenticated USING (true);

-- ─── SEED: BELL SCHEDULE (SMK Rantau) ───────────────────────────────────────

INSERT INTO school_schedules (period_name, start_time, end_time, description, day_applies, sort_order) VALUES
  ('Perhimpunan (Assembly)',  '07:30', '07:45', 'Morning assembly — all students must attend',        'all',    1),
  ('Waktu 1 (Period 1)',      '07:45', '08:25', NULL,                                                 'all',    2),
  ('Waktu 2 (Period 2)',      '08:25', '09:05', NULL,                                                 'all',    3),
  ('Waktu 3 (Period 3)',      '09:05', '09:45', NULL,                                                 'all',    4),
  ('Rehat (Recess)',          '09:45', '10:10', 'Canteen opens; students may visit toilet',           'all',    5),
  ('Waktu 4 (Period 4)',      '10:10', '10:50', NULL,                                                 'all',    6),
  ('Waktu 5 (Period 5)',      '10:50', '11:30', NULL,                                                 'all',    7),
  ('Waktu 6 (Period 6)',      '11:30', '12:10', NULL,                                                 'all',    8),
  ('Waktu 7 (Period 7)',      '12:10', '12:50', NULL,                                                 'mon-thu',9),
  ('Solat Jumaat',            '12:10', '13:10', 'Friday prayer — male students attend mosque',        'friday', 9),
  ('Tamat Sekolah (School Ends)', '12:50', '13:10', 'Bus and parent pick-up from main entrance',    'all',   10)
ON CONFLICT DO NOTHING;

-- ─── SEED: SCHOOL EVENTS (SMK Rantau 2026) ──────────────────────────────────

INSERT INTO school_events (title, description, event_date, event_end_date, category, location, is_important) VALUES
  ('Peperiksaan Pertengahan Tahun', 'Mid-year examination for all forms', '2026-06-10', '2026-06-14', 'academic', 'Dewan Peperiksaan', true),
  ('Latihan Rumah Sukan',           'Sports house training — Blue House practice session', '2026-06-06', NULL, 'sports', 'Padang Sekolah', false),
  ('Hari Kokurikulum',              'Co-curriculum activities — Kelab & Persatuan', '2026-06-20', NULL, 'cultural', 'Sekolah', false),
  ('Hari Sukan Sekolah',            'Annual school sports day', '2026-07-12', NULL, 'sports', 'Stadium Seremban', true),
  ('Pameran Sains & Teknologi',     'Science and technology exhibition by students', '2026-07-25', '2026-07-26', 'academic', 'Dewan Sekolah', false),
  ('Majlis Anugerah Cemerlang',     'Excellence awards ceremony for top-performing students', '2026-08-15', NULL, 'cultural', 'Dewan Perdana', true),
  ('Peperiksaan Percubaan PMR/PT3', 'Trial examination for Form 3 students', '2026-09-01', '2026-09-10', 'academic', 'Dewan Peperiksaan', true),
  ('Hari Malaysia',                 'National day celebration and assembly', '2026-09-16', NULL, 'holiday', 'Padang Sekolah', false),
  ('Peperiksaan Akhir Tahun',       'End-of-year examination for all forms', '2026-10-20', '2026-10-30', 'academic', 'Dewan Peperiksaan', true),
  ('Majlis Perpisahan Tingkatan 5', 'Farewell ceremony for SPM students', '2026-11-05', NULL, 'cultural', 'Dewan Sekolah', false)
ON CONFLICT DO NOTHING;

-- ─── SEED: SCHOOL RULES (SMK Rantau) ────────────────────────────────────────

INSERT INTO school_rules (category, rule_number, title, description, sort_order) VALUES
  -- Pakaian & Penampilan (Uniform & Appearance)
  ('Pakaian & Penampilan', 1, 'Pakaian Seragam Lengkap', 'All students must wear the complete school uniform every day. No modifications to the uniform are allowed.', 1),
  ('Pakaian & Penampilan', 2, 'Kasut & Stokin Putih', 'Students must wear white shoes and white socks. Shoes must be clean and polished at all times.', 2),
  ('Pakaian & Penampilan', 3, 'Rambut Kemas', 'Male students must keep hair short and neat. Female students must tie long hair. No dyeing or unnatural colouring.', 3),
  ('Pakaian & Penampilan', 4, 'Tidak Memakai Aksesori Berlebihan', 'No excessive jewellery or accessories. Female Muslim students must wear the tudung (headscarf) properly.', 4),

  -- Kehadiran & Masa (Attendance & Punctuality)
  ('Kehadiran & Masa', 1, 'Hadir Tepat Pada Masa', 'Students must arrive by 7:25 AM. Late students will be recorded and parents notified.', 5),
  ('Kehadiran & Masa', 2, 'Surat Cuti Sakit', 'Absent students must submit a medical certificate or a written excuse from parents within 3 days of returning.', 6),
  ('Kehadiran & Masa', 3, 'Hadir Sekurang-kurangnya 80%', 'Students must maintain at least 80% attendance. Failure to do so may result in being barred from examinations.', 7),

  -- Tingkah Laku (Behaviour)
  ('Tingkah Laku', 1, 'Hormat Guru & Kakitangan', 'Students must show respect to all teachers and school staff at all times, inside and outside school premises.', 8),
  ('Tingkah Laku', 2, 'Dilarang Buli & Ugut', 'Bullying, intimidation, or any form of harassment is strictly prohibited and will result in disciplinary action.', 9),
  ('Tingkah Laku', 3, 'Jaga Kebersihan Sekolah', 'Students are responsible for keeping the school clean. Littering is strictly prohibited.', 10),
  ('Tingkah Laku', 4, 'Dilarang Merokok & Bahan Berbahaya', 'Smoking, vaping, and possession of any prohibited substances are strictly forbidden on school grounds.', 11),

  -- Telefon & Gajet (Phones & Gadgets)
  ('Telefon & Gajet', 1, 'Telefon Disimpan Dalam Beg', 'Mobile phones must be kept in school bags during school hours. Phones must be switched off or on silent mode.', 12),
  ('Telefon & Gajet', 2, 'Penggunaan Gajet Dilarang Semasa PdP', 'Use of mobile phones or any electronic gadgets during teaching and learning sessions is strictly prohibited.', 13),
  ('Telefon & Gajet', 3, 'Rampasan Telefon', 'Phones used during school hours may be confiscated and only returned to parents at the end of term.', 14),

  -- Akademik (Academic)
  ('Akademik', 1, 'Siapkan Kerja Rumah', 'All homework and assignments must be completed and submitted on time. Late submission will affect marks.', 15),
  ('Akademik', 2, 'Dilarang Meniru', 'Cheating, plagiarism, or copying in any form during examinations or assignments is a serious offence.', 16),
  ('Akademik', 3, 'Bawa Buku & Alat Tulis', 'Students must bring all required textbooks, exercise books, and stationery to school daily.', 17)
ON CONFLICT DO NOTHING;
