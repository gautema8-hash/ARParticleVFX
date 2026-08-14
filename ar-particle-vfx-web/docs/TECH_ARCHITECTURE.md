# AR 手势粒子交互 - 技术架构文档

## 一、文档说明

本文档描述「基于 Web 摄像头的手势 AR 粒子交互」项目的技术架构，包括整体架构、模块划分、数据流、技术栈选型依据、目录结构等，供开发与评审使用。

---

## 二、架构目标

1. **纯 Web 实现**：无需安装任何客户端，浏览器打开即用。
2. **实时交互**：摄像头采集 → 手势识别 → 粒子渲染全链路延迟 < 100ms。
3. **高性能**：支持 5000+ 粒子、≥30FPS、1~2 只手实时跟踪。
4. **可扩展**：模块解耦，便于后续增加手势类型、粒子物理、双手协同等特性。
5. **易部署**：静态站点即可运行，仅依赖 HTTPS 安全上下文。

---

## 三、技术栈选型

| 层次 | 技术方案 | 版本 | 选型依据 |
| --- | --- | --- | --- |
| 摄像头采集 | WebRTC `getUserMedia` | 浏览器原生 | 无需插件，跨平台 |
| 手势识别 | MediaPipe Tasks Vision | ^0.10.0 | 21 个手部关键点，GPU 加速，官方维护 |
| 3D 渲染 | Three.js | ^0.160.0 | 生态完善，Shader 灵活，粒子性能优 |
| 着色器 | GLSL (ShaderMaterial) | — | 自定义发光粒子效果 |
| 构建工具 | Vite | ^5.0.0 | 快速冷启动，ES Module 原生支持 |
| 运行时 | 浏览器 (Chrome/Edge) | 最新 | 支持 WebGL2 + WebRTC |

### 技术选型替代方案

| 方案 | 优点 | 缺点 | 结论 |
| --- | --- | --- | --- |
| MediaPipe | GPU 加速、精度高、前端友好 | 模型文件较大 | ✅ 采用 |
| TensorFlow.js Handpose | 轻量 | 精度低、维护少 | 备选 |
| 自研手势算法 | 无依赖 | 精度与鲁棒性难保证 | 不采用 |

---

## 四、整体架构

```
┌────────────────────────────────────────────────────────────┐
│                          浏览器页面                          │
│                                                              │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │  摄像头采集层  │───▶│  手势识别层    │───▶│  手势状态机     │  │
│  │  camera.js   │    │ handTracker.js│    │ gestureRe-     │  │
│  │ getUserMedia │    │ MediaPipe     │    │ cognizer.js    │  │
│  │  <video>     │    │ HandLandmarker│    │ PINCH/GRAB/    │  │
│  └─────────────┘    └──────┬───────┘    │ OPEN/NONE      │  │
│                            │ 21关键点    └───────┬───────┘  │
│                            │                     │ gesture │
│                            ▼                     ▼        │
│                     ┌──────────────────────────────────┐   │
│                     │        粒子渲染层 (Three.js)       │   │
│                     │  particleScene.js                │   │
│                     │  Points + ShaderMaterial +       │   │
│                     │  AdditiveBlending                │   │
│                     └──────────────┬───────────────────┘   │
│                                    │                        │
│                     ┌──────────────▼───────────────────┐   │
│                     │   主循环 main.js (RAF 驱动)       │   │
│                     │  detectForVideo → modifyParticles│   │
│                     │  → updateParticles → render      │   │
│                     └──────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

---

## 五、模块划分与职责

### 5.1 camera.js - 摄像头采集层

**职责**：申请摄像头权限，获取视频流，挂载到 `<video>` 元素。

**接口**：
```js
startCamera(videoEl) → Promise<MediaStream>
```

**关键点**：
- 请求 1280x720/30fps 前置摄像头
- 浏览器兼容检测与异常处理

### 5.2 handTracker.js - 手势识别层

**职责**：初始化 MediaPipe HandLandmarker，对视频帧执行关键点检测。

**接口**：
```js
createHandTracker() → Promise<HandLandmarker>
detectHands(videoEl, startTimeMs) → HandLandmarkerResult
```

**输出**：每只手 21 个关键点（x, y, z 归一化坐标）。

**关键点**：
- `delegate: 'GPU'`，失败回退 CPU
- `runtimeMode: 'VIDEO'`，用时间戳对齐视频帧
- wasm 本地化，规避 CDN 风险

### 5.3 gestureRecognizer.js - 手势状态机

**职责**：根据 21 个关键点几何关系判定手势。

**接口**：
```js
recognizeGesture(landmarks) → 'PINCH' | 'GRAB' | 'OPEN' | 'NONE'
```

**判定逻辑**：
- 捏合 PINCH：拇指尖(4)与食指尖(8)距离 < 0.04
- 抓握 GRAB：≥4 个指尖比 PIP 关节更靠近手腕(0)
- 张开 OPEN：≥4 个指尖距手腕 > 0.35

### 5.4 particleScene.js - 粒子渲染层

**职责**：创建 Three.js 场景、正交相机、粒子系统与发光着色器。

**接口**：
```js
createParticleScene(container, count) → {
  scene, camera, renderer, points,
  positions: Float32Array, velocities: Float32Array, count
}
```

**关键点**：
- `OrthographicCamera` 配合归一化坐标，简化映射
- 自定义 ShaderMaterial：圆形柔和发光粒子
- `AdditiveBlending` + `depthWrite:false` 优化性能
- 粒子位置/速度用 `Float32Array` 存储，便于主循环更新

### 5.5 main.js - 主循环

**职责**：串联各模块，驱动每帧的检测、粒子更新与渲染。

**核心流程**：
```
requestAnimationFrame(animate)
  ├─ detectForVideo(video, now)      # 手势检测（按视频帧节流）
  ├─ recognizeGesture(landmark)      # 手势判定
  ├─ modifyParticles(center, gesture) # 手势驱动粒子
  ├─ updateParticles()               # 粒子物理更新
  └─ renderer.render(scene, camera)  # 渲染
