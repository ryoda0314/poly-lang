-- Restrict check_email_verified function to service_role only
-- Prevents authenticated users from enumerating emails by calling the RPC directly

-- Revoke all existing permissions
REVOKE ALL ON FUNCTION check_email_verified(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION check_email_verified(text) FROM anon;
REVOKE ALL ON FUNCTION check_email_verified(text) FROM authenticated;

-- Grant execute only to service_role
GRANT EXECUTE ON FUNCTION check_email_verified(text) TO service_role;
