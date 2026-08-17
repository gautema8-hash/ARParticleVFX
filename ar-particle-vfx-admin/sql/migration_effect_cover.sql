-- 已有数据库执行一次：保存 1:1 特效封面 Base64
ALTER TABLE biz_effect ADD COLUMN IF NOT EXISTS cover_base64 TEXT;
