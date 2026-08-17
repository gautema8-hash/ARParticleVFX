// src/views/detail.js — 特效详情页（预览 + 复制/导出）
import { getEffect, loadRemoteEffects } from '../effects/registry.js';
import { buildSingleFileHTML, copyCode, downloadCode } from '../exporter.js';
import { buildEffectHTML } from '../effects/particleEffects.js';
import { showToast } from '../lib/toast.js';
import { api, getUser, isLoggedIn } from '../api.js';

function canViewSource() {
  const user = getUser();
  return !!user && (Number(user.role) === 1 || Number(user.tier) > 0);
}

function escapeHtml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function highlightCode(source, language) {
  let code = escapeHtml(source);
  code = code.replace(/(&lt;!--[\s\S]*?--&gt;|\/\/.*?$|\/\*[\s\S]*?\*\/)/gm, '<span class="tok-comment">$1</span>');
  code = code.replace(/(&quot;.*?&quot;|&#39;.*?&#39;|`.*?`)/g, '<span class="tok-string">$1</span>');
  if (language === 'html') code = code.replace(/(&lt;\/?)([a-zA-Z][\w-]*)/g, '$1<span class="tok-tag">$2</span>');
  code = code.replace(/\b(const|let|var|function|return|new|if|else|for|async|await|true|false|null|class|export|import)\b/g, '<span class="tok-keyword">$1</span>');
  code = code.replace(/\b(THREE|Math|window|document|canvas|renderer|scene|camera)\b/g, '<span class="tok-api">$1</span>');
  return code;
}

function sourceParts(html) {
  const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1].trim()).filter(Boolean);
  const scripts = [...html.matchAll(/<script(?:[^>]*)>([\s\S]*?)<\/script>/gi)].map((m) => m[1].trim()).filter(Boolean);
  return { html, css: styles.join('\n\n'), js: scripts[scripts.length - 1] || '' };
}

