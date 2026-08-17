// src/views/login.js — 炫酷高级商用登录 / 注册 / 忘记密码 / 会员中心
import { api, setToken, setUser, getUser, clearSession, isLoggedIn } from '../api.js';
import { showToast } from '../lib/toast.js';

function tierText(tier) {
  if (tier === 2) return '企业版';
  if (tier === 1) return '个人 Pro';
  return '免费版';
}

// 专属炫酷样式（玻璃拟态 + 渐变光效 + 漂浮光晕）
const STYLE = `
  .auth-wrap{position:relative;min-height:calc(100vh - 60px);display:flex;align-items:center;justify-content:center;overflow:hidden;padding:24px;
    background:radial-gradient(1200px 600px at 50% -10%,#1b1245 0%,#0a0a12 55%);}
  .auth-bg-glow{position:absolute;border-radius:50%;filter:blur(80px);opacity:.5;pointer-events:none;}
  .auth-glow-1{width:360px;height:360px;background:#a855f7;top:-80px;left:10%;animation:authFloat 8s ease-in-out infinite;}
  .auth-glow-2{width:300px;height:300px;background:#22d3ee;bottom:-60px;right:8%;animation:authFloat 10s ease-in-out infinite reverse;}
  @keyframes authFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(30px)}}
  .auth-card{position:relative;z-index:2;width:430px;max-width:94vw;padding:38px 34px;border-radius:20px;
    background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.14);
    backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);
    box-shadow:0 24px 70px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.06);}
  .auth-brand{text-align:center;margin-bottom:6px;}
  .auth-logo{display:inline-flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:14px;font-size:24px;
    background:linear-gradient(135deg,#a855f7,#22d3ee);box-shadow:0 8px 24px rgba(168,85,247,.4);margin-bottom:14px;}
  .auth-title{margin:0;font-size:22px;font-weight:700;letter-spacing:.5px;
    background:linear-gradient(90deg,#e9d5ff,#67e8f9);-webkit-background-clip:text;background-clip:text;color:transparent;}
  .auth-sub{color:#9ca3af;font-size:13px;margin:8px 0 22px;}
  .auth-tabs{display:flex;gap:6px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:4px;margin-bottom:22px;}
  .auth-tab{flex:1;border:none;background:transparent;color:#cbd5e1;padding:10px 0;border-radius:9px;font-size:14px;cursor:pointer;transition:all .25s;}
  .auth-tab.on{background:linear-gradient(135deg,#a855f7,#22d3ee);color:#fff;font-weight:600;box-shadow:0 4px 14px rgba(168,85,247,.35);}
  .auth-field{margin-bottom:16px;}
  .auth-label{display:block;color:#a5b4fc;font-size:13px;margin-bottom:7px;}
  .auth-input{width:100%;box-sizing:border-box;padding:12px 15px;border-radius:11px;color:#fff;font-size:14px;
    background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);outline:none;transition:all .25s;}
  .auth-input::placeholder{color:#64748b;}
  .auth-input:focus{border-color:#a855f7;background:rgba(255,255,255,.09);box-shadow:0 0 0 3px rgba(168,85,247,.22);}
  .auth-btn{width:100%;padding:13px;border:none;border-radius:11px;color:#fff;font-size:15px;font-weight:700;cursor:pointer;letter-spacing:1px;
    background:linear-gradient(135deg,#a855f7 0%,#22d3ee 100%);background-size:150% 150%;transition:all .3s;}
  .auth-btn:hover{background-position:100% 50%;box-shadow:0 10px 28px rgba(168,85,247,.45);transform:translateY(-1px);}
  .auth-btn:disabled{opacity:.6;cursor:not-allowed;transform:none;}
  .auth-tip{text-align:center;color:#64748b;font-size:12px;margin-top:16px;}
  .auth-user{text-align:center;}
  .auth-avatar{width:64px;height:64px;border-radius:50%;margin:0 auto 14px;display:flex;align-items:center;justify-content:center;font-size:26px;
    background:linear-gradient(135deg,#a855f7,#22d3ee);box-shadow:0 8px 24px rgba(168,85,247,.4);}
  .auth-name{font-size:18px;font-weight:700;color:#fff;margin:0 0 8px;}
  .auth-badge{display:inline-block;padding:4px 12px;border-radius:999px;font-size:12px;margin:0 4px;}
  .badge-admin{background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;}
  .badge-tier{background:rgba(168,85,247,.2);color:#c4b5fd;border:1px solid rgba(168,85,247,.4);}
  .auth-meta{color:#9ca3af;font-size:13px;margin:14px 0 22px;word-break:break-all;}
  .auth-out{display:inline-block;padding:11px 28px;border-radius:11px;border:1px solid rgba(255,255,255,.2);color:#e5e7eb;background:rgba(255,255,255,.05);cursor:pointer;transition:all .25s;}
  .auth-out:hover{background:rgba(239,68,68,.15);border-color:rgba(239,68,68,.5);color:#fca5a5;}
`;

