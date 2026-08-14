export function createRecorder(canvas) {
  let mediaRecorder = null;
  let capturedStream = null; // 合成后的流（视频 + 音频）
  let videoStream = null;    // 仅画布视频流，用于停止
  let chunks = [];
  let startedAt = 0;

  function getMimeType(withAudio) {
    const candidates = withAudio
      ? [
          'video/webm;codecs=vp9,opus',
          'video/webm;codecs=vp8,opus',
          'video/webm',
          'video/mp4'
        ]
      : [
          'video/webm;codecs=vp9',
          'video/webm;codecs=vp8',
          'video/webm',
          'video/mp4'
        ];
    for (const mime of candidates) {
      try {
        if (window.MediaRecorder && MediaRecorder.isTypeSupported(mime)) {
          return mime;
        }
      } catch {
        // 忽略不支持的 mimeType 探测异常
      }
    }
    return '';
  }

  function start(audioStream) {
    if (!canvas.captureStream) {
      throw new Error('当前浏览器不支持画布录屏');
    }

    try {
      videoStream = canvas.captureStream(60);
    } catch (err) {
      throw new Error('无法捕获画面：' + err.message);
    }

    let audioTracks = [];
    if (audioStream) {
      audioTracks = audioStream.getAudioTracks();
    }

    capturedStream = audioTracks.length
      ? new MediaStream([...videoStream.getVideoTracks(), ...audioTracks])
      : videoStream;

    const mimeType = getMimeType(audioTracks.length > 0);
    const options = mimeType
      ? { mimeType, videoBitsPerSecond: 12_000_000, audioBitsPerSecond: 128_000 }
      : { videoBitsPerSecond: 12_000_000, audioBitsPerSecond: 128_000 };

    chunks = [];
    mediaRecorder = new MediaRecorder(capturedStream, options);

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    startedAt = performance.now();
    mediaRecorder.start(250);
  }

  function stop() {
    return new Promise((resolve, reject) => {
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        reject(new Error('当前没有进行中的录制'));
        return;
      }

      mediaRecorder.onstop = () => {
        const type = mediaRecorder.mimeType || 'video/webm';
        const blob = new Blob(chunks, { type });
        const duration = (performance.now() - startedAt) / 1000;

        // 仅停止视频轨道；音频轨道来自共享的音乐输出流，不应被停止
        if (videoStream) {
          videoStream.getTracks().forEach((track) => track.stop());
          videoStream = null;
        }
        capturedStream = null;

        resolve({ blob, duration, size: blob.size, type });
      };

      mediaRecorder.onerror = () => {
        reject(new Error('录制过程中出现错误'));
      };

      mediaRecorder.stop();
    });
  }

  function isRecording() {
    return !!(mediaRecorder && mediaRecorder.state === 'recording');
  }

  return { start, stop, isRecording };
}