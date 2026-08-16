import { startCamera } from './camera.js';
import { createHandTracker, detectHands } from './handTracker.js';
import { recognizeGesture, handSpan } from './gestureRecognizer.js';
import { createParticleScene } from './particleScene.js';
import { createRecorder } from './recorder.js';
import { createSegmenter, segmentImage } from './segmenter.js';
import { initNav } from './nav.js';
import { initRouter } from './router.js';
import { initUiEffects } from './ui.js';
import defaultAudioUrl from '../zhoujielunwith.ogg';

const video = document.getElementById('webcam');
const container = document.getElementById('scene');
const hint = document.getElementById('hint');
const toggleBg = document.getElementById('toggle-bg');
const toggleRecord = document.getElementById('toggle-record');
const uploadPhotosBtn = document.getElementById('upload-photos');
const photoInput = document.getElementById('photo-input');
const uploadParticlePhotoBtn = document.getElementById('upload-particle-photo');
const particlePhotoInput = document.getElementById('particle-photo-input');
const toggleAudio = document.getElementById('toggle-audio');
const audioSelect = document.getElementById('audio-select');
const audioInput = document.getElementById('audio-input');
const resetBtn = document.getElementById('reset-state');
const restoreBtn = document.getElementById('restore-state');

// 面板元素
const panel = document.getElementById('panel');
const panelCollapse = document.getElementById('panel-collapse');
const effectModeSelect = document.getElementById('effect-mode');
const sizeFactorInput = document.getElementById('size-factor');
const speedFactorInput = document.getElementById('speed-factor');
const bloomStrengthInput = document.getElementById('bloom-strength');
const sizeVal = document.getElementById('size-val');
const speedVal = document.getElementById('speed-val');
const bloomVal = document.getElementById('bloom-val');

// 初始化顶部导航栏
initNav(document.getElementById('site-nav'));
initUiEffects();

// 初始化 hash 路由（渲染各页面视图到 #app；#/demo 展示原始粒子 Demo）
initRouter(document.getElementById('app'), { panel, hint });

let showBackground = false;
let currentEffect = 'galaxy';

const particles = createParticleScene(container, video);
const {
  renderer,
  setBackgroundVisible,
  updateCoverScale,
  setPhoto,
  setEffectMode,
  setParams,
  getParams,
  setHand,
  removeHand,
  emitTrail,
  triggerShockwave,
  setParticleImage,
  explodeParticles,
  restoreParticles,
  clearParticleImage,
  update,
  render
} = particles;

// 「免费体验」按特效切换模式：#/demo?mode=ocean 等
window.addEventListener('demo:mode', (e) => {
  const mode = e.detail;
  if (['galaxy', 'ocean', 'photoParticle'].includes(mode)) {
    effectModeSelect.value = mode;
    currentEffect = mode;
    setEffectMode(mode);
  }
});

const recorder = createRecorder(renderer.domElement);

// 初始状态：默认隐藏背景
setBackgroundVisible(showBackground);
toggleBg.textContent = showBackground ? '隐藏背景' : '显示背景';

// ============ 音频播放 ============
const audioEl = document.createElement('audio');
audioEl.loop = true;
audioEl.crossOrigin = 'anonymous';

let audioEnabled = false; // 默认关闭音乐
let currentAudioUrl = defaultAudioUrl; // 默认音频文件
let selectedAudioValue = 'default'; // 当前下拉实际选中的值
let audioCaptureStream = null; // 缓存音乐输出流，供录屏合入音频

function getAudioCaptureStream() {
  if (!audioEnabled) return null;
  if (typeof audioEl.captureStream !== 'function') return null;
  try {
    if (!audioCaptureStream) {
      audioCaptureStream = audioEl.captureStream();
    }
    return audioCaptureStream;
  } catch {
    return null;
  }
}

function startAudio() {
  audioEl.src = currentAudioUrl;
  audioEl.play().then(() => {
    toggleAudio.textContent = '关闭音乐';
    hint.textContent = '音乐播放中…';
  }).catch(() => {
    toggleAudio.textContent = '关闭音乐';
    hint.textContent = '音乐已加载，点击画面任意处开始播放（浏览器自动播放限制）';
  });
}

function stopAudio() {
  audioEl.pause();
  toggleAudio.textContent = '开启音乐';
}

