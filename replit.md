# EduGuardian AI

Malaysia-focused AI-assisted school management platform: a React + TypeScript + Vite frontend with Supabase for auth, database, and row-level security. Serves parents, teachers, admins, super-admins, and guests through role-based dashboards.

## Stack
- React 19 + TypeScript + Vite 8
- MUI (Material UI) for components/theming, Emotion for styling, Recharts for charts
- React Router v7 for routing
- Supabase (`@supabase/supabase-js`) for auth + Postgres database + RLS
- SQL migrations live in `supabase/migrations/`

## Running the app
- Workflow **"Start application"** runs `npm run dev` (Vite) on port 5000 — this is what powers the Replit preview.
- Requires two secrets to be set: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Supabase Dashboard → Project Settings → API). These are already configured for the connected Supabase project.
- The Supabase database schema (schools, students, profiles, homework, announcements, etc.) is already applied — confirmed via direct REST queries against the connected project.
- See `docs/COMPETITION_SETUP.md` for manual steps to create staff/parent accounts and import students via CSV — admin signup is intentionally not exposed in the public UI.

## Structure
- `src/pages/<role>/` — role-specific dashboards and pages (parent, teacher, admin, guest, auth)
- `src/contexts/` — Auth, School, and ColorMode React contexts
- `src/lib/supabase.ts` — Supabase client instantiation
- `src/components/` — shared layout and common UI components
- `supabase/migrations/` — SQL schema migrations, applied in order by filename timestamp

## User preferences
None recorded yet.
