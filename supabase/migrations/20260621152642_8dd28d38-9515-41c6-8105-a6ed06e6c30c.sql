
-- Restrict remaining SECURITY DEFINER funcs
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
-- handle_new_user is trigger-only; already revoked from authenticated. Re-assert.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
-- has_role/current_tenant_id/is_tenant_member are used in RLS policies which run as security_invoker;
-- but the policies invoke security_definer helpers, which is fine. Restrict to authenticated only (already done).
-- Drop accidental public grants if any
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_tenant_id() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_tenant_member(uuid) FROM PUBLIC;