function applyAudioToggle() {
  if (audioEnabled) startAudio();
  else stopAudio();
}

function switchAudio(url) {
  currentAudioUrl = url;
  if (audioEnabled) startAudio();
}

// ============ 顶部按钮 ============
toggleBg.addEventListener('click', () => {
  showBackground = !showBackground;
  setBackgroundVisible(showBackground);
  toggleBg.textContent = showBackground ? '隐藏背景' : '显示背景';
});

// ============ 录屏 ============
function saveRecording({ blob, duration }) {
  const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
  const defaultName = `录屏_${new Date().toISOString().replace(/[:.]/g, '-')}.${ext}`;
  const confirmSave = window.confirm(
    `录制完成！\n时长：${duration.toFixed(1)} 秒\n大小：${(blob.size / 1024 / 1024).toFixed(2)} MB\n\n是否保存到本地？`
  );
  if (!confirmSave) {
    hint.textContent = '已放弃保存本次录制';
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = defaultName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  hint.textContent = `已开始保存：${defaultName}`;
}

toggleRecord.addEventListener('click', async () => {
  if (recorder.isRecording()) {
    try {
      const result = await recorder.stop();
      toggleRecord.classList.remove('recording');
      toggleRecord.textContent = '开始录制';
      saveRecording(result);
    } catch (err) {
      hint.textContent = '停止录制失败：' + err.message;
    }
    return;
  }
  try {
    recorder.start(audioEnabled ? getAudioCaptureStream() : null);
    toggleRecord.classList.add('recording');
    toggleRecord.textContent = '停止录制';
    hint.textContent = audioEnabled ? '录制中（含音乐）…' : '录制中…';
  } catch (err) {
    hint.textContent = '开始录制失败：' + err.message;
  }
});

// ============ 图片：上传 + 链接 ============
let photos = [];
let photoIndex = 0;

uploadPhotosBtn.addEventListener('click', () => photoInput.click());

photoInput.addEventListener('change', async () => {
  const files = Array.from(photoInput.files || []);
  if (!files.length) return;
  hint.textContent = '正在加载图片…';
  const loaded = [];
  for (const file of files) {
    try {
      const canvas = await loadImageToCanvas(file);
      loaded.push(canvas);
    } catch {
      // 跳过
    }
  }
  photoInput.value = '';
  if (!loaded.length) {
    hint.textContent = '图片加载失败，请重试';
    return;
  }
  loaded.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
  photos = loaded;
  photoIndex = 0;
  setPhoto(photos[0].canvas);
  hint.textContent = `已加载 ${photos.length} 张图片，当前 1/${photos.length}，左手捏合切换`;
});

function loadImageToCanvas(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const maxSide = 2048;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      const scale = Math.min(1, maxSide / Math.max(w, h));
      w = Math.round(w * scale);
      h = Math.round(h * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve({ canvas, name: file.name });
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

function nextPhoto() {
  if (!photos.length) return;
  photoIndex = (photoIndex + 1) % photos.length;
  setPhoto(photos[photoIndex].canvas);
  hint.textContent = `图片 ${photoIndex + 1}/${photos.length}`;
}

// ============ 粒子图片：上传 + 识别 + 粒子化 ============
let segmenterReady = false;
let lastParticleData = null;

uploadParticlePhotoBtn.addEventListener('click', () => particlePhotoInput.click());

particlePhotoInput.addEventListener('change', async () => {
  const file = particlePhotoInput.files?.[0];
  if (!file) return;
  particlePhotoInput.value = '';

  try {
    hint.textContent = '正在识别图片主体…';
    if (!segmenterReady) {
      await createSegmenter();
      segmenterReady = true;
    }

    const { canvas } = await loadImageToCanvas(file);
    const result = segmentImage(canvas);
    const confMask = result?.confidenceMasks?.[0];
    if (!confMask) {
      hint.textContent = '未检测到清晰的人像，请上传一张人像照片';
      return;
    }

    const { positions, colors } = sampleFromMask(canvas, confMask);
    if (Math.floor(positions.length / 3) < 100) {
      hint.textContent = '未识别到明显主体，请换一张主体清晰的图片';
      return;
    }

    setParticleImage(positions, colors);
    lastParticleData = { positions, colors };
    effectModeSelect.value = 'photoParticle';
    currentEffect = 'photoParticle';
    setEffectMode('photoParticle');
    hint.textContent = '已粒子化图片主体；右手握拳=爆炸，张开=复原';
  } catch (err) {
    hint.textContent = '图片识别失败：' + err.message;
  }
});

// 粒子图片目标粒子数（高密度还原）
const PARTICLE_TARGET = 50000;

// 从分割掩码中采样粒子：主体选择（最大连通域）+ 双线性上采样到图像分辨率（软边缘 + 高保真）
function sampleFromMask(canvas, mask) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // selfie_segmenter 输出置信度掩码（float32，范围 0~1）
  const maskData = mask.getAsFloat32Array();
  const mw = mask.width;
  const mh = mask.height;
  const total = mw * mh;
  const FG_THRESHOLD = 0.5;

  // ---- 1. 连通域分析（掩码分辨率，快）：定位最大前景主体及其包围盒，过滤背景杂物 ----
  const visited = new Uint8Array(total);
  const queue = new Int32Array(total);
  let bestLen = 0;
  let minMx = mw, minMy = mh, maxMx = 0, maxMy = 0;

  for (let i = 0; i < total; i++) {
    if (maskData[i] <= FG_THRESHOLD || visited[i]) continue;

    let head = 0;
    let tail = 0;
    queue[tail++] = i;
    visited[i] = 1;
    let len = 0;
    let cMinX = mw, cMinY = mh, cMaxX = 0, cMaxY = 0;

    while (head < tail) {
      const p = queue[head++];
      len++;
      const x = p % mw;
      const y = (p / mw) | 0;
      if (x < cMinX) cMinX = x;
      if (x > cMaxX) cMaxX = x;
      if (y < cMinY) cMinY = y;
      if (y > cMaxY) cMaxY = y;

      if (x > 0 && !visited[p - 1] && maskData[p - 1] > FG_THRESHOLD) { visited[p - 1] = 1; queue[tail++] = p - 1; }
      if (x < mw - 1 && !visited[p + 1] && maskData[p + 1] > FG_THRESHOLD) { visited[p + 1] = 1; queue[tail++] = p + 1; }
      if (y > 0 && !visited[p - mw] && maskData[p - mw] > FG_THRESHOLD) { visited[p - mw] = 1; queue[tail++] = p - mw; }
      if (y < mh - 1 && !visited[p + mw] && maskData[p + mw] > FG_THRESHOLD) { visited[p + mw] = 1; queue[tail++] = p + mw; }
    }

    if (len > bestLen) {
      bestLen = len;
      minMx = cMinX; minMy = cMinY; maxMx = cMaxX; maxMy = cMaxY;
    }
  }

  if (bestLen === 0) {
    return { positions: new Float32Array(0), colors: new Float32Array(0) };
  }

  // ---- 2. 双线性上采样掩码到图像分辨率，在包围盒内按受控密度生成候选点 ----
  const toMaskX = mw / canvas.width;
  const toMaskY = mh / canvas.height;

  function confAt(ix, iy) {
    // 图像像素中心 → 掩码浮点坐标
    const mx = (ix + 0.5) * toMaskX;
    const my = (iy + 0.5) * toMaskY;
    if (mx < 0 || my < 0 || mx > mw - 1 || my > mh - 1) return 0;
    const x0 = Math.floor(mx);
    const y0 = Math.floor(my);
    const x1 = Math.min(mw - 1, x0 + 1);
    const y1 = Math.min(mh - 1, y0 + 1);
    const fx = mx - x0;
    const fy = my - y0;
    const a = maskData[y0 * mw + x0];
    const b = maskData[y0 * mw + x1];
    const c = maskData[y1 * mw + x0];
    const d = maskData[y1 * mw + x1];
    return a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy;
  }

  // 包围盒映射到图像坐标（外扩 2px 捕捉软边缘）
  const PAD = 2;
  const bx0 = Math.max(0, Math.floor((minMx / mw) * canvas.width) - PAD);
  const by0 = Math.max(0, Math.floor((minMy / mh) * canvas.height) - PAD);
  const bx1 = Math.min(canvas.width - 1, Math.ceil((maxMx / mw) * canvas.width) + PAD);
  const by1 = Math.min(canvas.height - 1, Math.ceil((maxMy / mh) * canvas.height) + PAD);
  const boxW = bx1 - bx0 + 1;
  const boxH = by1 - by0 + 1;

  // 采样网格步长：使候选点数量约为目标数的 3 倍，保证密度且避免内存膨胀
  const step = Math.max(1, Math.round(Math.sqrt((boxW * boxH) / (PARTICLE_TARGET * 3))));

  // 边缘判定偏移：约半格掩码（区分主体轮廓与内部）
  const ex = Math.max(1, Math.round(0.5 / toMaskX));
  const ey = Math.max(1, Math.round(0.5 / toMaskY));

  const inner = [];
  const edge = [];
  for (let iy = by0; iy <= by1; iy += step) {
    for (let ix = bx0; ix <= bx1; ix += step) {
      const conf = confAt(ix, iy);
      if (conf <= FG_THRESHOLD) continue;

      // 亚像素抖动，消除规则网格的栅格感
      const jx = Math.min(canvas.width - 1, Math.max(0, ix + (Math.random() - 0.5) * (step - 1)));
      const jy = Math.min(canvas.height - 1, Math.max(0, iy + (Math.random() - 0.5) * (step - 1)));
      const px = Math.round(jx);
      const py = Math.round(jy);
      const pi = (py * canvas.width + px) * 4;
      const pixel = { x: jx, y: jy, r: data[pi], g: data[pi + 1], b: data[pi + 2], conf };

      const isEdge =
        confAt(ix - ex, iy) <= FG_THRESHOLD ||
        confAt(ix + ex, iy) <= FG_THRESHOLD ||
        confAt(ix, iy - ey) <= FG_THRESHOLD ||
        confAt(ix, iy + ey) <= FG_THRESHOLD;

      if (isEdge) edge.push(pixel);
      else inner.push(pixel);
    }
  }

  // ---- 3. 采样：内部密集，边缘按置信度稀疏形成软边 ----
  const target = Math.min(PARTICLE_TARGET, inner.length + edge.length);
  const edgeTarget = Math.min(Math.floor(target * 0.3), edge.length);
  const innerTarget = Math.min(target - edgeTarget, inner.length);
  const sampled = sampleUniform(inner, innerTarget).concat(sampleConfidence(edge, edgeTarget));

  // ---- 4. contain 缩放，保持原图比例并居中 ----
  const imgAspect = canvas.width / canvas.height;
  const viewW = container.clientWidth || window.innerWidth;
  const viewH = container.clientHeight || window.innerHeight;
  const viewAspect = viewW / viewH;
  let scaleX;
  let scaleY;
  if (viewAspect >= imgAspect) {
    scaleX = imgAspect / viewAspect;
    scaleY = 1;
  } else {
    scaleX = 1;
    scaleY = viewAspect / imgAspect;
  }

  const positions = new Float32Array(sampled.length * 3);
  const colors = new Float32Array(sampled.length * 3);
  for (let i = 0; i < sampled.length; i++) {
    const p = sampled[i];
    positions[i * 3] = ((p.x / canvas.width) * 2 - 1) * scaleX;
    positions[i * 3 + 1] = -((p.y / canvas.height) * 2 - 1) * scaleY;
    positions[i * 3 + 2] = 0;
    colors[i * 3] = p.r / 255;
    colors[i * 3 + 1] = p.g / 255;
    colors[i * 3 + 2] = p.b / 255;
  }

  return { positions, colors };
}

// 均匀采样 cnt 个元素
function sampleUniform(arr, cnt) {
  if (cnt <= 0) return [];
  if (cnt >= arr.length) return arr.slice();
  const ratio = arr.length / cnt;
  const out = [];
  for (let i = 0; i < cnt; i++) {
    out.push(arr[Math.floor(i * ratio)]);
  }
  return out;
}

// 按置信度加权采样：置信度越高越优先，边缘稀疏形成软过渡
// 使用前缀和 + 二分查找，O(cnt·log n)，避免大候选集时 O(cnt·n) 卡顿
function sampleConfidence(arr, cnt) {
  if (cnt <= 0) return [];
  if (cnt >= arr.length) return arr.slice();

  // 计算权重与前缀和
  const prefix = new Float64Array(arr.length);
  let totalWeight = 0;
  for (let i = 0; i < arr.length; i++) {
    totalWeight += arr[i].conf * arr[i].conf + 0.01;
    prefix[i] = totalWeight;
  }

  const used = new Set();
  const out = [];
  let guard = 0;
  while (out.length < cnt && used.size < arr.length && guard++ < cnt * 64) {
    const r = Math.random() * totalWeight;
    let lo = 0;
    let hi = arr.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (prefix[mid] < r) lo = mid + 1;
      else hi = mid;
    }
    const idx = lo;
    if (!used.has(idx)) {
      used.add(idx);
      out.push(arr[idx]);
    }
  }
  return out;
}

// ============ 音乐开关 + 下拉选择 ============
toggleAudio.addEventListener('click', () => {
  audioEnabled = !audioEnabled;
  applyAudioToggle();
  if (!audioEnabled) hint.textContent = '音乐已关闭';
});

audioSelect.addEventListener('change', () => {
  const value = audioSelect.value;
  if (value === '__upload__') {
    // 触发文件选择框；选择框保持当前实际音频不变
    audioSelect.value = selectedAudioValue;
    audioInput.click();
    return;
  }
  selectedAudioValue = value;
  if (value === 'default') {
    switchAudio(defaultAudioUrl);
  } else if (value === 'uploaded-0') {
    // 已上传音频：currentAudioUrl 在上传时已设置
    switchAudio(optionUrls[value]);
  }
  hint.textContent = '音乐已切换到所选音频';
});

// 记录上传音频对应的 objectURL
const optionUrls = {};

audioInput.addEventListener('change', () => {
  const file = audioInput.files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);

  const value = 'uploaded-0';
  // 释放上一个上传音频的 objectURL，避免内存泄漏
  if (optionUrls[value] && optionUrls[value] !== currentAudioUrl) {
    URL.revokeObjectURL(optionUrls[value]);
  }
  optionUrls[value] = url;
  selectedAudioValue = value;
  currentAudioUrl = url;

  // 更新下拉选项：确保上传音频可被选中并显示文件名
  if (!audioSelect.querySelector(`option[value="${value}"]`)) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = `上传：${file.name}`;
    audioSelect.appendChild(option);
  } else {
    audioSelect.querySelector(`option[value="${value}"]`).textContent = `上传：${file.name}`;
  }
  audioSelect.value = value;

  if (audioEnabled) startAudio();
  hint.textContent = `已上传音频：${file.name}`;
});

