-- 已有数据库执行一次：为管理员/创作者上传的自包含特效保存源码
ALTER TABLE biz_effect ADD COLUMN IF NOT EXISTS source_html TEXT;
