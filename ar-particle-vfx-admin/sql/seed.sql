-- AR粒子特效代码平台 种子数据（与前端 src/effects/registry.js 对齐）
-- effect_code 对应前端特效 id；tier 0免费 1个人Pro 2企业
INSERT INTO biz_effect (effect_code, effect_name, category, mode, tags, tier, description, status)
VALUES
  ('galaxy',        '宇宙星系',   'ar',       'galaxy',        'AR专属,手势交互', 0, '手势驱动螺旋星系、星河光带、引力冲击波与真实感行星', 1),
  ('ocean',         '海水潮流',   'ar',       'ocean',         'AR专属',           0, '青蓝潮流粒子随波浪流动的沉浸式海水特效', 1),
  ('photoParticle', '人像粒子',   'ar',       'photoParticle', 'AR专属,人像重构',  0, '上传照片，5 万粒子高保真重构人像，可爆炸/复原', 1),
  ('butterfly',     '蝴蝶粒子',   'animal',   NULL,            '普通粒子',         0, '蝴蝶飞舞轨迹', 1),
  ('fish',          '游鱼粒子',   'animal',   NULL,            '普通粒子',         0, '鱼群游动轨迹', 1),
  ('bird',          '飞鸟粒子',   'animal',   NULL,            '普通粒子',         1, '鸟群迁徙轨迹', 1),
  ('petal',         '花瓣粒子',   'flower',   NULL,            '普通粒子',         0, '花瓣飘落', 1),
  ('sakura',        '樱花粒子',   'flower',   NULL,            '普通粒子',         0, '樱花纷飞', 1),
  ('grid',          '科技点阵',   'geometry', NULL,            '普通粒子',         0, '点阵网格波动', 1),
  ('wave',          '粒子波',     'geometry', NULL,            '普通粒子',         1, '几何粒子波动', 1),
  ('snow',          '雪花粒子',   'festival', NULL,            '普通粒子',         0, '雪花飘落', 1),
  ('firework',      '烟花粒子',   'festival', NULL,            '普通粒子,点击触发', 1, '点击绽放烟花', 1),
  ('rain',          '雨滴粒子',   'nature',   NULL,            '普通粒子',         0, '雨滴下落', 1),
  ('firefly',       '萤火虫粒子', 'nature',   NULL,            '普通粒子',         0, '萤火虫飞舞', 1),
  ('nebula',        '星云粒子',   'tech',     NULL,            '普通粒子',         1, '科技星云', 1)
ON CONFLICT DO NOTHING;
