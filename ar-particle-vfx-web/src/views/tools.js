// src/views/tools.js — 工具箱（代码压缩 / 颜色拾取 / 参数生成器）
import { minifyCode } from '../tools/compress.js';
import { colorFormats } from '../tools/color.js';
import { buildParamsCode } from '../tools/params.js';
import { showToast } from '../lib/toast.js';
import { downloadCode } from '../exporter.js';
import { isLoggedIn } from '../api.js';

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('已复制');
  } catch {
    showToast('复制失败');
  }
}

export function renderTools(app, tool = 'compress') {
  app.innerHTML = `
    <div class="page">
      <h2 class="section-title">工具箱</h2>
      <p class="muted">免费留存工具</p>

      <div class="chips" id="tool-tabs">
        <button class="chip chip-active" data-tool="compress" type="button">代码压缩</button>
        <button class="chip" data-tool="color" type="button">颜色拾取</button>
        <button class="chip" data-tool="params" type="button">参数生成器</button>
        <button class="chip" data-tool="diy" type="button">DIY 特效</button>
      </div>

      <div id="tool-panel"></div>
    </div>
  `;

  const panel = app.querySelector('#tool-panel');
  const tabs = app.querySelectorAll('#tool-tabs .chip');

  function renderCompress() {
    panel.innerHTML = `
      <div class="card">
        <h3>代码压缩</h3>
        <p class="card-desc">粘贴 CSS/JS 代码，去除注释与多余空白</p>
        <div class="form-row"><textarea id="code-in" rows="8" placeholder="粘贴代码…"></textarea></div>
        <button class="btn btn-primary" id="btn-minify" type="button">压缩</button>
        <div class="form-row" style="margin-top:14px"><textarea id="code-out" rows="8" placeholder="压缩结果" readonly></textarea></div>
        <button class="btn" id="btn-copy-min" type="button">复制结果</button>
      </div>
    `;
    panel.querySelector('#btn-minify').addEventListener('click', () => {
      panel.querySelector('#code-out').value = minifyCode(panel.querySelector('#code-in').value);
    });
    panel.querySelector('#btn-copy-min').addEventListener('click', () => {
      const out = panel.querySelector('#code-out').value;
      if (!out) return showToast('请先压缩代码');
      copyText(out);
    });
  }

  function renderColor() {
    panel.innerHTML = `
      <div class="card">
        <h3>颜色拾取</h3>
        <p class="card-desc">选择颜色，查看 HEX / RGB / HSL 格式</p>
        <input type="color" id="color-in" value="#22d3ee">
        <div id="color-out" style="margin-top:14px;display:flex;flex-direction:column;gap:8px"></div>
      </div>
    `;
    function update() {
      const f = colorFormats(panel.querySelector('#color-in').value);
      panel.querySelector('#color-out').innerHTML = ['hex', 'rgb', 'hsl'].map((k) => `
        <div style="display:flex;gap:10px;align-items:center">
          <code style="flex:1;color:#22d3ee">${f[k]}</code>
          <button class="btn" data-copy="${f[k]}" type="button">复制</button>
        </div>`).join('');
      panel.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', () => copyText(b.dataset.copy)));
    }
    panel.querySelector('#color-in').addEventListener('input', update);
    update();
  }

  function renderParams() {
    panel.innerHTML = `
      <div class="card">
        <h3>参数生成器</h3>
        <p class="card-desc">调节粒子参数，生成配置代码</p>
        <div class="form-row"><label>粒子数量 <span id="v-count"></span></label><input type="range" id="p-count" min="500" max="100000" step="500" value="5000"></div>
        <div class="form-row"><label>粒子颜色</label><input type="color" id="p-color" value="#22d3ee"></div>
        <div class="form-row"><label>粒子大小 <span id="v-size"></span></label><input type="range" id="p-size" min="1" max="60" value="10"></div>
        <div class="form-row"><label>运动速度 <span id="v-speed"></span></label><input type="range" id="p-speed" min="0.2" max="5" step="0.1" value="1"></div>
        <div class="form-row"><label>透明度 <span id="v-opacity"></span></label><input type="range" id="p-opacity" min="0" max="1" step="0.05" value="0.8"></div>
        <pre id="params-out"></pre>
        <button class="btn btn-primary" id="btn-copy-params" type="button">复制配置代码</button>
      </div>
    `;
    function update() {
      const p = {
        count: +panel.querySelector('#p-count').value,
        color: panel.querySelector('#p-color').value,
        size: +panel.querySelector('#p-size').value,
        speed: +panel.querySelector('#p-speed').value,
        opacity: +panel.querySelector('#p-opacity').value
      };
      panel.querySelector('#v-count').textContent = p.count;
      panel.querySelector('#v-size').textContent = p.size;
      panel.querySelector('#v-speed').textContent = p.speed;
      panel.querySelector('#v-opacity').textContent = p.opacity;
      panel.querySelector('#params-out').textContent = buildParamsCode(p);
    }
    panel.querySelectorAll('input').forEach((i) => i.addEventListener('input', update));
    update();
    panel.querySelector('#btn-copy-params').addEventListener('click', () => copyText(panel.querySelector('#params-out').textContent));
  }

  const DIY_TEMPLATE = `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Three.js 3D 雨幕粒子</title>
<style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#020617}canvas{display:block}</style>
</head><body><script src="https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.min.js"><\/script><script>
const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x020617,.025);
const camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,1000);camera.position.set(0,2,18);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setSize(innerWidth,innerHeight);renderer.setClearColor(0x020617);document.body.appendChild(renderer.domElement);
const count=5200,pos=new Float32Array(count*3),color=new Float32Array(count*3);for(let i=0;i<count;i++){const k=i*3;pos[k]=(Math.random()-.5)*24;pos[k+1]=Math.random()*18-9;pos[k+2]=(Math.random()-.5)*18;const c=new THREE.Color().setHSL(.53+Math.random()*.12,.85,.55+Math.random()*.2);color[k]=c.r;color[k+1]=c.g;color[k+2]=c.b;}
const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('color',new THREE.BufferAttribute(color,3));const mat=new THREE.PointsMaterial({size:.075,vertexColors:true,transparent:true,opacity:.9,blending:THREE.AdditiveBlending});const rain=new THREE.Points(geo,mat);scene.add(rain);
const mouse={x:0,y:0};addEventListener('pointermove',e=>{mouse.x=(e.clientX/innerWidth-.5)*2;mouse.y=(e.clientY/innerHeight-.5)*2});
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)}addEventListener('resize',resize);
function animate(t){const a=geo.attributes.position.array;for(let i=0;i<count;i++){const k=i*3;a[k+1]-=.11;if(a[k+1]<-9)a[k+1]=9; a[k]+=Math.sin(t*.001+i)*.0015;}rain.rotation.y+=(mouse.x*.08-rain.rotation.y)*.025;rain.rotation.x+=(mouse.y*.05-rain.rotation.x)*.025;renderer.render(scene,camera);requestAnimationFrame(animate)}requestAnimationFrame(animate);
<\/script></body></html>`;

  function escapeCode(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  function highlightCode(value) {
    const tokenPattern = /<!--[\s\S]*?-->|<\/?[A-Za-z][^>]*>|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:const|let|var|function|return|new|for|if|else|class|import|from|async|await|true|false|null)\b/g;
    let result = ''; let cursor = 0; let match;
    while ((match = tokenPattern.exec(value))) {
      result += escapeCode(value.slice(cursor, match.index));
      const token = escapeCode(match[0]);
      const type = match[0].startsWith('<!--') ? 'comment' : match[0].startsWith('<') ? 'tag' : /^['"]/.test(match[0]) ? 'string' : 'keyword';
      result += `<span class="code-token-${type}">${token}</span>`; cursor = match.index + match[0].length;
    }
    return result + escapeCode(value.slice(cursor)) + (value.endsWith('\n') ? ' ' : '');
  }

  function formatCode(value) {
    const normalized = value.replace(/\r\n/g, '\n').replace(/>\s*</g, '>\n<');
    let indent = 0;
    return normalized.split('\n').map((line) => {
      const clean = line.trim(); if (!clean) return '';
      if (/^<\/(?!script|style)/i.test(clean) || /^<\/(script|style)/i.test(clean)) indent = Math.max(0, indent - 1);
      const output = `${'  '.repeat(indent)}${clean}`;
      if (/^<[^!/][^>]*[^/]>(?!.*<\/(?:[a-z]+)>$)/i.test(clean) && !/^<(meta|link|img|input|br|hr)/i.test(clean)) indent += 1;
      return output;
    }).join('\n');
  }

  function renderDIY() {
    panel.innerHTML = `
      <div class="card">
        <h3>DIY 粒子特效</h3>
        <p class="card-desc">输入 HTML 代码，特殊标签与关键字高亮，默认提供 Three.js 3D 下雨粒子示例</p>
        <div class="diy-editor-wrap"><pre id="diy-highlight" aria-hidden="true"></pre><textarea id="diy-code" rows="18" spellcheck="false" placeholder="粘贴 HTML 代码…"></textarea></div>
        <div class="form-row" style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-primary" id="btn-diy-run" type="button">运行预览</button>
          <button class="btn" id="btn-diy-format" type="button">格式化代码</button>
          <button class="btn" id="btn-diy-reset" type="button">恢复示例</button>
          <button class="btn" id="btn-diy-html" type="button">下载 HTML</button>
          <button class="btn" id="btn-diy-txt" type="button">下载 TXT</button>
        </div>
        <div class="form-row"><iframe id="diy-preview" sandbox="allow-scripts" style="width:100%;height:360px;border:none;border-radius:10px;background:#0a0a12"></iframe></div>
      </div>
    `;
    const ta = panel.querySelector('#diy-code');
    const highlight = panel.querySelector('#diy-highlight');
    const iframe = panel.querySelector('#diy-preview');
    ta.value = DIY_TEMPLATE;
    const updateHighlight = () => { highlight.innerHTML = highlightCode(ta.value); highlight.scrollTop = ta.scrollTop; highlight.scrollLeft = ta.scrollLeft; };
    ta.addEventListener('input', updateHighlight); ta.addEventListener('scroll', () => { highlight.scrollTop = ta.scrollTop; highlight.scrollLeft = ta.scrollLeft; });
    const run = () => { iframe.srcdoc = ta.value; };
    panel.querySelector('#btn-diy-format').addEventListener('click', () => { ta.value = formatCode(ta.value); updateHighlight(); showToast('代码已格式化'); });
    panel.querySelector('#btn-diy-reset').addEventListener('click', () => { ta.value = DIY_TEMPLATE; updateHighlight(); showToast('已恢复 Three.js 雨幕示例'); });
    panel.querySelector('#btn-diy-run').addEventListener('click', run);
    const requireLogin = () => { if (isLoggedIn()) return true; showToast('请先登录后复制或导出代码'); location.hash = '#/login'; return false; };
    panel.querySelector('#btn-diy-html').addEventListener('click', () => { if (requireLogin()) downloadCode('diy-particle-effect', ta.value, 'html'); });
    panel.querySelector('#btn-diy-txt').addEventListener('click', () => { if (requireLogin()) downloadCode('diy-particle-effect', ta.value, 'txt'); });
    updateHighlight(); run();
  }

  const renderers = { compress: renderCompress, color: renderColor, params: renderParams, diy: renderDIY };

  tabs.forEach((tab) => tab.addEventListener('click', () => {
    tabs.forEach((t) => t.classList.remove('chip-active'));
    tab.classList.add('chip-active');
    renderers[tab.dataset.tool]();
  }));

  // 根据子路由初始化对应工具（默认「代码压缩」）
  const initial = renderers[tool] ? tool : 'compress';
  tabs.forEach((t) => t.classList.toggle('chip-active', t.dataset.tool === initial));
  renderers[initial]();
}
