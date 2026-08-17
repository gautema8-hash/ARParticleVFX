-- AR粒子特效代码平台 数据库初始化脚本（PostgreSQL 10+）
-- 命名规范：表名全小写下划线，系统表 sys_ 前缀、业务表 biz_ 前缀

-- 系统用户表
CREATE TABLE sys_user (
    id          BIGSERIAL PRIMARY KEY,
    username    VARCHAR(64)  NOT NULL,
    password    VARCHAR(128) NOT NULL,
    email       VARCHAR(128),
    phone       VARCHAR(32),
    nickname    VARCHAR(64),
    tier        SMALLINT     NOT NULL DEFAULT 0,   -- 0免费 1个人Pro 2企业
    status      SMALLINT     NOT NULL DEFAULT 1,   -- 1正常 0禁用
    role        SMALLINT     NOT NULL DEFAULT 0,   -- 0普通用户 1管理员
    create_time TIMESTAMP    NOT NULL DEFAULT NOW(),
    update_time TIMESTAMP    NOT NULL DEFAULT NOW(),
    last_login_time TIMESTAMP,
    create_by   BIGINT,
    update_by   BIGINT,
    is_deleted  SMALLINT     NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX uk_sys_user_username ON sys_user (username) WHERE is_deleted = 0;

-- 业务特效表
CREATE TABLE biz_effect (
    id          BIGSERIAL PRIMARY KEY,
    effect_code VARCHAR(64)   NOT NULL,
    effect_name VARCHAR(128)  NOT NULL,
    category    VARCHAR(32)   NOT NULL,              -- ar/animal/flower/geometry/festival/nature/tech
    mode        VARCHAR(64),                         -- 对应前端特效模式，null 表示待实现
    tags        VARCHAR(256),
    tier        SMALLINT      NOT NULL DEFAULT 0,    -- 0免费 1Pro 2企业
    description TEXT,
    cover_url   VARCHAR(256),
    cover_base64 TEXT,
    source_html TEXT,
    price       DECIMAL(10,2),
    status      SMALLINT      NOT NULL DEFAULT 1,    -- 1上架 0下架
    create_time TIMESTAMP     NOT NULL DEFAULT NOW(),
    update_time TIMESTAMP     NOT NULL DEFAULT NOW(),
    publish_time TIMESTAMP,
    offline_time TIMESTAMP,
    create_by   BIGINT,
    update_by   BIGINT,
    is_deleted  SMALLINT      NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX uk_biz_effect_code ON biz_effect (effect_code) WHERE is_deleted = 0;
CREATE INDEX idx_biz_effect_category ON biz_effect (category);

-- 用户收藏表
CREATE TABLE biz_favorite (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT   NOT NULL,
    effect_id   BIGINT   NOT NULL,
    create_time TIMESTAMP NOT NULL DEFAULT NOW(),
    is_deleted  SMALLINT NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX uk_biz_favorite_user_effect ON biz_favorite (user_id, effect_id) WHERE is_deleted = 0;

-- 订单表（单特效购买 + 会员订阅）
CREATE TABLE biz_order (
    id          BIGSERIAL PRIMARY KEY,
    order_no    VARCHAR(64)   NOT NULL,
    user_id     BIGINT        NOT NULL,
    order_type  SMALLINT      NOT NULL,              -- 0单特效 1会员订阅
    effect_id   BIGINT,
    tier        SMALLINT,                            -- 会员订阅档位：1个人Pro 2企业
    amount      DECIMAL(10,2) NOT NULL,
    status      SMALLINT      NOT NULL DEFAULT 0,    -- 0待支付 1已支付 2已取消 3已退款
    pay_type    VARCHAR(16),
    create_time TIMESTAMP     NOT NULL DEFAULT NOW(),
    update_time TIMESTAMP     NOT NULL DEFAULT NOW(),
    is_deleted  SMALLINT      NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX uk_biz_order_no ON biz_order (order_no) WHERE is_deleted = 0;
CREATE INDEX idx_biz_order_user ON biz_order (user_id);

CREATE TABLE biz_feedback (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    name VARCHAR(64) NOT NULL,
    company VARCHAR(128),
    contact VARCHAR(128) NOT NULL,
    type VARCHAR(32),
    description TEXT NOT NULL,
    status SMALLINT NOT NULL DEFAULT 0,
    create_time TIMESTAMP NOT NULL DEFAULT NOW(),
    update_time TIMESTAMP NOT NULL DEFAULT NOW(),
    is_deleted SMALLINT NOT NULL DEFAULT 0
);
CREATE INDEX idx_biz_feedback_status ON biz_feedback(status);

-- 外键约束（保证数据一致性）
ALTER TABLE biz_favorite
    ADD CONSTRAINT fk_favorite_user FOREIGN KEY (user_id) REFERENCES sys_user (id);
ALTER TABLE biz_favorite
    ADD CONSTRAINT fk_favorite_effect FOREIGN KEY (effect_id) REFERENCES biz_effect (id);
ALTER TABLE biz_order
    ADD CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES sys_user (id);
ALTER TABLE biz_order
    ADD CONSTRAINT fk_order_effect FOREIGN KEY (effect_id) REFERENCES biz_effect (id);
