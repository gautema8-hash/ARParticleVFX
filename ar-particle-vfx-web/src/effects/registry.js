// src/effects/registry.js — 特效模板注册表（数据驱动）
// 每个特效 = 元数据（id/name/category/mode/tags/tier/description/params）
// mode 对应 particleScene.js 的 effectMode；mode 为 null 表示「待实现」的模板。

export const CATEGORIES = [
  { id: 'all', name: '全部特效' },
  { id: 'ar', name: 'AR专属特效' },
  { id: 'animal', name: '动物粒子' },
  { id: 'flower', name: '花卉粒子' },
  { id: 'geometry', name: '几何粒子' },
  { id: 'festival', name: '节日粒子' },
  { id: 'nature', name: '自然粒子' },
  { id: 'tech', name: '科技粒子' }
];

export const EFFECTS = [
  // —— AR 专属（已实现，可免费体验 #/demo）——
  {
    id: 'galaxy', name: '宇宙星系', category: 'ar', mode: 'galaxy',
    tags: ['AR专属', '手势交互'], tier: 'free',
    description: '手势驱动螺旋星系、星河光带、引力冲击波与真实感行星',
    params: { sizeFactor: 1, speedFactor: 1, bloomStrength: 0.7 }
  },
  {
    id: 'ocean', name: '海水潮流', category: 'ar', mode: 'ocean',
    tags: ['AR专属'], tier: 'free',
    description: '青蓝潮流粒子随波浪流动的沉浸式海水特效',
    params: { sizeFactor: 1, speedFactor: 1, bloomStrength: 0.7 }
  },
  {
    id: 'photoParticle', name: '人像粒子', category: 'ar', mode: 'photoParticle',
    tags: ['AR专属', '人像重构'], tier: 'free',
    description: '上传照片，5 万粒子高保真重构人像，可爆炸/复原',
    params: { sizeFactor: 1, speedFactor: 1, bloomStrength: 0.7 }
  },

  // —— 普通粒子（已实现，自包含 Canvas 2D 引擎，可预览 + 导出）——
  { id: 'butterfly', name: '蝴蝶粒子', category: 'animal', mode: 'particle', tags: ['普通粒子'], tier: 'free', description: '蝴蝶飞舞轨迹', params: {} },
  { id: 'fish', name: '游鱼粒子', category: 'animal', mode: 'particle', tags: ['普通粒子'], tier: 'free', description: '鱼群游动轨迹', params: {} },
  { id: 'bird', name: '飞鸟粒子', category: 'animal', mode: 'particle', tags: ['普通粒子'], tier: 'pro', description: '鸟群迁徙轨迹', params: {} },

  { id: 'petal', name: '花瓣粒子', category: 'flower', mode: 'particle', tags: ['普通粒子'], tier: 'free', description: '花瓣飘落', params: {} },
  { id: 'sakura', name: '樱花粒子', category: 'flower', mode: 'particle', tags: ['普通粒子'], tier: 'free', description: '樱花纷飞', params: {} },

  { id: 'grid', name: '科技点阵', category: 'geometry', mode: 'particle', tags: ['普通粒子'], tier: 'free', description: '点阵网格波动', params: {} },
  { id: 'wave', name: '粒子波', category: 'geometry', mode: 'particle', tags: ['普通粒子'], tier: 'pro', description: '几何粒子波动', params: {} },

  { id: 'snow', name: '雪花粒子', category: 'festival', mode: 'particle', tags: ['普通粒子'], tier: 'free', description: '雪花飘落', params: {} },
  { id: 'firework', name: '烟花粒子', category: 'festival', mode: 'particle', tags: ['普通粒子', '点击触发'], tier: 'pro', description: '点击绽放烟花', params: {} },

  { id: 'rain', name: '雨滴粒子', category: 'nature', mode: 'particle', tags: ['普通粒子'], tier: 'free', description: '雨滴下落', params: {} },
  { id: 'firefly', name: '萤火虫粒子', category: 'nature', mode: 'particle', tags: ['普通粒子'], tier: 'free', description: '萤火虫飞舞', params: {} },

  { id: 'nebula', name: '星云粒子', category: 'tech', mode: 'particle', tags: ['普通粒子'], tier: 'pro', description: '科技星云', params: {} }
];

export function getEffect(id) {
  return EFFECTS.find((e) => e.id === id);
}

export function listEffects(filter = {}) {
  return EFFECTS.filter((e) => {
    if (filter.category && filter.category !== 'all' && e.category !== filter.category) return false;
    if (filter.tier && e.tier !== filter.tier) return false;
    return true;
  });
}

export function categoryName(id) {
  const c = CATEGORIES.find((x) => x.id === id);
  return c ? c.name : id;
}
