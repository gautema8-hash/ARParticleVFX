# AR粒子特效代码平台 - 分步执行计划（兼容 demo001 · 可逐步落地）

> 使用说明：按「阶段 → 步骤」顺序执行，每步完成后核对「验收点」与「可行性评估」。本计划**基于现有 demo001 演进**，MVP 阶段纯前端、零重写，每步可独立验收、可回退。

---

## 〇、前置条件与执行总览

### 0.1 本机环境（已实测，无需重装）

| 项目 | 实测值 | 结论 |
| --- | --- | --- |
| Node.js / npm | v24.10.0 / 11.6.1 | ✅ |
| 终端 | Windows PowerShell | ⚠️ `curl` 写 `curl.exe`，多命令用 `;` 分隔 |
| 浏览器 | Chrome/Edge + WebGL2 + WebRTC | ✅ |
| 现有项目 | demo001 可 `npm run build` 通过 | ✅ 基线可用 |

### 0.2 执行总览

| 阶段 | 步骤 | 交付物 | 独立验收 |
| --- | --- | --- | --- |
| 阶段一 MVP | 1~8 | 可运行特效代码平台（纯前端 + BaaS） | ✅ |
| 阶段二 商业化 | 9~13 | WebAR 上线 + 会员订阅 + 100 特效 | ✅ |
| 阶段三 生态 | 14~16 | 创作者平台 + API + 定制 | ✅ |

### 0.3 关键约定（务必遵守）

1. **MVP 保留 Vite + 原生 JS**，不上 Next.js/React（零重写）。
2. **WebAR 以 MediaPipe 为底座**（复用 camera/handTracker/segmenter）。
3. **后端用 BaaS（Supabase）替代自建**；阶段二再评估 Nest + MySQL。
4. **商用前先替换 `zhoujielunwith.ogg`**（版权阻塞项，见文末 Checklist）。
5. 新增特效复用现有 `particleScene.js` 的 `makePoints` 引擎，不另造轮子。

---

## 阶段一：MVP（步骤 1~8）

### 步骤 1：代码基线确认与目录预留

**目标**：确认现有项目可运行，为平台化改造打基线。

**操作**：
```powershell
cd d:\sofa\aiproject\demo001
npm install
npm run build      # 确认能打包
npm run dev        # 浏览器打开 http://localhost:5173 确认可用
```

预留目录与文件：
```powershell
New-Item -ItemType Directory -Force src\effects
New-Item -ItemType File -Force src\exporter.js
New-Item -ItemType File -Force src\effects\registry.js
```

**验收点**：`npm run build` 通过；`npm run dev` 手势交互正常；`src/effects/`、`src/exporter.js` 已创建。

**可行性**：✅ 高。纯现状确认，无风险。

---

### 步骤 2：特效模板化改造（effects/ 注册表）

**目标**：把 `galaxy / ocean / photoParticle` 抽象为可枚举、可配置的特效模板。

**前置**：步骤 1。

**操作**：新建 `src/effects/registry.js`（最小侵入，先映射到现有 `setEffectMode`）：

```js
export const EFFECTS = [
  { id: 'galaxy', name: '宇宙星系', category: 'ar', mode: 'galaxy',
    params: { sizeFactor: 1, speedFactor: 1, bloomStrength: 0.7 } },
  { id: 'ocean', name: '海水潮流', category: 'ar', mode: 'ocean',
    params: { sizeFactor: 1, speedFactor: 1, bloomStrength: 0.7 } },
  { id: 'photoParticle', name: '人像粒子', category: 'ar', mode: 'photoParticle',
    params: { sizeFactor: 1, speedFactor: 1, bloomStrength: 0.7 } }
];
export const getEffect = (id) => EFFECTS.find(e => e.id === id);
export const listEffects = (cat) => cat ? EFFECTS.filter(e => e.category === cat) : EFFECTS;
```

`main.js` 的 `setEffectMode` 改为 `setEffectMode(getEffect(id).mode)` 驱动。

**验收点**：`listEffects()` 枚举 3 个特效；按 id 切换渲染正常，参数面板生效。

**可行性**：✅ 高。最小侵入封装，不重构 particleScene.js 内部。

---

### 步骤 3：exporter.js 单文件导出 / 复制

**目标**：实现「一键复制代码 + 单文件 HTML/TXT 导出」。

**前置**：步骤 2。

**操作**：新建 `src/exporter.js`，核心骨架：

```js
export function buildSingleFileHTML(effectId, params, opts = {}) {
  const meta = getEffect(effectId);
  const copyright = opts.isMember ? '' : '/* 免费版：仅供学习，商用需授权 */';
  // 1. 拼接内联 CSS + 特效核心 JS + 参数配置
  // 2. 模型/wasm：MVP 用 CDN 引用，进阶用 Base64 内联
  return `<!DOCTYPE html><html><head>...${copyright}...</head><body>...</body></html>`;
}
export async function copyCode(html) {
  try { await navigator.clipboard.writeText(html); return true; }
  catch { /* 降级 document.execCommand('copy') */ }
}
export function downloadCode(filename, html, ext = 'html') {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `${filename}.${ext}`; a.click();
  URL.revokeObjectURL(url);
}
```

