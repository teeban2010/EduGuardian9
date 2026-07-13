-- Library resources
CREATE TABLE IF NOT EXISTS library_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT,
  category TEXT NOT NULL DEFAULT 'Umum',
  resource_type TEXT NOT NULL DEFAULT 'buku' CHECK (resource_type IN ('buku', 'majalah', 'akhbar', 'digital', 'rujukan', 'novel', 'ensiklopedia')),
  isbn TEXT,
  quantity_total INTEGER NOT NULL DEFAULT 1,
  quantity_available INTEGER NOT NULL DEFAULT 1,
  location TEXT,
  description TEXT,
  cover_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE library_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_library_resources" ON library_resources FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "insert_library_resources" ON library_resources FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "update_library_resources" ON library_resources FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_library_resources" ON library_resources FOR DELETE
  TO authenticated USING (true);

-- Clubs and societies (Kelab & Persatuan)
CREATE TABLE IF NOT EXISTS clubs_societies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Kelab' CHECK (category IN ('Kelab', 'Persatuan', 'Unit Beruniform', 'Sukan & Permainan', 'Badan Pelajar')),
  description TEXT,
  teacher_advisor TEXT,
  president_name TEXT,
  meeting_schedule TEXT,
  meeting_location TEXT,
  member_count INTEGER DEFAULT 0,
  achievements TEXT,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE clubs_societies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_clubs_societies" ON clubs_societies FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "insert_clubs_societies" ON clubs_societies FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "update_clubs_societies" ON clubs_societies FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_clubs_societies" ON clubs_societies FOR DELETE
  TO authenticated USING (true);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_library_resources_school ON library_resources(school_id);
CREATE INDEX IF NOT EXISTS idx_clubs_societies_school ON clubs_societies(school_id);