// ============ 参数面板：同一按钮切换展开/收起 ============
function togglePanelVisibility() {
  const collapsed = panel.classList.toggle('collapsed');
  panelCollapse.textContent = collapsed ? '▶' : '收起';
}
panelCollapse.addEventListener('click', (e) => {
  e.stopPropagation();
  togglePanelVisibility();
});
panel.querySelector('.panel-header').addEventListener('click', togglePanelVisibility);

effectModeSelect.addEventListener('change', () => {
  const mode = effectModeSelect.value;
  currentEffect = mode;
  setEffectMode(mode);
  if (mode === 'ocean') {
    hint.textContent = '已切换：海水潮流粒子';
  } else if (mode === 'photoParticle') {
    hint.textContent = '已切换：粒子图片模式（请点击「粒子图片」上传图片，右手握拳=爆炸，张开=复原）';
  } else {
    hint.textContent = '已切换：宇宙星系粒子';
  }
});

function bindRange(input, valEl, key) {
  const apply = () => {
    const value = parseFloat(input.value);
    valEl.textContent = value.toFixed(1);
    setParams({ [key]: value });
  };
  input.addEventListener('input', apply);
  apply();
}
bindRange(sizeFactorInput, sizeVal, 'sizeFactor');
bindRange(speedFactorInput, speedVal, 'speedFactor');
bindRange(bloomStrengthInput, bloomVal, 'bloomStrength');

