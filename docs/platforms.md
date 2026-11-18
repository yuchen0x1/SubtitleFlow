# 平台可行性与支持范围

SubtitleFlow 的核心场景是对现有网页视频读取原生或文件字幕并按视频时间叠加，按需使用用户授权的标签页音频做识别。系统或框架选择以这两项为基准。

| 候选平台 | 结论 | 权限、依赖、用户价值与维护成本 | 分发与更新 |
| --- | --- | --- | --- |
| Windows 10 | A，桌面 Chrome/Edge | 浏览器能运行且支持 MV3、offscreen 和 tabCapture 时共享构建包。无需独立窗口、托盘或安装器。按浏览器与 OS 供应方的支持周期验收 | 共同 ZIP 或对应商店 |
| Windows 11 | A，桌面 Chrome/Edge | 与 Windows 10 相同的浏览器权限和硬件需求。独立原生程序无法直接读 DOM 或同步播放器 | 共同 ZIP 或对应商店 |
| Linux | A，桌面 Chrome/Edge | 浏览器内运行 JavaScript，CPU 架构随浏览器。无系统级媒体 hook，维护同一产物 | 共同 ZIP 或对应商店 |
| Ubuntu | A | 与 Linux 一致；不同音频服务和浏览器版本需实机验收 | 同 Linux |
| Debian | A | 与 Linux 一致；发行版仓库里的浏览器需满足最低版本 | 同 Linux |
| Fedora | A | 与 Linux 一致；由浏览器适配系统音频设备 | 同 Linux |
| Arch Linux | A | 与 Linux 一致；滚动更新需关注浏览器回归 | 同 Linux |
| macOS Intel | A，桌面 Chrome/Edge | 无原生扩展二进制或 Keychain 组件；取决于对应浏览器仍支持的 OS 与架构 | 共同 ZIP 或对应商店 |
| macOS Apple Silicon | A，桌面 Chrome/Edge | 同上；Whisper Python 依赖的 CPU/GPU 支持须单独验证 | 同 macOS Intel |
| 桌面 Chrome 扩展 | A | MV3、116+。读取 DOM、扩展存储、用户直接触发的 tabCapture，原生/导入不需要模型 | GitHub ZIP 手动更新，Chrome Web Store 签名自动更新 |
| 桌面 Edge 扩展 | A | 共享 Chromium MV3 API；独立验收扩展权限和安装入口 | GitHub ZIP 手动更新，Edge Add-ons 签名自动更新 |
| Firefox 扩展 | C | 可移植网页/导入核心，需事件页、权限、消息生命周期重测，缺少本项目依赖的 Chromium 音频捕获链。相对独立维护成本高 | AMO 或 Mozilla 签名 XPI，当前无 Firefox 发行 |
| Android 手机 | C | Edge Android 和 Firefox Android 存在扩展渠道，现有桌面 ZIP 的后台音频能力和触屏 UI 需独立验证。原生 APK 也无法读其他浏览器页面 | 移动扩展商店或 APK，当前无移动版 |
| Android 平板 | C | 同 Android；需额外验证横竖屏、分屏、文件选择和前后台切换 | 同 Android |
| 折叠屏 | C | 同 Android；需处理折叠姿态、尺寸变化和播放器遮挡 | 同 Android |
| iOS | C | Safari Web Extension 可读已授权 Safari 页面；需要容器、签名、审核，Chromium 音频捕获架构无法搬用 | Apple 开发者账号与 App Store |
| iPadOS | C | 同 iOS；另外考虑分屏、文件选择和全屏播放器 | 同 iOS |
| 桌面网页 | D | 普通页面只能访问本源媒体，无法接管其他站点播放器 | 可随网站部署，但无法交付核心场景 |
| 移动网页 | D | 同源限制相同，另有移动浏览器后台和全屏限制 | 同上 |
| 响应式 Web | D | 响应式布局只能改善本页 UI，权限边界与普通网页一致 | 同上 |
| PWA | D | Service Worker 不具有浏览器扩展权限 | 无法通过缓存更新解决能力缺口 |
| Docker | C | 能运行可选 Python 服务，字幕显示仍在浏览器；公开端口带来额外认证、隔离和模型缓存成本 | 当前 Python 依赖单独更新 |
| NAS | C | 可作为识别服务的实验主机，资源和加速支持不统一。当前服务以本机回环为边界 | 当前无 NAS 分发 |
| 私有化部署 | C | 可在用户设备运行可选服务；共享服务需要用户隔离和传输保护 | 当前无多用户发行 |
| 云服务器 | C | 可接入用户已有 HTTPS/WSS ASR/翻译，托管本产品会新增计费、音频隐私与运维责任 | 延用用户自配 Provider |
| CLI | C | 批处理字幕或模型的价值与现有工具重合，无法独立叠加网页视频 | 测试和打包脚本已覆盖维护场景 |
| 独立原生 Windows/Linux/macOS 播放器 | C | 适合自有媒体文件，无法完整复用已有网页播放器的账户、权限和时间轴。每端新增包装和更新成本 | 无 EXE、DEB、RPM、Flatpak、DMG 或 PKG |

可选 Python 服务与扩展分离。软件可离线处理网页/文件字幕。Whisper 首次加载通常需要下载模型及足够的内存/磁盘。云端路径使用 HTTPS 或 WSS。页面全屏、iframe 和 DRM 的行为以浏览器实际提供的数据与权限为准。

参考 [Chromium 音频采集](https://developer.chrome.com/docs/extensions/how-to/web-platform/screen-capture) · [Microsoft Edge 扩展 API](https://learn.microsoft.com/en-us/microsoft-edge/extensions/developer-guide/api-support) · [Firefox 后台入口](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background) · [Firefox 自行分发签名](https://extensionworkshop.com/documentation/publish/self-distribution/) · [Safari Web Extensions](https://developer.apple.com/safari/extensions/)。
