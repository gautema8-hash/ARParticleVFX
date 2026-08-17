// src/views/enterprise.js — 企业服务页（数据驱动 + 联系表单）
import { showToast } from '../lib/toast.js';

const SERVICES = [
  {
    id: 'custom', name: '定制开发', desc: '品牌 Logo 粒子、产品主题 AR、活动定制粒子',
    price: '¥0~1000 / 个',
    features: ['专属粒子特效设计', '品牌元素融合', '源码交付 + 商用授权']
  },
  {
    id: 'license', name: '素材授权', desc: '全库特效商用授权',
    price: '年付制',
    features: ['全库特效商用', '持续上新', '企业级授权']
  },
  {
    id: 'api', name: 'API 接入', desc: '对接建站工具 / H5 编辑器',
    price: '按调用量计费',
    features: ['REST API', '鉴权与配额', '技术支持']
  }
];

const NEED_TYPES = ['定制开发', '素材授权', 'API 接入', '其他'];

export function renderEnterprise(app) {
  const cards = SERVICES.map((s) => `
    <div class="card">
      <h3>${s.name}</h3>
      <div class="service-price">${s.price}</div>
      <p class="card-desc">${s.desc}</p>
      <ul class="feature-list">${s.features.map((f) => `<li>✓ ${f}</li>`).join('')}</ul>
    </div>`).join('');

  app.innerHTML = `
    <div class="page">
      <h2 class="section-title">企业服务</h2>
      <p class="muted">定制开发、素材授权、API 接入一站式服务，定制开发 ¥0~1000 / 个</p>
      <div class="grid grid-3">${cards}</div>

      <div class="card" style="margin-top:24px">
        <h3>联系我们</h3>
        <p class="card-desc">留下需求，我们将在一个工作日内联系你</p>
        <a class="btn" href="mailto:xuyangtogether@163.com" style="margin-bottom:14px;display:inline-block">联系我们：xuyangtogether@163.com</a>
        <div class="form-row"><label>姓名 *</label><input type="text" id="f-name" placeholder="您的称呼"></div>
        <div class="form-row"><label>公司</label><input type="text" id="f-company" placeholder="公司/团队名称"></div>
        <div class="form-row"><label>联系方式 *</label><input type="text" id="f-contact" placeholder="邮箱 / 微信"></div>
        <div class="form-row"><label>需求类型</label><select id="f-type">${NEED_TYPES.map((t) => `<option>${t}</option>`).join('')}</select></div>
        <div class="form-row"><label>需求描述 *</label><textarea id="f-desc" rows="4" placeholder="简述定制需求"></textarea></div>
        <button class="btn btn-primary" id="btn-submit" type="button">提交需求</button>
      </div>
    </div>
  `;

  app.querySelector('#btn-submit').addEventListener('click', () => {
    const name = app.querySelector('#f-name').value.trim();
    const contact = app.querySelector('#f-contact').value.trim();
    const desc = app.querySelector('#f-desc').value.trim();
    const company = app.querySelector('#f-company').value.trim();
    const type = app.querySelector('#f-type').value;

    if (!name || !contact || !desc) {
      showToast('请填写姓名、联系方式和需求描述');
      return;
    }
    if (!localStorage.getItem('arpfx_token')) {
      showToast('请先登录后提交需求');
      location.hash = '#/login';
      return;
    }

    showToast('需求正在提交，请稍候…');
    fetch('/api/service/requests', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(localStorage.getItem('arpfx_token') ? { Authorization: `Bearer ${localStorage.getItem('arpfx_token')}` } : {}) }, body: JSON.stringify({ name, company, contact, type, description: desc }) })
      .then(async (response) => { const result = await response.json(); if (!response.ok || result.code !== 200) throw new Error(result.message || '提交失败'); showToast('需求已提交，官方账号会尽快联系你'); })
      .catch((error) => { showToast(error.message || '提交失败，请稍后重试'); });
  });
}
