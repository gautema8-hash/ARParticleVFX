// 智能助手：右侧悬浮对话、模型配置和主题跟随系统
import './assistant.css';
import { getToken } from './api.js';
const STORAGE_KEY = 'arpfx_assistant_settings';
const KEY_STORAGE = 'arpfx_assistant_api_key';

const PROVIDERS = [
  { id: 'deepseek', name: 'DeepSeek 深度求索', baseUrl: 'https://api.deepseek.com/v1', models: ['deepseek-chat', 'deepseek-reasoner'] },
  { id: 'qwen', name: '通义千问 DashScope', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', models: ['qwen-max', 'qwen-plus', 'qwen-turbo'] },
  { id: 'zhipu', name: '智谱 GLM', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', models: ['glm-4-plus', 'glm-4-air', 'glm-4-flash'] },
  { id: 'moonshot', name: '月之暗面 Kimi', baseUrl: 'https://api.moonshot.cn/v1', models: ['moonshot-v1-128k', 'moonshot-v1-32k'] },
  { id: 'doubao', name: '字节豆包 Ark', baseUrl: '', models: ['Doubao-Seed-1.6', 'Doubao-Pro-32k'] },
  { id: 'wenxin', name: '百度文心一言', baseUrl: '', models: ['ernie-4.5-turbo', 'ernie-speed-128k'] },
  { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', models: ['gpt-4.1', 'gpt-4.1-mini', 'o3', 'o4-mini'] },
  { id: 'anthropic', name: 'Anthropic Claude', baseUrl: 'https://api.anthropic.com/v1', models: ['claude-sonnet-4', 'claude-3-7-sonnet-latest', 'claude-3-5-haiku-latest'] },
  { id: 'google', name: 'Google Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', models: ['gemini-2.5-pro', 'gemini-2.5-flash'] },
  { id: 'mistral', name: 'Mistral AI', baseUrl: 'https://api.mistral.ai/v1', models: ['mistral-large-latest', 'codestral-latest'] },
  { id: 'custom', name: '自定义 OpenAI 兼容服务', baseUrl: '', models: ['自定义模型'] }
];

const DEFAULT_SETTINGS = { provider: 'deepseek', model: 'deepseek-chat', reasoning: 'auto', baseUrl: 'https://api.deepseek.com/v1' };

function loadSettings() {
  try { return { ...DEFAULT_SETTINGS, ...(JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}) }; } catch { return { ...DEFAULT_SETTINGS }; }
}

function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  if (settings.apiKey) sessionStorage.setItem(KEY_STORAGE, settings.apiKey);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function renderMarkdown(value) {
  const source = escapeHtml(value || '');
  const blocks = [];
  let html = source.replace(/```([\w-]*)\n?([\s\S]*?)```/g, (_, language, code) => {
    const index = blocks.push(code.trim()) - 1;
    return `<pre class="assistant-code"><div class="assistant-code-head"><span>${language || '代码'}</span><button type="button" data-copy-code="${index}">复制</button></div><code>${code.trim()}</code></pre>`;
  });
  html = html.replace(/^### (.+)$/gm, '<h4>$1</h4>').replace(/^## (.+)$/gm, '<h3>$1</h3>').replace(/^# (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>').replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code class="assistant-inline-code">$1</code>');
  return html.split(/\n{2,}/).map((part) => part.startsWith('<pre') || part.startsWith('<h') || part.startsWith('<ul') ? part : `<p>${part.replace(/\n/g, '<br>')}</p>`).join('');
}

function messageBubble(list, role, content, options = {}) {
  const item = document.createElement('div');
  item.className = `assistant-message assistant-message-${role}`;
  const label = document.createElement('span'); label.className = 'assistant-message-label'; label.textContent = role === 'user' ? '你' : '粒子助手';
  const body = document.createElement('div'); body.className = 'assistant-message-body';
  if (role === 'assistant' && !options.loading) body.innerHTML = renderMarkdown(content); else body.textContent = content;
  if (role === 'assistant' && !options.loading) {
    const actions = document.createElement('div'); actions.className = 'assistant-message-actions';
    actions.innerHTML = '<button type="button" data-message-action="copy">复制</button><button type="button" data-message-action="regenerate">重新生成</button>';
    item.append(label, body, actions);
  } else item.append(label, body);
  list.appendChild(item); list.scrollTop = list.scrollHeight; return item;
}

function providerById(id) { return PROVIDERS.find((item) => item.id === id) || PROVIDERS[0]; }

export function initAssistant() {
  if (document.getElementById('assistant-root')) return;
  let settings = loadSettings();
  settings.apiKey = sessionStorage.getItem(KEY_STORAGE) || '';
  const root = document.createElement('div'); root.id = 'assistant-root'; root.className = 'assistant-root';
  root.innerHTML = `
    <button class="assistant-fab" type="button" aria-label="打开智能助手"><span class="assistant-fab-orbit"></span><b>AI</b><small>智能助手</small></button>
    <section class="assistant-window" aria-label="智能机器人对话窗口">
      <header class="assistant-header"><div class="assistant-brand"><span class="assistant-avatar">✦</span><div><strong>粒子智能助手</strong><small>DEEPSEEK STYLE · 在线</small></div></div><div class="assistant-header-actions"><button type="button" data-assistant-action="settings" aria-label="设置">⚙</button><button type="button" data-assistant-action="fullscreen" aria-label="全屏">□</button><button type="button" data-assistant-action="minimize" aria-label="隐藏">—</button></div></header>
      <div class="assistant-settings" hidden><div class="assistant-settings-title"><strong>模型连接设置</strong><button type="button" data-assistant-action="settings-close">完成</button></div><p class="assistant-settings-tip">默认使用 DeepSeek · deepseek-chat。API Key 仅用于当前浏览器会话，并通过平台后端转发；DeepSeek 官方 API 需要账户额度。</p><label>API Provider（服务商）<select data-setting="provider"></select></label><label>API KEY<input data-setting="apiKey" type="password" placeholder="输入服务商 API Key" autocomplete="off"></label><label>Model（模型）<select data-setting="model"></select></label><label>Reasoning Effort（推理强度）<select data-setting="reasoning"><option value="auto">自动</option><option value="none">关闭</option><option value="low">低</option><option value="medium">中</option><option value="high">高</option></select></label><label>API Base URL（接口地址）<input data-setting="baseUrl" type="url" placeholder="OpenAI 兼容接口地址"></label><button class="assistant-save" type="button" data-assistant-action="save">保存连接配置</button></div>
      <div class="assistant-chat"><div class="assistant-messages"></div><div class="assistant-suggestions"><button type="button" data-prompt="帮我推荐适合电商首页的粒子特效">推荐电商特效</button><button type="button" data-prompt="如何把这个粒子特效接入我的网站？">接入方案</button><button type="button" data-prompt="帮我设计一个 WebAR 活动方案">WebAR 方案</button></div><form class="assistant-composer"><textarea rows="1" placeholder="描述你的需求，例如：帮我设计一个星空登录页…"></textarea><button type="submit" aria-label="发送">➤</button></form></div>
    </section>`;
  document.body.appendChild(root);
  const fab = root.querySelector('.assistant-fab'), win = root.querySelector('.assistant-window'), settingsPanel = root.querySelector('.assistant-settings'), messages = root.querySelector('.assistant-messages'), form = root.querySelector('.assistant-composer'), input = form.querySelector('textarea');
  const providerSelect = root.querySelector('[data-setting="provider"]'), modelSelect = root.querySelector('[data-setting="model"]');
  const setTheme = () => { root.dataset.systemTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'; };
  setTheme(); window.matchMedia('(prefers-color-scheme: light)').addEventListener?.('change', setTheme);
  const renderProviders = () => { providerSelect.innerHTML = '<optgroup label="国内大模型"></optgroup><optgroup label="海外大模型"></optgroup><optgroup label="其他服务"></optgroup>'; const groups = providerSelect.querySelectorAll('optgroup'); PROVIDERS.forEach((p) => { const group = ['deepseek','qwen','zhipu','moonshot','doubao','wenxin'].includes(p.id) ? groups[0] : ['openai','anthropic','google','mistral'].includes(p.id) ? groups[1] : groups[2]; const option = document.createElement('option'); option.value = p.id; option.textContent = p.name; group.appendChild(option); }); providerSelect.value = settings.provider; };
  const renderModels = () => { const provider = providerById(settings.provider); modelSelect.innerHTML = ''; provider.models.forEach((model) => { const option = document.createElement('option'); option.value = model; option.textContent = model; modelSelect.appendChild(option); }); modelSelect.value = provider.models.includes(settings.model) ? settings.model : provider.models[0]; settings.model = modelSelect.value; if (!settings.baseUrl || settings.provider !== provider.id) settings.baseUrl = provider.baseUrl; root.querySelector('[data-setting="baseUrl"]').value = settings.baseUrl; };
  renderProviders(); renderModels(); root.querySelector('[data-setting="apiKey"]').value = settings.apiKey; root.querySelector('[data-setting="reasoning"]').value = settings.reasoning;
  const open = () => { win.classList.add('assistant-open'); fab.classList.add('assistant-hidden'); if (!messages.children.length) messageBubble(messages, 'assistant', '你好，我是粒子智能助手。可以帮你设计特效方案、分析接入方式、生成前端代码和优化视觉效果。'); };
  const close = () => {
    win.classList.remove('assistant-open', 'assistant-minimized');
    root.classList.remove('assistant-fullscreen');
    fab.classList.remove('assistant-hidden');
    const fullscreenButton = root.querySelector('[data-assistant-action="fullscreen"]');
    fullscreenButton.textContent = '□';
    fullscreenButton.setAttribute('aria-label', '全屏');
    fullscreenButton.title = '全屏';
  };
  fab.addEventListener('click', open);
  root.querySelectorAll('[data-assistant-action="settings"]').forEach((b) => b.addEventListener('click', () => { settingsPanel.hidden = false; }));
  root.querySelector('[data-assistant-action="settings-close"]').addEventListener('click', () => { settingsPanel.hidden = true; });
  root.querySelector('[data-assistant-action="minimize"]').addEventListener('click', close);
  root.querySelector('[data-assistant-action="fullscreen"]').addEventListener('click', () => {
    const fullscreen = root.classList.toggle('assistant-fullscreen');
    const button = root.querySelector('[data-assistant-action="fullscreen"]');
    button.textContent = fullscreen ? '×' : '□';
    button.setAttribute('aria-label', fullscreen ? '退出全屏' : '全屏');
    button.title = fullscreen ? '退出全屏' : '全屏';
  });
  providerSelect.addEventListener('change', () => { settings.provider = providerSelect.value; settings.model = ''; settings.baseUrl = providerById(settings.provider).baseUrl; renderModels(); });
  modelSelect.addEventListener('change', () => { settings.model = modelSelect.value; });
  root.querySelectorAll('[data-setting="reasoning"], [data-setting="baseUrl"], [data-setting="apiKey"]').forEach((field) => field.addEventListener('input', () => { settings[field.dataset.setting] = field.value; }));
  root.querySelector('[data-assistant-action="save"]').addEventListener('click', () => { settings.apiKey = root.querySelector('[data-setting="apiKey"]').value.trim(); settings.reasoning = root.querySelector('[data-setting="reasoning"]').value; settings.baseUrl = root.querySelector('[data-setting="baseUrl"]').value.trim(); saveSettings(settings); settingsPanel.hidden = true; messageBubble(messages, 'assistant', '连接配置已保存。现在可以开始对话。'); });
  root.querySelectorAll('[data-prompt]').forEach((button) => button.addEventListener('click', () => { input.value = button.dataset.prompt; input.focus(); }));
  input.addEventListener('keydown', (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); form.requestSubmit(); } });
  messages.addEventListener('click', async (event) => {
    const copyButton = event.target.closest('[data-copy-code], [data-message-action="copy"]');
    if (copyButton) {
      const code = copyButton.dataset.copyCode !== undefined ? messages.querySelectorAll('.assistant-code code')[Number(copyButton.dataset.copyCode)]?.textContent : copyButton.closest('.assistant-message')?.querySelector('.assistant-message-body')?.textContent;
      if (code) { await navigator.clipboard?.writeText(code); copyButton.textContent = '已复制'; setTimeout(() => { copyButton.textContent = '复制'; }, 1200); }
    }
    if (event.target.closest('[data-message-action="regenerate"]')) {
      const previousUser = [...messages.querySelectorAll('.assistant-message-user')].pop();
      if (previousUser) { input.value = previousUser.querySelector('.assistant-message-body').textContent; form.requestSubmit(); }
    }
  });
  form.addEventListener('submit', async (event) => { event.preventDefault(); const text = input.value.trim(); if (!text) return; input.value = ''; messageBubble(messages, 'user', text); if (!settings.apiKey) { messageBubble(messages, 'assistant', 'DeepSeek 默认使用 deepseek-chat。请在设置中填写有效 API Key；DeepSeek 官方 API 需要账户额度，不能免 Key 直接调用。'); return; } const loading = messageBubble(messages, 'assistant', '正在连接模型…'); try { const headers = { 'Content-Type': 'application/json' }; const token = getToken(); if (token) headers.Authorization = `Bearer ${token}`; const response = await fetch('/api/assistant/chat', { method: 'POST', headers, body: JSON.stringify({ provider: settings.provider, baseUrl: settings.baseUrl, apiKey: settings.apiKey, model: settings.model, reasoningEffort: settings.reasoning, messages: [...messages.querySelectorAll('.assistant-message')].slice(-12).map((item) => ({ role: item.classList.contains('assistant-message-user') ? 'user' : 'assistant', content: item.querySelector('.assistant-message-body').textContent })) }) }); const result = await response.json(); if (!response.ok || result.code !== 200) throw new Error(result.message || '模型服务响应失败'); loading.remove(); messageBubble(messages, 'assistant', result.data?.reply || '模型没有返回文本内容。'); } catch (error) { loading.querySelector('.assistant-message-body').textContent = `连接失败：${error.message}。请检查 API Key、接口地址和后端服务。`; } });
  window.addEventListener('assistant:open', open); return root;
}
