// 首页：鼠标驱动的伪 3D 银河粒子主视觉
let rafId = null;
let cleanupGalaxy = null;

function initCyberGalaxy(canvas) {
  const ctx = canvas.getContext('2d', { alpha: false });
  const particles = [];
  const bursts = [];
  const mouse = { x: 0, y: 0, tx: 0, ty: 0, active: false };
  const palette = ['#7dd3fc', '#22d3ee', '#818cf8', '#a78bfa', '#f472b6', '#fef08a', '#ffffff'];
  let width = 0;
  let height = 0;
  let time = 0;
  let last = performance.now();

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth || window.innerWidth;
    height = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const createParticle = () => {
    const arm = Math.floor(Math.random() * 4);
    const radius = Math.pow(Math.random(), 0.65);
    return { radius, angle: arm * Math.PI / 2 + radius * 10.5 + (Math.random() - 0.5) * 0.9, z: Math.random() * 1.2 + 0.15, depth: Math.random() * 2 - 1, size: Math.random() * 1.8 + 0.35, color: palette[(Math.random() * palette.length) | 0], speed: 0.14 + Math.random() * 0.28, twinkle: Math.random() * 6.28, prevX: 0, prevY: 0 };
  };
  for (let i = 0; i < 1150; i++) particles.push(createParticle());
  const createBurst = (x, y) => {
    for (let i = 0; i < 110; i++) { const a = Math.random() * Math.PI * 2; const speed = 1.2 + Math.random() * 5.8; bursts.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: 1, size: .8 + Math.random() * 2.4, color: palette[(Math.random() * palette.length) | 0] }); }
  };
  const onResize = () => resize();
  const onPointerMove = (event) => { const rect = canvas.getBoundingClientRect(); mouse.tx = ((event.clientX - rect.left) / rect.width - 0.5) * 2; mouse.ty = ((event.clientY - rect.top) / rect.height - 0.5) * 2; mouse.active = true; };
  const onPointerLeave = () => { mouse.active = false; mouse.tx = 0; mouse.ty = 0; };
  const onPointerDown = (event) => { const rect = canvas.getBoundingClientRect(); createBurst(event.clientX - rect.left, event.clientY - rect.top); };
  canvas.addEventListener('pointermove', onPointerMove); canvas.addEventListener('pointerleave', onPointerLeave); canvas.addEventListener('pointerdown', onPointerDown); window.addEventListener('resize', onResize); resize();

  const draw = (now) => {
    const dt = Math.min((now - last) / 1000, 0.04); last = now; time += dt; mouse.x += (mouse.tx - mouse.x) * Math.min(1, dt * 4.5); mouse.y += (mouse.ty - mouse.y) * Math.min(1, dt * 4.5);
    const cx = width * 0.5 + mouse.x * width * 0.06, cy = height * 0.52 + mouse.y * height * 0.045, scale = Math.min(width, height) * 0.78;
    const day = document.body.classList.contains('theme-day');
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) * .72); bg.addColorStop(0, day ? '#fff4cf' : '#19104d'); bg.addColorStop(.3, day ? '#fff0e8' : '#0e1a4e'); bg.addColorStop(1, day ? '#b9e9ff' : '#030611'); ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.16 + mouse.x * .05);
    for (let i = 0; i < 7; i++) { ctx.globalAlpha = day ? .035 : .055; ctx.strokeStyle = i % 2 ? '#22d3ee' : '#a855f7'; ctx.lineWidth = 32 + i * 18; ctx.beginPath(); ctx.ellipse(0, 0, scale * (.34 + i * .08), scale * (.11 + i * .025), 0, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
    for (const p of particles) {
      p.angle += p.speed * dt; p.twinkle += dt * (1.5 + p.speed * 3); p.z += dt * .035; if (p.z > 1.35) p.z = .12;
      const radial = p.radius * scale * (0.95 + p.z * .16), perspective = 1 / (0.7 + p.z), x = cx + Math.cos(p.angle) * radial * perspective + p.depth * width * .08 * mouse.x, y = cy + Math.sin(p.angle) * radial * .39 * perspective + p.depth * height * .055 * mouse.y;
      const alpha = Math.min(1, .28 + Math.abs(Math.sin(p.twinkle)) * .72) * (1 - p.radius * .35), size = p.size * perspective * (1.1 + p.z);
      if (p.prevX) { ctx.globalAlpha = alpha * .22; ctx.strokeStyle = p.color; ctx.lineWidth = Math.max(.35, size * .4); ctx.beginPath(); ctx.moveTo(p.prevX, p.prevY); ctx.lineTo(x, y); ctx.stroke(); }
      const glowRadius = Math.max(.1, size * 7); const glow = ctx.createRadialGradient(x, y, 0, x, y, glowRadius); glow.addColorStop(0, `rgba(255,255,255,${alpha})`); glow.addColorStop(.18, p.color); glow.addColorStop(1, 'rgba(0,0,0,0)'); ctx.globalAlpha = alpha; ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, glowRadius, 0, Math.PI * 2); ctx.fill(); p.prevX = x; p.prevY = y;
    }
    ctx.globalAlpha = 1;
    const coreR = 30 + Math.sin(time * 2.3) * 8 + mouse.active * 8, core = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 5); core.addColorStop(0, 'rgba(255,255,255,.98)'); core.addColorStop(.08, 'rgba(255,246,190,.98)'); core.addColorStop(.22, 'rgba(255,110,210,.75)'); core.addColorStop(.48, 'rgba(124,91,255,.28)'); core.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = core; ctx.beginPath(); ctx.arc(cx, cy, coreR * 5, 0, Math.PI * 2); ctx.fill();
    for (let i = bursts.length - 1; i >= 0; i--) { const b = bursts[i]; b.x += b.vx; b.y += b.vy; b.vx *= .985; b.vy *= .985; b.life -= dt * 1.55; if (b.life <= 0) { bursts.splice(i, 1); continue; } ctx.globalAlpha = b.life; ctx.fillStyle = b.color; ctx.shadowBlur = 16; ctx.shadowColor = b.color; ctx.beginPath(); ctx.arc(b.x, b.y, b.size * b.life, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; }
    ctx.globalAlpha = 1; rafId = requestAnimationFrame(draw);
  };
  rafId = requestAnimationFrame(draw);
  return () => { cancelAnimationFrame(rafId); window.removeEventListener('resize', onResize); canvas.removeEventListener('pointermove', onPointerMove); canvas.removeEventListener('pointerleave', onPointerLeave); canvas.removeEventListener('pointerdown', onPointerDown); };
}