// ============ 重置 / 还原 ============
let restoreSnapshot = null;
let resetCount = 0;
let lastResetTime = 0;
const RESET_WINDOW = 2000; // 2 秒内连续点击算连续

function captureSnapshot() {
  return {
    effectMode: effectModeSelect.value,
    currentEffect,
    sizeFactor: sizeFactorInput.value,
    speedFactor: speedFactorInput.value,
    bloomStrength: bloomStrengthInput.value,
    showBackground,
    photos: photos.slice(),
    photoIndex,
    lastParticleData: lastParticleData
      ? {
          positions: lastParticleData.positions.slice(),
          colors: lastParticleData.colors.slice()
        }
      : null
  };
}

function applyDefaultState() {
  effectModeSelect.value = 'galaxy';
  currentEffect = 'galaxy';
  setEffectMode('galaxy');

  sizeFactorInput.value = '1';
  speedFactorInput.value = '1';
  bloomStrengthInput.value = '0.7';
  sizeVal.textContent = '1.0';
  speedVal.textContent = '1.0';
  bloomVal.textContent = '0.7';
  setParams({ sizeFactor: 1, speedFactor: 1, bloomStrength: 0.7 });

  showBackground = false;
  setBackgroundVisible(false);
  toggleBg.textContent = '显示背景';

  photos = [];
  photoIndex = 0;
  setPhoto(null);

  clearParticleImage();
  lastParticleData = null;
}

