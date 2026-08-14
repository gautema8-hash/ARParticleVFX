export async function startCamera(videoEl) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('当前浏览器不支持摄像头访问，请使用最新版 Chrome/Edge');
  }

  // 释放可能已存在的旧视频流，避免设备被页面自身重复占用
  if (videoEl.srcObject) {
    videoEl.srcObject.getTracks().forEach((track) => track.stop());
    videoEl.srcObject = null;
  }

  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720, facingMode: 'user' },
      audio: false
    });
  } catch (err) {
    if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      throw new Error('摄像头被其他应用占用，请关闭占用摄像头的程序（微信、Zoom、相机等）后重试');
    }
    if (err.name === 'NotAllowedError') {
      throw new Error('摄像头权限被拒绝，请在浏览器地址栏允许访问摄像头');
    }
    if (err.name === 'NotFoundError') {
      throw new Error('未检测到摄像头设备');
    }
    throw err;
  }

  videoEl.srcObject = stream;
  await videoEl.play();
  return stream;
}