export function renderHome(app) {
  if (rafId) cancelAnimationFrame(rafId); if (cleanupGalaxy) cleanupGalaxy();
  app.innerHTML = `
    <div class="home-wrap">
      <canvas id="home-bg"></canvas><div class="home-orbit home-orbit-a"></div><div class="home-orbit home-orbit-b"></div>
      <section class="home-hero">
        <div class="home-badge"><span></span> AR PARTICLE VFX · IMMERSIVE STUDIO</div>
        <h1 class="home-title">把银河宇宙<br><em>装进你的产品</em></h1>
        <p class="home-sub">高保真 3D 粒子 · WebAR 交互 · 商用级视觉资产</p>
        <div class="home-actions"><a class="home-btn home-btn-primary" href="#/effects">探索特效宇宙 <b>↗</b></a><a class="home-btn home-btn-ghost" href="#/demo">开启实时体验 <b>◉</b></a></div>
        <div class="home-hint"><i></i> 移动鼠标操控星流 · 点击画面触发星爆</div>
      </section>
      <div class="home-metrics"><div><strong>15</strong><span>粒子资产</span></div><div><strong>60</strong><span>FPS 流畅渲染</span></div><div><strong>1</strong><span>文件即可导出</span></div></div>
      <div class="home-corner home-corner-tl">LIVE / 3D GALAXY PARTICLE FIELD</div><div class="home-corner home-corner-br">MOVE TO EXPLORE · CLICK TO BURST</div>
    </div>
    <style>
      .home-wrap{--home-text:#f8fafc;--home-muted:#cbd5e1;position:relative;min-height:calc(100vh - 60px);display:flex;align-items:center;justify-content:center;overflow:hidden;background:#030611;color:var(--home-text)}#home-bg{position:absolute;inset:0;width:100%;height:100%;display:block;cursor:crosshair}.home-wrap:after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 50% 50%,transparent 30%,rgba(0,0,0,.38) 100%),linear-gradient(115deg,rgba(0,229,255,.06),transparent 30%,rgba(236,72,153,.08))}.home-hero{position:relative;z-index:1;text-align:center;padding:72px 24px 100px;max-width:980px;pointer-events:none}.home-hero a{pointer-events:auto}.home-badge{display:inline-flex;align-items:center;gap:8px;padding:8px 18px;border-radius:999px;font-size:11px;letter-spacing:3px;color:#67e8f9;background:rgba(8,15,38,.58);border:1px solid rgba(34,211,238,.42);box-shadow:0 0 28px rgba(34,211,238,.18),inset 0 0 18px rgba(34,211,238,.08)}.home-badge span{width:7px;height:7px;border-radius:50%;background:#34d399;box-shadow:0 0 12px #34d399}.home-title{margin:28px 0 18px;font-size:clamp(2.8rem,7vw,6.4rem);font-weight:900;line-height:1.02;letter-spacing:-.06em;text-shadow:0 12px 50px rgba(0,0,0,.36);background:linear-gradient(110deg,#dffaff 0%,#22d3ee 27%,#a78bfa 55%,#fb7185 82%,#fde68a 100%);-webkit-background-clip:text;background-clip:text;color:transparent}.home-title em{font-style:normal;background:linear-gradient(110deg,#22d3ee,#818cf8,#f472b6);-webkit-background-clip:text;background-clip:text;color:transparent}.home-sub{margin:0 0 34px;font-size:clamp(1rem,2vw,1.25rem);color:var(--home-muted);letter-spacing:2px}.home-actions{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}.home-btn{position:relative;overflow:hidden;display:inline-flex;align-items:center;gap:14px;padding:16px 26px;border-radius:14px;font-size:15px;font-weight:800;letter-spacing:.6px;text-decoration:none;transition:transform .25s,box-shadow .25s,border-color .25s}.home-btn b{font-size:18px}.home-btn:hover{transform:translateY(-4px)}.home-btn-primary{color:#fff;background:linear-gradient(110deg,#0891b2,#7c3aed 52%,#ec4899);box-shadow:0 14px 44px rgba(124,58,237,.38),inset 0 1px rgba(255,255,255,.42)}.home-btn-primary:hover{box-shadow:0 18px 54px rgba(236,72,153,.48),0 0 35px rgba(34,211,238,.22)}.home-btn-ghost{color:#bff8ff;background:rgba(8,15,38,.48);border:1px solid rgba(103,232,249,.45);box-shadow:inset 0 0 20px rgba(34,211,238,.08)}.home-btn-ghost:hover{border-color:#67e8f9;background:rgba(34,211,238,.14);box-shadow:0 12px 38px rgba(34,211,238,.2)}.home-hint{margin-top:24px;color:rgba(226,232,240,.62);font-size:11px;letter-spacing:1px}.home-hint i{display:inline-block;width:6px;height:6px;border-radius:50%;background:#f472b6;box-shadow:0 0 12px #f472b6;margin-right:6px}.home-metrics{position:absolute;z-index:2;left:28px;bottom:24px;display:flex;gap:28px}.home-metrics div{display:flex;flex-direction:column;gap:2px}.home-metrics strong{font-size:20px;color:#f8fafc}.home-metrics span{font-size:10px;letter-spacing:1px;color:#94a3b8}.home-corner{position:absolute;z-index:2;color:rgba(148,163,184,.6);font-size:9px;letter-spacing:2px}.home-corner-tl{left:28px;top:28px}.home-corner-br{right:28px;bottom:28px}.home-orbit{position:absolute;z-index:1;pointer-events:none;width:56vw;height:18vw;border:1px solid rgba(103,232,249,.14);border-radius:50%;transform:rotate(-18deg);box-shadow:0 0 28px rgba(34,211,238,.08)}.home-orbit-a{width:62vw}.home-orbit-b{width:42vw;transform:rotate(34deg);border-color:rgba(244,114,182,.13)}body.theme-day .home-wrap{--home-text:#19223d;--home-muted:#3b4a70}.theme-day .home-wrap:after{background:radial-gradient(circle at 50% 50%,transparent 28%,rgba(255,255,255,.24) 100%),linear-gradient(115deg,rgba(14,165,233,.08),transparent 30%,rgba(236,72,153,.1))}.theme-day .home-badge{color:#075985;background:rgba(255,255,255,.58);border-color:rgba(14,116,144,.38)}.theme-day .home-btn-ghost{color:#075985;background:rgba(255,255,255,.48);border-color:rgba(14,116,144,.38)}.theme-day .home-metrics strong{color:#172554}.theme-day .home-corner{color:rgba(30,64,175,.62)}@media(max-width:768px){.home-hero{padding:60px 18px 120px}.home-metrics{left:18px;right:18px;justify-content:space-between;gap:10px}.home-corner{display:none}.home-orbit{width:100vw;height:34vw}}
    </style>
  `;
  cleanupGalaxy = initCyberGalaxy(app.querySelector('#home-bg'));
}
