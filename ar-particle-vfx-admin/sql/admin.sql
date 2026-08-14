-- Admin account & role column migration (run on existing database)
-- 1) Add role column: 0 normal user, 1 admin
ALTER TABLE sys_user ADD COLUMN IF NOT EXISTS role SMALLINT NOT NULL DEFAULT 0;

-- 2) Default admin account: admin / Admin123 (role=1 admin, tier=2 enterprise)
--    password is BCrypt hash of Admin123
INSERT INTO sys_user (username, password, nickname, tier, role, status)
VALUES ('admin', '$2b$10$WL5pNki5XdePUS9glmgLQ.Y.cjw.wJtObcGX7VHqt6/JM4aDUUb4y', 'Administrator', 2, 1, 1)
ON CONFLICT DO NOTHING;
