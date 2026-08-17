CREATE TABLE IF NOT EXISTS sys_login_log (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT,
  username VARCHAR(128),
  nickname VARCHAR(128),
  email VARCHAR(128),
  address VARCHAR(128),
  operation VARCHAR(64) NOT NULL,
  login_time TIMESTAMP NOT NULL DEFAULT NOW(),
  ip VARCHAR(64),
  device_type VARCHAR(32),
  user_agent TEXT,
  browser VARCHAR(64),
  os VARCHAR(64),
  success SMALLINT NOT NULL DEFAULT 1,
  detail VARCHAR(256),
  is_deleted SMALLINT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_sys_login_log_time ON sys_login_log(login_time);