function applySnapshot(snap) {
  // 先恢复粒子图片数据
  if (snap.lastParticleData) {
    lastParticleData = {
      positions: snap.lastParticleData.positions,
      colors: snap.lastParticleData.colors
    };
    setParticleImage(lastParticleData.positions, lastParticleData.colors);
  } else {
    lastParticleData = null;
    clearParticleImage();
  }

  // 恢复模式（setEffectMode 会正确控制各层显隐）
  effectModeSelect.value = snap.effectMode;
  currentEffect = snap.currentEffect;
  setEffectMode(snap.currentEffect);

  // 恢复参数
  sizeFactorInput.value = snap.sizeFactor;
  speedFactorInput.value = snap.speedFactor;
  bloomStrengthInput.value = snap.bloomStrength;
  sizeVal.textContent = parseFloat(snap.sizeFactor).toFixed(1);
  speedVal.textContent = parseFloat(snap.speedFactor).toFixed(1);
  bloomVal.textContent = parseFloat(snap.bloomStrength).toFixed(1);
  setParams({
    sizeFactor: parseFloat(snap.sizeFactor),
    speedFactor: parseFloat(snap.speedFactor),
    bloomStrength: parseFloat(snap.bloomStrength)
  });

  // 恢复背景
  showBackground = snap.showBackground;
  setBackgroundVisible(snap.showBackground);
  toggleBg.textContent = snap.showBackground ? '隐藏背景' : '显示背景';

  // 恢复图片列表
  photos = snap.photos.slice();
  photoIndex = snap.photoIndex;
  if (photos.length) {
    setPhoto(photos[Math.min(photoIndex, photos.length - 1)].canvas);
  } else {
    setPhoto(null);
  }
}

