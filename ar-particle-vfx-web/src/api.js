// src/api.js — 后端接口封装（fetch + token 会话 + 统一 Result 处理）
const BASE_URL = '/api';
const TOKEN_KEY = 'arpfx_token';
const USER_KEY = 'arpfx_user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

export function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isLoggedIn() {
  return !!getToken();
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new Error('网络请求失败，请确认后端服务已启动');
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error('服务响应格式错误');
  }

  // 后端统一返回 { code, message, data }，code === 200 表示成功
  if (data.code !== 200) {
    const err = new Error(data.message || '请求失败');
    err.code = data.code;
    throw err;
  }
  return data.data;
}

export const api = {
  register: (payload) => request('/user/register', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/user/login', { method: 'POST', body: payload, auth: false }),
  sendEmailCode: (payload) => request('/user/email-code', { method: 'POST', body: payload, auth: false }),
  emailLogin: (payload) => request('/user/email-login', { method: 'POST', body: payload, auth: false }),
  info: () => request('/user/info'),
  favorites: () => request('/user/favorites'),
  addFavorite: (effectId) => request(`/user/favorite/${effectId}`, { method: 'POST' }),
  removeFavorite: (effectId) => request(`/user/favorite/${effectId}`, { method: 'DELETE' }),
  effectList: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/effect/list${qs ? '?' + qs : ''}`, { auth: false });
  },
  effectDetail: (id) => request(`/effect/${id}`, { auth: false }),
  orderCreate: (payload) => request('/order/create', { method: 'POST', body: payload }),
  orderList: () => request('/order/list'),
  mockPayCallback: (orderNo) => request(`/order/pay/callback?orderNo=${encodeURIComponent(orderNo)}`, { method: 'POST' }),
  resetPassword: (payload) => request('/user/reset-password', { method: 'POST', body: payload, auth: false }),
  adminUsers: (keyword = '') => request(`/admin/users${keyword ? '?keyword=' + encodeURIComponent(keyword) : ''}`),
  adminDashboard: () => request('/admin/dashboard'),
  adminFeedbacks: (type = 'all') => request(`/admin/feedbacks?type=${encodeURIComponent(type)}`),
  submitFeedback: (payload) => request('/service/requests', { method: 'POST', body: payload }),
  knowledgeList: () => request('/knowledge/list', { auth: false }),
  knowledgeView: (id) => request(`/knowledge/${id}/view`, { method: 'POST', auth: false }),
  knowledgeFavorite: (id) => request(`/knowledge/${id}/favorite`, { method: 'POST', auth: false }),
  knowledgeUnfavorite: (id) => request(`/knowledge/${id}/unfavorite`, { method: 'POST', auth: false }),
  adminKnowledge: () => request('/admin/knowledge'),
  createKnowledge: (payload) => request('/admin/knowledge', { method: 'POST', body: payload }),
  updateKnowledge: (id, payload) => request(`/admin/knowledge/${id}`, { method: 'PUT', body: payload }),
  deleteKnowledge: (id) => request(`/admin/knowledge/${id}`, { method: 'DELETE' }),
  updateFeedbackStatus: (id, status) => request(`/admin/feedback/${id}/status?status=${status}`, { method: 'PUT' }),
  deleteFeedback: (id) => request(`/admin/feedback/${id}`, { method: 'DELETE' }),
  updateAdminUser: (id, payload) => request(`/admin/user/${id}`, { method: 'PUT', body: payload }),
  deleteAdminUser: (id) => request(`/admin/user/${id}`, { method: 'DELETE' }),
  resetAdminUserPassword: (id) => request(`/admin/user/${id}/reset-password`, { method: 'PUT' }),
  adminLoginLogs: () => request('/admin/login-logs'),
  sendTechnicalMail: (payload) => request('/admin/technical-mail', { method: 'POST', body: payload }),
  adminOrders: () => request('/admin/orders'),
  adminEffects: () => request('/admin/effects'),
  createEffect: (payload) => request('/admin/effect', { method: 'POST', body: payload }),
  updateEffectStatus: (id, status) => request(`/admin/effect/${id}/status?status=${status}`, { method: 'PUT' })
  ,deleteAdminEffect: (id) => request(`/admin/effect/${id}`, { method: 'DELETE' })
};
