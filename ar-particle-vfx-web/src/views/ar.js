// src/views/ar.js — WebAR实景专题页
import { listEffects, loadRemoteEffects, effectCover } from '../effects/registry.js';
import { showToast } from '../lib/toast.js';

export function renderAR(app, params) {
  const arEffects = listEffects({ category: 'ar' });

  const cards = arEffects.map((e) => `
    <div class="card">
      <div class="card-cover" style="background-image:url('${effectCover(e)}')"></div>
      <span class="tag">${e.tags.join(' · ')}</span>
      <h3>${e.name}</h3>
      <p class="card-desc">${e.description}</p>
      <a class="btn btn-primary" style="margin-top:12px" href="#/demo?mode=${e.mode}">立即体验</a>
    </div>`).join('');

  const demoUrl = location.origin + location.pathname + '#/demo';

  app.innerHTML = `
    <div class="page">
      <h2 class="section-title">WebAR 实景特效</h2>
      <p class="muted">无需下载 App，浏览器调用摄像头，粒子叠加真实场景</p>

      <div class="grid grid-3" id="ar-effect-cards">${cards}</div>

      <h3 style="margin-top:32px">手机扫码体验</h3>
      <div class="card" style="display:flex;align-items:center;gap:20px;flex-wrap:wrap">
        <img class="qr"
             src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(demoUrl)}"
             alt="扫码体验二维码" onerror="this.style.display='none'">
        <div style="min-width:220px;flex:1">
          <p class="card-desc" style="margin:0 0 12px">用手机扫码打开，或在手机浏览器访问：</p>
          <code style="word-break:break-all;color:#22d3ee;font-size:13px">${demoUrl}</code>
          <div style="margin-top:12px">
            <button class="btn" id="btn-copy-url" type="button">复制体验链接</button>
          </div>
        </div>
      </div>
    </div>
  `;

  loadRemoteEffects({ category: 'ar' }).then((remote) => {
    const target = app.querySelector('#ar-effect-cards'); if (!target) return;
    const merged = [...arEffects]; remote.forEach((item) => { if (!merged.some((local) => local.id === item.id)) merged.push(item); });
    target.innerHTML = merged.map((e) => `<div class="card"><div class="card-cover" style="background-image:url('${effectCover(e)}')"></div><span class="tag">${e.tags.join(' · ')}</span><h3>${e.name}</h3><p class="card-desc">${e.description}</p><a class="btn btn-primary" style="margin-top:12px" href="#/effect/${e.id}">查看特效</a></div>`).join('');
  });

  app.querySelector('#btn-copy-url')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(demoUrl);
      showToast('体验链接已复制');
    } catch {
      showToast('复制失败，请手动复制');
    }
  });
}
