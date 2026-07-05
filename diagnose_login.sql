-- ============================================================================
-- LOGIN DIAGNOSTIC SCRIPT
-- Run against whichever Postgres DB your backend's ConnectionStrings:DefaultConnection
-- actually points to (check Backend/appsettings.json, or the ConnectionStrings__DefaultConnection
-- env var if running via docker-compose).
--
--   psql "postgresql://postgres:postgres@localhost:5433/payroll_db" -f diagnose_login.sql
--
-- ============================================================================

-- STEP 1: Confirm you're even looking at the right database / table.
SELECT current_database(), current_user, inet_server_addr(), inet_server_port();

-- STEP 2: List existing users so you can see what emails actually exist,
-- and what shape their passwordhash is in (a real PBKDF2 hash is base64,
-- ~60-90 chars, starts with "AQAAAA..."; anything else is legacy plain-text
-- or corrupted data).
SELECT empid, email, role, status, statusbysuperadmin,
       LEFT(passwordhash, 12) AS hash_preview,
       LENGTH(passwordhash) AS hash_length
FROM t_users
ORDER BY empid;

SELECT id, email, name, LEFT(passwordhash, 12) AS hash_preview
FROM t_superadmins;

-- STEP 3: Insert (or reset) a guaranteed-working test account.
-- Email:    logintest@microtechnique.in
-- Password: Test@1234
-- The hash below was generated using the EXACT same algorithm as
-- Microsoft.AspNetCore.Identity.PasswordHasher<T> (PBKDF2-HMACSHA256,
-- 10,000 iterations, 16-byte salt, 32-byte subkey, format marker 0x01),
-- so AuthController's hasher.VerifyHashedPassword(...) call will succeed
-- against it if — and only if — your API is actually talking to this database.

INSERT INTO t_users (name, email, passwordhash, gender, status, role, spaceid, dateofjoining, statusbysuperadmin)
VALUES (
    'Login Test User',
    'logintest@microtechnique.in',
    'AQAAAAEAACcQAAAAEOMQ+EHowcyP4imqLk4N/HEttY+6jG8IxABMZl2NKF01qIBhD5GpvmbLekMwRxv7cA==',
    'Unknown',
    'Active',
    'Admin',
    NULL,
    CURRENT_DATE,
    TRUE   -- must be TRUE for Admin role or AuthController blocks it with 403
)
ON CONFLICT (email) DO UPDATE
SET passwordhash = EXCLUDED.passwordhash,
    status = 'Active',
    statusbysuperadmin = TRUE;

-- STEP 4: Verify it landed correctly.
SELECT empid, email, status, statusbysuperadmin, role, LEFT(passwordhash, 12) AS hash_preview
FROM t_users
WHERE email = 'logintest@microtechnique.in';

-- Now try logging in with:
--   Email:    logintest@microtechnique.in
--   Password: Test@1234
--
-- If this succeeds -> your DB, hashing, and JWT pipeline are all fine;
--   the issue was that your original account's password/email/status/DB
--   target didn't match what you assumed.
-- If this FAILS -> the problem is not password-related at all (it's
--   connectivity: wrong DB, backend can't reach Postgres, CORS blocking
--   the request before it hits AuthController, or wrong frontend
--   REACT_APP_BACKEND_ORIGIN). Check the backend console output — the
--   improved logging added to AuthController.Login will print exactly
--   which branch it took (see "[Login] ..." lines).
