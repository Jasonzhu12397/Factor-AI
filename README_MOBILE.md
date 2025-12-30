# Factor - 手机客户端开发指南

由于 Factor 基于 React 和 Tailwind CSS，通过 **Capacitor** 可以快速将其打包为 Android 或 iOS 应用。

## 1. 核心原理
Factor Web -> [Capacitor] -> Android/iOS WebView 原生壳子。

## 2. 准备工作

### 电脑端配置 (必须)
1.  **允许外部连接**: 必须让电脑上的 Ollama 监听所有网口。
    *   在 Windows 环境变量中添加 `OLLAMA_HOST`，值为 `0.0.0.0`。
    *   确保 `OLLAMA_ORIGINS` 仍设置为 `*`。
2.  **重启 Ollama**。
3.  **获取电脑 IP**: 打开命令行运行 `ipconfig`，找到局域网 IP（例如 `192.168.1.5`）。

## 3. 打包步骤

### 初始化 Capacitor
在项目根目录运行：
```bash
npm install @capacitor/core @capacitor/cli
npx cap init Factor com.factor.app --web-dir dist
```

### 添加平台
```bash
# Android
npm install @capacitor/android
npx cap add android

# iOS (需要 Mac)
npm install @capacitor/ios
npx cap add ios
```

### 构建与同步
每次修改 Web 代码后：
```bash
npm run build
npx cap copy
npx cap open android  # 这会启动 Android Studio
```

## 4. 手机端连接设置

1.  在手机上打开 Factor App。
2.  点击右上角的 **设置 (齿轮图标)**。
3.  将 Ollama Server URL 修改为你的电脑 IP，例如：`http://192.168.1.5:11434`。
4.  点击保存，Factor 将会尝试连接你电脑上的模型。

## 5. PWA (最快手机化方案)
如果你不想折腾 Android Studio，可以直接将本项目部署到 Vercel 或 Netlify，然后在手机浏览器中打开 URL，点击“添加到主屏幕”。由于我们使用了响应式设计，它的体验将非常接近原生 App。

---
**提示**: 手机和电脑必须在同一个 Wi-Fi 下才能互通。