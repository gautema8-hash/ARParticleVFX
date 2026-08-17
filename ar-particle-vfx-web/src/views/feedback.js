import { api, getUser, isLoggedIn } from '../api.js';
import { showToast } from '../lib/toast.js';

export function renderFeedback(app) {
  const user = getUser() || {};
  app.innerHTML = `<div class="page feedback-page"><h2 class="section-title">用户反馈</h2><p class="muted">问题反馈和定制需求会统一进入官方管理后台处理。</p><div class="card"><div class="form-row"><label>姓名 *</label><input id="fb-name" value="${user.nickname || ''}" placeholder="您的称呼"></div><div class="form-row"><label>联系方式 *</label><input id="fb-contact" value="${user.email || ''}" placeholder="邮箱 / 微信 / 手机号"></div><div class="form-row"><label>反馈类型</label><select id="fb-type"><option>问题反馈</option><option>定制开发</option><option>素材授权</option><option>API 接入</option><option>其他</option></select></div><div class="form-row"><label>问题描述 *</label><textarea id="fb-desc" rows="7" placeholder="请详细描述您遇到的问题或需求"></textarea></div><button class="btn btn-primary" id="fb-submit" type="button">提交反馈</button></div></div>`;
  app.querySelector('#fb-submit').addEventListener('click', async () => { if (!isLoggedIn()) { showToast('请先登录后提交反馈'); location.hash='#/login'; return; } const name=app.querySelector('#fb-name').value.trim(), contact=app.querySelector('#fb-contact').value.trim(), description=app.querySelector('#fb-desc').value.trim(), type=app.querySelector('#fb-type').value; if(!name||!contact||!description){showToast('请完整填写姓名、联系方式和问题描述');return;} try{await api.submitFeedback({name,contact,type,description});showToast('反馈已提交，感谢您的建议');app.querySelector('#fb-desc').value='';}catch(e){showToast(e.message);}});
}