resetBtn.addEventListener('click', () => {
  const now = Date.now();
  if (now - lastResetTime > RESET_WINDOW) {
    resetCount = 0;
  }
  lastResetTime = now;

  if (resetCount === 0) {
    restoreSnapshot = captureSnapshot();
    restoreBtn.disabled = false;
  }

  applyDefaultState();
  resetCount++;

  if (resetCount >= 3) {
    restoreSnapshot = null;
    restoreBtn.disabled = true;
    hint.textContent = '已连续重置 3 次，还原功能已失效';
  } else {
    hint.textContent = '已重置为默认状态，可点击「还原」恢复';
  }
});

restoreBtn.addEventListener('click', () => {
  if (!restoreSnapshot) {
    hint.textContent = '当前无可还原内容';
    return;
  }
  applySnapshot(restoreSnapshot);
  restoreSnapshot = null;
  restoreBtn.disabled = true;
  resetCount = 0;
  hint.textContent = '已还原到重置前状态';
});

// ============ 坐标转换 ============
const toSceneX = (x) => (0.5 - x) * 2;
const toSceneY = (y) => -(y - 0.5) * 2;

// ============ 右手：控制粒子 ============
const rightHandState = { prevTipX: null, prevTipY: null, prevGesture: null };

function handleParticleHand(landmarks) {
  // 粒子图片模式：右手单独控制爆炸/复原
  if (currentEffect === 'photoParticle') {
    const gesture = recognizeGesture(landmarks);
    if (gesture === 'GRAB') explodeParticles();
    else if (gesture === 'OPEN') restoreParticles();
    return;
  }

  const handCenter = landmarks[9];
  const fingerTip = landmarks[8];
  const gesture = recognizeGesture(landmarks);
  const span = handSpan(landmarks);

  const cx = toSceneX(handCenter.x);
  const cy = toSceneY(handCenter.y);
  const tx = toSceneX(fingerTip.x);
  const ty = toSceneY(fingerTip.y);

  setHand(0, cx, cy, span, gesture);

  if (rightHandState.prevTipX !== null) {
    const dx = tx - rightHandState.prevTipX;
    const dy = ty - rightHandState.prevTipY;
    if (Math.hypot(dx, dy) > 0.012) {
      emitTrail(tx, ty, dx, dy);
    }
    if (gesture === 'GRAB' && rightHandState.prevGesture !== 'GRAB') {
      triggerShockwave(cx, cy);
    }
  }
  rightHandState.prevTipX = tx;
  rightHandState.prevTipY = ty;
  rightHandState.prevGesture = gesture;
}

