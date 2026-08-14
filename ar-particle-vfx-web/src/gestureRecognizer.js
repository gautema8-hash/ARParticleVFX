const TIPS = [4, 8, 12, 16, 20];
const PIP = [2, 6, 10, 14, 18];

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0));
}

// 手掌大小的稳定近似：手腕(0)到中指根(9)距离 × 2。
// 用手掌根/指根等固定骨骼点，不依赖手指是否伸展，避免握拳时数值突变。
export function handSpan(landmarks) {
  return distance(landmarks[0], landmarks[9]) * 2;
}

export function recognizeGesture(landmarks) {
  // 1. 握拳优先判定：几乎所有手指折叠。
  //    必须放在捏合之前，否则握拳时拇指尖与食指尖靠近会误判为捏合，
  //    导致「握拳=爆炸」失效。
  let folded = 0;
  for (let i = 0; i < TIPS.length; i++) {
    if (distance(landmarks[TIPS[i]], landmarks[0]) < distance(landmarks[PIP[i]], landmarks[0])) {
      folded++;
    }
  }
  if (folded >= 4) return 'GRAB';

  // 2. 捏合：拇指尖与食指尖距离近
  const pinchDist = distance(landmarks[4], landmarks[8]);
  if (pinchDist < 0.04) return 'PINCH';

  // 3. 张开：多数指尖远离手腕。
  //    改用相对手掌大小的自适应阈值，避免手离得稍远时固定 0.35 判不出来。
  const span = handSpan(landmarks);
  const threshold = Math.max(0.28, span * 0.6);
  let extended = 0;
  for (const idx of TIPS) {
    if (distance(landmarks[idx], landmarks[0]) > threshold) extended++;
  }
  if (extended >= 4) return 'OPEN';

  return 'NONE';
}
