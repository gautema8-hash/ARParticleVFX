// src/router.js — hash 路由
import { renderHome } from './views/home.js';
import { renderCatalog } from './views/catalog.js';
import { renderDetail } from './views/detail.js';
import { renderAR } from './views/ar.js';
import { renderPricing } from './views/pricing.js';
import { renderEnterprise } from './views/enterprise.js';
import { renderTools } from './views/tools.js';
import { renderHelp } from './views/help.js';
import { renderLogin } from './views/login.js';
import { renderOrders } from './views/orders.js';
import { renderAdmin } from './views/admin.js';
import { getEffect } from './effects/registry.js';

const routes = {
  '/': renderHome,
  '/effects': renderCatalog,
  '/ar': renderAR,
  '/pricing': renderPricing,
  '/enterprise': renderEnterprise,
  '/tools': renderTools,
  '/help': renderHelp,
  '/login': renderLogin,
  '/orders': renderOrders,
  '/admin': renderAdmin
};

const TITLES = {
  '/': 'WebAR粒子特效代码库 - 一键复制开箱即用',
  '/effects': '特效中心 - 粒子特效库',
  '/ar': 'WebAR 实景特效',
  '/pricing': '定价 - 会员商用授权',
  '/enterprise': '企业服务 - 粒子特效定制',
  '/tools': '工具箱 - 代码压缩/颜色拾取/参数生成器',
  '/help': '帮助中心',
  '/login': '登录 - 会员中心',
  '/orders': '我的订单',
  '/admin': '管理后台',
  '/demo': '免费体验 - AR 手势粒子'
};

export function initRouter(app, demoUI = {}) {
  const { panel, hint } = demoUI;

  function setTitle(title) {
    document.title = title;
  }

  function showDemo() {
    app.style.display = 'none';
    if (panel) panel.style.display = '';
    if (hint) hint.style.display = '';
  }

  function showPage() {
    app.style.display = '';
    if (panel) panel.style.display = 'none';
    if (hint) hint.style.display = 'none';
  }

  function parse() {
    const raw = location.hash.replace(/^#/, '') || '/';
    const [path, query] = raw.split('?');
    const params = new URLSearchParams(query || '');
    const seg = path.split('/').filter(Boolean);

    // 免费体验：展示原始粒子 Demo（#scene + 参数面板）
    if (path === '/demo') {
      showDemo();
      setTitle(TITLES['/demo']);
      const mode = params.get('mode');
      if (mode) window.dispatchEvent(new CustomEvent('demo:mode', { detail: mode }));
      return;
    }

    showPage();

    // 特效详情：#/effect/:id
    if (seg[0] === 'effect' && seg[1]) {
      const e = getEffect(seg[1]);
      setTitle(e ? `${e.name} - 粒子特效` : '特效详情');
      renderDetail(app, seg[1]);
      return;
    }

    // 工具箱子页：#/tools/compress 等
    if (seg[0] === 'tools') {
      setTitle(TITLES['/tools']);
      renderTools(app, seg[1]);
      return;
    }

    // 帮助中心子页：#/help/tutorial 等
    if (seg[0] === 'help') {
      setTitle(TITLES['/help']);
      renderHelp(app, seg[1]);
      return;
    }

    setTitle(TITLES[path] || TITLES['/']);
    (routes[path] || routes['/'])(app, params);
  }

  window.addEventListener('hashchange', parse);
  parse();
}

