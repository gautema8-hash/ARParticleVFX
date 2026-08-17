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
import { renderFavorites } from './views/favorites.js';
import { getEffect } from './effects/registry.js';
import { renderFeedback } from './views/feedback.js';
import { renderKnowledge } from './views/knowledge.js';
import * as THREE from 'three';

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
  '/admin': renderAdmin,
  '/favorites': renderFavorites,
  '/feedback': renderFeedback,
  '/knowledge': renderKnowledge
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
  '/favorites': '我的收藏 - 粒子特效库',
  '/feedback': '用户反馈 - 粒子特效库',
  '/knowledge': '科技指南 - 粒子特效库',
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
    requestAnimationFrame(() => initPageSpace(app));
  }

  window.addEventListener('hashchange', parse);
  parse();
}

let pageSpaceCleanup = null;
function initPageSpace(app) {
  if (pageSpaceCleanup) { pageSpaceCleanup(); pageSpaceCleanup = null; }
  const page = app.querySelector('.page');
  if (!page || page.classList.contains('admin-shell')) return;
  const canvas=document.createElement('canvas'); canvas.className='page-space-canvas'; page.prepend(canvas);
  const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(55,1,.1,100); camera.position.z=9; const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:false});
  const count=1700,pos=new Float32Array(count*3),col=new Float32Array(count*3),palette=[new THREE.Color('#22d3ee'),new THREE.Color('#8b5cf6'),new THREE.Color('#f472b6'),new THREE.Color('#fde047')];
  for(let i=0;i<count;i++){const k=i*3,r=3+Math.random()*15,a=Math.random()*Math.PI*2;pos[k]=Math.cos(a)*r;pos[k+1]=(Math.random()-.5)*10+Math.sin(a)*.5;pos[k+2]=Math.sin(a)*r-5;const c=palette[i%palette.length];col[k]=c.r;col[k+1]=c.g;col[k+2]=c.b;}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('color',new THREE.BufferAttribute(col,3));const stars=new THREE.Points(geo,new THREE.PointsMaterial({size:.045,vertexColors:true,transparent:true,opacity:.65,blending:THREE.AdditiveBlending}));scene.add(stars);const sea=new THREE.Mesh(new THREE.PlaneGeometry(28,16,45,24),new THREE.MeshBasicMaterial({color:'#075985',wireframe:true,transparent:true,opacity:.12}));sea.rotation.x=-Math.PI/2;sea.position.y=-4;scene.add(sea);
  let raf=0,t=0;const resize=()=>{const r=page.getBoundingClientRect();renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();};const loop=()=>{t+=.002;stars.rotation.y=t*.2;sea.position.z=Math.sin(t)*2;renderer.render(scene,camera);raf=requestAnimationFrame(loop);};resize();loop();addEventListener('resize',resize);pageSpaceCleanup=()=>{cancelAnimationFrame(raf);renderer.dispose();canvas.remove();};
}
