// src/views/home.js — 首页（Hero + 价值卡片）
export function renderHome(app) {
  app.innerHTML = `
    <div class="page">
      <section class="hero">
        <h1>WebAR粒子特效代码库</h1>
        <p>200+ 款 Canvas / WebGL 粒子特效，支持实景 AR 交互，一键复制、开箱即用</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="#/effects">立即浏览特效库</a>
          <a class="btn btn-ghost" href="#/demo">免费体验粒子特效</a>
        </div>
      </section>
      <section class="grid">
        <div class="card"><h3>一键复制代码</h3><p class="muted">完整 HTML/CSS/JS，粘贴即可运行</p></div>
        <div class="card"><h3>单文件导出</h3><p class="muted">下载 .html 双击直接预览</p></div>
        <div class="card"><h3>WebAR 实景交互</h3><p class="muted">浏览器调用摄像头，粒子叠加真实场景</p></div>
        <div class="card"><h3>全场景商用授权</h3><p class="muted">会员解锁商业使用权限</p></div>
      </section>
    </div>
  `;
}
