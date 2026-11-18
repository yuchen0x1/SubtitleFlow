# SubtitleFlow

SubtitleFlow 是一个 Chrome / Edge Manifest V3 浏览器插件，用于读取网页视频字幕并按时间轴显示。无 AI 时可读取网页原生字幕、导入 SRT/VTT/ASS/SSA 或只显示原文；语音识别和机器翻译都是可选项。

## 最新更新

<!-- github-release:start -->

### 0.0.2 · 2026-11-17（开发版本，尚未发布）

无 AI 基础模式：默认只显示原文，可读取网页字幕或导入字幕文件；语音识别与自动翻译均为可选服务。

[全部发行记录](https://github.com/yuchen0x1/SubtitleFlow/releases)

<!-- github-release:end -->

完整发布记录见 [docs/releases/release-notes.md](docs/releases/release-notes.md)。

当前版本已经包含：

- 原生 HTML5 `TextTrack` 字幕提取与 SRT/VTT/ASS/SSA 解析。
- Shadow DOM 字幕悬浮层，支持双语、仅中文、仅原文、拖动和样式预览。
- Chrome `tabCapture` + Offscreen Document 音频采集，采集后重新连接 `AudioContext.destination` 保留原声。
- 16 kHz PCM 转换、音量/VAD 过滤、WebSocket ASR 连接协议。
- OpenAI 兼容翻译 Provider、本地服务 Provider、上下文窗口、缓存、重试、并发队列。
- Popup 快捷控制与 Options 设置中心。
- 可选 FastAPI 本地服务健康检查、模型状态、翻译与 ASR WebSocket 接口。

## 开发

```powershell
npm install
npm run typecheck
npm test
npm run build
```

构建完成后，加载 `dist` 目录即可在 Chrome 或 Edge 的“扩展程序 / 加载已解压的扩展程序”中安装。打包 ZIP：

```powershell
npm run package
```

## 使用

1. 打开包含 HTML5 视频的网页。
2. 如果刚重新加载了扩展，刷新视频页面，让新的 `content.js` 注入。
3. 有原生 `TextTrack` 字幕时点击“显示字幕”，无需配置服务；也可先导入 SRT/VTT/ASS/SSA。
4. 只有需要从声音识别或自动翻译时，才在设置中心配置对应服务。
   从声音识别还需在弹窗选择“字幕来源：语音识别”；默认“网页或文件（无 AI）”不会使用升级前保留的识别服务。
5. 画面里烧录的字幕属于视频像素，不配置 ASR/OCR 时无法自动识别。

## 云端 Provider

在设置中心填写 API 地址、模型和 API Key。API Key 只保存在浏览器本地设置中，日志不会输出密钥。没有配置 Provider 时，界面会显示未配置状态。

## 本地服务

```powershell
npm run local-service
```

脚本会使用 Python 3.11 创建或复用工作区 `.venv`，安装 `faster-whisper`，并在
`127.0.0.1:8765` 启动 FastAPI 服务。首次连接 ASR 时会下载所选 Whisper 模型；默认模型是
`small`，可改用 `tiny` 先验证链路：

```powershell
.\scripts\start-local-service.ps1 -Model tiny
```

模型未加载或下载失败时，服务会返回明确的错误状态，不会伪造识别结果。

## 兼容性和限制

插件针对普通 HTML5 视频、YouTube、Bilibili、Vimeo 提供通用检测和适配。跨域 iframe、DRM 保护视频、受保护字幕和浏览器禁止捕获的媒体会显示能力限制；项目不绕过 DRM。

## 隐私

音频采集只在用户点击开始后启动。停止后会停止 MediaStream tracks、关闭 AudioContext 和 WebSocket。云端模式会向用户配置的服务发送数据；本地模式可将处理留在本机。

## 测试

已执行的本地检查包括 `npm test`、`npm run typecheck`、`npm run package`、实际本地服务健康检查和
Whisper WebSocket `ready`/音频 `complete` 协议检查。真实 X/YouTube 页面、云端 API、DRM 和用户自定义模型仍需在目标环境中加载扩展并配置服务后验收。
