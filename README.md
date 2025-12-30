
# Factor - Ollama Web GUI (Windows)

Factor 是一个为 [Ollama](https://ollama.com/) 设计的现代、高性能本地大模型 Web 图形界面。

## 1. 环境准备
*   **Node.js**: v18+
*   **Ollama**: 已安装并正在运行。

## 2. 调试指南 (VS Code)

### 步骤 A：解决跨域 (CORS) - 必须执行
1.  退出任务栏中的 Ollama。
2.  在 Windows 环境变量中添加：
    *   `OLLAMA_ORIGINS` = `*`
3.  重启 Ollama。

### 步骤 B：启动开发服务器
在 VS Code 终端运行：
```bash
npm run dev
```
确认控制台输出：`Local: http://localhost:3000`

### 步骤 C：开始断点调试
1.  按下 `F5` 或在左侧点击“运行和调试”图标。
2.  选择 **"Debug Factor in Chrome"**。
3.  VS Code 会自动打开一个新的 Chrome 窗口，此时你可以在 `.tsx` 文件中点击行号左侧打断点。

## 3. 打包安装包
*   运行 `npm run tauri build` 即可在 `src-tauri/target/release/bundle` 下找到 .exe。
