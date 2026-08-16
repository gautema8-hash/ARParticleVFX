// src/views/help.js — 帮助中心（使用教程 / 授权说明 / 常见问题）
export function renderHelp(app, section = 'tutorial') {
  app.innerHTML = `
    <div class="page">
      <h2 class="section-title">帮助中心</h2>
      <p class="muted">使用教程 / 授权说明 / 常见问题</p>

      <div class="chips" id="help-tabs">
        <button class="chip chip-active" data-help="tutorial" type="button">使用教程</button>
        <button class="chip" data-help="license" type="button">授权说明</button>
        <button class="chip" data-help="faq" type="button">常见问题</button>
      </div>

      <div id="help-panel"></div>
    </div>
  `;

  const panel = app.querySelector('#help-panel');
  const tabs = app.querySelectorAll('#help-tabs .chip');

  const SECTIONS = {
    tutorial: `
      <div class="card">
        <h3>使用教程</h3>
        <div class="help-step"><h4>1. 挑选特效</h4><p class="card-desc">进入「特效中心」，按分类浏览，点击卡片查看详情。</p></div>
        <div class="help-step"><h4>2. 一键复制代码</h4><p class="card-desc">在详情页点击「一键复制代码」，粘贴到 .html 文件即可运行。</p></div>
        <div class="help-step"><h4>3. 嵌入现有网页</h4><p class="card-desc">将导出的代码块嵌入你的 HTML 页面（或作为背景层），调整定位即可。</p></div>
        <div class="help-step"><h4>4. 体验 WebAR</h4><p class="card-desc">点击「免费体验」或进入「WebAR实景」，授权摄像头后用手势驱动粒子。</p></div>
      </div>`,
    license: `
      <div class="card">
        <h3>授权说明</h3>
        <table class="compare">
          <thead><tr><th>权益</th><th>免费版</th><th>个人 Pro</th><th>企业版</th></tr></thead>
          <tbody>
            <tr><td>普通特效</td><td>每日 3 次</td><td>不限次</td><td>不限次</td></tr>
            <tr><td>AR 特效</td><td>—</td><td>每日 10 次</td><td>无限制</td></tr>
            <tr><td>商用授权</td><td>—</td><td>个人</td><td>企业</td></tr>
            <tr><td>版权标识</td><td>保留</td><td>可去除</td><td>可去除</td></tr>
          </tbody>
        </table>
        <p class="card-desc" style="margin-top:12px">免费版代码带版权标识、仅限学习使用；会员版解锁商用授权并可去除版权标识。</p>
      </div>`,
    faq: `
      <div class="card">
        <h3>常见问题</h3>
        <div class="help-step"><h4>摄像头打不开 / 提示被占用？</h4><p class="card-desc">关闭占用摄像头的应用（微信、Zoom 等）后重试，或在浏览器地址栏允许摄像头权限。</p></div>
        <div class="help-step"><h4>哪些浏览器支持？</h4><p class="card-desc">Chrome / Edge / Safari 最新版；摄像头需在 HTTPS 或 localhost 环境。</p></div>
        <div class="help-step"><h4>粒子卡顿怎么办？</h4><p class="card-desc">调低粒子大小、关闭光晕（bloom），或在参数面板降低粒子数量。</p></div>
        <div class="help-step"><h4>复制代码后怎么运行？</h4><p class="card-desc">新建 .html 文件，粘贴复制的完整代码，双击用浏览器打开即可。</p></div>
      </div>`
  };

  function render(section) {
    panel.innerHTML = SECTIONS[section];
  }

  tabs.forEach((tab) => tab.addEventListener('click', () => {
    tabs.forEach((t) => t.classList.remove('chip-active'));
    tab.classList.add('chip-active');
    render(tab.dataset.help);
  }));

  // 根据子路由初始化对应节（默认「使用教程」）
  const initial = SECTIONS[section] ? section : 'tutorial';
  tabs.forEach((t) => t.classList.toggle('chip-active', t.dataset.help === initial));
  render(initial);
}

