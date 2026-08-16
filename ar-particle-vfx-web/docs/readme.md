# AR 粒子特效代码平台 · 前端

基于 **Vite + Three.js + MediaPipe** 的 AR 粒子特效平台前端。提供特效浏览 / 预览 / 导出、WebAR 实景体验、用户体系、订单与管理后台等完整页面，通过 RESTful API 对接后端 `ar-particle-vfx-admin`。

---

## 一、功能特性

### 页面（hash 路由）
| 路由 | 页面 |
| --- | --- |
| `#/` | 首页 |
| `#/effects` | 特效中心（分类筛选） |
| `#/effect/:id` | 特效详情（预览 + 复制/导出 + 收藏 + 购买） |
| `#/ar` | WebAR 实景专题 |
| `#/demo` | 免费体验（摄像头 + 手势粒子） |
| `#/pricing` | 定价（会员订阅下单） |
| `#/enterprise` | 企业服务 |
| `#/tools` | 工具箱（代码压缩 / 颜色拾取 / 参数生成器） |
| `#/help` | 帮助中心 |
| `#/login` | 登录 / 注册 / 忘记密码 / 会员中心 |
| `#/orders` | 我的订单 |
| `#/admin` | 管理后台（仅管理员） |

### 特效能力
- **3 款 AR 特效**（宇宙星系 / 海水潮流 / 人像粒子）：摄像头 + 手势实时驱动（张开=星系、划动=光带、握拳=冲击波）。
- **12 款高级 3D 粒子特效**（雪花 / 雨滴 / 花瓣 / 樱花 / 蝴蝶 / 游鱼 / 飞鸟 / 萤火虫 / 科技点阵 / 粒子波 / 烟花 / 星云）：统一采用 Three.js GPU 点云、参数化 3D 形态、平滑形变和扩散爆破场，详情页 **iframe 实时预览** + **一键导出单文件 HTML**。
- 每款高级特效均支持手动「爆炸 / 还原」，开启手势后支持「张开手掌爆炸、握拳还原、双手距离缩放」；粒子使用实物参考色板、粒子级颜色渐变、ACES 色调映射和高像素比渲染。

### 用户体系（对接后端）
- 注册 / 登录 / 忘记密码 / 会员中心（管理员徽章 + 档位展示）
- 收藏、我的订单、会员订阅下单、单特效购买、模拟支付

### 管理后台（管理员 role=1）
- 用户管理 / 订单管理 / 特效管理（上架 / 下架）

---

## 二、技术栈

| 模块 | 技术 | 版本 |
| --- | --- | --- |
| 手势识别 | MediaPipe Tasks Vision（HandLandmarker / ImageSegmenter） | ^0.10.35 |
| 渲染 | Three.js + WebGL + UnrealBloomPass | ^0.160.1 |
| 构建 | Vite | ^5.4.21 |
| 路由 | 原生 hash 路由 | — |
| 后端对接 | fetch + RESTful API（/api 代理） | 原生 |

> 关键约束：`getUserMedia` 仅在 **HTTPS 或 localhost** 环境可用。

---

## 三、目录结构

```
ar-particle-vfx-web/
├── index.html                  # 页面骨架
├── vite.config.js              # publicDir + /api 代理到 8080
├── package.json
├── models/                     # MediaPipe 模型与 wasm（本地化）
│   ├── hand_landmarker.task
│   └── wasm/
├── docs/                       # 全部项目文档（readme + 架构 + 日志等）
└── src/
    ├── main.js                 # 入口：摄像头按需启动 + 手势派发 + 面板逻辑
    ├── router.js               # hash 路由
    ├── nav.js                  # 顶部导航（登录态联动）
    ├── api.js                  # 后端接口封装（fetch + token 会话）
    ├── constants.js            # 前后端档位映射
    ├── camera.js               # 摄像头采集
    ├── handTracker.js          # 手势识别
    ├── gestureRecognizer.js    # 手势状态机
    ├── segmenter.js            # 人像分割
    ├── particleScene.js        # AR 粒子场景（Three.js）
    ├── recorder.js             # 屏幕录制
    ├── exporter.js             # 单文件 HTML 导出 / 复制
    ├── effects/
    │   ├── registry.js         # 15 款特效注册表
    │   └── particleEffects.js  # 12 款高级 3D 粒子引擎（可导出 HTML）
    ├── tools/                  # 代码压缩 / 颜色 / 参数生成
    ├── lib/toast.js            # 轻提示
    └── views/                  # home/catalog/detail/ar/pricing/enterprise/tools/help/login/orders/admin
```

---

## 四、快速开始

### 环境要求
- Node.js ≥ 18，npm ≥ 9
- Chrome / Edge 最新版（WebGL2 + WebRTC）
- 摄像头（体验 AR 需）
- **后端已启动**（见 `ar-particle-vfx-admin/README.md`）

### 安装与运行

```bash
cd ar-particle-vfx-web
npm install
npm run dev
# 浏览器打开 http://localhost:5173
```

> 前端已配置 Vite 代理：`/api` → `http://localhost:8080`，开发时无需处理跨域。

### 生产构建

```bash
npm run build
# 将 dist/ 发布到 HTTPS 静态站点，/api 需通过 Nginx 反代到后端
```

---

## 五、特效清单（15 款）

| 类型 | 特效 | 说明 |
| --- | --- | --- |
| AR | 宇宙星系 galaxy | 手势驱动螺旋星系（免费体验） |
| AR | 海水潮流 ocean | 青蓝潮流粒子（免费体验） |
| AR | 人像粒子 photoParticle | 上传照片重构 5 万粒子（免费体验） |
| 动物 | 蝴蝶 / 游鱼 / 飞鸟 | 粒子群游动（飞鸟 Pro） |
| 花卉 | 花瓣 / 樱花 | 下落旋转 |
| 几何 | 科技点阵 / 粒子波 | 网格波动（粒子波 Pro） |
| 节日 | 雪花 / 烟花 | 烟花点击绽放（Pro） |
| 自然 | 雨滴 / 萤火虫 | 下落 / 漂浮闪烁 |
| 科技 | 星云 | 漩涡（Pro） |

---

## 六、说明

- **摄像头按需启动**：仅进入 `#/demo` 才请求摄像头，离开即释放。
- **高级粒子导出**：`particleEffects.js` 生成单文件 HTML，运行时加载 Three.js；正式商用建议将 CDN 替换为企业自有静态资源地址。
- **AR 特效**：依赖 Three.js + 摄像头，暂无独立导出，通过「免费体验」在线使用。
