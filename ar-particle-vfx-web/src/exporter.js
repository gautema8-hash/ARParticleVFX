// src/exporter.js — 单文件 HTML 导出 / 复制
import { getEffect } from './effects/registry.js';
import { buildEffectHTML } from './effects/particleEffects.js';

// AR 特效暂时保留轻量占位导出；普通粒子由高级 Three.js 3D 引擎生成。
function buildParticleDemo(effect) {
  const isAR = effect.mode !== null;
  const color = isAR ? '#a855f7' : '#22d3ee';
  const count = 140;

  if (isAR) {
    return `
    <style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#050816}#camera{position:fixed;inset:0;width:100%;height:100%;object-fit:cover;filter:saturate(1.12) contrast(1.05)}#fx{position:fixed;inset:0;width:100%;height:100%}.tip{position:fixed;z-index:3;bottom:20px;left:50%;transform:translateX(-50%);padding:9px 14px;border-radius:999px;color:#fff;background:rgba(5,8,22,.62);font:13px sans-serif}</style>
    <video id="camera" autoplay muted playsinline></video><div id="fx"></div><div class="tip">${effect.name} · AR 粒子特效 · 点击画面触发爆发</div>
    <script src="https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.min.js"><\/script><script>(async function(){
      const video=document.getElementById('camera');try{video.srcObject=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'},audio:false});}catch(e){document.querySelector('.tip').textContent='请允许摄像头权限后体验 AR 特效';}
      const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.1,100);camera.position.z=12;const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setSize(innerWidth,innerHeight);document.getElementById('fx').appendChild(renderer.domElement);const n=2200,a=new Float32Array(n*3);for(let i=0;i<n;i++){const k=i*3;a[k]=(Math.random()-.5)*14;a[k+1]=(Math.random()-.5)*9;a[k+2]=(Math.random()-.5)*7;}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(a,3));const m=new THREE.PointsMaterial({color:'${color}',size:.075,transparent:true,opacity:.85,blending:THREE.AdditiveBlending});const p=new THREE.Points(g,m);scene.add(p);addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});addEventListener('pointerdown',()=>{p.scale.set(1.8,1.8,1.8);setTimeout(()=>p.scale.set(1,1,1),420)});function loop(t){p.rotation.y=t*.00015;p.rotation.x=Math.sin(t*.0003)*.12;renderer.render(scene,camera);requestAnimationFrame(loop)}requestAnimationFrame(loop);
    })();<\/script>`;
  }

  return `
  <style>
    body{margin:0;overflow:hidden;background:#0a0a12}
    canvas{display:block}
    .tip{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);
      color:rgba(255,255,255,.7);font-family:sans-serif;font-size:14px}
  </style>
  <canvas id="c"></canvas>
  <div class="tip">${effect.name} · 粒子演示${isAR ? '（完整 AR 特效代码后续接入）' : ''}</div>
  <script>
  (function(){
    var c=document.getElementById('c'),x=c.getContext('2d');
    function resize(){c.width=innerWidth;c.height=innerHeight}
    resize();addEventListener('resize',resize);
    var N=${count},COLOR='${color}',ps=[];
    for(var i=0;i<N;i++)ps.push({x:Math.random()*c.width,y:Math.random()*c.height,
      vx:(Math.random()-.5)*.8,vy:(Math.random()-.5)*.8,r:Math.random()*2.5+1});
    function loop(){
      x.clearRect(0,0,c.width,c.height);
      for(var i=0;i<N;i++){
        var p=ps[i];
        p.x+=p.vx;p.y+=p.vy;
        if(p.x<0||p.x>c.width)p.vx*=-1;
        if(p.y<0||p.y>c.height)p.vy*=-1;
        x.beginPath();x.arc(p.x,p.y,p.r,0,6.283);
        x.fillStyle=COLOR;x.fill();
      }
      requestAnimationFrame(loop);
    }
    loop();
  })();
  </script>`;
}

export async function buildSingleFileHTML(effectId, opts = {}) {
  const effect = opts.effect || getEffect(effectId);
  if (!effect) return '';

  if (effect.sourceHtml) return effect.sourceHtml;

  // 普通粒子特效：生成高级 3D 点云动画 HTML。
  if (effect.mode === 'particle') {
    return await buildEffectHTML(effect);
  }

  // AR 特效（依赖摄像头 + Three.js + MediaPipe）：暂无独立导出，保留占位提示
  const copyright = opts.isMember
    ? '<!-- 已授权商用版 -->'
    : '<!-- 免费版：仅供学习使用，商用请购买授权 -->';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${effect.name} - 粒子特效</title>
  ${copyright}
</head>
<body>
  ${buildParticleDemo(effect)}
</body>
</html>`;
}

export async function copyCode(html) {
  try {
    await navigator.clipboard.writeText(html);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = html;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

export function downloadCode(filename, html, ext = 'html') {
  const type = ext === 'html' ? 'text/html;charset=utf-8' : 'text/plain;charset=utf-8';
  const blob = new Blob([html], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