```

---

## 六、核心数据流

```
摄像头视频帧
    │
    ▼
HandLandmarker.detectForVideo()
    │
    ▼
result.landmarks[handIndex][21]   // 每手 21 个关键点 {x,y,z}
    │
    ▼
recognizeGesture(landmarks)       // 手势类型
    │
    ├─ handCenter = landmarks[9]  // 中指根作为参考点
    │
    ▼
modifyParticles(handCenter, gesture)
    │   坐标映射：归一化(0~1) → 场景(-1~1)，Y 轴翻转
    │   手势差异：
    │     OPEN  → 粒子向手吸引
    │     PINCH → 粒子强汇聚
    │     GRAB  → 粒子漩涡
    │
    ▼
updateParticles()                 // position += velocity，带阻尼
    │
    ▼
renderer.render()                 // WebGL 绘制
```

---

## 七、坐标系统与映射

| 坐标空间 | 范围 | 说明 |
| --- | --- | --- |
| MediaPipe 关键点 | x,y ∈ [0,1]，z 为深度相对量 | 归一化到视频帧 |
| Three.js 场景 | x,y ∈ [-1,1]，z=0 | 正交相机 |
| 映射公式 | `sceneX = (x - 0.5) * 2`；`sceneY = -(y - 0.5) * 2` | Y 轴翻转（图像坐标→3D坐标） |

---

## 八、性能设计

| 优化点 | 具体措施 |
| --- | --- |
| 检测节流 | 仅在 `video.currentTime` 变化时执行检测，避免重复算 |
| GPU 加速 | MediaPipe `delegate:'GPU'` |
| 粒子渲染 | Float32Array 直写 + `needsUpdate`，零拷贝更新 |
| 渲染管线 | `AdditiveBlending` + `depthWrite:false`，跳过深度排序 |
| 像素比 | `Math.min(devicePixelRatio, 2)`，避免高分屏过重 |
| 降级策略 | GPU 失败→CPU；WebGL 失败→Canvas 2D；摄像头失败→鼠标 |

---

## 九、目录结构（规划）

```
demo001/
├── readme.md                  # 项目总体方案说明
├── TECH_ARCHITECTURE.md       # 本文档：技术架构
├── ENVIRONMENT.md             # 本机环境说明
├── FEASIBILITY_ANALYSIS.md    # 可行性分析
├── REQUIREMENTS.md            # 落地需求
├── EXECUTION_PLAN.md          # 分步执行计划
├── package.json
├── vite.config.js
├── index.html
├── public/
│   ├── hand_landmarker.task   # 手势模型（约 7.45MB）
│   └── wasm/                  # MediaPipe wasm（本地化）
└── src/
    ├── main.js
    ├── camera.js
    ├── handTracker.js
    ├── gestureRecognizer.js
    ├── particleScene.js
    └── style.css
```

---

## 十、安全与约束

1. **安全上下文**：`getUserMedia` 强制要求 HTTPS 或 localhost。
2. **摄像头权限**：需用户显式授权，拒绝后需引导开启。
3. **模型资源**：`hand_landmarker.task` 约 7.45MB，需本地托管避免外网依赖。
4. **wasm 资源**：本地化到 `public/wasm`，避免 CDN 不可用风险。

---

## 十一、扩展性规划

| 扩展方向 | 架构预留 |
| --- | --- |
| 新增手势 | 扩展 `gestureRecognizer.js` 增加判定分支 |
| 粒子物理 | 在 `modifyParticles` 增加引力/碰撞/阻尼模型 |
| 双手协同 | `detectHands` 已支持 `numHands:2`，主循环遍历多手 |
| 深度伪 3D | 利用关键点 z 值映射粒子 z 轴 |
| 移动端 | 自适应粒子数 + 像素比 + 检测频率 |