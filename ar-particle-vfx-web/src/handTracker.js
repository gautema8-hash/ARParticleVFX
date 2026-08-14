import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

let landmarker = null;

export async function createHandTracker() {
  // 使用本地 wasm，避免依赖外部 CDN（网络更稳）
  const vision = await FilesetResolver.forVisionTasks('/wasm');

  landmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: '/hand_landmarker.task',
      delegate: 'GPU'   // Intel Arc 140T 支持 GPU 加速
    },
    runningMode: 'VIDEO',
    numHands: 2,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5
  });
  return landmarker;
}

export function detectHands(videoEl, startTimeMs) {
  return landmarker ? landmarker.detectForVideo(videoEl, startTimeMs) : null;
}