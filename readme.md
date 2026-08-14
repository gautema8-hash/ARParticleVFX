# AR 粒子特效代码平台

一个**前后端分离**的 AR 粒子特效代码平台：浏览、预览、导出 **15 款粒子特效**（3 款 WebAR + 12 款普通粒子），并提供完整的**用户体系、收藏、订单、会员订阅、管理员后台**能力。

---

## 一、项目结构

```
ARParticleVFX/
├── ar-particle-vfx-admin/        # 后端：Spring Boot 2.4.2 单体
│   ├── README.md                 # 后端文档（接口/数据库/运行）
│   ├── src/                      # Java 源码
│   └── sql/                      # schema.sql / seed.sql / admin.sql
├── ar-particle-vfx-web/          # 前端：Vite + Three.js + MediaPipe
│   ├── docs/readme.md            # 前端文档（页面/特效/运行）
│   ├── src/                      # 前端源码
│   └── models/                   # MediaPipe 模型与 wasm
├── 前后端功能-执行计划.md          # 功能规划（前后端依赖步骤）
├── 待办操作与下一步指南.md         # 环境实测 + 操作手册 + 验证清单
└── readme.md                     # 本文档（集合入口）
```

---

## 二、技术栈

| 端 | 技术 |
| --- | --- |
| 后端 | JDK 1.8 · Spring Boot 2.4.2 · Tomcat 9.0.93 · PostgreSQL · MyBatis · PageHelper · Redis(Jedis 3.3.0) · Log4j2 · BCrypt |
| 前端 | Vite 5 · Three.js 0.160 · MediaPipe Tasks Vision · 原生 fetch + hash 路由 |

---

## 三、功能总览

| 模块 | 能力 |
| --- | --- |
| 特效 | 15 款特效：3 款 WebAR（星系/海水/人像粒子）+ 12 款普通粒子（雪花/雨/花瓣/樱花/蝴蝶/游鱼/飞鸟/萤火虫/点阵/粒子波/烟花/星云） |
| 特效操作 | 详情页实时预览、一键复制、单文件 HTML 导出（零依赖） |
| 用户体系 | 注册 / 登录 / 忘记密码 / 会员中心 / 管理员角色 |
| 收藏 | 收藏 / 取消 / 列表（与特效 id 对齐） |
| 订单 | 单特效购买 / 会员订阅、我的订单、模拟支付回调 |
| 会员 | 免费 / 个人 Pro / 企业三档，支付成功后升级（仅升不降） |
| 管理后台 | 用户 / 订单 / 特效管理、上架下架（仅管理员） |
| 安全 | BCrypt 密码、支付越权防护、幂等 CAS、防枚举、接口限流 |
| 工具箱 | 代码压缩 / 颜色拾取 / 参数生成器 |

---

## 四、快速启动

### 1. 初始化数据库（PostgreSQL）

```bash
psql -U postgres -c "CREATE DATABASE arpfx;"
psql -U postgres -d arpfx -f ar-particle-vfx-admin/sql/schema.sql
psql -U postgres -d arpfx -f ar-particle-vfx-admin/sql/seed.sql
psql -U postgres -d arpfx -f ar-particle-vfx-admin/sql/admin.sql
```

### 2. 启动后端（8080）

```bash
cd ar-particle-vfx-admin
mvn spring-boot:run
```

### 3. 启动前端（5173）

```bash
cd ar-particle-vfx-web
npm install
npm run dev
```

浏览器打开 **http://localhost:5173**（前端已代理 `/api` → `http://localhost:8080`）。

> 详细环境信息（本机 PostgreSQL/Redis 路径、端口、密码、验证清单）见 **《待办操作与下一步指南.md》**。

---

## 五、默认账号

| 账号 | 密码 | 角色 | 档位 |
| --- | --- | --- | --- |
| admin | Admin123 | 管理员（role=1） | 企业版 |

> 首次启动若 `admin` 不存在，后端 `DataInitializer` 会自动创建。

---

## 六、文档导航

| 文档 | 内容 |
| --- | --- |
| `ar-particle-vfx-admin/README.md` | 后端：技术栈、接口清单、数据库、运行、安全设计 |
| `ar-particle-vfx-web/docs/readme.md` | 前端：页面路由、特效清单、目录结构、运行 |
| `前后端功能-执行计划.md` | 前后端功能规划与执行顺序 |
| `待办操作与下一步指南.md` | 环境实测、待操作步骤、端到端验证清单、商用意见 |
| `ar-particle-vfx-web/docs/` | 前端历史文档（技术架构 / 需求 / 可行性 / 开发日志等） |
| `ar-particle-vfx-admin/Spring Boot 2.4.2 单体项目技术规范手册.md` | 后端技术规范手册 |

---

## 七、当前状态

- 核心功能链路（注册 → 登录 → 收藏 → 下单 → 支付 → 会员升级 → 管理后台）已打通，前后端接口自测通过（36 项 PASS / 0 FAIL）。
- 剩余待办：**真实支付接入**（需企业资质 + 商户号）、**版权音乐替换**（`zhoujielunwith.ogg`）。
- 商用定位建议：「免费工具引流 + 企业定制 / API 授权」双轮驱动。
