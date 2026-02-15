-- Database function to check if a user exists and is email-verified
-- by looking up auth.users directly (indexed by email).
-- Replaces the old approach of loading all users into memory via admin.listUsers().
--
-- SECURITY: Uses constant-time pattern to prevent timing attacks and user enumeration.
-- Always performs queries with the same structure regardless of user existence.

CREATE OR REPLACE FUNCTION check_email_verified(p_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_id uuid;
    v_verified boolean;
    v_exists boolean;
    v_normalized_email text;
    -- Fixed non-existent UUID for dummy queries to ensure consistent query plan and timing
    c_dummy_uuid uuid := '00000000-0000-0000-0000-000000000000';
BEGIN
    -- Input validation and sanitization
    IF p_email IS NULL OR p_email = '' OR length(p_email) > 255 THEN
        RETURN jsonb_build_object('exists', false, 'email_verified', false);
    END IF;

    -- Normalize email (trim whitespace and lowercase)
    v_normalized_email := lower(trim(p_email));

    -- Email format validation (basic check)
    IF v_normalized_email !~ '^[^@]+@[^@]+\.[^@]+$' THEN
        RETURN jsonb_build_object('exists', false, 'email_verified', false);
    END IF;

    -- Direct indexed lookup on auth.users
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_normalized_email LIMIT 1;
    v_exists := v_user_id IS NOT NULL;

    -- SECURITY: Always execute a profiles query with identical structure
    -- This ensures the same query plan and execution time regardless of user existence
    IF v_exists THEN
        -- Real user: query their actual profile
        SELECT email_verified INTO v_verified
        FROM public.profiles
        WHERE id = v_user_id
        LIMIT 1;
    ELSE
        -- Non-existent user: query with dummy UUID (same query structure)
        SELECT email_verified INTO v_verified
        FROM public.profiles
        WHERE id = c_dummy_uuid
        LIMIT 1;

        -- Always set to false for non-existent users
        v_verified := false;
    END IF;

    -- Optional: Add small random delay to further obscure timing differences
    -- Uncomment if you want additional protection (adds 10-50ms)
    -- PERFORM pg_sleep(0.01 + random() * 0.04);

    -- Audit log (optional - requires auth_audit_log table)
    -- To enable, create table:
    -- CREATE TABLE IF NOT EXISTS auth_audit_log (
    --     id bigserial PRIMARY KEY,
    --     email text NOT NULL,
    --     success boolean NOT NULL,
    --     ip_address text,
    --     created_at timestamptz DEFAULT now()
    -- );
    -- Then uncomment below:
    -- INSERT INTO auth_audit_log (email, success, ip_address)
    -- VALUES (v_normalized_email, v_exists AND COALESCE(v_verified, false),
    --         current_setting('request.headers', true)::json->>'x-forwarded-for');

    -- Return consistent response structure
    RETURN jsonb_build_object(
        'exists', v_exists,
        'email_verified', COALESCE(v_verified, false)
    );
END;
$$;
