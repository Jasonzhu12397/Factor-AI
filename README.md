# Factor - Ollama Web GUI (Windows)

Factor 是一个为 [Ollama](https://ollama.com/) 设计的现代、高性能本地大模型 Web 图形界面。它支持流式输出、多会话管理以及多模型切换。

## 1. 环境准备

在开始之前，请确保你的 Windows 系统已安装以下工具：

*   **Node.js**: [下载并安装 LTS 版本](https://nodejs.org/) (建议 v18+)。
*   **Ollama**: [下载并安装](https://ollama.com/)。
*   **Rust**: (仅打包 .exe 需要) [下载并安装 rustup-init.exe](https://www.rust-lang.org/tools/install)。
*   **C++ 构建工具**: 安装 Rust 时通常会提示安装 Visual Studio 生成工具。

## 2. 解决跨域 (CORS) 限制

**非常重要**：Ollama 默认只允许本地命令行访问。为了让浏览器或桌面客户端能连接到 Ollama，你必须设置环境变量：

1.  按下 `Win + S` 搜索“环境变量”，选择“编辑系统环境变量”。
2.  点击“环境变量”按钮。
3.  在“用户变量”下点击“新建”：
    *   变量名：`OLLAMA_ORIGINS`
    *   变量值：`*`
4.  **彻底退出并重启 Ollama**（在任务栏托盘右键退出，然后重新运行）。

## 3. 开发与调试

### 安装依赖
在项目根目录打开终端（PowerShell 或 CMD），运行：
```bash
npm install
```

### 运行 Web 版预览
在浏览器中打开并调试：
```bash
npm run dev
```
访问地址: `http://localhost:3000`

### 运行桌面版调试 (Tauri)
如果你想在一个原生 Windows 窗口中查看效果：
```bash
npx tauri dev
```

## 4. 打包为 Windows .exe 安装包

我们使用 [Tauri](https://tauri.app/) 来生成极简、高效的 Windows 安装包。

1.  **构建 Web 资源**:
    ```bash
    npm run build
    ```

2.  **生成安装包**:
    ```bash
    npm run tauri build
    ```

3.  **查找文件**:
    打包完成后，你可以在以下目录找到生成的安装程序：
    `src-tauri/target/release/bundle/msi/` (.msi 安装包)
    或
    `src-tauri/target/release/bundle/exe/` (.exe 单文件)

## 5. 项目结构说明

*   `src/App.tsx`: 应用主入口和状态管理。
*   `src/components/Sidebar.tsx`: 侧边栏（会话管理、模型切换）。
*   `src/components/ChatContainer.tsx`: 聊天窗口（消息展示、流式输入）。
*   `src/services/ollamaService.ts`: 负责与本地 Ollama API 通信的逻辑。
*   `src-tauri/`: Tauri 的原生配置文件（控制窗口样式、图标等）。

## 6. 常见问题

*   **无法连接 Ollama?**
    确保 `OLLAMA_ORIGINS` 已正确设置并重启了 Ollama。检查 `http://localhost:11434` 是否可访问。
*   **打包失败?**
    确保已安装 Rust 环境并更新到最新版本 (`rustup update`)。
*   **界面显示空白?**
    检查控制台是否有跨域错误或资源加载错误。

---

**Factor** - 享受极速的本地 AI 交互体验。