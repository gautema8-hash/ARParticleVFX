// src/views/catalog.js — 特效中心列表页
import { CATEGORIES, listEffects, categoryName, loadRemoteEffects, effectCover } from '../effects/registry.js';

export function renderCatalog(app, params) {
  const cat = params.get('category') || 'all';

  const tabs = CATEGORIES.map((c) => `
    <a class="chip ${c.id === cat ? 'chip-active' : ''}" href="#/effects?category=${c.id}">${c.name}</a>
  `).join('');

  const effects = listEffects({ category: cat });
  const renderCards = (items) => items.map((e) => `
    <a class="card" href="#/effect/${e.id}">
      <div class="card-cover" style="background-image:url('${effectCover(e)}')"></div>
      <span class="tag">${e.tags[0] || ''}</span>
      <h3>${e.name}</h3>
      <p class="card-desc">${e.description}</p>
    </a>`).join('');


  app.innerHTML = `
    <div class="page">
      <h2 class="section-title">特效中心 · ${categoryName(cat)}</h2>
      <div class="chips">${tabs}</div>
      <div class="grid" id="effect-cards">${renderCards(effects)}</div>
    </div>
  `;
  loadRemoteEffects({ category: cat }).then((remote) => {
    const merged = [...effects]; remote.forEach((item) => { if (!merged.some((local) => local.id === item.id)) merged.push(item); });
    const target = app.querySelector('#effect-cards'); if (target) target.innerHTML = renderCards(merged);
  });
}
