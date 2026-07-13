
-- Add school_id to announcements for multi-tenant filtering
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES schools(id) ON DELETE CASCADE;

-- Make author_id nullable for seed data / system announcements
ALTER TABLE announcements ALTER COLUMN author_id DROP NOT NULL;
ALTER TABLE announcements ALTER COLUMN author_id SET DEFAULT NULL;
