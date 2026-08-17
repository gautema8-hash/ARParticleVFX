// src/views/admin.js — 管理后台（仅管理员）
import { api, isLoggedIn, getUser } from '../api.js';
import { showToast } from '../lib/toast.js';
import * as THREE from 'three';

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
    <div class="page admin-shell">
      <canvas class="admin-space-canvas" id="admin-space-canvas"></canvas>
      <div class="admin-space-overlay"></div>
      <div class="admin-content">
      <h2 class="section-title">管理后台</h2>
      <div class="chips" id="admin-tabs">
        <button class="chip chip-active" data-tab="dashboard" type="button">首页</button>
        <button class="chip" data-tab="users" type="button">用户管理</button>
        <button class="chip" data-tab="orders" type="button">订单管理</button>
        <button class="chip" data-tab="effects" type="button">特效管理</button>
        <button class="chip" data-tab="create" type="button">新增特效</button>
        <button class="chip" data-tab="feedback" type="button">问题反馈 / 定制需求</button>
        <button class="chip" data-tab="logs" type="button">登录操作日志</button>
        <button class="chip" data-tab="mail" type="button">技术资讯邮件</button>
        <button class="chip" data-tab="knowledge" type="button">知识文章管理</button>
      </div>
      <div id="admin-panel" style="margin-top:16px"></div>
      </div>
    </div>`;

  initAdminSpace(app.querySelector('#admin-space-canvas'));

  const panel = app.querySelector('#admin-panel');
  const tabs = app.querySelectorAll('#admin-tabs .chip');

  function fail(e) { panel.innerHTML = `<p class="muted">加载失败：${e.message}</p>`; }

  async function renderDashboard() {
    panel.innerHTML = '<p class="muted">加载中…</p>'; const d = await api.adminDashboard();
    panel.innerHTML = `<div class="grid grid-3 admin-dashboard-cards"><div class="card"><h3>用户注册数</h3><strong>${d.userCount}</strong></div><div class="card"><h3>今日新增 / 日活记录</h3><strong>${d.todayRegistrations}</strong></div><div class="card"><h3>粒子特效统计</h3><strong>${d.effectCount}</strong><p class="muted">AR ${d.arCount} · 3D ${d.threeDCount}</p><p class="muted">上架 ${d.publishedEffectCount} · 下架 ${d.offlineEffectCount}</p></div><div class="card"><h3>订单总数</h3><strong>${d.orderCount}</strong></div><div class="card"><h3>已支付订单</h3><strong>${d.paidOrderCount}</strong></div><div class="card"><h3>进账总览</h3><strong>¥${d.revenue || 0}</strong></div><div class="card"><h3>问题反馈 / 定制需求</h3><strong>${d.feedbackCount}</strong><p class="muted">待接入反馈统计</p></div></div>`;
  }

  async function renderUsers(keyword = '') {
    panel.innerHTML = '<p class="muted">加载中…</p>';
    const list = await api.adminUsers(keyword);
    panel.innerHTML = `<div class="admin-searchbar"><input id="admin-user-keyword" placeholder="通过邮箱 / 用户名 / 昵称查询用户"><button class="btn btn-primary" id="admin-user-search" type="button">查询</button><button class="btn" id="admin-user-clear" type="button">清空</button></div><div class="table-wrap"><table class="compare"><thead><tr><th>ID</th><th>用户名</th><th>昵称</th><th>邮箱</th><th>档位</th><th>角色</th><th>操作</th></tr></thead><tbody>
      ${list.map(u => `<tr><td>${u.id}</td><td>${u.username}</td><td><input data-user-field="nickname" data-user-id="${u.id}" value="${u.nickname || ''}"></td><td><input data-user-field="email" data-user-id="${u.id}" value="${u.email || ''}"></td><td><select data-user-field="tier" data-user-id="${u.id}"><option value="0" ${u.tier===0?'selected':''}>免费</option><option value="1" ${u.tier===1?'selected':''}>Pro</option><option value="2" ${u.tier===2?'selected':''}>企业</option></select></td><td><select data-user-field="role" data-user-id="${u.id}"><option value="0" ${u.role===0?'selected':''}>用户</option><option value="1" ${u.role===1?'selected':''}>管理员</option><option value="2" ${u.role===2?'selected':''}>创作者</option></select></td><td><button class="btn" data-save-user="${u.id}" type="button">保存</button><button class="btn" data-reset-user="${u.id}" type="button">重置密码</button><button class="btn" data-delete-user="${u.id}" type="button">删除</button></td></tr>`).join('')}
    </tbody></table></div>`;
    panel.querySelector('#admin-user-search').addEventListener('click', () => renderUsers(panel.querySelector('#admin-user-keyword').value.trim()));
    panel.querySelector('#admin-user-clear').addEventListener('click', () => renderUsers());
    panel.querySelectorAll('[data-save-user]').forEach((button) => button.addEventListener('click', async () => { const id=button.dataset.saveUser; const value=(field)=>panel.querySelector(`[data-user-field="${field}"][data-user-id="${id}"]`).value; try { await api.updateAdminUser(id,{nickname:value('nickname'),email:value('email'),tier:Number(value('tier')),role:Number(value('role')),status:1}); showToast('用户已更新'); } catch (e) { showToast(e.message); } }));
    panel.querySelectorAll('[data-delete-user]').forEach((button) => button.addEventListener('click', async () => { if (!confirm('确认逻辑删除该用户？')) return; try { await api.deleteAdminUser(button.dataset.deleteUser); showToast('用户已删除'); renderUsers(); } catch (e) { showToast(e.message); } }));
    panel.querySelectorAll('[data-reset-user]').forEach((button) => button.addEventListener('click', async () => { if (!confirm('确认将密码重置为 Qwer123..？')) return; try { await api.resetAdminUserPassword(button.dataset.resetUser); showToast('密码已重置为 Qwer123..'); } catch (e) { showToast(e.message); } }));
  }
  async function renderLogs() { panel.innerHTML='<p class="muted">加载中…</p>'; const list=await api.adminLoginLogs(); panel.innerHTML=`<div class="card admin-log-tip">仅展示最近 7 天日志，系统每天自动逻辑清理过期记录。</div><div class="table-wrap"><table class="compare"><thead><tr><th>用户名</th><th>昵称</th><th>邮箱</th><th>操作</th><th>时间</th><th>IP</th><th>地址识别</th><th>设备</th><th>浏览器</th><th>系统</th><th>User-Agent</th><th>结果</th></tr></thead><tbody>${list.map(l=>`<tr><td>${l.username||'-'}</td><td>${l.nickname||'-'}</td><td>${l.email||'-'}</td><td>${l.operation}</td><td>${(l.loginTime||'').replace('T',' ')}</td><td>${l.ip||'-'}</td><td>${l.address||'-'}</td><td>${l.deviceType||'-'}</td><td>${l.browser||'-'}</td><td>${l.os||'-'}</td><td class="log-ua">${l.userAgent||'-'}</td><td>${l.success===1?'成功':'失败'}</td></tr>`).join('')}</tbody></table></div>`; }
  async function renderMail() { const list=await api.adminUsers(); panel.innerHTML=`<div class="card"><h3>发送技术资讯</h3><p class="muted">可勾选收件人，单批最多发送 20 人。没有邮箱的用户不会发送。</p><div class="admin-mail-toolbar"><button class="btn" id="mail-all" type="button">全选</button><button class="btn" id="mail-none" type="button">清空</button><span id="mail-count">已选 0 / 20</span></div><div class="admin-recipient-list">${list.map(u=>`<label><input type="checkbox" data-mail-user="${u.id}" ${u.email?'':'disabled'}><span>${u.nickname||u.username} · ${u.email||'无邮箱'}</span></label>`).join('')}</div><div class="form-row"><label>邮件主题</label><input id="mail-subject" placeholder="例如：粒子特效库新增技术能力通知"></div><div class="form-row"><label>邮件正文</label><textarea id="mail-content" rows="10" placeholder="请输入要发送的技术信息"></textarea></div><button class="btn btn-primary" id="mail-send" type="button">发送技术资讯</button></div>`; const checks=[...panel.querySelectorAll('[data-mail-user]')], update=()=>{panel.querySelector('#mail-count').textContent=`已选 ${checks.filter(x=>x.checked).length} / 20`;}; checks.forEach(c=>c.addEventListener('change',()=>{if(checks.filter(x=>x.checked).length>20)c.checked=false;update();})); panel.querySelector('#mail-all').addEventListener('click',()=>{checks.filter(x=>!x.disabled).slice(0,20).forEach(x=>x.checked=true);update();}); panel.querySelector('#mail-none').addEventListener('click',()=>{checks.forEach(x=>x.checked=false);update();}); panel.querySelector('#mail-send').addEventListener('click',async()=>{const userIds=checks.filter(x=>x.checked).map(x=>Number(x.dataset.mailUser)); try{const result=await api.sendTechnicalMail({userIds,subject:panel.querySelector('#mail-subject').value,content:panel.querySelector('#mail-content').value});showToast(`发送完成：成功 ${result.sent}，失败 ${result.failed}`);}catch(e){showToast(e.message);}}); }
  async function renderKnowledge() { panel.innerHTML='<p class="muted">加载中…</p>'; const list=await api.adminKnowledge(); panel.innerHTML=`<div class="card knowledge-editor"><h3>发布科技指南</h3><div class="form-row"><label>标题</label><input id="kn-title" placeholder="文章标题"></div><div class="form-row"><label>分类</label><input id="kn-category" placeholder="Three.js / WebAR / 性能优化"></div><div class="form-row"><label>摘要</label><input id="kn-summary" placeholder="文章摘要"></div><div class="form-row"><label>正文</label><textarea id="kn-content" rows="6" placeholder="支持纯文本与换行"></textarea></div><button class="btn btn-primary" id="kn-create" type="button">保存文章（草稿）</button></div><div class="table-wrap"><table class="compare"><thead><tr><th>ID</th><th>标题</th><th>分类</th><th>状态</th><th>创建时间</th><th>操作</th></tr></thead><tbody>${list.map(x=>`<tr><td>${x.id}</td><td><input data-kn="title" data-id="${x.id}" value="${x.title||''}"></td><td><input data-kn="category" data-id="${x.id}" value="${x.category||''}"></td><td><select data-kn="status" data-id="${x.id}"><option value="0" ${x.status===0?'selected':''}>草稿</option><option value="1" ${x.status===1?'selected':''}>已发布</option></select></td><td>${(x.createTime||'').replace('T',' ')}</td><td><button class="btn" data-kn-save="${x.id}" type="button">保存</button><button class="btn" data-kn-delete="${x.id}" type="button">删除</button></td></tr>`).join('')}</tbody></table></div>`; panel.querySelector('#kn-create').addEventListener('click',async()=>{await api.createKnowledge({title:panel.querySelector('#kn-title').value,category:panel.querySelector('#kn-category').value,summary:panel.querySelector('#kn-summary').value,content:panel.querySelector('#kn-content').value,status:0});showToast('文章已保存');renderKnowledge();}); panel.querySelectorAll('[data-kn-save]').forEach(b=>b.addEventListener('click',async()=>{const id=b.dataset.knSave;const val=k=>panel.querySelector(`[data-kn="${k}"][data-id="${id}"]`).value;const old=list.find(x=>String(x.id)===String(id))||{};await api.updateKnowledge(id,{title:val('title'),category:val('category'),status:Number(val('status')),summary:old.summary||'',content:old.content||''});showToast('文章已更新');})); panel.querySelectorAll('[data-kn-delete]').forEach(b=>b.addEventListener('click',async()=>{if(confirm('确认逻辑删除文章？')){await api.deleteKnowledge(b.dataset.knDelete);renderKnowledge();}})); }

  async function renderOrders() {
    panel.innerHTML = '<p class="muted">加载中…</p>';
    const list = await api.adminOrders();
    const stats = `<div class="card" style="margin-bottom:14px"><strong>订单统计：</strong> 总订单 ${list.length} · 已支付 ${list.filter(o=>o.status===1).length} · 进账 ¥${list.filter(o=>o.status===1).reduce((sum,o)=>sum+Number(o.amount||0),0).toFixed(2)}</div>`;
    panel.innerHTML = stats + `<div class="table-wrap"><table class="compare"><thead><tr><th>ID</th><th>订单号</th><th>类型</th><th>金额</th><th>状态</th><th>时间</th></tr></thead><tbody>
      ${list.map(o => `<tr><td>${o.id}</td><td>${o.orderNo}</td><td>${o.orderType === 1 ? '会员' : '特效'}</td><td>¥${o.amount}</td><td>${STATUS_TXT[o.status] ?? o.status}</td><td>${(o.createTime || '').replace('T', ' ')}</td></tr>`).join('')}
    </tbody></table></div>`;
  }

  async function renderFeedback(type = 'all') { panel.innerHTML='<p class="muted">加载中…</p>'; const list=await api.adminFeedbacks(type); panel.innerHTML=`<div class="feedback-filter-panel"><span class="feedback-filter-title">反馈类型筛选</span><select id="feedback-type"><option value="all" ${type==='all'?'selected':''}>查询全部</option><option value="feedback" ${type==='feedback'?'selected':''}>问题反馈</option><option value="custom" ${type==='custom'?'selected':''}>定制需求</option></select><button class="btn btn-primary feedback-query-btn" id="feedback-query" type="button">查询反馈</button></div><div class="table-wrap"><table class="compare"><thead><tr><th>ID</th><th>姓名</th><th>联系方式</th><th>类型</th><th>问题描述</th><th>创建时间</th><th>处理时间</th><th>状态</th><th>操作</th></tr></thead><tbody>${list.map(f=>`<tr><td>${f.id}</td><td>${f.name}</td><td>${f.contact}</td><td>${f.type||'-'}</td><td>${f.description}</td><td>${(f.createTime||'').replace('T',' ')||'-'}</td><td>${(f.processTime||'').replace('T',' ')||'-'}</td><td>${f.status===0?'待处理':'已处理'}</td><td><button class="btn" data-feedback-status="${f.id}" type="button">标记处理</button><button class="btn" data-feedback-delete="${f.id}" type="button">删除</button></td></tr>`).join('')}</tbody></table></div>`; panel.querySelector('#feedback-query').addEventListener('click',()=>renderFeedback(panel.querySelector('#feedback-type').value)); panel.querySelectorAll('[data-feedback-status]').forEach(b=>b.addEventListener('click',async()=>{await api.updateFeedbackStatus(b.dataset.feedbackStatus,1);renderFeedback(type);})); panel.querySelectorAll('[data-feedback-delete]').forEach(b=>b.addEventListener('click',async()=>{if(confirm('确认逻辑删除？')){await api.deleteFeedback(b.dataset.feedbackDelete);renderFeedback(type);}})); }

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

  const renderers = { dashboard: renderDashboard, users: renderUsers, orders: renderOrders, effects: renderEffects, create: renderCreate, feedback: renderFeedback, logs: renderLogs, mail: renderMail, knowledge: renderKnowledge };
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => x.classList.remove('chip-active'));
    t.classList.add('chip-active');
    renderers[t.dataset.tab]().catch(fail);
  }));
  renderDashboard().catch(fail);
}

function initAdminSpace(canvas) {
  if (!canvas) return;
  const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, .1, 1000); camera.position.z = 8;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true }); renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8)); renderer.setSize(innerWidth, innerHeight);
  const count = 4200; const positions = new Float32Array(count * 3); const colors = new Float32Array(count * 3); const palette=[new THREE.Color('#36e4ff'),new THREE.Color('#8b5cf6'),new THREE.Color('#ff3cac'),new THREE.Color('#facc15')];
  for(let i=0;i<count;i++){const r=3+Math.random()*15, a=Math.random()*Math.PI*2, y=(Math.random()-.5)*10; positions[i*3]=Math.cos(a)*r; positions[i*3+1]=y+Math.sin(a*.7)*.8; positions[i*3+2]=Math.sin(a)*r-4; const c=palette[i%palette.length]; colors[i*3]=c.r;colors[i*3+1]=c.g;colors[i*3+2]=c.b;}
  const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.BufferAttribute(positions,3)); geo.setAttribute('color',new THREE.BufferAttribute(colors,3)); const mat=new THREE.PointsMaterial({size:.035,vertexColors:true,transparent:true,opacity:.9,blending:THREE.AdditiveBlending}); const stars=new THREE.Points(geo,mat); scene.add(stars);
  const wave=new THREE.Mesh(new THREE.PlaneGeometry(26,16,60,35),new THREE.MeshBasicMaterial({color:'#083b66',wireframe:true,transparent:true,opacity:.16})); wave.rotation.x=-Math.PI/2; wave.position.y=-4; scene.add(wave);
  let t=0; const animate=()=>{t+=.002; stars.rotation.y=t*.35; stars.rotation.x=Math.sin(t)*.08; wave.position.z=Math.sin(t)*2; renderer.render(scene,camera); requestAnimationFrame(animate);}; animate();
  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
}
