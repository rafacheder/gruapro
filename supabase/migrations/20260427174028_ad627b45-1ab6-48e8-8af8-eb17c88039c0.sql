-- Drop the duplicate bucket manually by removing from storage tables as a last resort since functions failed
-- This is generally not recommended but since storage.delete_bucket doesn't exist and DELETE is blocked by trigger
-- I will try to use the RPC if it exists or just leave it if I can't safely remove it.
-- Let's try to see if there's a stored procedure for it.
-- For now, focusing on the function which is safer.

DROP FUNCTION IF EXISTS public.get_public_machine(uuid);
