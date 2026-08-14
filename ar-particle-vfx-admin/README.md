# AR 粒子特效代码平台 · 后端服务

Spring Boot 2.4.2 单体后端，为 AR 粒子特效平台提供**用户、订单、特效、收藏、管理后台**等能力，与前端 `ar-particle-vfx-web` 通过 RESTful API 对接。

---

## 一、技术栈

| 类别 | 技术 | 版本 |
| --- | --- | --- |
| 语言 / 框架 | JDK + Spring Boot | 1.8 / 2.4.2 |
| Web 容器 | Tomcat（内嵌） | 9.0.93 |
| 数据库 | PostgreSQL | 14+ |
| ORM | MyBatis + PageHelper | 2.2.0 / 1.4.2 |
| 缓存 / 会话 | Redis（Jedis） | 3.3.0 |
| 密码加密 | BCrypt（spring-security-crypto） | Spring Boot BOM 管理 |
| 日志 | Log4j2 | 2.17.2 |
| 校验 / 简化 | Validation + Lombok | — |

---

## 二、功能清单

| 模块 | 功能 | 说明 |
| --- | --- | --- |
| 用户 | 注册 / 登录 / 忘记密码 / 用户信息 | BCrypt 加密、Redis Token 会话、防用户名枚举 |
| 角色 | 管理员 `role=1` | 默认账号 `admin`，由 `DataInitializer` 幂等创建 |
| 收藏 | 收藏 / 取消 / 列表 | 按 `effectCode` 标识（与前端特效 id 对齐） |
| 订单 | 单特效 / 会员订阅下单、订单列表 | 订单号 UUID、金额 BigDecimal |
| 支付 | 模拟支付回调 | 归属校验 + CAS 幂等 + 会员仅升不降 |
| 特效 | 分页列表 / 详情 | 游客可访问，支持分类/档位筛选 |
| 管理后台 | 用户 / 订单 / 特效管理、上下架 | 仅管理员（role=1）可访问 |
| 安全 | 接口限流 / 越权防护 / 参数校验 | Redis 计数器限流（20 次/60 秒，按 IP+路径） |

---

## 三、目录结构

```
src/main/java/com/arpfx/platform/
├── PlatformApplication.java      # 启动类
├── common/
│   ├── constant/                # RedisKeyConstant / SysConstant
│   ├── enums/                   # ResultCodeEnum / TierEnum / OrderStatusEnum
│   ├── exception/               # BusinessException / GlobalExceptionHandler
│   ├── result/                  # Result / PageResult
│   └── utils/                   # RedisUtils / TokenUtils / UserContext
├── config/
│   ├── WebConfig.java           # 跨域 + 登录拦截器 + 限流拦截器注册
│   ├── TokenInterceptor.java    # Token 鉴权
│   ├── RateLimitInterceptor.java# 接口限流（Redis 计数器）
│   ├── DataInitializer.java     # 启动时幂等创建 admin
│   ├── RedisConfig.java         # Redis String 序列化
│   └── MybatisConfig.java
├── controller/                  # User / Effect / Order / Admin
├── service/ + service/impl/     # User / Effect / Order / Admin
├── dao/mapper/                  # User / Effect / Favorite / Order
└── entity/                      # po / dto / vo
src/main/resources/
├── mapper/                      # MyBatis XML
├── config/application-dev.yml   # 开发环境
├── application.yml              # 主配置
└── log4j2-spring.xml
sql/
├── schema.sql                   # 建表 + 索引 + 外键（含 role 字段）
├── seed.sql                     # 15 款特效种子数据
└── admin.sql                    # role 字段迁移 + 默认管理员账号
```

---

## 四、接口清单

### 用户 / 收藏
| 方法 | 路径 | 说明 | 鉴权 |
| --- | --- | --- | --- |
| POST | /api/user/register | 注册 | 否 |
| POST | /api/user/login | 登录（返回 token + 用户信息含 role） | 否 |
| POST | /api/user/reset-password | 忘记密码（用户名 + 邮箱 + 新密码） | 否 |
| GET | /api/user/info | 当前用户信息 | 是 |
| POST | /api/user/favorite/{effectCode} | 收藏特效 | 是 |
| DELETE | /api/user/favorite/{effectCode} | 取消收藏 | 是 |
| GET | /api/user/favorites | 我的收藏编码列表 | 是 |

### 特效
| 方法 | 路径 | 说明 | 鉴权 |
| --- | --- | --- | --- |
| GET | /api/effect/list | 分页列表（category/tier/pageNum/pageSize） | 否 |
| GET | /api/effect/{id} | 特效详情 | 否 |

### 订单 / 支付
| 方法 | 路径 | 说明 | 鉴权 |
| --- | --- | --- | --- |
| POST | /api/order/create | 创建订单（orderType 0单特效/1会员，effectCode 或 tier） | 是 |
| GET | /api/order/list | 我的订单 | 是 |
| POST | /api/order/pay/callback | 模拟支付回调（orderNo，仅订单本人可触发） | 是 |

### 管理后台（仅管理员 role=1）
| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /api/admin/users | 用户列表 |
| GET | /api/admin/orders | 订单列表 |
| GET | /api/admin/effects | 特效列表（含下架） |
| PUT | /api/admin/effect/{id}/status?status=0/1 | 特效上架/下架 |

> 鉴权：请求头 `Authorization: Bearer {token}`。Token 由登录接口下发，存于 Redis，默认 7 天过期。

---

## 五、数据库初始化

```bash
# 1. 建库
psql -U postgres -c "CREATE DATABASE arpfx;"
# 2. 建表 + 索引 + 外键
psql -U postgres -d arpfx -f sql/schema.sql
# 3. 特效种子数据（15 款）
psql -U postgres -d arpfx -f sql/seed.sql
# 4. 管理员账号（admin / Admin123，role=1）
psql -U postgres -d arpfx -f sql/admin.sql
```

---

## 六、运行

```bash
cd ar-particle-vfx-admin
mvn spring-boot:run
# 或打包运行
mvn clean package -DskipTests
java -jar target/arpfx-platform-1.0.0.jar
```

默认配置（`application-dev.yml`）：
- 数据库 `jdbc:postgresql://127.0.0.1:5432/arpfx`，用户 `postgres`，密码 `postgres`（可用环境变量 `DB_PASSWORD` 覆盖）
- Redis `127.0.0.1:6379`（无密码，可用 `REDIS_PASSWORD` 覆盖）
- 端口 `8080`

启动后验证：`curl http://localhost:8080/api/effect/list`

---

## 七、默认账号

| 账号 | 密码 | 角色 | 档位 |
| --- | --- | --- | --- |
| admin | Admin123 | 管理员（role=1） | 企业版（tier=2） |

> 首次启动若 `admin` 不存在，`DataInitializer` 会自动创建（幂等）。

---

## 八、安全设计要点

- 密码 **BCrypt** 加盐存储，登录统一提示「用户名或密码错误」防枚举。
- 支付回调**归属校验**（仅订单本人）+ **CAS 条件更新**（幂等、防并发重复处理）。
- 会员升级 `GREATEST(tier, #{tier})` **仅升不降**。
- 订单号 **UUID** 防并发碰撞。
- 接口限流：注册/登录/重置密码/支付回调 20 次/60 秒（Redis 计数器）。
- 管理接口统一校验 `role=1`。
