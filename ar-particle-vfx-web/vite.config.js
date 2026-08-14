import { defineConfig } from 'vite';

export default defineConfig({
  // 将 models 目录作为静态资源根目录：
  // 代码中 /hand_landmarker.task 与 /wasm 会自动映射到 models/ 下的同名资源
  publicDir: 'models',
  server: {
    // 开发环境：将 /api 代理到后端，避免跨域与 token 携带问题
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
});