**验收点**：详情页点击复制，粘贴到 `.html` 双击可运行；导出 `.html`/`.txt` 文件可运行。

**可行性**：✅ 高。Blob/Clipboard 均为浏览器原生，与 recorder.js 导出同思路。

---

### 步骤 4：平台站点骨架（hash 路由三页面）

**目标**：首页 + 分类列表页 + 特效详情页，静态站点，不上框架。

**前置**：步骤 3。

**操作**：用 hash 路由（`#/`、`#/list/:cat`、`#/effect/:id`）实现三视图，复用现有 DOM 结构：

```
index.html        # 增加 #page 容器 + 顶部导航
src/router.js     # 新增：监听 hashchange，渲染对应视图
src/views/        # 新增：home.js / list.js / detail.js
```

详情页复用现有 `createParticleScene` 预览特效，工具栏绑定 `copyCode/downloadCode`。

**验收点**：三个页面可切换；详情页能实时预览 + 复制/导出。

**可行性**：✅ 高。原生 hash 路由，零依赖；MVP 暂不上 Next.js。

---

### 步骤 5：BaaS 接入（Supabase 注册登录 + 收藏）

**目标**：注册登录 + 收藏能力。

**前置**：步骤 4。

**操作**：
```powershell
npm install @supabase/supabase-js
```
- Supabase 控制台建项目，建表：`profiles`、`favorites(user_id, effect_id)`。
- 新建 `src/supabase.js` 封装 `auth.signUp/signIn` 与收藏增删查。
- 详情页收藏按钮绑定登录态。

**验收点**：能注册登录、收藏/取消收藏，刷新后收藏仍在。

**可行性**：✅ 高。BaaS 免自建后端；需能访问 supabase.com（国内可达，必要时自建等价服务）。

---

### 步骤 6：首批 30 款特效资产入库

**目标**：动物/花卉/几何三类共 30 款普通粒子特效。

**前置**：步骤 2。

**操作**：基于 `makePoints` 引擎，用「配置化」批量生成（每类 10 款），写入 `src/effects/`：
- 动物：蝴蝶、飞鸟、游鱼、萤火虫…（轨迹 + 颜色 + 形状配置）
- 花卉：花瓣、蒲公英、樱花、玫瑰…（下落 + 旋转 + 渐变色）
- 几何：点阵、线条、星云、粒子波…（几何布局 + 光效）
- 每款生成一张静态封面图（canvas 截帧）。

**验收点**：`listEffects()` 共 33 款（3 AR + 30 普通）；列表页可预览封面，详情页可运行。

**可行性**：✅ 高。引擎复用，特效以配置为主；单款成本低。

---

### 步骤 7：单特效支付对接

**目标**：微信/支付宝单特效购买。

**前置**：步骤 5、6；企业主体 + 商户号。

**操作**：
- 后端：Supabase Edge Functions（或自建 Node）实现下单、支付回调、订单落库、解锁特效。
- 前端：详情页「购买」按钮 → 拉起支付 → 回调解锁 → 授权范围入库。

**验收点**：完成一笔测试支付后特效解锁，订单与授权可查。

**可行性**：⚠️ 中。需企业主体 + 支付资质（约 5000 元 + 数日审核），是 MVP 首个外部依赖节点。

---

### 步骤 8：MVP 构建部署 + 灰度验证

**目标**：部署 HTTPS + 灰度验证付费转化。

**前置**：步骤 7。

**操作**：
```powershell
npm run build
# 将 dist/ 发布到 Vercel / Netlify（免费档），绑定自定义域名 + HTTPS
```
- 埋点：接入统计（用量、复制/导出次数、注册、付费）。
- 灰度：小范围投放，观察付费转化率，决定是否上调会员档。

**验收点**：线上 `https://` 可访问，特效预览/复制/导出/支付可用；转化数据可观测。

**可行性**：✅ 高（部署）；⚠️ 中（商业转化需数据验证）。

---

## 阶段二：功能完善 + AR 上线（步骤 9~13）

### 步骤 9：WebAR 特效上线（首批 10 款）

**目标**：复用 MediaPipe 手势/人像链路，上线 10 款 AR 特效。

**前置**：阶段一完成。

**操作**：复用 `camera.js + handTracker.js + gestureRecognizer.js + particleScene.js`，把现有 galaxy/ocean/photoParticle 扩展为 10 款「手势驱动 AR」特效（动物/花卉主题）。

**验收点**：手机扫码 → 摄像头实景中粒子随手势互动。

**可行性**：✅ 高。核心链路已在 demo001 验证，属复制扩展。

---

### 步骤 10：会员体系 + 订阅支付

**目标**：个人/企业会员权限划分 + 订阅支付。

**前置**：步骤 7。

**操作**：会员表 + 订阅（月/年）+ 权限中间层（免费/Pro/企业）；前端会员中心页面。

