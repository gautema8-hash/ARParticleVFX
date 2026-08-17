// src/views/admin.js — 管理后台（仅管理员）
import { api, isLoggedIn, getUser } from '../api.js';
import { showToast } from '../lib/toast.js';

const TIER_TXT = { 0: '免费', 1: 'Pro', 2: '企业' };
const ROLE_TXT = { 0: '用户', 1: '管理员', 2: '创作者' };
const STATUS_TXT = { 0: '待支付', 1: '已支付', 2: '已取消', 3: '已退款' };

export async function renderAdmin(app) {
  const user = getUser();
  if (!isLoggedIn() || ![1, 2].includes(Number(user?.role))) {
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
        <button class="chip chip-active" data-tab="dashboard" type="button">首页</button>
        <button class="chip" data-tab="users" type="button">用户管理</button>
        <button class="chip" data-tab="orders" type="button">订单管理</button>
        <button class="chip" data-tab="effects" type="button">特效管理</button>
        <button class="chip" data-tab="create" type="button">新增特效</button>
        <button class="chip" data-tab="feedback" type="button">问题反馈 / 定制需求</button>
      </div>
      <div id="admin-panel" style="margin-top:16px"></div>
    </div>`;

  const panel = app.querySelector('#admin-panel');
  const tabs = app.querySelectorAll('#admin-tabs .chip');

  function fail(e) { panel.innerHTML = `<p class="muted">加载失败：${e.message}</p>`; }

  async function renderDashboard() {
    panel.innerHTML = '<p class="muted">加载中…</p>'; const d = await api.adminDashboard();
    panel.innerHTML = `<div class="grid grid-3 admin-dashboard-cards"><div class="card"><h3>用户注册数</h3><strong>${d.userCount}</strong></div><div class="card"><h3>今日新增 / 日活记录</h3><strong>${d.todayRegistrations}</strong></div><div class="card"><h3>粒子特效统计</h3><strong>${d.effectCount}</strong><p class="muted">AR ${d.arCount} · 3D ${d.threeDCount}</p></div><div class="card"><h3>订单总数</h3><strong>${d.orderCount}</strong></div><div class="card"><h3>已支付订单</h3><strong>${d.paidOrderCount}</strong></div><div class="card"><h3>进账总览</h3><strong>¥${d.revenue || 0}</strong></div><div class="card"><h3>问题反馈 / 定制需求</h3><strong>${d.feedbackCount}</strong><p class="muted">待接入反馈统计</p></div></div>`;
  }

  async function renderUsers() {
    panel.innerHTML = '<p class="muted">加载中…</p>';
    const list = await api.adminUsers();
    panel.innerHTML = `<div class="table-wrap"><table class="compare"><thead><tr><th>ID</th><th>用户名</th><th>昵称</th><th>邮箱</th><th>档位</th><th>角色</th><th>操作</th></tr></thead><tbody>
      ${list.map(u => `<tr><td>${u.id}</td><td>${u.username}</td><td><input data-user-field="nickname" data-user-id="${u.id}" value="${u.nickname || ''}"></td><td><input data-user-field="email" data-user-id="${u.id}" value="${u.email || ''}"></td><td><select data-user-field="tier" data-user-id="${u.id}"><option value="0" ${u.tier===0?'selected':''}>免费</option><option value="1" ${u.tier===1?'selected':''}>Pro</option><option value="2" ${u.tier===2?'selected':''}>企业</option></select></td><td><select data-user-field="role" data-user-id="${u.id}"><option value="0" ${u.role===0?'selected':''}>用户</option><option value="1" ${u.role===1?'selected':''}>管理员</option><option value="2" ${u.role===2?'selected':''}>创作者</option></select></td><td><button class="btn" data-save-user="${u.id}" type="button">保存</button><button class="btn" data-delete-user="${u.id}" type="button">删除</button></td></tr>`).join('')}
    </tbody></table></div>`;
    panel.querySelectorAll('[data-save-user]').forEach((button) => button.addEventListener('click', async () => { const id=button.dataset.saveUser; const value=(field)=>panel.querySelector(`[data-user-field="${field}"][data-user-id="${id}"]`).value; try { await api.updateAdminUser(id,{nickname:value('nickname'),email:value('email'),tier:Number(value('tier')),role:Number(value('role')),status:1}); showToast('用户已更新'); } catch (e) { showToast(e.message); } }));
    panel.querySelectorAll('[data-delete-user]').forEach((button) => button.addEventListener('click', async () => { if (!confirm('确认逻辑删除该用户？')) return; try { await api.deleteAdminUser(button.dataset.deleteUser); showToast('用户已删除'); renderUsers(); } catch (e) { showToast(e.message); } }));
  }

  async function renderOrders() {
    panel.innerHTML = '<p class="muted">加载中…</p>';
    const list = await api.adminOrders();
    const stats = `<div class="card" style="margin-bottom:14px"><strong>订单统计：</strong> 总订单 ${list.length} · 已支付 ${list.filter(o=>o.status===1).length} · 进账 ¥${list.filter(o=>o.status===1).reduce((sum,o)=>sum+Number(o.amount||0),0).toFixed(2)}</div>`;
    panel.innerHTML = stats + `<div class="table-wrap"><table class="compare"><thead><tr><th>ID</th><th>订单号</th><th>类型</th><th>金额</th><th>状态</th><th>时间</th></tr></thead><tbody>
      ${list.map(o => `<tr><td>${o.id}</td><td>${o.orderNo}</td><td>${o.orderType === 1 ? '会员' : '特效'}</td><td>¥${o.amount}</td><td>${STATUS_TXT[o.status] ?? o.status}</td><td>${(o.createTime || '').replace('T', ' ')}</td></tr>`).join('')}
    </tbody></table></div>`;
  }

  async function renderFeedback() { panel.innerHTML='<p class="muted">加载中…</p>'; const list=await api.adminFeedbacks(); panel.innerHTML=`<div class="table-wrap"><table class="compare"><thead><tr><th>ID</th><th>姓名</th><th>联系方式</th><th>类型</th><th>问题描述</th><th>状态</th><th>操作</th></tr></thead><tbody>${list.map(f=>`<tr><td>${f.id}</td><td>${f.name}</td><td>${f.contact}</td><td>${f.type||'-'}</td><td>${f.description}</td><td>${f.status===0?'待处理':'已处理'}</td><td><button class="btn" data-feedback-status="${f.id}" type="button">标记处理</button><button class="btn" data-feedback-delete="${f.id}" type="button">删除</button></td></tr>`).join('')}</tbody></table></div>`; panel.querySelectorAll('[data-feedback-status]').forEach(b=>b.addEventListener('click',async()=>{await api.updateFeedbackStatus(b.dataset.feedbackStatus,1);renderFeedback();})); panel.querySelectorAll('[data-feedback-delete]').forEach(b=>b.addEventListener('click',async()=>{if(confirm('确认逻辑删除？')){await api.deleteFeedback(b.dataset.feedbackDelete);renderFeedback();}})); }

  async function renderEffects() {
    panel.innerHTML = '<p class="muted">加载中…</p>';
    const list = await api.adminEffects();
    panel.innerHTML = `<div class="table-wrap"><table class="compare"><thead><tr><th>ID</th><th>编码</th><th>名称</th><th>粒子标签</th><th>创建时间</th><th>上架时间</th><th>下架时间</th><th>状态</th><th>操作</th></tr></thead><tbody>
      ${list.map(e => `<tr><td>${e.id}</td><td>${e.effectCode}</td><td>${e.effectName}</td><td>${e.tags || '-'}</td><td>${(e.createTime||'').replace('T',' ')}</td><td>${(e.publishTime||'').replace('T',' ')||'-'}</td><td>${(e.offlineTime||'').replace('T',' ')||'-'}</td><td>${e.status === 1 ? '上架' : '下架'}</td>
        <td><button class="btn" data-id="${e.id}" data-status="${e.status === 1 ? 0 : 1}" type="button">${e.status === 1 ? '下架' : '上架'}</button><button class="btn" data-delete-effect="${e.id}" type="button">删除</button></td></tr>`).join('')}
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
    panel.querySelectorAll('[data-delete-effect]').forEach(btn => btn.addEventListener('click', async () => { if (!confirm('确认逻辑删除该特效？')) return; try { await api.deleteAdminEffect(btn.dataset.deleteEffect); showToast('特效已删除'); renderEffects(); } catch (e) { showToast(e.message); } }));
  }

  function renderCreate() {
    panel.innerHTML = `<div class="card"><h3>新增并上架特效</h3><p class="card-desc">管理员或创作者可创建 AR / 3D 特效。保存后先下架审核，确认后再点击上架。</p>
      <div class="form-row"><label>特效编码 *</label><input id="ef-code" placeholder="例如 rain-2026"></div>
      <div class="form-row"><label>特效名称 *</label><input id="ef-name" placeholder="例如 霓虹雨幕"></div>
      <div class="form-row"><label>特效分类 *</label><select id="ef-category"><option value="ar">AR 特效</option><option value="3d">3D 特效</option></select></div>
      <div class="form-row"><label>运行模式</label><input id="ef-mode" placeholder="例如 galaxy / particle"></div>
      <div class="form-row"><label>标签</label><input id="ef-tags" placeholder="高级3D,商用视觉"></div>
      <div class="form-row"><label>档位</label><select id="ef-tier"><option value="0">免费</option><option value="1">个人 Pro</option><option value="2">企业</option></select></div>
      <div class="form-row"><label>1:1 卡片封面</label><input id="ef-cover-file" type="file" accept="image/png,image/jpeg,image/webp"><div id="ef-cover-preview" class="effect-cover-upload-preview">默认图片</div></div>
      <div class="form-row"><label>描述</label><textarea id="ef-desc" rows="3"></textarea></div>
      <div class="form-row"><label>HTML 源码 *</label><textarea id="ef-source" rows="12" placeholder="粘贴可直接运行的 HTML / Three.js 特效代码"></textarea></div>
      <button class="btn btn-primary" id="btn-create-effect" type="button">保存特效（下架）</button></div>`;
    let coverBase64 = '';
    panel.querySelector('#ef-cover-file').addEventListener('change', (event) => {
      const file = event.target.files?.[0]; if (!file) return;
      const reader = new FileReader(); reader.onload = () => { const image = new Image(); image.onload = () => { const size = Math.min(image.width, image.height); const canvas = document.createElement('canvas'); canvas.width = canvas.height = 800; canvas.getContext('2d').drawImage(image, (image.width - size) / 2, (image.height - size) / 2, size, size, 0, 0, 800, 800); coverBase64 = canvas.toDataURL('image/jpeg', .86); panel.querySelector('#ef-cover-preview').style.backgroundImage = `url('${coverBase64}')`; panel.querySelector('#ef-cover-preview').textContent = ''; }; image.src = reader.result; }; reader.readAsDataURL(file);
    });
    panel.querySelector('#btn-create-effect').addEventListener('click', async () => {
      const payload = { effectCode: panel.querySelector('#ef-code').value.trim(), effectName: panel.querySelector('#ef-name').value.trim(), category: panel.querySelector('#ef-category').value, mode: panel.querySelector('#ef-mode').value.trim(), tags: panel.querySelector('#ef-tags').value.trim(), tier: Number(panel.querySelector('#ef-tier').value), description: panel.querySelector('#ef-desc').value.trim(), sourceHtml: panel.querySelector('#ef-source').value, coverBase64, status: 0 };
      const button = panel.querySelector('#btn-create-effect'); button.disabled = true;
      try { await api.createEffect(payload); showToast('特效已保存为下架状态，请在特效管理中上架'); renderEffects(); } catch (err) { showToast(err.message); button.disabled = false; }
    });
  }

  const renderers = { dashboard: renderDashboard, users: renderUsers, orders: renderOrders, effects: renderEffects, create: renderCreate, feedback: renderFeedback };
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => x.classList.remove('chip-active'));
    t.classList.add('chip-active');
    renderers[t.dataset.tab]().catch(fail);
  }));
  renderDashboard().catch(fail);
}
