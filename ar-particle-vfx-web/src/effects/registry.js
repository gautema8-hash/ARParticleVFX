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

  // —— 高级 3D 粒子（Three.js GPU 点云，可预览 + 导出）——
  { id: 'butterfly', name: '蝴蝶粒子', category: 'animal', mode: 'particle', tags: ['高级3D', '商用视觉'], tier: 'free', description: '参数化 3D 蝴蝶与蝶群流光形变', params: {} },
  { id: 'fish', name: '游鱼粒子', category: 'animal', mode: 'particle', tags: ['高级3D', '商用视觉'], tier: 'free', description: '深海 3D 鱼群与空间流场', params: {} },
  { id: 'bird', name: '飞鸟粒子', category: 'animal', mode: 'particle', tags: ['高级3D', 'Pro'], tier: 'pro', description: '星际飞鸟点云与动态迁徙', params: {} },

  { id: 'petal', name: '花瓣粒子', category: 'flower', mode: 'particle', tags: ['高级3D', '商用视觉'], tier: 'free', description: '流光花瓣 3D 形态与环绕运动', params: {} },
  { id: 'sakura', name: '樱花粒子', category: 'flower', mode: 'particle', tags: ['高级3D', '商用视觉'], tier: 'free', description: '樱舞幻境与柔和粒子扩散', params: {} },

  { id: 'grid', name: '科技点阵', category: 'geometry', mode: 'particle', tags: ['高级3D', '商用视觉'], tier: 'free', description: '量子点阵空间网格与波面扫描', params: {} },
  { id: 'wave', name: '粒子波', category: 'geometry', mode: 'particle', tags: ['高级3D', 'Pro'], tier: 'pro', description: '能量波场与三维起伏曲面', params: {} },

  { id: 'snow', name: '雪花粒子', category: 'festival', mode: 'particle', tags: ['高级3D', '商用视觉'], tier: 'free', description: '冰晶雪域与空间雪幕', params: {} },
  { id: 'firework', name: '烟花粒子', category: 'festival', mode: 'particle', tags: ['高级3D', '点击爆破'], tier: 'pro', description: '盛典烟火三维爆破与扩散', params: {} },

  { id: 'rain', name: '雨滴粒子', category: 'nature', mode: 'particle', tags: ['高级3D', '商用视觉'], tier: 'free', description: '霓虹雨幕与纵深光线', params: {} },
  { id: 'firefly', name: '萤火虫粒子', category: 'nature', mode: 'particle', tags: ['高级3D', '商用视觉'], tier: 'free', description: '萤火星尘与空间漂浮光点', params: {} },

  { id: 'nebula', name: '星云粒子', category: 'tech', mode: 'particle', tags: ['高级3D', 'Pro'], tier: 'pro', description: '深空星云与旋涡点云', params: {} }
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
