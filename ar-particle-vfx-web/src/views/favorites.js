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
    let codes = await api.favorites();
    if (!codes) codes = [];
    const effects = await Promise.all(codes.map(async (code) => {
      const local = getEffect(code); if (local) return local;
      try { const remote = await api.effectDetail(code); return { id: remote.effectCode, name: remote.effectName, description: remote.description, tags: String(remote.tags || '').split(','), coverBase64: remote.coverBase64, coverUrl: remote.coverUrl }; } catch { return null; }
    }));
    const articles = await api.knowledgeList(); const articleIds=JSON.parse(localStorage.getItem('arpfx_knowledge_favorites')||'[]');
    box.innerHTML = `<div class="favorite-tabs"><button class="btn btn-primary" data-fav-tab="effects" type="button">特效收藏</button><button class="btn" data-fav-tab="articles" type="button">博文收藏</button></div><div class="grid" data-fav-panel="effects">${effects.filter(Boolean).map((e) => `<div class="card favorite-card"><a class="favorite-card-link" href="#/effect/${e.id}"><div class="card-cover" style="background-image:url('${effectCover(e)}')"></div><span class="tag">${e.tags?.[0] || '粒子特效'}</span><h3>♥ ${e.name}</h3><p class="card-desc">${e.description || ''}</p></a><button class="btn favorite-remove" data-remove-favorite="${e.id}" type="button">取消收藏</button></div>`).join('')}</div><div class="grid" data-fav-panel="articles" hidden>${articles.filter(a=>articleIds.includes(String(a.id))).map(a=>`<article class="card"><span class="tag">${a.category||'科技指南'}</span><h3>${a.title}</h3><p class="card-desc">${a.summary||''}</p><p class="muted">发布人：${a.authorName||'官方'} · 浏览 ${a.viewCount||0} · 收藏 ${a.favoriteCount||0} · 发布时间 ${(a.createTime||'').replace('T',' ')}</p><button class="btn" data-remove-article="${a.id}" type="button">取消收藏</button></article>`).join('')||'<p class="muted">暂无博文收藏。</p>'}</div>`;
    box.querySelectorAll('[data-fav-tab]').forEach(t=>t.addEventListener('click',()=>{box.querySelectorAll('[data-fav-panel]').forEach(p=>p.hidden=p.dataset.favPanel!==t.dataset.favTab);box.querySelectorAll('[data-fav-tab]').forEach(x=>x.classList.toggle('btn-primary',x===t));}));
    box.querySelectorAll('[data-remove-favorite]').forEach((button) => button.addEventListener('click', async () => { button.disabled = true; try { await api.removeFavorite(button.dataset.removeFavorite); renderFavorites(app); } catch (error) { button.disabled = false; } }));
    box.querySelectorAll('[data-remove-article]').forEach((button) => button.addEventListener('click', () => { const ids=JSON.parse(localStorage.getItem('arpfx_knowledge_favorites')||'[]').filter(id=>id!==button.dataset.removeArticle); localStorage.setItem('arpfx_knowledge_favorites',JSON.stringify(ids)); renderFavorites(app); }));
  } catch (error) { box.innerHTML = `<div class="card">加载失败：${error.message}</div>`; }
}
