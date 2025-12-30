
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
  },
  // 防止 Vite 清除 Tauri 特有的控制台输出
  clearScreen: false,
});
