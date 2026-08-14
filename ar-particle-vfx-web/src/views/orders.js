// src/views/orders.js — 我的订单
import { api, isLoggedIn } from '../api.js';
import { showToast } from '../lib/toast.js';

const STATUS = { 0: '待支付', 1: '已支付', 2: '已取消', 3: '已退款' };
const TYPE = { 0: '单特效', 1: '会员订阅' };

export async function renderOrders(app) {
  if (!isLoggedIn()) {
    app.innerHTML = `
      <div class="page">
        <h2 class="section-title">我的订单</h2>
        <div class="card"><p class="muted">请先登录后查看订单</p>
        <a class="btn btn-primary" href="#/login">去登录</a></div>
      </div>`;
    return;
  }

  app.innerHTML = `
    <div class="page">
      <h2 class="section-title">我的订单</h2>
      <div id="orders-box" class="muted">加载中…</div>
    </div>`;

  const box = app.querySelector('#orders-box');
  let orders;
  try {
    orders = await api.orderList();
  } catch (err) {
    box.innerHTML = `<div class="card">加载失败：${err.message}</div>`;
    return;
  }

  if (!orders || !orders.length) {
    box.innerHTML = '<div class="card"><p class="muted">暂无订单，去<a href="#/effects">特效中心</a>或<a href="#/pricing">定价页</a>逛逛吧</p></div>';
    return;
  }

  box.innerHTML = orders.map((o) => `
    <div class="card" style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
        <div>
          <strong>${TYPE[o.orderType] ?? '订单'}</strong>
          ${o.tier ? `<span class="tag">${o.tier === 2 ? '企业版' : '个人Pro'}</span>` : ''}
          <span class="tag">${STATUS[o.status] ?? o.status}</span>
        </div>
        <div style="color:#22d3ee;font-weight:700">¥${o.amount ?? '0'}</div>
      </div>
      <p class="muted" style="margin:8px 0;font-size:12px">订单号：${o.orderNo}</p>
      <p class="muted" style="margin:0;font-size:12px">时间：${o.createTime ? o.createTime.replace('T', ' ') : ''}</p>
      ${o.status === 0 ? `<button class="btn btn-primary" data-pay="${o.orderNo}" type="button" style="margin-top:10px">去支付</button>` : ''}
    </div>`).join('');

  box.querySelectorAll('[data-pay]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      try {
        await api.mockPayCallback(btn.dataset.pay);
        showToast('支付成功');
        renderOrders(app);
      } catch (err) {
        showToast(err.message);
        btn.disabled = false;
      }
    });
  });
}
