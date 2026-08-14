import { FilesetResolver, ImageSegmenter } from '@mediapipe/tasks-vision';

let segmenter = null;

export async function createSegmenter() {
  // 复用本地 wasm；人像分割输出置信度掩码（软分割，头发丝级边缘）
  const vision = await FilesetResolver.forVisionTasks('/wasm');
  segmenter = await ImageSegmenter.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: '/selfie_segmenter.tflite',
      delegate: 'CPU'
    },
    runningMode: 'IMAGE',
    outputCategoryMask: false,
    outputConfidenceMasks: true
  });
  return segmenter;
}

export function segmentImage(source) {
  if (!segmenter) return null;
  return segmenter.segment(source);
}