// ============ 左手：切换图片（捏合） ============
const leftHandState = { wasPinching: false, lastPinchTime: 0 };
const PINCH_COOLDOWN = 500;

function handlePhotoHand(landmarks, now) {
  const gesture = recognizeGesture(landmarks);
  const isPinching = gesture === 'PINCH';
  if (isPinching && !leftHandState.wasPinching) {
    if (now - leftHandState.lastPinchTime > PINCH_COOLDOWN) {
      nextPhoto();
      leftHandState.lastPinchTime = now;
    }
  }
  leftHandState.wasPinching = isPinching;
}

// ============ 手势派发 ============
function dispatchHands(hands, handednesses, now) {
  // 粒子图片模式：任意一只手都用于控制爆炸/复原。
  // 前置摄像头为镜像画面，MediaPipe 的 handedness 会把右手的用户误判为 Left，
  // 若仍按左右手派发，手势会被错误地当成「左手切图」而失效。
  if (currentEffect === 'photoParticle') {
    const anyHand = hands[0] || null;
    if (anyHand) {
      handleParticleHand(anyHand);
    }
    return;
  }

  let rightLandmarks = null;
  let leftLandmarks = null;
  for (let i = 0; i < hands.length; i++) {
    const label = handednesses?.[i]?.[0]?.categoryName;
    if (label === 'Right') rightLandmarks = hands[i];
    else if (label === 'Left') leftLandmarks = hands[i];
    else if (!rightLandmarks) rightLandmarks = hands[i];
  }

  if (rightLandmarks) {
    handleParticleHand(rightLandmarks);
  } else {
    removeHand(0);
    rightHandState.prevTipX = null;
    rightHandState.prevTipY = null;
    rightHandState.prevGesture = null;
  }

  if (leftLandmarks) {
    handlePhotoHand(leftLandmarks, now);
  } else {
    leftHandState.wasPinching = false;
  }
}

// ============ 按需启动：仅进入 #/demo 时才启动摄像头与渲染循环 ============
let demoStarted = false;
let rafId = null;

async function startDemo() {
  if (demoStarted) return;
  try {
    await createHandTracker();
    await startCamera(video);
    updateCoverScale();
    hint.textContent =
      '右手：张开=星系 / 划动=光带 / 握拳=冲击波；左手：捏合切换图片';
    demoStarted = true;
  } catch (err) {
    hint.textContent = '初始化失败：' + err.message;
    return;
  }

  let lastVideoTime = -1;
  let lastFrameTime = performance.now();

  function animate() {
    const now = performance.now();
    const dt = Math.min(0.05, (now - lastFrameTime) / 1000);
    lastFrameTime = now;
    const time = now / 1000;

    if (video.currentTime !== lastVideoTime) {
      lastVideoTime = video.currentTime;
      const result = detectHands(video, now);
      const hands = result?.landmarks ?? [];
      const handednesses = result?.handedness ?? null;
      dispatchHands(hands, handednesses, now);
    }

    update(dt, time);
    render();
    rafId = requestAnimationFrame(animate);
  }
  rafId = requestAnimationFrame(animate);
}

function stopDemo() {
  if (rafId != null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  // 释放摄像头，避免后台持续占用与隐私顾虑
  if (video.srcObject) {
    video.srcObject.getTracks().forEach((track) => track.stop());
    video.srcObject = null;
  }
  demoStarted = false;
}

function syncDemo() {
  const isDemo = location.hash.replace(/^#/, '').split('?')[0] === '/demo';
  if (isDemo) startDemo();
  else stopDemo();
}

window.addEventListener('hashchange', syncDemo);
syncDemo();
