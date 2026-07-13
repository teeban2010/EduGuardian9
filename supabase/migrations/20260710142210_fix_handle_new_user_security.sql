
/*
# Fix handle_new_user Function Security

## Summary
Fixes two security issues with the handle_new_user trigger function:
1. Mutable search_path: sets search_path to '' (empty) and uses fully-qualified table names
2. Public execute permission: revokes EXECUTE from anon and authenticated roles
   (this is a trigger function — it must only be called by the trigger, not via RPC)

## Changes
- Recreates handle_new_user with SET search_path = '' to prevent search_path injection
- Revokes EXECUTE on the function from anon and authenticated roles
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'parent')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
