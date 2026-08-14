// src/constants.js — 前后端统一常量与会员档位映射
// 后端 sys_user.tier / biz_effect.tier 使用整数：0 免费 / 1 个人Pro / 2 企业
export const TIER = { FREE: 0, PRO: 1, ENTERPRISE: 2 };
export const TIER_LABEL = { 0: 'free', 1: 'pro', 2: 'enterprise' };

/** 前端字符串档位 -> 后端整数档位 */
export function tierToCode(label) {
  return TIER[label] ?? TIER.FREE;
}

/** 后端整数档位 -> 前端字符串档位 */
export function codeToTier(code) {
  return TIER_LABEL[code] ?? TIER_LABEL[TIER.FREE];
}
