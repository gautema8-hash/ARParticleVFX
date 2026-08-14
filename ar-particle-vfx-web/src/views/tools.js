// src/views/tools.js — 工具箱（代码压缩 / 颜色拾取 / 参数生成器）
import { minifyCode } from '../tools/compress.js';
import { colorFormats } from '../tools/color.js';
import { buildParamsCode } from '../tools/params.js';
import { showToast } from '../lib/toast.js';

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('已复制');
  } catch {
    showToast('复制失败');
  }
}

export function renderTools(app) {
  app.innerHTML = `
    <div class="page">
      <h2 class="section-title">工具箱</h2>
      <p class="muted">免费留存工具</p>

      <div class="chips" id="tool-tabs">
        <button class="chip chip-active" data-tool="compress" type="button">代码压缩</button>
        <button class="chip" data-tool="color" type="button">颜色拾取</button>
        <button class="chip" data-tool="params" type="button">参数生成器</button>
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

  const renderers = { compress: renderCompress, color: renderColor, params: renderParams };

  tabs.forEach((tab) => tab.addEventListener('click', () => {
    tabs.forEach((t) => t.classList.remove('chip-active'));
    tab.classList.add('chip-active');
    renderers[tab.dataset.tool]();
  }));

  renderCompress(); // 默认展示「代码压缩」
}