export async function renderDetail(app, id) {
  let e = getEffect(id);
  if (!e) {
    const remote = await loadRemoteEffects({});
    e = remote.find((item) => item.id === id);
  }

  if (!e) {
    app.innerHTML = `
      <div class="page">
        <h2 class="section-title">特效不存在</h2>
        <a class="btn" href="#/effects">返回特效中心</a>
      </div>
    `;
    return;
  }

  const tags = e.tags.map((t) => `<span class="tag">${t}</span>`).join(' ');
  const cta = e.mode === 'particle'
    ? `<span class="btn" style="opacity:.6;pointer-events:none">下方实时预览</span>`
    : e.mode
      ? `<a class="btn btn-primary" href="#/demo?mode=${e.mode}">免费体验</a>`
      : `<span class="btn" style="opacity:.5;pointer-events:none">即将上线</span>`;

  const sourceAccess = (e.mode === 'particle' || e.sourceHtml) && canViewSource();
  app.innerHTML = `
    <div class="page">
      <h2 class="section-title">${e.name}</h2>
      <div class="muted" style="margin-bottom:16px">${tags}</div>
      <div class="preview-box" id="preview-box">${e.mode === 'particle' ? '' : (e.mode ? '已接入 Demo，点「免费体验」查看实景效果' : '待实现模板')}</div>
      <div class="toolbar">
        ${cta}
        <button class="btn" id="btn-copy" type="button">一键复制代码</button>
        <button class="btn" id="btn-html" type="button">导出 HTML</button>
        <button class="btn" id="btn-txt" type="button">导出 TXT</button>
        <button class="btn" id="btn-fav" type="button">收藏</button>
        <button class="btn btn-primary" id="btn-buy" type="button">购买</button>
      </div>
      ${sourceAccess ? `
        <section class="source-panel" id="source-panel">
          <div class="source-head"><div><span class="source-kicker">MEMBER SOURCE ACCESS</span><h3>特效源代码</h3></div><span class="source-lock">商业授权 · 已解锁</span></div>
          <div class="source-tabs"><button class="chip chip-active" data-source-tab="html" type="button">HTML</button><button class="chip" data-source-tab="css" type="button">CSS</button><button class="chip" data-source-tab="js" type="button">JS</button></div>
          <div class="source-code-wrap"><pre><code id="source-code">正在加载源代码…</code></pre></div>
        </section>` : ''}
    </div>
  `;

  // 普通粒子特效：内嵌实时预览（自包含 iframe）
  if (e.mode === 'particle') {
    const iframe = document.createElement('iframe');
    // 所有普通粒子均升级为 Three.js 3D 点云，使用更高预览区域。
    iframe.style.cssText = 'width:100%;height:560px;border:none;border-radius:10px;background:#050816';
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    iframe.setAttribute('allow', 'camera; microphone');
    app.querySelector('#preview-box').appendChild(iframe);
    const htmlPromise = e.sourceHtml ? Promise.resolve(e.sourceHtml) : buildEffectHTML(e);
    htmlPromise.then((html) => {
      iframe.srcdoc = html;
      if (!sourceAccess) return;
      const parts = sourceParts(html);
      const sourceCode = app.querySelector('#source-code');
      let activeTab = 'html';
      const renderSource = () => { sourceCode.innerHTML = highlightCode(parts[activeTab], activeTab); };
      app.querySelectorAll('[data-source-tab]').forEach((tab) => tab.addEventListener('click', () => {
        activeTab = tab.dataset.sourceTab;
        app.querySelectorAll('[data-source-tab]').forEach((item) => item.classList.toggle('chip-active', item === tab));
        renderSource();
      }));
      renderSource();
    });
  }

  // 绑定工具栏事件
  app.querySelector('#btn-copy').addEventListener('click', async () => {
    if (!isLoggedIn()) { showToast('请先登录后复制代码'); location.hash = '#/login'; return; }
    const html = await buildSingleFileHTML(id, { effect: e });
    const ok = await copyCode(html);
    showToast(ok ? '已复制到剪贴板，粘贴到 .html 即可运行' : '复制失败，请手动选择代码');
  });
  app.querySelector('#btn-html').addEventListener('click', async () => {
    if (!isLoggedIn()) { showToast('请先登录后导出 HTML'); location.hash = '#/login'; return; }
    const html = await buildSingleFileHTML(id, { effect: e });
    downloadCode(e.name, html, 'html');
    showToast('已导出 HTML 文件');
  });
  app.querySelector('#btn-txt').addEventListener('click', async () => {
    if (!isLoggedIn()) { showToast('请先登录后导出 TXT'); location.hash = '#/login'; return; }
    const html = await buildSingleFileHTML(id, { effect: e });
    downloadCode(e.name, html, 'txt');
    showToast('已导出 TXT 文件');
  });
  const favBtn = app.querySelector('#btn-fav');
  let favorited = false;

  // 已登录则查询当前收藏状态
  if (isLoggedIn()) {
    api.favorites()
      .then((codes) => {
        favorited = (codes || []).includes(id);
        favBtn.textContent = favorited ? '取消收藏' : '收藏';
      })
      .catch(() => {});
  }

  favBtn.addEventListener('click', async () => {
    if (!isLoggedIn()) {
      showToast('请先登录');
      location.hash = '#/login';
      return;
    }
    try {
      if (favorited) {
        await api.removeFavorite(id);
        favorited = false;
        favBtn.textContent = '收藏';
        showToast('已取消收藏');
      } else {
        await api.addFavorite(id);
        favorited = true;
        favBtn.textContent = '取消收藏';
        showToast('已收藏');
      }
    } catch (err) {
      showToast(err.message);
    }
  });

  // 购买：单特效下单 + 模拟支付
  app.querySelector('#btn-buy').addEventListener('click', async () => {
    if (!isLoggedIn()) {
      showToast('请先登录');
      location.hash = '#/login';
      return;
    }
    const btnBuy = app.querySelector('#btn-buy');
    btnBuy.disabled = true;
    try {
      const order = await api.orderCreate({ orderType: 0, effectCode: id });
      await api.mockPayCallback(order.orderNo);
      showToast(`已购买「${e.name}」，可前往我的订单查看`);
      location.hash = '#/orders';
    } catch (err) {
      showToast(err.message);
    } finally {
      btnBuy.disabled = false;
    }
  });
}
