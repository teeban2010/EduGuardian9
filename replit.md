# EduGuardian AI

## Overview
EduGuardian AI is a Malaysia-focused school management platform connecting schools, parents, teachers, and students. It's a React 19 + TypeScript + Vite single-page app using Material UI (MUI) for the interface and Supabase for authentication, database, and storage.

## Stack
- **Frontend**: React 19, TypeScript, Vite, React Router, MUI (Material UI), Emotion, Recharts
- **Backend/Data**: Supabase (Postgres + Auth), SQL migrations in `supabase/migrations/`
- **Roles**: parent, teacher, admin, super admin, guest — see `src/pages/` subfolders per role

## Running the project
- Dev server: `npm run dev` (bound via the "Start application" workflow, Vite on port 5000, `host: 0.0.0.0`, `allowedHosts: true` for the Replit preview proxy)
- Build: `npm run build`
- Lint: `npm run lint`

## Environment
- `.env` holds `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, already populated from the original Bolt/Supabase project this was imported from. These point to an existing external Supabase project — not a Replit-managed database.
- SQL migrations under `supabase/migrations/` are not auto-applied here; they must be run against that Supabase project via the Supabase SQL editor or CLI (see `docs/COMPETITION_SETUP.md` for the manual setup checklist: applying the latest migration, creating staff/parent accounts, importing students via CSV).

## Notes
- Imported from a zip upload; original stack and structure were preserved as-is (no migration to Replit's own DB or workspace conventions).
- Node.js 22 is required (`@supabase/*` packages declare `engines.node >= 22`); the project module was upgraded from the default 20 to 22 during setup.
