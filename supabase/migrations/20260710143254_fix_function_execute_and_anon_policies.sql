
/*
# Fix handle_new_user Execute Permission and Remove Unnecessary Anon Access

## Summary
1. Revokes EXECUTE on handle_new_user() from PUBLIC role (anon and authenticated inherit from PUBLIC)
2. Removes anon role from clubs_societies SELECT policy (only accessed behind auth)
3. Removes anon role from library_resources SELECT policy (only accessed behind auth)
4. Keeps schools_select_anon policy (needed for public landing page school lookup)

## Security Changes
- handle_new_user: revoke EXECUTE from PUBLIC, anon, authenticated — trigger only, not callable via RPC
- clubs_societies: SELECT now authenticated-only (was anon,authenticated)
- library_resources: SELECT now authenticated-only (was anon,authenticated)
- schools: anon SELECT retained for public landing page (status = 'active' filter)
*/

-- Revoke EXECUTE from PUBLIC (covers anon + authenticated inheritance)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- Remove anon from clubs_societies SELECT (only accessed behind ProtectedRoute)
DROP POLICY IF EXISTS "select_clubs_societies" ON clubs_societies;
CREATE POLICY "select_clubs_societies" ON clubs_societies FOR SELECT
  TO authenticated
  USING (true);

-- Remove anon from library_resources SELECT (only accessed behind ProtectedRoute)
DROP POLICY IF EXISTS "select_library_resources" ON library_resources;
CREATE POLICY "select_library_resources" ON library_resources FOR SELECT
  TO authenticated
  USING (true);