**验收点**：开通会员后额度/版权标识按档位生效。

**可行性**：⚠️ 中。订阅比单购复杂（续费/退款/回调），需后端完善。

---

### 步骤 11：参数调节面板（会员专属）

**目标**：会员自定义粒子参数，生成专属代码。

**前置**：步骤 3。

**操作**：把现有 `sizeFactor/speedFactor/bloomStrength` 扩展为通用 schema（粒子数/颜色/大小/速度/发射角/透明度），调节后实时预览并重新 `buildSingleFileHTML`。

**验收点**：会员调参 → 预览同步 → 导出的代码含自定义参数。

**可行性**：✅ 高。现有面板即为雏形，扩展 schema 即可。

---

### 步骤 12：特效库扩充至 100+

**目标**：累计 100+ 特效，新增节日/自然/科技分类。

**前置**：步骤 6。

**操作**：继续配置化量产，补节日（雪花/烟花/红包雨）、自然（雨滴/火焰/星空）、科技（点阵/线条/星云）。

**验收点**：`listEffects()` 达 100+，分类齐全。

**可行性**：✅ 高。规模复制，成本递减。

---

### 步骤 13：SEO + 内容运营（评估 Next.js 迁移）

**目标**：自然流量获取。

**前置**：步骤 8。

**操作**：技术社区发文、关键词优化；若 SSR/SEO 收益明确，再评估把平台前端迁移 Next.js（此时特效引擎仍是纯 JS 复用，不重写）。

**验收点**：自然搜索流量增长，注册/付费随流量提升。

**可行性**：⚠️ 中。SEO 见效慢；Next.js 迁移为可选，不阻塞 MVP。

---

## 阶段三：生态拓展（步骤 14~16）

### 步骤 14：创作者平台
**目标**：开发者上传原创特效，平台分成。
**操作**：上传审核 → 特效打包规范 → 分成结算。
**验收点**：外部创作者可上传并上架特效。
**可行性**：⚠️ 中。需审核、结算、版权合规体系。

### 步骤 15：开放 API
**目标**：对接第三方建站/H5 工具，按调用量计费。
**操作**：REST API + 鉴权 + 计费 + 配额。
**验收点**：第三方可调用特效渲染 API。
**可行性**：⚠️ 中。需后端稳定与限流计费。

### 步骤 16：定制服务 + 工具矩阵
**目标**：企业定制（logo 粒子/主题 AR）+ Figma 插件/桌面工具。
**操作**：标准化定制套餐 + 插件开发。
**验收点**：能交付企业定制单。
**可行性**：⚠️ 中。高客单价但依赖商务能力。

---

## 分步可行性评估汇总

| 步骤 | 内容 | 可行性 | 关键风险/依赖 |
| --- | --- | --- | --- |
| 1 | 代码基线 | ✅ 高 | 无 |
| 2 | 特效模板化 | ✅ 高 | 无 |
| 3 | 单文件导出 | ✅ 高 | 无 |
| 4 | 站点骨架 | ✅ 高 | 无 |
| 5 | BaaS 接入 | ✅ 高 | 需访问 supabase |
| 6 | 30 款特效 | ✅ 高 | 素材工作量 |
| 7 | 单特效支付 | ⚠️ 中 | 企业主体 + 支付资质 |
| 8 | 部署灰度 | ✅/⚠️ 中 | 转化需数据验证 |
| 9 | WebAR 上线 | ✅ 高 | 复用现有链路 |
| 10 | 会员订阅 | ⚠️ 中 | 订阅复杂度 |
| 11 | 参数面板 | ✅ 高 | 现有雏形 |
| 12 | 100+ 特效 | ✅ 高 | 量产成本 |
| 13 | SEO/迁移 | ⚠️ 中 | 见效慢，可选 |
| 14 | 创作者平台 | ⚠️ 中 | 审核/结算/合规 |
| 15 | 开放 API | ⚠️ 中 | 限流计费 |
| 16 | 定制服务 | ⚠️ 中 | 商务能力 |

## 整体可行性结论

- **MVP（步骤 1~8）**：技术可行性**高**，6/8 步无重大风险；仅「支付（步骤 7）」需企业资质、「转化（步骤 8）」需市场验证。可在 4-6 周落地。
- **阶段二/三**：技术路线清晰，主要风险在**商业与合规**（订阅/审核/结算），而非技术。
- **唯一硬性阻塞（商用前）**：替换 `zhoujielunwith.ogg` 内置音频。

## 商用前 Checklist（执行步骤 1 前先处理）

- [ ] ❗ 替换/移除 `zhoujielunwith.ogg`（版权）
- [ ] 核对 MediaPipe 模型许可并保留 Google 署名
- [ ] 准备企业主体 + ICP 备案 + 支付资质（步骤 7 前置）
- [ ] 拟定隐私政策、用户协议、授权说明

> 执行建议：先按顺序执行步骤 1→8 跑通 MVP，再逐项推进阶段二/三。每步可独立验收、可回退，不阻塞后续。
