// src/nav.js
// 顶部导航栏：数据驱动渲染 + 交互（下拉 / 汉堡 / 移动端手风琴）
import { isLoggedIn, getUser } from './api.js';
import { toggleTheme } from './ui.js';

const MENUS = [
  { id: 'effects', label: '特效中心', href: '#/effects', children: [
    { label: '全部特效', href: '#/effects' },
    { label: '动物粒子', href: '#/effects?category=animal' },
    { label: '花卉粒子', href: '#/effects?category=flower' },
    { label: '几何粒子', href: '#/effects?category=geometry' },
    { label: '节日粒子', href: '#/effects?category=festival' },
    { label: '自然粒子', href: '#/effects?category=nature' },
    { label: '科技粒子', href: '#/effects?category=tech' }
  ]},
  { id: 'ar', label: 'WebAR实景', href: '#/ar', children: [
    { label: '手势交互', href: '#/demo?mode=galaxy' },
    { label: '人像粒子', href: '#/demo?mode=photoParticle' },
    { label: '图像识别', href: '#/ar?type=marker' },
    { label: 'AR 专题', href: '#/ar' }
  ]},
  { id: 'pricing', label: '定价', href: '#/pricing' },
  { id: 'enterprise', label: '企业服务', href: '#/enterprise', children: [
    { label: '定制开发', href: '#/enterprise?type=custom' },
    { label: '素材授权', href: '#/enterprise?type=license' },
    { label: 'API 接入', href: '#/enterprise?type=api' }
  ]},
  { id: 'tools', label: '工具箱', href: '#/tools', children: [
    { label: '代码压缩', href: '#/tools/compress' },
    { label: '颜色拾取', href: '#/tools/color' },
    { label: '参数生成器', href: '#/tools/params' },
    { label: 'DIY 特效', href: '#/tools/diy' }
  ]},
  { id: 'help', label: '帮助中心', href: '#/help', children: [
    { label: '使用教程', href: '#/help/tutorial' },
    { label: '授权说明', href: '#/help/license' },
    { label: '常见问题', href: '#/help/faq' }
  ]}
];

function buildNav() {
  const nav = document.createElement('nav');
  nav.className = 'site-nav';
  nav.setAttribute('aria-label', '主导航');

  const logo = document.createElement('a');
  logo.className = 'nav-logo';
  logo.href = '#/';
  logo.innerHTML = '<span class="nav-logo-mark">AR</span>粒子特效库';
  nav.appendChild(logo);

  const menu = document.createElement('ul');
  menu.className = 'nav-menu';
  MENUS.forEach((m) => {
    const li = document.createElement('li');
    li.className = 'nav-item' + (m.children ? ' has-dropdown' : '');

    const a = document.createElement('a');
    a.className = 'nav-link';
    a.href = m.href;
    a.textContent = m.label;
    li.appendChild(a);

    if (m.children) {
      const sub = document.createElement('ul');
      sub.className = 'nav-dropdown';
      m.children.forEach((c) => {
        const subLi = document.createElement('li');
        const subA = document.createElement('a');
        subA.href = c.href;
        subA.textContent = c.label;
        subLi.appendChild(subA);
        sub.appendChild(subLi);
      });
      li.appendChild(sub);
    }
    menu.appendChild(li);
  });
  nav.appendChild(menu);

  const actions = document.createElement('div');
  actions.className = 'nav-actions';
  actions.innerHTML =
    '<button class="nav-search" type="button" aria-label="搜索">🔍</button>' +
    '<button class="nav-theme" type="button" aria-label="切换主题" title="切换深空/白昼主题">☼</button>' +
    '<a class="nav-demo" href="#/demo">免费体验</a>' +
    '<a class="nav-login" id="nav-auth" href="#/login">登录</a>' +
    '<a class="nav-cta" href="#/pricing">开通会员</a>';
  nav.appendChild(actions);

  const burger = document.createElement('button');
  burger.className = 'nav-burger';
  burger.type = 'button';
  burger.setAttribute('aria-label', '菜单');
  burger.innerHTML = '<span></span><span></span><span></span>';
  nav.appendChild(burger);

  return nav;
}

function bindNavEvents(nav) {
  const burger = nav.querySelector('.nav-burger');
  const themeButton = nav.querySelector('.nav-theme');
  themeButton.addEventListener('click', () => {
    const day = toggleTheme();
    themeButton.textContent = day ? '☾' : '☼';
    themeButton.title = day ? '切换深空主题' : '切换白昼主题';
  });

  // 移动端：汉堡开关
  burger.addEventListener('click', () => {
    nav.classList.toggle('nav-open');
  });

  // 移动端：父级菜单点击展开/收起子菜单
  nav.querySelectorAll('.nav-item.has-dropdown > .nav-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      if (window.innerWidth > 768) return;
      e.preventDefault();
      const item = link.parentElement;
      const wasOpen = item.classList.contains('open');
      nav.querySelectorAll('.nav-item.open').forEach((i) => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });

  // 点击子菜单项后收起移动端菜单
  nav.querySelectorAll('.nav-dropdown a').forEach((a) => {
    a.addEventListener('click', () => {
      if (window.innerWidth <= 768) nav.classList.remove('nav-open');
    });
  });
}

export function initNav(container) {
  if (!container) return null;
  const nav = buildNav();
  container.replaceChildren(nav);
  bindNavEvents(nav);
  const themeButton = nav.querySelector('.nav-theme');
  const isDay = document.body.classList.contains('theme-day');
  themeButton.textContent = isDay ? '☾' : '☼';
  themeButton.title = isDay ? '切换深空主题' : '切换白昼主题';
  syncAuth();
  window.addEventListener('auth:change', syncAuth);
  return nav;
}

// 登录态联动：已登录显示昵称，未登录显示「登录」
function syncAuth() {
  const link = document.querySelector('#nav-auth');
  if (!link) return;
  if (isLoggedIn()) {
    const user = getUser();
    link.textContent = user?.nickname || user?.username || '我的';
  } else {
    link.textContent = '登录';
  }
}
