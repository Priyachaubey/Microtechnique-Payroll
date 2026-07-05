-- ============================================================
-- seed_default_users.sql
-- Run this against your EXISTING database (any state) to
-- guarantee at least one working login per role. Safe to
-- re-run any number of times — uses ON CONFLICT, touches
-- nothing else.
--
--   psql "postgresql://postgres:postgres@localhost:5433/payroll_db" -f seed_default_users.sql
--
-- (If running against the Docker Compose stack, port is 5433
--  on the host as mapped in docker-compose.yml.)
-- ============================================================

-- Ensure there is at least one space to attach users to.
INSERT INTO t_spaces (spaceid, spacename, adminid, numberofemployees, createdat, isactive, workinghours, type)
SELECT 1, 'Microtechnique HQ', NULL, 1, NOW(), TRUE, 8, 'Department'
WHERE NOT EXISTS (SELECT 1 FROM t_spaces WHERE spaceid = 1);

-- Default Admin
-- Email:    admin@microtechnique.local
-- Password: Admin@12345
INSERT INTO t_users (
    spaceid, name, email, passwordhash, gender, status, role,
    dateofjoining, is_approved, statusbysuperadmin
)
VALUES (
    1, 'Default Admin', 'admin@microtechnique.local',
    'AQAAAAEAACcQAAAAEIH17qNSs5zwtOjA+6XDNFIxXKr+cyd/UaqOyu60OV2d36lcua3RJTZJOD6oQo3g/A==',
    'Unknown', 'Active', 'Admin', CURRENT_DATE, TRUE, TRUE
)
ON CONFLICT (email) DO UPDATE SET
    passwordhash = EXCLUDED.passwordhash,
    status = 'Active',
    statusbysuperadmin = TRUE;

UPDATE t_spaces SET adminid = (SELECT empid FROM t_users WHERE email = 'admin@microtechnique.local')
WHERE spaceid = 1 AND adminid IS NULL;

-- Default Employee (same space)
-- Email:    employee@microtechnique.local
-- Password: Employee@12345
INSERT INTO t_users (
    spaceid, name, email, passwordhash, gender, status, role,
    dateofjoining, is_approved, statusbysuperadmin
)
VALUES (
    1, 'Default Employee', 'employee@microtechnique.local',
    'AQAAAAEAACcQAAAAELmU/490ge6J0ZHn5oiwTBrzsdOot+s/GDwhjcCcKmFraB08mR1gsjbknKqSegB4DA==',
    'Unknown', 'Active', 'Employee', CURRENT_DATE, TRUE, FALSE
)
ON CONFLICT (email) DO UPDATE SET
    passwordhash = EXCLUDED.passwordhash,
    status = 'Active';

-- Confirm what's now in the DB for these two accounts.
SELECT empid, spaceid, email, role, status, statusbysuperadmin
FROM t_users
WHERE email IN ('admin@microtechnique.local', 'employee@microtechnique.local');
