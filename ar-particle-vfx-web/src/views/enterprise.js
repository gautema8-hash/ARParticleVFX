// src/views/enterprise.js — 企业服务页（数据驱动 + 联系表单）
import { showToast } from '../lib/toast.js';

const SERVICES = [
  {
    id: 'custom', name: '定制开发', desc: '品牌 Logo 粒子、产品主题 AR、活动定制粒子',
    price: '¥3000~20000 / 个',
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
      <p class="muted">高客单价定制，覆盖品牌、授权、API 全场景</p>
      <div class="grid grid-3">${cards}</div>

      <div class="card" style="margin-top:24px">
        <h3>联系我们</h3>
        <p class="card-desc">留下需求，我们将在一个工作日内联系你</p>
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

    const subject = encodeURIComponent(`【企业服务咨询】${type}`);
    const body = encodeURIComponent(
      `姓名：${name}\n公司：${company || '—'}\n联系方式：${contact}\n需求类型：${type}\n需求描述：\n${desc}`
    );
    // 无后端方案：生成邮件草稿（替换为真实商务邮箱）
    window.location.href = `mailto:sales@arpfx.com?subject=${subject}&body=${body}`;
    showToast('已打开邮件客户端，请发送');
  });
}

