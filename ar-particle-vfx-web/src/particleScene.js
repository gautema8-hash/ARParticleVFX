import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// 配色：深空藏蓝 / 电光紫 / 青蓝荧光 / 暖金
const C = {
  deepBlue: new THREE.Color(0x141a3a),
  purple: new THREE.Color(0x8b5cf6),
  electricPurple: new THREE.Color(0xa855f7),
  cyan: new THREE.Color(0x22d3ee),
  blue: new THREE.Color(0x38bdf8),
  gold: new THREE.Color(0xfbbf24),
  warmGold: new THREE.Color(0xf59e0b),
  white: new THREE.Color(0xffffff)
};

function gaussianRandom() {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

export function createParticleScene(container, videoEl) {
  const _tmpColor = new THREE.Color();

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    preserveDrawingBuffer: true // 录屏必需
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  // ---- 光照（星球体立体感） ----
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(0.5, 0.8, 1);
  scene.add(dirLight);

  // ---- 视频背景（合入 WebGL，实现 AR 实景叠加） ----
  const videoTexture = new THREE.VideoTexture(videoEl);
  videoTexture.colorSpace = THREE.SRGBColorSpace;
  videoTexture.minFilter = THREE.LinearFilter;
  videoTexture.magFilter = THREE.LinearFilter;

  const bgUniforms = { map: { value: videoTexture }, uvScale: { value: 1.0 } };
  function updateCoverScale() {
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const viewportAspect = width / height;
    const vw = videoEl.videoWidth || 1280;
    const vh = videoEl.videoHeight || 720;
    const videoAspect = vw / vh;
    bgUniforms.uvScale.value =
      viewportAspect / videoAspect > 1
        ? viewportAspect / videoAspect
        : videoAspect / viewportAspect;
  }
  updateCoverScale();

  const bgMaterial = new THREE.ShaderMaterial({
    uniforms: bgUniforms,
    depthTest: false,
    depthWrite: false,
    fog: false,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D map;
      uniform float uvScale;
      varying vec2 vUv;
      void main() {
        vec2 uv = vec2(1.0 - vUv.x, vUv.y);
        uv = (uv - 0.5) * uvScale + 0.5;
        gl_FragColor = texture2D(map, uv);
      }
    `
  });
  const backgroundPlane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMaterial);
  backgroundPlane.position.z = -2;
  backgroundPlane.renderOrder = -2;
  scene.add(backgroundPlane);

  // ---- 上传图片展示层（独立场景，不经 bloom，保证原图无曝光） ----
  const photoScene = new THREE.Scene();
  const photoUniforms = { map: { value: null } };
  const photoMaterial = new THREE.ShaderMaterial({
    uniforms: photoUniforms,
    depthTest: false,
    depthWrite: false,
    fog: false,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D map;
      varying vec2 vUv;
      void main() {
        gl_FragColor = texture2D(map, vUv);
      }
    `
  });
  const photoPlane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), photoMaterial);
  photoPlane.position.z = 0;
  photoPlane.visible = false;
  photoScene.add(photoPlane);
  let photoTexture = null;

  function setPhoto(canvas) {
    if (photoTexture) {
      photoTexture.dispose();
      photoTexture = null;
    }
    if (!canvas) {
      photoPlane.visible = false;
      photoUniforms.map.value = null;
      return;
    }
    photoTexture = new THREE.CanvasTexture(canvas);
    photoTexture.colorSpace = THREE.SRGBColorSpace;
    photoTexture.minFilter = THREE.LinearFilter;
    photoTexture.magFilter = THREE.LinearFilter;
    photoUniforms.map.value = photoTexture;

    // 按原比例居中完整展示（contain），不裁剪、不变形
    const imgAspect = canvas.width / canvas.height;
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    const viewAspect = w / h;

    let scaleX;
    let scaleY;
    if (viewAspect >= imgAspect) {
      // 图片相对更高：高度铺满，宽度按比例缩小
      scaleX = imgAspect / viewAspect;
      scaleY = 1;
    } else {
      // 图片相对更宽：宽度铺满，高度按比例缩小
      scaleX = 1;
      scaleY = viewAspect / imgAspect;
    }
    const shrink = 0.65; // 图片整体缩小，占屏幕约 65%
    photoPlane.scale.set(scaleX * shrink, scaleY * shrink, 1);

    photoPlane.rotation.z = 0; // 方正展示，不倾斜

    photoPlane.visible = true;
  }

  // ---- Bloom 后处理（柔光 + 强烈镜头光晕） ----
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(container.clientWidth, container.clientHeight),
    0.7, // strength：降低，避免图片亮部过曝
    0.6, // radius
    0.88 // threshold：提高，仅粒子高亮区触发 bloom，图片不过曝
  );
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());

  // ---- 通用粒子构造器 ----
  function makePoints(positions, attrs, shaders, uniforms, blending = THREE.AdditiveBlending, transparent = true) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    for (const key in attrs) {
      const def = attrs[key];
      geometry.setAttribute(key, new THREE.BufferAttribute(def.array, def.itemSize));
    }
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: shaders.vertex,
      fragmentShader: shaders.fragment,
      transparent,
      depthWrite: false,
      blending
    });
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    return { geometry, material, points };
  }

  // 各层引用（在下方代码块中赋值）
  let backgroundStars;
  let nebula;
  let starLayer;
  let trailLayer;
  let oceanLayer;

  // 特效模式与可调参数
  let effectMode = 'galaxy'; // 'galaxy' | 'ocean'
  const params = { sizeFactor: 1, speedFactor: 1, bloomStrength: 0.7 };

  // ============ 1. 远景稀疏星点（最远层，轻微闪烁） ============
  {
    const BG_COUNT = 1100;
    const positions = new Float32Array(BG_COUNT * 3);
    const aColor = new Float32Array(BG_COUNT * 3);
    const aScale = new Float32Array(BG_COUNT);
    const aTwinkle = new Float32Array(BG_COUNT);
    const aTwinkleSpeed = new Float32Array(BG_COUNT);
    for (let i = 0; i < BG_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2.6;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2.6;
      positions[i * 3 + 2] = -1.5 - Math.random() * 1.5;
      const col = Math.random() < 0.75 ? C.white : C.blue;
      aColor[i * 3] = col.r * (0.5 + Math.random() * 0.5);
      aColor[i * 3 + 1] = col.g * (0.5 + Math.random() * 0.5);
      aColor[i * 3 + 2] = col.b * (0.5 + Math.random() * 0.5);
      aScale[i] = 0.4 + Math.random() * 1.2;
      aTwinkle[i] = Math.random() * Math.PI * 2;
      aTwinkleSpeed[i] = 0.4 + Math.random() * 1.6;
    }
    backgroundStars = makePoints(
      positions,
      {
        aColor: { array: aColor, itemSize: 3 },
        aScale: { array: aScale, itemSize: 1 },
        aTwinkle: { array: aTwinkle, itemSize: 1 },
        aTwinkleSpeed: { array: aTwinkleSpeed, itemSize: 1 }
      },
      {
        vertex: `
          attribute vec3 aColor;
          attribute float aScale;
          attribute float aTwinkle;
          attribute float aTwinkleSpeed;
          uniform float uTime;
          uniform float uSize;
          varying vec3 vColor;
          varying float vAlpha;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            float tw = 0.55 + 0.45 * sin(uTime * aTwinkleSpeed + aTwinkle);
            gl_PointSize = uSize * aScale * tw * (1.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
            vColor = aColor;
            vAlpha = tw;
          }
        `,
        fragment: `
          varying vec3 vColor;
          varying float vAlpha;
          void main() {
            float d = distance(gl_PointCoord, vec2(0.5));
            float alpha = 1.0 - smoothstep(0.0, 0.5, d);
            gl_FragColor = vec4(vColor, alpha * vAlpha);
          }
        `
      },
      { uTime: { value: 0 }, uSize: { value: 6.0 } }
    );
    scene.add(backgroundStars.points);
  }

  // ============ 2. 星云气态云团（半透明流体，缓慢扩散） ============
  {
    const NEBULA_COUNT = 420;
    const nebulaVel = new Float32Array(NEBULA_COUNT * 3);
    const positions = new Float32Array(NEBULA_COUNT * 3);
    const aColor = new Float32Array(NEBULA_COUNT * 3);
    const aScale = new Float32Array(NEBULA_COUNT);
    for (let i = 0; i < NEBULA_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2.2;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 1.8;
      positions[i * 3 + 2] = -0.6 - Math.random() * 0.8;
      const col = Math.random() < 0.5 ? C.purple : C.deepBlue;
      aColor[i * 3] = col.r;
      aColor[i * 3 + 1] = col.g;
      aColor[i * 3 + 2] = col.b;
      aScale[i] = 3.0 + Math.random() * 5.0;
      nebulaVel[i * 3] = gaussianRandom() * 0.02;
      nebulaVel[i * 3 + 1] = gaussianRandom() * 0.02;
      nebulaVel[i * 3 + 2] = 0;
    }
    nebula = makePoints(
      positions,
      {
        aColor: { array: aColor, itemSize: 3 },
        aScale: { array: aScale, itemSize: 1 }
      },
      {
        vertex: `
          attribute vec3 aColor;
          attribute float aScale;
          uniform float uTime;
          varying vec3 vColor;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = uSize * aScale * (1.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
            vColor = aColor;
          }
        `,
        fragment: `
          varying vec3 vColor;
          void main() {
            float d = distance(gl_PointCoord, vec2(0.5));
            float alpha = 1.0 - smoothstep(0.0, 0.5, d);
            alpha = pow(alpha, 2.2);
            gl_FragColor = vec4(vColor, alpha * 0.16);
          }
        `
      },
      { uTime: { value: 0 }, uSize: { value: 60.0 } },
      THREE.NormalBlending,
      true
    );
    nebula.velocities = nebulaVel;
    nebula.capacity = NEBULA_COUNT;
    scene.add(nebula.points);
  }

  // ============ 3. 螺旋星系（每只手一个） ============
  const GALAXY_PER_HAND = 2200;
  const galaxyHands = [null, null];

  function createGalaxy() {
    const positions = new Float32Array(GALAXY_PER_HAND * 3);
    const aColor = new Float32Array(GALAXY_PER_HAND * 3);
    const aScale = new Float32Array(GALAXY_PER_HAND);
    const aTwinkle = new Float32Array(GALAXY_PER_HAND);

    const branches = 3;
    const spin = 2.6;
    const inner = C.cyan;
    const outer = C.electricPurple;

    for (let i = 0; i < GALAXY_PER_HAND; i++) {
      const r = Math.pow(Math.random(), 1.7);
      const branchAngle = (i % branches) * ((Math.PI * 2) / branches);
      const angle = branchAngle + r * spin * 3.0 + gaussianRandom() * 0.28;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      positions[i * 3] = x + gaussianRandom() * 0.05 * r;
      positions[i * 3 + 1] = y + gaussianRandom() * 0.05 * r;
      positions[i * 3 + 2] = gaussianRandom() * 0.08;

      let col;
      if (Math.random() < 0.14) {
        col = Math.random() < 0.6 ? C.gold : C.warmGold;
      } else {
        col = _tmpColor.copy(inner).lerp(outer, r);
      }
      aColor[i * 3] = col.r;
      aColor[i * 3 + 1] = col.g;
      aColor[i * 3 + 2] = col.b;
      aScale[i] = 0.5 + Math.random() * 1.4;
      aTwinkle[i] = Math.random() * Math.PI * 2;
    }

    const galaxy = makePoints(
      positions,
      {
        aColor: { array: aColor, itemSize: 3 },
        aScale: { array: aScale, itemSize: 1 },
        aTwinkle: { array: aTwinkle, itemSize: 1 }
      },
      {
        vertex: `
          attribute vec3 aColor;
          attribute float aScale;
          attribute float aTwinkle;
          uniform float uTime;
          uniform float uSize;
          varying vec3 vColor;
          varying float vAlpha;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            float tw = 0.7 + 0.3 * sin(uTime * 2.0 + aTwinkle);
            gl_PointSize = uSize * aScale * tw * (1.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
            vColor = aColor;
            vAlpha = tw;
          }
        `,
        fragment: `
          varying vec3 vColor;
          varying float vAlpha;
          void main() {
            float d = distance(gl_PointCoord, vec2(0.5));
            float alpha = 1.0 - smoothstep(0.0, 0.5, d);
            float core = 1.0 - smoothstep(0.0, 0.18, d);
            vec3 col = vColor * (0.55 + core * 2.6);
            gl_FragColor = vec4(col, alpha * vAlpha);
          }
        `
      },
      { uTime: { value: 0 }, uSize: { value: 30.0 } }
    );
    galaxy.points.visible = false;
    scene.add(galaxy.points);

    // 核心光晕（镜头光晕 + 暖色核心）
    const coreGlow = makePoints(
      new Float32Array([0, 0, 0.02]),
      { aScale: { array: new Float32Array([1.0]), itemSize: 1 } },
      {
        vertex: `
          attribute float aScale;
          uniform float uTime;
          uniform float uSize;
          varying float vPulse;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = uSize * aScale * (1.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
            vPulse = 0.85 + 0.15 * sin(uTime * 3.0);
          }
        `,
        fragment: `
          varying float vPulse;
          void main() {
            vec2 uv = gl_PointCoord - 0.5;
            float d = length(uv);
            float alpha = 1.0 - smoothstep(0.0, 0.5, d);
            float r = smoothstep(0.5, 0.0, length(uv + vec2(0.05, 0.0)));
            float b = smoothstep(0.5, 0.0, length(uv - vec2(0.05, 0.0)));
            vec3 col = vec3(r * 1.1, alpha * 0.95, b * 1.1);
            col += vec3(1.0, 0.85, 0.5) * pow(alpha, 4.0) * 1.4;
            gl_FragColor = vec4(col * vPulse, alpha * vPulse);
          }
        `
      },
      { uTime: { value: 0 }, uSize: { value: 260.0 } }
    );
    coreGlow.points.visible = false;
    scene.add(coreGlow.points);

    // 真实感行星（地球/月球/火星等），程序化生成纹理
    const PLANET_TYPES = ['earth', 'moon', 'mars', 'jupiter', 'neptune', 'venus'];
    const planetCount = 4 + Math.floor(Math.random() * 3);
    const planets = [];
    const usedTypes = new Set();
    for (let p = 0; p < planetCount; p++) {
      const size = 0.02 + Math.random() * 0.04;
      const orbit = 0.2 + Math.random() * 0.75;
      const angleOffset = Math.random() * Math.PI * 2;
      const speed = 0.4 + Math.random() * 0.6;
      const selfSpin = (Math.random() - 0.5) * 2.0;

      // 优先不重复地选择行星类型
      let type = PLANET_TYPES[Math.floor(Math.random() * PLANET_TYPES.length)];
      if (usedTypes.size < PLANET_TYPES.length) {
        while (usedTypes.has(type)) {
          type = PLANET_TYPES[Math.floor(Math.random() * PLANET_TYPES.length)];
        }
      }
      usedTypes.add(type);

      const texture = makePlanetTexture(type);
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(size, 32, 32),
        new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.85,
          metalness: 0.05
        })
      );
      mesh.userData.selfSpin = selfSpin;
      mesh.visible = false;
      scene.add(mesh);
      planets.push({ mesh, orbit, angleOffset, speed, size, selfSpin });
    }

    return { ...galaxy, coreGlow, planets, radius: 0, goal: 0, active: false };
  }

  // ============ 程序化行星纹理生成 ============
  function makePlanetTexture(type) {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, size, size);

    if (type === 'earth') {
      const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      grad.addColorStop(0, '#1e5bb8');
      grad.addColorStop(1, '#0a2f6a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      // 大陆
      for (let i = 0; i < 14; i++) {
        ctx.beginPath();
        const cx = Math.random() * size;
        const cy = Math.random() * size;
        const rx = 20 + Math.random() * 70;
        const ry = 20 + Math.random() * 70;
        ctx.ellipse(cx, cy, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fillStyle = Math.random() < 0.5 ? '#3e7a34' : '#5a8f3a';
        ctx.fill();
      }
      // 云
      for (let i = 0; i < 20; i++) {
        ctx.beginPath();
        ctx.ellipse(Math.random() * size, Math.random() * size, 10 + Math.random() * 30, 6 + Math.random() * 14, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fill();
      }
    } else if (type === 'moon') {
      const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      grad.addColorStop(0, '#c8c8c8');
      grad.addColorStop(1, '#7a7a7a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      // 陨石坑
      for (let i = 0; i < 40; i++) {
        const cx = Math.random() * size;
        const cy = Math.random() * size;
        const r = 3 + Math.random() * 16;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(90,90,90,0.5)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + r * 0.2, cy + r * 0.2, r * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(180,180,180,0.4)';
        ctx.fill();
      }
    } else if (type === 'mars') {
      const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      grad.addColorStop(0, '#d8733c');
      grad.addColorStop(1, '#7a2f16');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      for (let i = 0; i < 16; i++) {
        ctx.beginPath();
        ctx.ellipse(Math.random() * size, Math.random() * size, 20 + Math.random() * 50, 10 + Math.random() * 30, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fillStyle = Math.random() < 0.5 ? 'rgba(140,70,40,0.4)' : 'rgba(200,120,80,0.3)';
        ctx.fill();
      }
    } else if (type === 'jupiter') {
      const grad = ctx.createLinearGradient(0, 0, 0, size);
      grad.addColorStop(0, '#d9c39a');
      grad.addColorStop(0.3, '#b07644');
      grad.addColorStop(0.5, '#e3d2b0');
      grad.addColorStop(0.7, '#a5683a');
      grad.addColorStop(1, '#c99b6a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      // 大红斑
      ctx.beginPath();
      ctx.ellipse(size * 0.62, size * 0.7, size * 0.14, size * 0.08, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#b8432f';
      ctx.fill();
      // 条纹
      for (let y = 0; y < size; y += 8) {
        ctx.fillStyle = `rgba(160,120,80,${0.08 + Math.random() * 0.12})`;
        ctx.fillRect(0, y, size, 3 + Math.random() * 5);
      }
    } else if (type === 'neptune') {
      const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      grad.addColorStop(0, '#4f7dff');
      grad.addColorStop(1, '#1e3a8a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      for (let i = 0; i < 12; i++) {
        ctx.beginPath();
        ctx.ellipse(Math.random() * size, Math.random() * size, 30 + Math.random() * 60, 8 + Math.random() * 20, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fill();
      }
    } else if (type === 'venus') {
      const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      grad.addColorStop(0, '#f0d08a');
      grad.addColorStop(1, '#b07c35');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      for (let i = 0; i < 14; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * size, Math.random() * size, 20 + Math.random() * 50, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(220,180,110,0.25)';
        ctx.fill();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // ============ 4. 恒星粒子（暖金闪烁 + 超新星爆闪 + 十字星芒色散） ============
  {
    const STAR_COUNT = 180;
    const positions = new Float32Array(STAR_COUNT * 3);
    const aColor = new Float32Array(STAR_COUNT * 3);
    const aScale = new Float32Array(STAR_COUNT);
    const aFlash = new Float32Array(STAR_COUNT);
    const aFlashSpeed = new Float32Array(STAR_COUNT);
    for (let i = 0; i < STAR_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2.2;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2.0;
      positions[i * 3 + 2] = -0.2 - Math.random() * 0.4;
      const col = Math.random() < 0.55 ? C.gold : C.white;
      aColor[i * 3] = col.r;
      aColor[i * 3 + 1] = col.g;
      aColor[i * 3 + 2] = col.b;
      aScale[i] = 0.6 + Math.random() * 1.6;
      aFlash[i] = Math.random() * Math.PI * 2;
      aFlashSpeed[i] = 0.5 + Math.random() * 2.5;
    }
    starLayer = makePoints(
      positions,
      {
        aColor: { array: aColor, itemSize: 3 },
        aScale: { array: aScale, itemSize: 1 },
        aFlash: { array: aFlash, itemSize: 1 },
        aFlashSpeed: { array: aFlashSpeed, itemSize: 1 }
      },
      {
        vertex: `
          attribute vec3 aColor;
          attribute float aScale;
          attribute float aFlash;
          attribute float aFlashSpeed;
          uniform float uTime;
          varying vec3 vColor;
          varying float vFlash;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            float tw = 0.7 + 0.3 * sin(uTime * aFlashSpeed + aFlash);
            gl_PointSize = uSize * aScale * tw * (1.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
            vColor = aColor * (1.0 + tw);
            float wave = sin(uTime * aFlashSpeed + aFlash);
            vFlash = pow(max(0.0, wave), 50.0) * 3.0;
          }
        `,
        fragment: `
          varying vec3 vColor;
          varying float vFlash;
          void main() {
            vec2 uv = gl_PointCoord - 0.5;
            float d = length(uv);
            float alpha = 1.0 - smoothstep(0.0, 0.5, d);
            float streak = pow(max(0.0, 1.0 - abs(uv.x) * 5.0) * max(0.0, 1.0 - abs(uv.y) * 1.2), 1.5)
                         + pow(max(0.0, 1.0 - abs(uv.y) * 5.0) * max(0.0, 1.0 - abs(uv.x) * 1.2), 1.5);
            float r = 1.0 - smoothstep(0.0, 0.5, length(uv + vec2(0.05, 0.0)));
            float b = 1.0 - smoothstep(0.0, 0.5, length(uv - vec2(0.05, 0.0)));
            vec3 col = vec3(r, alpha, b);
            col += vColor * (alpha + streak * 0.7);
            col += vColor * vFlash;
            float a = alpha + streak * 0.4 + vFlash;
            gl_FragColor = vec4(col, a);
          }
        `
      },
      { uTime: { value: 0 }, uSize: { value: 26.0 } }
    );
    scene.add(starLayer.points);
  }

  // ============ 5. 星河光带拖尾（指尖划动拉出） ============
  {
    const TRAIL_COUNT = 1400;
    const trailPositions = new Float32Array(TRAIL_COUNT * 3);
    const trailAlpha = new Float32Array(TRAIL_COUNT);
    const trailColor = new Float32Array(TRAIL_COUNT * 3);
    const trailScale = new Float32Array(TRAIL_COUNT);
    const trailVel = new Float32Array(TRAIL_COUNT * 3);
    const trailLife = new Float32Array(TRAIL_COUNT);
    let trailHead = 0;

    for (let i = 0; i < TRAIL_COUNT; i++) {
      trailPositions[i * 3] = 0;
      trailPositions[i * 3 + 1] = 0;
      trailPositions[i * 3 + 2] = 0.1;
      trailAlpha[i] = 0;
      trailLife[i] = 0;
      trailColor[i * 3] = C.cyan.r;
      trailColor[i * 3 + 1] = C.cyan.g;
      trailColor[i * 3 + 2] = C.cyan.b;
      trailScale[i] = 0.6 + Math.random() * 1.0;
    }

    trailLayer = makePoints(
      trailPositions,
      {
        aColor: { array: trailColor, itemSize: 3 },
        aScale: { array: trailScale, itemSize: 1 },
        aAlpha: { array: trailAlpha, itemSize: 1 }
      },
      {
        vertex: `
          attribute vec3 aColor;
          attribute float aScale;
          attribute float aAlpha;
          uniform float uSize;
          varying vec3 vColor;
          varying float vAlpha;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = uSize * aScale * (1.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
            vColor = aColor;
            vAlpha = aAlpha;
          }
        `,
        fragment: `
          varying vec3 vColor;
          varying float vAlpha;
          void main() {
            float d = distance(gl_PointCoord, vec2(0.5));
            float alpha = 1.0 - smoothstep(0.0, 0.5, d);
            gl_FragColor = vec4(vColor, alpha * vAlpha);
          }
        `
      },
      { uSize: { value: 22.0 } }
    );
    scene.add(trailLayer.points);

    trailLayer.data = { trailPositions, trailVel, trailAlpha, trailColor, trailLife, trailHead, TRAIL_COUNT };
  }

  // ============ 6. 环形冲击波（握拳引力坍缩释放） ============
  const WAVE_PARTICLES = 240;
  const MAX_WAVES = 4;
  const waves = [];
  for (let w = 0; w < MAX_WAVES; w++) {
    const positions = new Float32Array(WAVE_PARTICLES * 3);
    const aOffset = new Float32Array(WAVE_PARTICLES);
    for (let i = 0; i < WAVE_PARTICLES; i++) {
      const angle = (i / WAVE_PARTICLES) * Math.PI * 2;
      positions[i * 3] = Math.cos(angle);
      positions[i * 3 + 1] = Math.sin(angle);
      positions[i * 3 + 2] = 0;
      aOffset[i] = gaussianRandom() * 0.06;
    }
    const waveObj = makePoints(
      positions,
      { aOffset: { array: aOffset, itemSize: 1 } },
      {
        vertex: `
          attribute float aOffset;
          uniform float uRadius;
          uniform float uAngle;
          uniform float uSize;
          void main() {
            float a = atan(position.y, position.x) + uAngle + aOffset;
            float r = length(position.xy) * uRadius;
            vec3 p = vec3(cos(a) * r, sin(a) * r, position.z);
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = uSize * (1.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragment: `
          uniform float uAlpha;
          uniform vec3 uColor;
          void main() {
            float d = distance(gl_PointCoord, vec2(0.5));
            float alpha = 1.0 - smoothstep(0.0, 0.5, d);
            gl_FragColor = vec4(uColor, alpha * uAlpha);
          }
        `
      },
      {
        uRadius: { value: 0 },
        uAngle: { value: 0 },
        uAlpha: { value: 0 },
        uSize: { value: 16.0 },
        uColor: { value: new THREE.Color(0xc084fc) }
      }
    );
    waveObj.points.visible = false;
    waveObj.points.position.z = 0.05;
    scene.add(waveObj.points);
    waves.push({ ...waveObj, active: false, radius: 0, alpha: 0, speed: 0.6, life: 0 });
  }
  let waveIndex = 0;

  function triggerShockwave(x, y) {
    const wave = waves[waveIndex];
    waveIndex = (waveIndex + 1) % MAX_WAVES;
    wave.active = true;
    wave.radius = 0.04;
    wave.alpha = 1.0;
    wave.life = 1.0;
    wave.points.position.x = x;
    wave.points.position.y = y;
    wave.points.visible = true;
  }

  // ============ 7. 海水潮流粒子 ============
  {
    const OCEAN_COUNT = 8000;
    const positions = new Float32Array(OCEAN_COUNT * 3);
    const aColor = new Float32Array(OCEAN_COUNT * 3);
    const aScale = new Float32Array(OCEAN_COUNT);
    const aPhase = new Float32Array(OCEAN_COUNT);
    const oceanCols = [
      new THREE.Color(0x0ea5e9), // 青蓝
      new THREE.Color(0x38bdf8), // 浅蓝
      new THREE.Color(0x1e3a8a), // 深蓝
      new THREE.Color(0xffffff) // 泡沫白
    ];
    for (let i = 0; i < OCEAN_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2.4;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2.0;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
      const brightness = 0.6 + Math.random() * 0.4;
      const col = oceanCols[Math.floor(Math.random() * oceanCols.length)];
      aColor[i * 3] = col.r * brightness;
      aColor[i * 3 + 1] = col.g * brightness;
      aColor[i * 3 + 2] = col.b * brightness;
      aScale[i] = 0.6 + Math.random() * 1.6;
      aPhase[i] = Math.random() * Math.PI * 2;
    }
    oceanLayer = makePoints(
      positions,
      {
        aColor: { array: aColor, itemSize: 3 },
        aScale: { array: aScale, itemSize: 1 },
        aPhase: { array: aPhase, itemSize: 1 }
      },
      {
        vertex: `
          attribute vec3 aColor;
          attribute float aScale;
          attribute float aPhase;
          uniform float uTime;
          uniform float uSize;
          uniform float uSpeed;
          varying vec3 vColor;
          varying float vAlpha;
          void main() {
            vec3 p = position;
            float wave = sin(p.x * 3.0 + uTime * uSpeed + aPhase) * 0.06
                       + cos(p.y * 2.8 + uTime * uSpeed * 1.3 + aPhase) * 0.05;
            p.x += wave * 0.6;
            p.y += sin(p.x * 2.0 + uTime * uSpeed * 0.7 + aPhase) * 0.04;
            p.y += cos(p.x * 1.5 + uTime * uSpeed * 1.1 + aPhase) * 0.03;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = uSize * aScale * (1.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
            vColor = aColor;
            vAlpha = 0.55 + 0.45 * sin(uTime * uSpeed * 0.8 + aPhase);
          }
        `,
        fragment: `
          varying vec3 vColor;
          varying float vAlpha;
          void main() {
            float d = distance(gl_PointCoord, vec2(0.5));
            float alpha = 1.0 - smoothstep(0.0, 0.5, d);
            alpha = pow(alpha, 1.6);
            gl_FragColor = vec4(vColor, alpha * vAlpha * 0.55);
          }
        `
      },
      { uTime: { value: 0 }, uSize: { value: 40.0 }, uSpeed: { value: 1.5 } }
    );
    oceanLayer.points.visible = false;
    scene.add(oceanLayer.points);
  }

  // ============ 8. 粒子图片层（上传图片 → 主体分割 → 粒子重构/爆炸/复原） ============
  // 粒子缓冲容量：需 ≥ main.js 中的 PARTICLE_TARGET（50000），避免被截断
  const PI_COUNT = 50000;
  const piPositions = new Float32Array(PI_COUNT * 3);
  const piTarget = new Float32Array(PI_COUNT * 3);
  const piExplode = new Float32Array(PI_COUNT * 3);
  const piColor = new Float32Array(PI_COUNT * 3);
  const piScale = new Float32Array(PI_COUNT);
  for (let i = 0; i < PI_COUNT; i++) {
    piScale[i] = 0.5 + Math.random() * 0.8;
  }
  let piActive = false;
  let piActiveCount = 0;     // 实际激活的粒子数量（优化：仅更新激活的粒子）
  let piExplodeAmount = 0;   // 0 = 复原态，1 = 爆炸态
  let piExplodeTarget = 0;

  const piLayer = makePoints(
    piPositions,
    {
      aColor: { array: piColor, itemSize: 3 },
      aScale: { array: piScale, itemSize: 1 }
    },
    {
      vertex: `
        attribute vec3 aColor;
        attribute float aScale;
        uniform float uSize;
        varying vec3 vColor;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = uSize * aScale * (1.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
          vColor = aColor;
        }
      `,
      fragment: `
        varying vec3 vColor;
        void main() {
          float d = distance(gl_PointCoord, vec2(0.5));
          float alpha = 1.0 - smoothstep(0.0, 0.5, d);
          alpha = pow(alpha, 1.4);
          gl_FragColor = vec4(vColor, alpha);
        }
      `
    },
    { uSize: { value: 10.0 } },
    THREE.AdditiveBlending,
    true
  );
  piLayer.points.visible = false;
  // 关键：particlePhotoScene 在 composer 渲染后以 autoClear=false 叠加渲染，
  // depth buffer 中有残留深度值。若不关闭深度测试，z=0 的粒子会被错误剔除而不显示。
  piLayer.material.depthTest = false;
  piLayer.material.depthWrite = false;
  piLayer.points.renderOrder = 10;
  piLayer.points.position.z = 0.5;
  scene.add(piLayer.points);

  function setParticleImage(positions, colors) {
    const n = Math.min(Math.floor(positions.length / 3), PI_COUNT);

    // 计算物体中心
    let cx = 0;
    let cy = 0;
    for (let i = 0; i < n; i++) {
      cx += positions[i * 3];
      cy += positions[i * 3 + 1];
    }
    cx /= n;
    cy /= n;

    for (let i = 0; i < n; i++) {
      piTarget[i * 3] = positions[i * 3];
      piTarget[i * 3 + 1] = positions[i * 3 + 1];
      piTarget[i * 3 + 2] = 0;

      piColor[i * 3] = colors[i * 3];
      piColor[i * 3 + 1] = colors[i * 3 + 1];
      piColor[i * 3 + 2] = colors[i * 3 + 2];

      // 复位当前显示位置到成形坐标
      piPositions[i * 3] = positions[i * 3];
      piPositions[i * 3 + 1] = positions[i * 3 + 1];
      piPositions[i * 3 + 2] = 0;

      // 爆炸方向：沿「中心 → 粒子」向外散射
      const dx = positions[i * 3] - cx;
      const dy = positions[i * 3 + 1] - cy;
      const len = Math.hypot(dx, dy) || 0.001;
      const dist = 0.7 + Math.random() * 1.4;
      piExplode[i * 3] = cx + (dx / len) * dist;
      piExplode[i * 3 + 1] = cy + (dy / len) * dist;
      piExplode[i * 3 + 2] = 0;
    }

    // 未使用粒子设为黑色，隐藏
    for (let i = n; i < PI_COUNT; i++) {
      piColor[i * 3] = 0;
      piColor[i * 3 + 1] = 0;
      piColor[i * 3 + 2] = 0;
    }

    piLayer.geometry.attributes.position.needsUpdate = true;
    piLayer.geometry.attributes.aColor.needsUpdate = true;

    piActive = true;
    piActiveCount = n;
    piExplodeAmount = 0;
    piExplodeTarget = 0;
    piLayer.points.visible = true;
    piLayer.geometry.setDrawRange(0, n); // 只绘制激活粒子，跳过未使用的黑色粒子
    return n;
  }

  function explodeParticles() {
    if (!piActive) return;
    piExplodeTarget = 1;
  }

  function restoreParticles() {
    if (!piActive) return;
    piExplodeTarget = 0;
  }

  function clearParticleImage() {
    piActive = false;
    piActiveCount = 0;
    piExplodeAmount = 0;
    piExplodeTarget = 0;
    piLayer.points.visible = false;
    piLayer.geometry.setDrawRange(0, 0);
  }

  // ============ 手部 API ============
  // setHand：设置/更新一只手的星系目标。手势决定星系规模。
  // 放大上限 = 屏幕 2 倍；缩小下限 = 手掌 1/3。
  function setHand(id, x, y, span, gesture) {
    let goal;
    if (gesture === 'OPEN') goal = Math.min(span * 4.0, 2.0); // 张开：诞生巨型星系，上限 2
    else if (gesture === 'GRAB') goal = Math.max(span / 3, 0.06); // 握拳：引力坍缩，下限掌 1/3
    else if (gesture === 'PINCH') goal = span * 2.0;
    else goal = span * 3.5;

    if (!galaxyHands[id]) {
      const g = createGalaxy();
      galaxyHands[id] = g;
    }
    const g = galaxyHands[id];
    g.active = true;
    g.goal = goal;
    g.points.visible = true;
    g.coreGlow.points.visible = true;
    g.points.position.x = x;
    g.points.position.y = y;
    g.coreGlow.points.position.x = x;
    g.coreGlow.points.position.y = y;
  }

  function removeHand(id) {
    if (galaxyHands[id]) {
      galaxyHands[id].active = false;
    }
  }

  function emitTrail(x, y, dx, dy) {
    const d = trailLayer.data;
    const idx = d.trailHead;
    d.trailHead = (d.trailHead + 1) % d.TRAIL_COUNT;
    d.trailPositions[idx * 3] = x;
    d.trailPositions[idx * 3 + 1] = y;
    d.trailPositions[idx * 3 + 2] = 0.1;
    d.trailVel[idx * 3] = dx * 1.5 + gaussianRandom() * 0.05;
    d.trailVel[idx * 3 + 1] = dy * 1.5 + gaussianRandom() * 0.05;
    d.trailVel[idx * 3 + 2] = 0;
    d.trailLife[idx] = 0.8 + Math.random() * 0.7;
    d.trailAlpha[idx] = 0.9;

    const speed = Math.hypot(dx, dy);
    const t = clamp(speed * 1.5, 0, 1);
    const col = _tmpColor.copy(C.cyan).lerp(C.electricPurple, t);
    d.trailColor[idx * 3] = col.r;
    d.trailColor[idx * 3 + 1] = col.g;
    d.trailColor[idx * 3 + 2] = col.b;
  }

  // ============ 更新 ============
  function update(dt, time) {
    for (const layer of [backgroundStars, nebula, starLayer]) {
      if (layer.material.uniforms.uTime) layer.material.uniforms.uTime.value = time;
    }

    // 应用可调参数
    if (oceanLayer) {
      oceanLayer.material.uniforms.uTime.value = time;
      oceanLayer.material.uniforms.uSpeed.value = 1.5 * params.speedFactor;
      oceanLayer.material.uniforms.uSize.value = 40.0 * params.sizeFactor;
    }

    // 粒子图片层：随 sizeFactor 调节粒子大小（更细更保真）
    if (piLayer) {
      piLayer.material.uniforms.uSize.value = 10.0 * params.sizeFactor;
    }

    // galaxy 模式粒子层：应用粒子大小参数
    backgroundStars.material.uniforms.uSize.value = 6.0 * params.sizeFactor;
    nebula.material.uniforms.uSize.value = 60.0 * params.sizeFactor;
    starLayer.material.uniforms.uSize.value = 26.0 * params.sizeFactor;
    trailLayer.material.uniforms.uSize.value = 22.0 * params.sizeFactor;
    for (const wave of waves) {
      wave.material.uniforms.uSize.value = 16.0 * params.sizeFactor;
    }
    for (let id = 0; id < 2; id++) {
      const g = galaxyHands[id];
      if (g) g.material.uniforms.uSize.value = 30.0 * params.sizeFactor;
    }

    bloomPass.strength = params.bloomStrength;

    // 星云缓慢漂移
    {
      const np = nebula.geometry.attributes.position.array;
      const vel = nebula.velocities;
      const cap = nebula.capacity;
      for (let i = 0; i < cap; i++) {
        np[i * 3] += vel[i * 3] * dt * params.speedFactor;
        np[i * 3 + 1] += vel[i * 3 + 1] * dt * params.speedFactor;
        if (np[i * 3] > 1.2) np[i * 3] = -1.2;
        if (np[i * 3] < -1.2) np[i * 3] = 1.2;
        if (np[i * 3 + 1] > 1.0) np[i * 3 + 1] = -1.0;
        if (np[i * 3 + 1] < -1.0) np[i * 3 + 1] = 1.0;
      }
      nebula.geometry.attributes.position.needsUpdate = true;
    }

    // 星系：跟随手、半径插值、自转
    for (let id = 0; id < 2; id++) {
      const g = galaxyHands[id];
      if (!g) continue;
      const px = g.points.position.x;
      const py = g.points.position.y;
      if (g.active) {
        g.radius += (g.goal - g.radius) * Math.min(1, dt * 3.5);
        g.points.rotation.z += dt * 2.0 * params.speedFactor; // 旋转速度再快两倍
        g.points.scale.setScalar(g.radius);
        g.coreGlow.points.scale.setScalar(1.0);
        g.coreGlow.material.uniforms.uSize.value = 80 + g.radius * 140;
        g.material.uniforms.uTime.value = time;
        g.coreGlow.material.uniforms.uTime.value = time;
      } else {
        // 手消失：星系坍缩消失
        g.radius *= Math.max(0, 1 - dt * 4);
        g.points.scale.setScalar(g.radius);
        g.coreGlow.material.uniforms.uSize.value = 80 + g.radius * 140;
      }

      // 更新星球体（随星系旋转 + 缩放 + 自转）
      for (const planet of g.planets) {
        const a = planet.angleOffset + g.points.rotation.z * planet.speed;
        planet.mesh.position.x = px + Math.cos(a) * planet.orbit * g.radius;
        planet.mesh.position.y = py + Math.sin(a) * planet.orbit * g.radius;
        planet.mesh.scale.setScalar(g.radius);
        planet.mesh.rotation.y += planet.selfSpin * dt * params.speedFactor;
        planet.mesh.visible = g.radius > 0.02;
      }

      if (!g.active && g.radius < 0.005) {
        g.radius = 0;
        g.points.visible = false;
        g.coreGlow.points.visible = false;
      }
    }

    // 拖尾粒子：寿命衰减与运动
    {
      const d = trailLayer.data;
      for (let i = 0; i < d.TRAIL_COUNT; i++) {
        if (d.trailLife[i] > 0) {
          d.trailLife[i] -= dt;
          d.trailPositions[i * 3] += d.trailVel[i * 3] * dt;
          d.trailPositions[i * 3 + 1] += d.trailVel[i * 3 + 1] * dt;
          d.trailVel[i * 3] *= 0.96;
          d.trailVel[i * 3 + 1] *= 0.96;
          d.trailAlpha[i] = clamp(d.trailLife[i], 0, 1) * 0.9;
          if (d.trailLife[i] <= 0) {
            d.trailAlpha[i] = 0;
            d.trailPositions[i * 3] = 0;
            d.trailPositions[i * 3 + 1] = 0;
          }
        }
      }
      trailLayer.geometry.attributes.position.needsUpdate = true;
      trailLayer.geometry.attributes.aAlpha.needsUpdate = true;
      trailLayer.geometry.attributes.aColor.needsUpdate = true;
    }

    // 冲击波扩散
    for (const wave of waves) {
      if (!wave.active) continue;
      wave.life -= dt * 1.4;
      wave.radius += dt * wave.speed * params.speedFactor;
      wave.alpha = clamp(wave.life, 0, 1);
      wave.material.uniforms.uRadius.value = wave.radius;
      wave.material.uniforms.uAlpha.value = wave.alpha;
      wave.material.uniforms.uAngle.value = time * 0.8;
      if (wave.life <= 0) {
        wave.active = false;
        wave.points.visible = false;
      }
    }

    // 粒子图片层：爆炸/复原插值 + 爆炸态轻微抖动
    if (piActive) {
      piExplodeAmount += (piExplodeTarget - piExplodeAmount) * Math.min(1, dt * 3.0);
      // 收敛后吸附到目标值，避免浮点残差导致永不静止
      if (Math.abs(piExplodeAmount - piExplodeTarget) < 0.001) piExplodeAmount = piExplodeTarget;

      const e = piExplodeAmount;
      // 复原静止态：位置已等于目标，跳过逐帧重算（5 万粒子下的性能优化）
      if (e !== 0 || piExplodeTarget !== 0) {
        for (let i = 0; i < piActiveCount; i++) {
          const tx = piTarget[i * 3];
          const ty = piTarget[i * 3 + 1];
          let ex = piExplode[i * 3];
          let ey = piExplode[i * 3 + 1];
          if (e > 0.01) {
            const j = 0.02 * Math.sin(time * 20 + i * 0.7);
            ex += j;
            ey += j * 0.7;
          }
          piPositions[i * 3] = tx + (ex - tx) * e;
          piPositions[i * 3 + 1] = ty + (ey - ty) * e;
        }
        piLayer.geometry.attributes.position.needsUpdate = true;
      }
    }
  }

  function render() {
    if (effectMode === 'photoParticle') {
      // 粒子图片模式：直接渲染主场景，完全跳过 bloom。
      // bloom 的 threshold=0.88 会过滤掉深色粒子，导致图片粒子几乎不可见；
      // 直接渲染可 100% 还原粒子真实颜色。
      renderer.render(scene, camera);
      return;
    }
    composer.render();
    // 叠加原图层（不经 bloom 后处理，保持 100% 原图）
    renderer.autoClear = false;
    renderer.render(photoScene, camera);
    renderer.autoClear = true;
  }

  function setBackgroundVisible(visible) {
    backgroundPlane.visible = visible;
  }

  // 特效切换与参数调节
  function setEffectMode(mode) {
    effectMode = mode === 'ocean' ? 'ocean' : mode === 'photoParticle' ? 'photoParticle' : 'galaxy';
    const isOcean = effectMode === 'ocean';
    const isPhoto = effectMode === 'photoParticle';

    // 星系/恒星/光带层：仅在 galaxy 模式显示
    const showGalaxy = !isOcean && !isPhoto;
    for (let id = 0; id < 2; id++) {
      const g = galaxyHands[id];
      if (g) {
        g.points.visible = showGalaxy && g.active;
        g.coreGlow.points.visible = showGalaxy && g.active;
        for (const planet of g.planets) {
          planet.mesh.visible = showGalaxy && g.radius > 0.02;
        }
      }
    }
    starLayer.points.visible = showGalaxy;
    trailLayer.points.visible = showGalaxy;

    // 海水层：仅 ocean 模式显示
    oceanLayer.points.visible = isOcean;

    // 粒子图片层：仅 photoParticle 模式显示
    piLayer.points.visible = isPhoto && piActive;

    return effectMode;
  }

  function setParams(partial) {
    if (partial.sizeFactor !== undefined) params.sizeFactor = clamp(partial.sizeFactor, 0.4, 3);
    if (partial.speedFactor !== undefined) params.speedFactor = clamp(partial.speedFactor, 0.2, 5);
    if (partial.bloomStrength !== undefined) params.bloomStrength = clamp(partial.bloomStrength, 0, 3);
    return { ...params };
  }

  function getParams() {
    return { ...params };
  }

  function getEffectMode() {
    return effectMode;
  }

  function handleResize() {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    renderer.setSize(w, h);
    composer.setSize(w, h);
    updateCoverScale();
  }
  window.addEventListener('resize', handleResize);

  return {
    renderer,
    scene,
    camera,
    setBackgroundVisible,
    updateCoverScale,
    setPhoto,
    setHand,
    removeHand,
    emitTrail,
    triggerShockwave,
    update,
    render,
    handleResize,
    setEffectMode,
    setParams,
    getParams,
    getEffectMode,
    setParticleImage,
    explodeParticles,
    restoreParticles,
    clearParticleImage
  };
}
