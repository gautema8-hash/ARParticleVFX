// src/views/admin.js — 管理后台（仅管理员）
import { api, isLoggedIn, getUser } from '../api.js';
import { showToast } from '../lib/toast.js';

const TIER_TXT = { 0: '免费', 1: 'Pro', 2: '企业' };
const ROLE_TXT = { 0: '用户', 1: '管理员' };
const STATUS_TXT = { 0: '待支付', 1: '已支付', 2: '已取消', 3: '已退款' };

export async function renderAdmin(app) {
  const user = getUser();
  if (!isLoggedIn() || user?.role !== 1) {
    app.innerHTML = `
      <div class="page">
        <h2 class="section-title">管理后台</h2>
        <div class="card"><p class="muted">需要管理员权限</p><a class="btn btn-primary" href="#/login">去登录</a></div>
      </div>`;
    return;
  }

  app.innerHTML = `
    <div class="page">
      <h2 class="section-title">管理后台</h2>
      <div class="chips" id="admin-tabs">
        <button class="chip chip-active" data-tab="users" type="button">用户管理</button>
        <button class="chip" data-tab="orders" type="button">订单管理</button>
        <button class="chip" data-tab="effects" type="button">特效管理</button>
      </div>
      <div id="admin-panel" style="margin-top:16px"></div>
    </div>`;

  const panel = app.querySelector('#admin-panel');
  const tabs = app.querySelectorAll('#admin-tabs .chip');

  function fail(e) { panel.innerHTML = `<p class="muted">加载失败：${e.message}</p>`; }

  async function renderUsers() {
    panel.innerHTML = '<p class="muted">加载中…</p>';
    const list = await api.adminUsers();
    panel.innerHTML = `<div class="table-wrap"><table class="compare"><thead><tr><th>ID</th><th>用户名</th><th>昵称</th><th>邮箱</th><th>档位</th><th>角色</th></tr></thead><tbody>
      ${list.map(u => `<tr><td>${u.id}</td><td>${u.username}</td><td>${u.nickname || '-'}</td><td>${u.email || '-'}</td><td>${TIER_TXT[u.tier] ?? u.tier}</td><td>${ROLE_TXT[u.role] ?? u.role}</td></tr>`).join('')}
    </tbody></table></div>`;
  }

  async function renderOrders() {
    panel.innerHTML = '<p class="muted">加载中…</p>';
    const list = await api.adminOrders();
    panel.innerHTML = `<div class="table-wrap"><table class="compare"><thead><tr><th>ID</th><th>订单号</th><th>类型</th><th>金额</th><th>状态</th><th>时间</th></tr></thead><tbody>
      ${list.map(o => `<tr><td>${o.id}</td><td>${o.orderNo}</td><td>${o.orderType === 1 ? '会员' : '特效'}</td><td>¥${o.amount}</td><td>${STATUS_TXT[o.status] ?? o.status}</td><td>${(o.createTime || '').replace('T', ' ')}</td></tr>`).join('')}
    </tbody></table></div>`;
  }

  async function renderEffects() {
    panel.innerHTML = '<p class="muted">加载中…</p>';
    const list = await api.adminEffects();
    panel.innerHTML = `<div class="table-wrap"><table class="compare"><thead><tr><th>ID</th><th>编码</th><th>名称</th><th>档位</th><th>状态</th><th>操作</th></tr></thead><tbody>
      ${list.map(e => `<tr><td>${e.id}</td><td>${e.effectCode}</td><td>${e.effectName}</td><td>${TIER_TXT[e.tier] ?? e.tier}</td><td>${e.status === 1 ? '上架' : '下架'}</td>
        <td><button class="btn" data-id="${e.id}" data-status="${e.status === 1 ? 0 : 1}" type="button">${e.status === 1 ? '下架' : '上架'}</button></td></tr>`).join('')}
    </tbody></table></div>`;
    panel.querySelectorAll('[data-id]').forEach(btn => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
          await api.updateEffectStatus(btn.dataset.id, Number(btn.dataset.status));
          showToast('操作成功');
          renderEffects();
        } catch (err) {
          showToast(err.message);
          btn.disabled = false;
        }
      });
    });
  }

  const renderers = { users: renderUsers, orders: renderOrders, effects: renderEffects };
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => x.classList.remove('chip-active'));
    t.classList.add('chip-active');
    renderers[t.dataset.tab]().catch(fail);
  }));
  renderUsers().catch(fail);
}
