# AR 手势粒子交互 - 本机电脑环境文档

## 一、文档说明

本文档记录开发/部署本机（用于运行「AR 手势粒子交互」项目的电脑）的实际环境配置，作为环境参考与问题排查依据。数据采集时间：2026-08-13。

---

## 二、硬件配置

| 项目 | 配置 | 说明 |
| --- | --- | --- |
| CPU | Intel(R) Core(TM) Ultra 9 285H | 多核高性能处理器 |
| 内存 | 32 GB (33820106752 字节) | 远超项目需求（≥4GB 即可） |
| GPU | Intel(R) Arc(TM) 140T GPU (16GB) | 支持 WebGL2，可跑 MediaPipe GPU 加速 |
| 虚拟显示适配器 | GameViewer Virtual Display Adapter | 远程显示 |
| 虚拟显示适配器 | OrayIddDriver Device | 虚拟显示器驱动 |
| 网络摄像头 | 需前置/外置摄像头 | 用于手势采集 |

> 注：本机存在两个虚拟显示适配器（GameViewer、OrayIdd），可能用于远程桌面场景。若摄像头采集异常，需确认摄像头未被远程会话独占。

---

## 三、操作系统

| 项目 | 值 |
| --- | --- |
| 操作系统 | Microsoft Windows 11 家庭版 中文版 |
| 版本 | 10.0.26200 |
| 架构 | x64 |

---

## 四、开发环境

| 项目 | 值 | 是否满足要求 |
| --- | --- | --- |
| Node.js | v24.10.0 | ✅（要求 ≥ v18） |
| npm | 11.6.1 | ✅（要求 ≥ v9） |
| 默认 Shell | Windows PowerShell 5.1 | ⚠️ 命令需用 PowerShell 语法 |
| IDE | Visual Studio Code | ✅ |
| 浏览器 | Chrome / Edge | ✅ 最新版支持 WebGL2 + WebRTC |

### 默认终端说明

本机默认终端为 **Windows PowerShell 5.1**，编写命令时需注意：

| 事项 | 说明 |
| --- | --- |
| 命令分隔符 | 用 `;` 分隔（而非 `&&`） |
| curl | 必须写 `curl.exe`（默认 `curl` 是 Invoke-WebRequest 别名，参数不兼容） |
| 目录创建 | 用 `New-Item -ItemType Directory -Force <path>` |
| 文件复制 | 用 `Copy-Item -Recurse -Force <src> <dst>` |

---

## 五、网络环境

| 项目 | 值 | 结论 |
| --- | --- | --- |
| npm registry | `https://registry.npmmirror.com` | ✅ 国内镜像，装依赖快 |
| npm proxy | 无 | ✅ |
| npm https-proxy | 无 | ✅ |
| 模型下载源 | storage.googleapis.com | ✅ 实测 HTTP 200 可达 |
| jsdelivr CDN | cdn.jsdelivr.net | ⚠️ 目录 HEAD 404，具体 wasm 文件 200 |

### 网络可达性实测

| 资源 | HTTP 状态 | 说明 |
| --- | --- | --- |
| registry.npmmirror.com | 200 | npm 源可用 |
| storage.googleapis.com/hand_landmarker.task | 200 | 模型可下载（约 7.45MB） |
| cdn.jsdelivr.net wasm 文件 | 200 | 具体文件可达 |
| cdn.jsdelivr.net wasm 目录 | 404 | 目录不可直接访问 |

**结论**：npm 依赖安装、模型下载、wasm 获取均无障碍；建议将 wasm 本地化以彻底规避 CDN 不确定性。

---

## 六、环境满足度评估

| 需求项 | 最低要求 | 本机实际 | 满足度 |
| --- | --- | --- | --- |
| 操作系统 | Windows/macOS/Linux | Windows 11 | ✅ |
| 浏览器 | 最新 Chrome/Edge | 最新版 | ✅ |
| Node.js | ≥ v18 | v24.10.0 | ✅ 超额 |
| npm | ≥ v9 | 11.6.1 | ✅ 超额 |
| 内存 | ≥ 4GB | 32GB | ✅ 超额 |
| GPU（可选） | WebGL2 支持 | Intel Arc 140T 16GB | ✅ |
| 摄像头 | 1 个可用 | 需确认 | ⚠️ 需实测 |
| 网络 | 可访问 npm + 模型源 | 均可达 | ✅ |

---

## 七、潜在风险与注意事项

1. **虚拟显示器干扰**：本机装有两个虚拟显示适配器（GameViewer、OrayIdd），若通过远程桌面访问，摄像头可能被宿主会话占用，需在物理机上运行浏览器。

2. **摄像头可用性**：本机是否有物理摄像头尚未实测；若无，需外接 USB 摄像头，否则只能降级为鼠标交互。

3. **浏览器选择**：建议使用 Chrome 或 Edge，二者均完整支持 WebRTC 和 WebGL2，并支持 MediaPipe WebGPU/WebGL 后端。

4. **远程访问限制**：getUserMedia 在 localhost 或 HTTPS 下才能工作；若通过远程 IP 访问，需配置 HTTPS。

---

## 八、建议的本地运行方式

```powershell
cd d:/sofa/aiproject/demo001
npm install
npm run dev
# 在物理机的 Chrome/Edge 中打开 http://localhost:5173
```

> 关键：在**物理机浏览器**中打开 localhost 地址，而非远程桌面会话内，以确保摄像头权限正常工作。