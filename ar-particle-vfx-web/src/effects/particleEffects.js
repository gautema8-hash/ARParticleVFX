// src/effects/particleEffects.js
// 普通粒子特效引擎：为 12 款特效生成「自包含、零依赖、可独立运行」的 HTML
// mode: fall(下落) | float(漂浮) | swarm(群游) | grid(网格波动) | burst(点击爆炸) | vortex(漩涡)

const CFG = {
  snow:      { mode: 'fall',   colors: ['#ffffff', '#e0f2fe'], count: 180, size: [1.5, 4], speed: [0.5, 1.6], sway: [0.3, 1.0], shape: 'circle' },
  rain:      { mode: 'fall',   colors: ['#38bdf8', '#0ea5e9'], count: 220, size: [10, 16],  speed: [9, 14],    sway: [0, 0],       shape: 'line' },
  petal:     { mode: 'fall',   colors: ['#f9a8d4', '#f472b6', '#fbcfe8'], count: 70, size: [4, 7], speed: [0.6, 1.4], sway: [1.0, 2.0], shape: 'ellipse', spin: true },
  sakura:    { mode: 'fall',   colors: ['#fecdd3', '#fda4af', '#fecaca'], count: 130, size: [2, 4.5], speed: [0.8, 1.8], sway: [0.6, 1.6], shape: 'ellipse', spin: true },
  butterfly: { mode: 'swarm',  colors: ['#f97316', '#ec4899', '#a855f7', '#fbbf24'], count: 40, size: [3, 6], speed: [0.8, 2.0], shape: 'wings' },
  fish:      { mode: 'swarm',  colors: ['#22d3ee', '#38bdf8', '#0ea5e9'], count: 55, size: [4, 8], speed: [0.8, 2.2], shape: 'fish' },
  bird:      { mode: 'swarm',  colors: ['#e5e7eb', '#f3f4f6', '#9ca3af'], count: 60, size: [3, 5], speed: [1.2, 2.6], shape: 'bird' },
  firefly:   { mode: 'float',  colors: ['#a3e635', '#fde047'], count: 90, size: [2, 4], speed: [0.3, 1.0], shape: 'glow' },
  grid:      { mode: 'grid',   colors: ['#22d3ee'], count: 0, size: [1.5, 3], speed: [1, 1], shape: 'circle' },
  wave:      { mode: 'grid',   colors: ['#a855f7', '#22d3ee'], count: 0, size: [2, 4], speed: [1.5, 1.5], shape: 'circle' },
  firework:  { mode: 'burst',  colors: ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#f472b6'], count: 90, size: [1.5, 3], speed: [2, 6], shape: 'circle' },
  nebula:    { mode: 'vortex', colors: ['#a855f7', '#22d3ee', '#8b5cf6', '#ec4899'], count: 420, size: [1, 3], speed: [0.4, 1.4], shape: 'glow' }
};

// 通用粒子引擎（注入到生成的 HTML 中）
const ENGINE = `
var c=document.getElementById('c'),x=c.getContext('2d');
function resize(){c.width=innerWidth;c.height=innerHeight} resize();addEventListener('resize',resize);
var N=__COUNT__,MODE='__MODE__',SHAPE='__SHAPE__',SPIN=__SPIN__;
var COLORS=__COLORS__,SIZE_MIN=__SIZE_MIN__,SIZE_MAX=__SIZE_MAX__,SPD_MIN=__SPD_MIN__,SPD_MAX=__SPD_MAX__,SWAY_MIN=__SWAY_MIN__,SWAY_MAX=__SWAY_MAX__;
var ps=[],bursts=[];
function rnd(a,b){return a+Math.random()*(b-a)}
function pick(arr){return arr[(Math.random()*arr.length)|0]}
function makeParticle(ox,oy){
  var p={x:ox!==undefined?ox:rnd(0,c.width),y:oy!==undefined?oy:rnd(0,c.height),
    size:rnd(SIZE_MIN,SIZE_MAX),color:pick(COLORS),age:rnd(0,6.28),sway:rnd(SWAY_MIN,SWAY_MAX),spd:rnd(SPD_MIN,SPD_MAX)};
  if(MODE==='fall'){p.y=-p.size;p.vy=rnd(1,2);p.vx=rnd(-0.3,0.3);}
  else if(MODE==='float'){p.vx=rnd(-1,1)*0.4;p.vy=rnd(-1,1)*0.4;}
  else if(MODE==='swarm'){var a=rnd(0,6.28);p.cx=rnd(0,c.width);p.cy=rnd(0,c.height);p.r=rnd(20,70);p.a=a;p.va=rnd(0.01,0.04)*p.spd;}
  else if(MODE==='vortex'){var r=rnd(20,Math.min(c.width,c.height)*0.5);var an=rnd(0,6.28);p.cx=c.width/2;p.cy=c.height/2;p.r=r;p.an=an;p.va=rnd(0.005,0.02)*p.spd;}
  return p;
}
if(MODE==='grid'){var gap=__GAP__;for(var gx=0;gx<c.width+gap;gx+=gap){for(var gy=0;gy<c.height+gap;gy+=gap){ps.push({x:gx,y:gy,baseX:gx,baseY:gy,size:rnd(SIZE_MIN,SIZE_MAX),color:pick(COLORS)});}}}
else{for(var i=0;i<N;i++)ps.push(makeParticle());}
function update(){
  for(var i=0;i<ps.length;i++){var p=ps[i];p.age+=0.02;
    if(MODE==='fall'){p.y+=p.vy*(1+p.spd*0.4);p.x+=Math.sin(p.age*p.sway)*0.6;if(p.y>c.height+p.size){p.y=-p.size;p.x=rnd(0,c.width);}}
    else if(MODE==='float'){p.x+=Math.sin(p.age)*p.sway*0.5;p.y+=Math.cos(p.age*1.3)*p.sway*0.4;p.x+=p.vx;p.y+=p.vy;
      if(p.x<0||p.x>c.width||p.y<0||p.y>c.height){p.vx*=-1;p.vy*=-1;p.x=Math.max(0,Math.min(c.width,p.x));p.y=Math.max(0,Math.min(c.height,p.y));}}
    else if(MODE==='swarm'){p.a+=p.va;p.cx+=p.spd;if(p.cx>c.width+80)p.cx=-80;if(p.cx<-80)p.cx=c.width+80;p.x=p.cx+Math.cos(p.a)*p.r;p.y=p.cy+Math.sin(p.a)*p.r*0.4;}
    else if(MODE==='vortex'){p.an+=p.va;p.r-=0.15;if(p.r<5){p.r=rnd(40,Math.min(c.width,c.height)*0.5);}p.x=p.cx+Math.cos(p.an)*p.r;p.y=p.cy+Math.sin(p.an)*p.r*0.6;}
    else if(MODE==='grid'){p.x=p.baseX+Math.sin(p.baseY*0.02+p.age)*8;p.y=p.baseY+Math.cos(p.baseX*0.02+p.age)*8;}
  }
  for(var b=0;b<bursts.length;b++){var bu=bursts[b];bu.age++;for(var j=0;j<bu.parts.length;j++){var q=bu.parts[j];q.x+=q.vx;q.y+=q.vy;q.vy+=0.05;q.life-=0.015;}if(bu.age>90)bursts.splice(b--,1);}
}
function draw(){
  for(var i=0;i<ps.length;i++){var p=ps[i];var al=1;
    if(MODE==='float')al=0.4+0.6*Math.abs(Math.sin(p.age*2));
    x.globalAlpha=al;
    if(SHAPE==='circle'){x.fillStyle=p.color;x.beginPath();x.arc(p.x,p.y,p.size,0,6.283);x.fill();}
    else if(SHAPE==='line'){x.strokeStyle=p.color;x.lineWidth=1.5;x.beginPath();x.moveTo(p.x,p.y);x.lineTo(p.x-p.size*0.3,p.y-p.size);x.stroke();}
    else if(SHAPE==='ellipse'){x.save();x.translate(p.x,p.y);x.rotate(SPIN?Math.sin(p.age)*0.8:0);x.fillStyle=p.color;x.beginPath();x.ellipse(0,0,p.size,p.size*0.6,0,0,6.283);x.fill();x.restore();}
    else if(SHAPE==='glow'){var g=x.createRadialGradient(p.x,p.y,0,p.x,p.y,p.size*4);g.addColorStop(0,p.color);g.addColorStop(1,'transparent');x.fillStyle=g;x.beginPath();x.arc(p.x,p.y,p.size*4,0,6.283);x.fill();}
    else if(SHAPE==='wings'){x.fillStyle=p.color;x.beginPath();x.ellipse(p.x-Math.sin(p.age*6)*3,p.y,3,p.size*0.8,0,0,6.283);x.ellipse(p.x+Math.sin(p.age*6)*3,p.y,3,p.size*0.8,0,0,6.283);x.fill();}
    else if(SHAPE==='fish'){x.save();x.translate(p.x,p.y);x.fillStyle=p.color;x.beginPath();x.ellipse(0,0,p.size,p.size*0.45,0,0,6.283);x.fill();x.beginPath();x.moveTo(p.size,0);x.lineTo(p.size*1.7,p.size*0.5);x.lineTo(p.size*1.7,-p.size*0.5);x.fill();x.restore();}
    else if(SHAPE==='bird'){x.strokeStyle=p.color;x.lineWidth=1.5;var fl=Math.sin(p.age*8)*3;x.beginPath();x.moveTo(p.x-fl,p.y-2);x.quadraticCurveTo(p.x,p.y,p.x+fl,p.y-2);x.stroke();}
  }
  for(var b=0;b<bursts.length;b++){var bu=bursts[b];for(var j=0;j<bu.parts.length;j++){var q=bu.parts[j];x.globalAlpha=Math.max(0,q.life);x.fillStyle=q.color;x.beginPath();x.arc(q.x,q.y,q.size,0,6.283);x.fill();}}
  x.globalAlpha=1;
}
if(MODE==='burst'){addEventListener('click',function(e){var parts=[];for(var i=0;i<N;i++){var a=rnd(0,6.28);var v=rnd(SPD_MIN,SPD_MAX);parts.push({x:e.clientX,y:e.clientY,vx:Math.cos(a)*v,vy:Math.sin(a)*v,size:rnd(SIZE_MIN,SIZE_MAX),color:pick(COLORS),life:1});}bursts.push({age:0,parts:parts});});}
function loop(){x.fillStyle='rgba(10,10,18,0.2)';x.fillRect(0,0,c.width,c.height);update();draw();requestAnimationFrame(loop);}
loop();
`;

function cfgOr(id) { return CFG[id] || CFG.snow; }

export function buildEffectHTML(effect) {
  const c = cfgOr(effect.id);
  const gap = effect.id === 'grid' ? 26 : 30;
  const code = ENGINE
    .replace(/__COUNT__/g, String(c.count))
    .replace(/__MODE__/g, c.mode)
    .replace(/__SHAPE__/g, c.shape)
    .replace(/__SPIN__/g, c.spin ? 'true' : 'false')
    .replace(/__COLORS__/g, JSON.stringify(c.colors))
    .replace(/__SIZE_MIN__/g, c.size[0])
    .replace(/__SIZE_MAX__/g, c.size[1])
    .replace(/__SPD_MIN__/g, c.speed[0])
    .replace(/__SPD_MAX__/g, c.speed[1])
    .replace(/__SWAY_MIN__/g, c.sway[0])
    .replace(/__SWAY_MAX__/g, c.sway[1])
    .replace(/__GAP__/g, String(gap));

  const isFree = effect.tier === 'free' || effect.tier === 0;
  const copyright = isFree
    ? '<!-- 免费版：仅供学习使用，商用请购买授权 -->'
    : '<!-- Pro 特效：商用需会员授权 -->';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${effect.name} - 粒子特效</title>
<style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#0a0a12}canvas{display:block}</style>
</head>
<body>
<canvas id="c"></canvas>
${copyright}
<script>
${code}
</script>
</body>
</html>`;
}


