// src/tools/params.js — 粒子参数生成器
export function buildParamsConfig(p) {
  return {
    particleCount: p.count,
    color: p.color,
    size: p.size,
    speed: p.speed,
    opacity: p.opacity
  };
}

export function buildParamsCode(p) {
  const config = buildParamsConfig(p);
  return `// 粒子特效参数配置
const particleConfig = ${JSON.stringify(config, null, 2)};
`;
}
