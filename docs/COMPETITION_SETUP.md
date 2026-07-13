# Competition Setup Checklist

## 1. Apply the latest Supabase migration
Run `supabase/migrations/20260713000100_role_based_student_permissions.sql` in the Supabase SQL Editor, or apply it through the Supabase CLI.

## 2. Create staff accounts manually
1. Register the account normally or create it under Supabase Authentication > Users.
2. Open Table Editor > profiles.
3. Set `role` to `admin` or `teacher`.
4. Set `school_id` to the competition school's UUID.
5. For the SuperAdmin account, set `is_super_admin` to `true`.

Admin is intentionally removed from public registration.

## 3. Create at least one parent account
The current schema requires every student to have a `parent_id`. Create a parent account and ensure its profile has the same `school_id`.

## 4. Add students through the app
Log in as Admin, Teacher, or SuperAdmin, then open **Students** from the sidebar.

## 5. Import students through CSV
Use `docs/students_import_template.csv`. Replace the placeholder UUIDs, then import it through Supabase Table Editor > students > Import data from CSV.

## 6. Competition scope
Teacher-to-student assignment is intentionally not implemented for this version. Teachers can manage students within their school. This avoids introducing another table and additional screens before the competition.
