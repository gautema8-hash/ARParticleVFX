// src/views/pricing.js — 定价页（数据驱动 + 会员订阅下单）
import { showToast } from '../lib/toast.js';
import { api, isLoggedIn } from '../api.js';

const TIERS = [
  {
    id: 'free', name: '免费版', price: '¥0', period: '',
    desc: '引流钩子，每日 3 次额度',
    features: ['每日 3 次复制/导出', '代码带版权标识', '仅限学习使用'],
    cta: '开始使用', href: '#/effects', featured: false
  },
  {
    id: 'pro', name: '个人 Pro', price: '¥1', period: '/月', tier: 1,
    desc: '个人开发者与外包从业者，首月体验价',
    features: ['全量普通特效不限次', 'AR 特效每日 10 次', '个人商用授权', '参数调节面板'],
    cta: '立即开通', href: null, featured: true
  },
  {
    id: 'enterprise', name: '企业版', price: '¥99', period: '/月', tier: 2,
    desc: '企业商用与团队协作',
    features: ['全量特效 + AR 无限制', '企业商用授权', '3 个子账号', '定制服务享折扣'],
    cta: '立即开通', href: null, featured: false
  }
];

export function renderPricing(app) {
  const cards = TIERS.map((t) => `
    <div class="card pricing ${t.featured ? 'featured' : ''}">
      <h3>${t.name}</h3>
      <div class="price">${t.price}<span style="font-size:14px;font-weight:400;color:#9ca3af">${t.period}</span></div>
      <p class="card-desc">${t.desc}</p>
      <ul>${t.features.map((f) => `<li>✓ ${f}</li>`).join('')}</ul>
      <button class="btn ${t.featured ? 'btn-primary' : ''}" data-tier="${t.id}" type="button">${t.cta}</button>
    </div>`).join('');

  app.innerHTML = `
    <div class="page">
      <h2 class="section-title">定价</h2>
      <p class="muted">免费引流，会员解锁商用授权</p>
      <div class="grid grid-3">${cards}</div>

      <h3 style="margin-top:32px">套餐对比</h3>
      <div class="table-wrap">
        <table class="compare">
          <thead><tr><th>功能</th><th>免费</th><th>个人 Pro</th><th>企业</th></tr></thead>
          <tbody>
            <tr><td>普通特效</td><td>每日 3 次</td><td>不限次</td><td>不限次</td></tr>
            <tr><td>AR 特效</td><td>—</td><td>每日 10 次</td><td>无限制</td></tr>
            <tr><td>商用授权</td><td>—</td><td>个人</td><td>企业</td></tr>
            <tr><td>子账号</td><td>—</td><td>—</td><td>3 个</td></tr>
            <tr><td>版权标识去除</td><td>—</td><td>✓</td><td>✓</td></tr>
          </tbody>
        </table>
      </div>

      <h3 style="margin-top:32px">单特效购买</h3>
      <p class="muted">优质定制级特效单独定价，9.9~49.9 元/个，购买后永久使用</p>
    </div>
  `;

  app.querySelectorAll('[data-tier]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const tier = TIERS.find((t) => t.id === btn.dataset.tier);
      if (!tier) return;
      // 免费版：跳特效中心
      if (tier.id === 'free') {
        location.hash = tier.href;
        return;
      }
      // 会员订阅：需登录后下单 + 模拟支付
      if (!isLoggedIn()) {
        showToast('请先登录');
        location.hash = '#/login';
        return;
      }
      btn.disabled = true;
      try {
        const order = await api.orderCreate({ orderType: 1, tier: tier.tier });
        await api.mockPayCallback(order.orderNo);
        showToast(`已开通${tier.name}，欢迎使用`);
        window.dispatchEvent(new CustomEvent('auth:change'));
        location.hash = '#/orders';
      } catch (err) {
        showToast(err.message);
      } finally {
        btn.disabled = false;
      }
    });
  });
}
