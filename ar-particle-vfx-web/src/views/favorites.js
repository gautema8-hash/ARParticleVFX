import { api, isLoggedIn } from '../api.js';
import { getEffect, effectCover } from '../effects/registry.js';

export async function renderFavorites(app) {
  if (!isLoggedIn()) {
    app.innerHTML = '<div class="page"><h2 class="section-title">我的收藏</h2><div class="card"><p class="muted">登录后查看你收藏的特效</p><a class="btn btn-primary" href="#/login">去登录</a></div></div>';
    return;
  }
  app.innerHTML = '<div class="page"><h2 class="section-title">我的收藏</h2><div id="favorites-box" class="muted">加载中…</div></div>';
  const box = app.querySelector('#favorites-box');
  try {
    const codes = await api.favorites();
    if (!codes?.length) { box.innerHTML = '<div class="card"><p class="muted">还没有收藏特效，去<a href="#/effects">特效中心</a>看看吧。</p></div>'; return; }
    const effects = await Promise.all(codes.map(async (code) => {
      const local = getEffect(code); if (local) return local;
      try { const remote = await api.effectDetail(code); return { id: remote.effectCode, name: remote.effectName, description: remote.description, tags: String(remote.tags || '').split(','), coverBase64: remote.coverBase64, coverUrl: remote.coverUrl }; } catch { return null; }
    }));
    box.innerHTML = `<div class="grid">${effects.filter(Boolean).map((e) => `<div class="card favorite-card"><a class="favorite-card-link" href="#/effect/${e.id}"><div class="card-cover" style="background-image:url('${effectCover(e)}')"></div><span class="tag">${e.tags?.[0] || '粒子特效'}</span><h3>♥ ${e.name}</h3><p class="card-desc">${e.description || ''}</p></a><button class="btn favorite-remove" data-remove-favorite="${e.id}" type="button">取消收藏</button></div>`).join('')}</div>`;
    box.querySelectorAll('[data-remove-favorite]').forEach((button) => button.addEventListener('click', async () => { button.disabled = true; try { await api.removeFavorite(button.dataset.removeFavorite); renderFavorites(app); } catch (error) { button.disabled = false; } }));
  } catch (error) { box.innerHTML = `<div class="card">加载失败：${error.message}</div>`; }
}
