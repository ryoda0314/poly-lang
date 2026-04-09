-- Prevent users from changing their own role via RLS UPDATE policy
-- This closes the privilege escalation vulnerability where any authenticated user
-- could set role = 'admin' on their own profile row.

CREATE OR REPLACE FUNCTION prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow service_role to change roles (for admin operations)
    IF current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role' THEN
        RETURN NEW;
    END IF;

    -- Block all other role changes
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        RAISE EXCEPTION 'role column cannot be modified';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_role_change_trigger ON profiles;

CREATE TRIGGER prevent_role_change_trigger
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION prevent_role_change();
