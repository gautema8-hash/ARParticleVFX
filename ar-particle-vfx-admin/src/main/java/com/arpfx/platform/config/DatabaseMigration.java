package com.arpfx.platform.config;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import javax.annotation.Resource;

/** 小版本兼容迁移：保证已存在的本地数据库可直接升级。 */
@Component
public class DatabaseMigration {
    @Resource private JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void migrate() {
        jdbcTemplate.execute("ALTER TABLE biz_knowledge ADD COLUMN IF NOT EXISTS image_base64 TEXT");
    }
}