export function renderLogin(app) {
  const loggedIn = isLoggedIn();
  const currentUser = loggedIn ? getUser() : null;

  app.innerHTML = `
    <div class="auth-wrap">
      <div class="auth-bg-glow auth-glow-1"></div>
      <div class="auth-bg-glow auth-glow-2"></div>
      <div class="auth-card">
        <style>${STYLE}</style>
        <div id="auth-box"></div>
      </div>
    </div>
  `;

  const box = app.querySelector('#auth-box');

  // —— 已登录：会员中心（含管理员徽章） ——
  if (loggedIn) {
    const isAdmin = currentUser?.role === 1;
    const isCreator = currentUser?.role === 2;
    box.innerHTML = `
      <div class="auth-user">
        <div class="auth-avatar">${isAdmin ? '🛡️' : '🧑‍💻'}</div>
        <p class="auth-name">${currentUser?.nickname || currentUser?.username || ''}</p>
        <div>
          ${isAdmin ? '<span class="auth-badge badge-admin">管理员</span>' : isCreator ? '<span class="auth-badge badge-tier">创作者</span>' : ''}
          <span class="auth-badge badge-tier">${tierText(currentUser?.tier)}</span>
        </div>
        <p class="auth-meta">账号：${currentUser?.username || ''}${currentUser?.email ? ' · ' + currentUser.email : ''}</p>
        <div>
          ${isAdmin || isCreator ? '<a class="auth-out" href="#/admin" style="margin-right:10px;text-decoration:none">创作后台</a>' : ''}
          <a class="auth-out" href="#/orders" style="margin-right:10px;text-decoration:none">我的订单</a>
          <button class="auth-out" id="btn-logout" type="button">退出登录</button>
        </div>
      </div>
    `;
    box.querySelector('#btn-logout').addEventListener('click', () => {
      clearSession();
      showToast('已退出登录');
      window.dispatchEvent(new CustomEvent('auth:change'));
      renderLogin(app);
    });
    return;
  }

  // —— 未登录：登录 / 注册 / 忘记密码 ——
  box.innerHTML = `
    <div class="auth-brand">
      <div class="auth-logo">✨</div>
      <h2 class="auth-title">AR 粒子特效库</h2>
      <p class="auth-sub">登录解锁收藏、会员与商用授权</p>
    </div>
    <div class="auth-tabs" id="auth-tabs">
      <button class="auth-tab on" data-mode="login" type="button">登录</button>
      <button class="auth-tab" data-mode="register" type="button">注册</button>
      <button class="auth-tab" data-mode="forgot" type="button">忘记密码</button>
    </div>
    <form id="auth-form" novalidate>
      <div class="auth-field">
        <label class="auth-label">邮箱</label>
        <input class="auth-input" id="auth-email" type="email" placeholder="请输入邮箱" autocomplete="email">
      </div>
      <div class="auth-field" id="auth-password-field">
        <label class="auth-label">密码</label>
        <input class="auth-input" id="auth-password" type="password" placeholder="请输入密码（6-32 位）" autocomplete="current-password">
      </div>
      <div class="auth-field" id="auth-code-field" style="display:none">
        <label class="auth-label">邮箱验证码</label><div style="display:flex;gap:8px"><input class="auth-input" id="auth-code" type="text" placeholder="6 位验证码" maxlength="6"><button class="btn" id="btn-code" type="button">发送验证码</button></div>
      </div>
      <div class="auth-field" id="auth-newpassword-field" style="display:none">
        <label class="auth-label">新密码</label>
        <input class="auth-input" id="auth-newpassword" type="password" placeholder="请输入新密码（6-32 位）" autocomplete="new-password">
      </div>
      <div class="auth-field" id="auth-nickname-field" style="display:none">
        <label class="auth-label">昵称（选填）</label>
        <input class="auth-input" id="auth-nickname" type="text" placeholder="给自己起个昵称">
      </div>
      <button class="auth-btn" id="btn-auth" type="submit">登 录</button>
    </form>
    <p class="auth-tip">登录即代表同意服务条款与隐私政策</p>
  `;

  let mode = 'login';
  const form = box.querySelector('#auth-form');
  const btn = box.querySelector('#btn-auth');
  const tabs = box.querySelectorAll('.auth-tab');

  function setMode(m) {
    mode = m;
    tabs.forEach((t) => t.classList.toggle('on', t.dataset.mode === m));
    box.querySelector('#auth-password-field').style.display = m === 'forgot' ? 'none' : '';
    box.querySelector('#auth-newpassword-field').style.display = 'none';
    box.querySelector('#auth-code-field').style.display = (m === 'register' || m === 'forgot') ? '' : 'none';
    box.querySelector('#auth-nickname-field').style.display = m === 'register' ? '' : 'none';
    btn.textContent = m === 'login' ? '登 录' : m === 'register' ? '注 册' : '重置密码';
  }

  tabs.forEach((t) => t.addEventListener('click', () => setMode(t.dataset.mode)));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = box.querySelector('#auth-email').value.trim();
    const password = box.querySelector('#auth-password').value;
    const newPassword = box.querySelector('#auth-newpassword').value;
    const code = box.querySelector('#auth-code').value.trim();
    const nickname = box.querySelector('#auth-nickname').value.trim();

    if (!email) return showToast('请填写邮箱');
    if (mode === 'login' && !password) return showToast('请填写密码');
    if (mode === 'register' && password.length < 6) return showToast('密码至少 6 位');
    if ((mode === 'register' || mode === 'forgot') && !code) return showToast('请填写邮箱验证码');

    btn.disabled = true;
    try {
      if (mode === 'login') {
        const data = await api.login({ email, password });
        setToken(data.token);
        setUser(data.user);
        showToast(data.user?.role === 1 ? '欢迎回来，管理员' : '登录成功');
        window.dispatchEvent(new CustomEvent('auth:change'));
        renderLogin(app);
      } else if (mode === 'register') {
        await api.register({ email, password, nickname: nickname || undefined, code });
        showToast('注册成功，请登录');
        setMode('login');
        box.querySelector('#auth-password').value = '';
      } else {
        const data = await api.emailLogin({ email, code });
        setToken(data.token); setUser(data.user); showToast('验证码登录成功'); window.dispatchEvent(new CustomEvent('auth:change')); renderLogin(app);
      }
    } catch (err) {
      showToast(err.message);
    } finally {
      btn.disabled = false;
    }
  });
  box.querySelector('#btn-code').addEventListener('click', async () => {
    const email = box.querySelector('#auth-email').value.trim(); if (!email) return showToast('请先填写邮箱');
    const codeButton = box.querySelector('#btn-code'); codeButton.disabled = true;
    try { await api.sendEmailCode({ email, purpose: mode === 'register' ? 'register' : 'login' }); showToast('验证码已发送，请查收邮箱'); let seconds = 60; const timer = setInterval(() => { codeButton.textContent = `${--seconds}s`; if (seconds <= 0) { clearInterval(timer); codeButton.disabled = false; codeButton.textContent = '发送验证码'; } }, 1000); } catch (err) { showToast(err.message); codeButton.disabled = false; }
  });
}
