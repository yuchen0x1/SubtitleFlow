# 竞品与开源技术研究

## 2026-11-18 调研快照

覆盖 31 个有公开仓库的直接项目、相邻产品、框架、规范与底层库。通过 GitHub API 读取默认分支入口、README（公开且采用常用路径时）、根源码目录、工作流目录、最近提交、最近更新的 Issues 和 Latest Release。30/90/180 是按默认分支提交历史计算的累计窗口。推送日期可能来自非默认分支，Release 缺项表示 API 没有正式条目。许可证使用仓库声明，缺项表示未识别，不能据此复用代码。源码目录和 Issue 链接供复查，未运行全部产品，也未逐行审计各仓库。

补充发现与界面参考采用 [Language Reactor 官方说明](https://dev.languagereactor.com/help/basic) 的逐字幕暂停与内容导航，[Gitee Whisper-WebUI](https://gitee.com/kayeah82/Whisper-WebUI/blob/master/README.md) 的文件转写与 SRT/VTT 导出，以及 [LLPlayer 官方站](https://llplayer.com/) 与 [作者的社区讨论](https://www.reddit.com/r/languagelearning/comments/1iopf71)。GitLab 的 VideoLAN 上游页面不可读取，VLC 证据取其 GitHub 镜像。社区结果只用于发现需求，技术判断回到仓库和官方文档。

| 项目 | Star / Fork | 推送日期 | 最新 Release | 许可证 / 主语言 | 30 / 90 / 180 日提交 | 范围与观察 |
| --- | ---: | --- | --- | --- | ---: | --- |
| [asbplayer/asbplayer](https://github.com/asbplayer/asbplayer) | 1,532 / 233 | 2026-11-18 | [v1.23.0](https://github.com/asbplayer/asbplayer/releases/tag/v1.23.0) | AGPL-3.0 / TypeScript | 89 / 261 / 386 | 直接 · Chromium/浏览器｜extension、common 分层和时间轴、外挂字幕与句子挖掘；字幕输入与字幕渲染分开。ASS 版式反馈表明不能承诺完整样式还原。 [源码与提交](https://github.com/asbplayer/asbplayer/tree/f7e96de9a4cb02c5170907c87dea559e61d19428) · [近期 Issue](https://github.com/asbplayer/asbplayer/issues/1479) |
| [stefman69/OpenSub-Overlay](https://github.com/stefman69/OpenSub-Overlay) | 0 / 0 | 2026-10-27 | [v_1.0](https://github.com/stefman69/OpenSub-Overlay/releases/tag/v_1.0) | 未识别 / JavaScript | 1 / 9 / 30 | 直接 · Chromium｜根目录扩展文件与 README 展示捕获字幕、配对轨道、本地渲染与双语导出。借鉴文件优先显示，许可需另核。 [源码与提交](https://github.com/stefman69/OpenSub-Overlay/tree/7b22ca47c733b20d22cb1de28c2b1c7344ef89d6) |
| [QuellaMC/DualSub](https://github.com/QuellaMC/DualSub) | 3 / 1 | 2026-11-14 | [v3.5.0](https://github.com/QuellaMC/DualSub/releases/tag/v3.5.0) | NOASSERTION / TypeScript | 19 / 69 / 71 | 直接 · 浏览器｜src、public、docs；针对 Disney+ 等的站点适配、双轨与时间校准。发布说明区分提示、样式、外观和适配器。 [源码与提交](https://github.com/QuellaMC/DualSub/tree/1cf9b7ace482edc4410c8d93aab27162688ebee0) · [近期 Issue](https://github.com/QuellaMC/DualSub/issues/78) |
| [WannabeLynx/DualSub](https://github.com/WannabeLynx/DualSub) | 1 / 0 | 2026-08-12 | — | MIT / JavaScript | 0 / 0 / 6 | 直接 · 浏览器｜src、docs；选择一对现有轨道，按视频同步。无需账户，支持文本背景；不同站点读取能力需各自验证。 [源码与提交](https://github.com/WannabeLynx/DualSub/tree/80dc1655b9bf3adb0241da17e7761bf05fdb6561) |
| [DarlingGoose/LST](https://github.com/DarlingGoose/LST) | 5 / 0 | 2026-11-15 | [v0.6.9](https://github.com/DarlingGoose/LST/releases/tag/v0.6.9) | MIT / JavaScript | 0 / 78 / 78 | 直接 · Chromium｜src、tests 做 Ollama 本机翻译、前瞻缓存和批量预翻译。借鉴默认本地路径与明确 Provider。 [源码与提交](https://github.com/DarlingGoose/LST/tree/49ea7c95252da72e676912fdac7830b5bd6dd21e) · [近期 Issue](https://github.com/DarlingGoose/LST/issues/31) |
| [seanmcbroom/dual-sub-jellyfin](https://github.com/seanmcbroom/dual-sub-jellyfin) | 16 / 2 | 2026-11-07 | — | GPL-3.0 / JavaScript | 4 / 4 / 18 | 直接 · Chrome/Firefox｜src、manifests、tests 体现目标平台清单和站点专项回归。GitHub Issues 提到了其他站点的影响。 [源码与提交](https://github.com/seanmcbroom/dual-sub-jellyfin/tree/ab8ed1c50f35de9a788e12d9547c934a416b7781) · [近期 Issue](https://github.com/seanmcbroom/dual-sub-jellyfin/issues/5) |
| [immersive-translate/immersive-translate](https://github.com/immersive-translate/immersive-translate) | 19,835 / 1,166 | 2026-11-13 | [v1.35.2](https://github.com/immersive-translate/immersive-translate/releases/tag/v1.35.2) | 未识别 / 未识别 | 14 / 25 / 52 | 直接 · 浏览器/移动入口｜公开仓库以 dist 与文档为主。其双语布局与服务入口可参考，无法从发行目录确认内部缓存、测试和架构。 [源码与提交](https://github.com/immersive-translate/immersive-translate/tree/9aec4d2a0d2433d9dff5c739f098aa23d7ee89ee) · [近期 Issue](https://github.com/immersive-translate/immersive-translate/issues/3469) |
| [rsimmons/subadub](https://github.com/rsimmons/subadub) | 146 / 42 | 2026-07-01 | — | MIT / Shell | 0 / 0 / 3 | 直接 · Chrome/Firefox｜在 Netflix 上生成可选文字并导出原始字幕。可借鉴字幕文本选择，站点专用实现不可推广为通用能力。 [源码与提交](https://github.com/rsimmons/subadub/tree/a03b1b94e59328c11e31485c6016626fcfeb2790) · [近期 Issue](https://github.com/rsimmons/subadub/issues/42) |
| [umlx5h/LLPlayer](https://github.com/umlx5h/LLPlayer) | 4,749 / 307 | 2026-11-05 | [v0.3.0](https://github.com/umlx5h/LLPlayer/releases/tag/v0.3.0) | GPL-3.0 / C# | 0 / 0 / 3 | 相邻 · Windows WPF｜双字幕、Whisper ASR、OCR 与字幕侧栏。支持独立媒体场景，无法替代浏览器扩展的网页内字幕路径。 [源码与提交](https://github.com/umlx5h/LLPlayer/tree/da101d87681bb4d1d87a59884bca95043dd1158b) · [近期 Issue](https://github.com/umlx5h/LLPlayer/issues/178) |
| [video-dev/hls.js](https://github.com/video-dev/hls.js) | 17,061 / 2,783 | 2026-11-17 | [v1.7.4](https://github.com/video-dev/hls.js/releases/tag/v1.7.4) | NOASSERTION / TypeScript | 61 / 148 / 293 | 技术 · Web｜src、tests；HLS 封装、字幕数据转换、MSE 与播放器事件测试。现有项目可借鉴多轨变化事件。 [源码与提交](https://github.com/video-dev/hls.js/tree/c4637e53bbd4d1d0838d5b1e954ab1fc7af355bb) · [近期 Issue](https://github.com/video-dev/hls.js/issues/4289) |
| [shaka-project/shaka-player](https://github.com/shaka-project/shaka-player) | 8,283 / 1,628 | 2026-11-18 | [v5.3.5](https://github.com/shaka-project/shaka-player/releases/tag/v5.3.5) | Apache-2.0 / JavaScript | 166 / 341 / 534 | 技术 · Web/嵌入式｜lib、ui、test；媒体和文本解析分层，TTML 与文本轨，电视端样式差异在 Issues 中可见。 [源码与提交](https://github.com/shaka-project/shaka-player/tree/8ee7915bb6e182c5a19eb1a02b16cfc6a9cb4f21) · [近期 Issue](https://github.com/shaka-project/shaka-player/issues/9694) |
| [videojs/video.js](https://github.com/videojs/video.js) | 40,216 / 7,502 | 2026-11-18 | [video.js@10.5.0](https://github.com/videojs/video.js/releases/tag/video.js%4010.5.0) | NOASSERTION / TypeScript | 117 / 638 / 951 | 技术 · Web HTML/React｜packages 与 apps 分开。播放、暂停、重播和无障碍控制值得参考，适配器需要明确版本边界。 [源码与提交](https://github.com/videojs/video.js/tree/e9da7b8af6a5e2c7e6fdb62761a283d9d3477a09) · [近期 Issue](https://github.com/videojs/video.js/issues/9796) |
| [Dash-Industry-Forum/dash.js](https://github.com/Dash-Industry-Forum/dash.js) | 5,554 / 1,741 | 2026-11-18 | [v5.3.0](https://github.com/Dash-Industry-Forum/dash.js/releases/tag/v5.3.0) | NOASSERTION / JavaScript | 29 / 50 / 94 | 技术 · Web｜src、samples、test；DASH 字幕与播放器同步，考虑媒体信息异步初始化和播放页变化。 [源码与提交](https://github.com/Dash-Industry-Forum/dash.js/tree/a1862089bcbaef900c3605c9baba4d783877d90e) · [近期 Issue](https://github.com/Dash-Industry-Forum/dash.js/issues/5124) |
| [mozilla/vtt.js](https://github.com/mozilla/vtt.js) | 514 / 90 | 2024-03-01 | — | Apache-2.0 / JavaScript | 0 / 0 / 0 | 技术 · Web/Node｜lib、tests；WebVTT 解析和 cue 设置。其 EOF 用例支持续测空行与无末尾换行。 [源码与提交](https://github.com/mozilla/vtt.js/tree/42ca104e8845bfc4485e8579d62cac6feaa00de9) · [近期 Issue](https://github.com/mozilla/vtt.js/issues/391) |
| [w3c/webvtt](https://github.com/w3c/webvtt) | 118 / 35 | 2026-05-20 | — | NOASSERTION / HTML | 0 / 0 / 0 | 标准 · Web｜根目录规范与 archives；时间轴、cue、布局和字幕可访问性规则。规范参考不等于引入代码。 [源码与提交](https://github.com/w3c/webvtt/tree/064802512ff9d8cd22dea4aea2cd1508aa2cc679) · [近期 Issue](https://github.com/w3c/webvtt/issues/553) |
| [mpv-player/mpv](https://github.com/mpv-player/mpv) | 38,179 / 3,673 | 2026-11-17 | [v0.42.0](https://github.com/mpv-player/mpv/releases/tag/v0.42.0) | NOASSERTION / C | 329 / 625 / 866 | 相邻 · 桌面跨平台｜sub、player、test；轨道、延迟与播放器多媒体时钟。可借鉴偏移操作的正负语义。 [源码与提交](https://github.com/mpv-player/mpv/tree/f92afa75cdb06e077a9ecd9a9ec2eb36b16327c2) · [近期 Issue](https://github.com/mpv-player/mpv/issues/18261) |
| [videolan/vlc](https://github.com/videolan/vlc) | 20,500 / 6,453 | 2026-11-18 | — | GPL-2.0 / C | 376 / 1194 / 2646 | 相邻 · 桌面/移动｜modules、src、test；字幕模块、解码和输出，参考格式及分发边界，GitHub 是同步镜像。 [源码与提交](https://github.com/videolan/vlc/tree/c48b46e97f99abbbca622110684da65ab2a22688) |
| [SubtitleEdit/subtitleedit](https://github.com/SubtitleEdit/subtitleedit) | 15,043 / 1,385 | 2026-11-18 | [v5.4.0](https://github.com/SubtitleEdit/subtitleedit/releases/tag/v5.4.0) | MIT / C# | 1303 / 4986 / 9800 | 相邻 · 桌面｜src、tests，涵盖字幕格式、校准、同步和校正。导入格式错误与提示比直接增加格式更优先。 [源码与提交](https://github.com/SubtitleEdit/subtitleedit/tree/a91a109730573720e2c37453b0a7e7debd65a317) · [近期 Issue](https://github.com/SubtitleEdit/subtitleedit/issues/17014) |
| [kaegi/alass](https://github.com/kaegi/alass) | 1,469 / 74 | 2023-12-28 | [v2.0.0](https://github.com/kaegi/alass/releases/tag/v2.0.0) | GPL-3.0 / Rust | 0 / 0 / 0 | 技术 · CLI｜alass-core、alass-cli；实现按时间匹配的对齐，适合批处理，实时浏览器内对齐需要另一套资源预算。 [源码与提交](https://github.com/kaegi/alass/tree/874f02d9577182752a0f969b6d6b98fd65bdf1fc) · [近期 Issue](https://github.com/kaegi/alass/issues/56) |
| [sc0ty/subsync](https://github.com/sc0ty/subsync) | 1,423 / 91 | 2024-10-01 | [0.17](https://github.com/sc0ty/subsync/releases/tag/0.17) | GPL-3.0 / C++ | 0 / 0 / 0 | 技术 · 桌面/CLI｜subsync、assets、tools；语音辅助同步。对采集资源和可解释性要求高，候选先做人工偏移。 [源码与提交](https://github.com/sc0ty/subsync/tree/c888da7257d57bf039523c9f7015feacb4b95dc3) · [近期 Issue](https://github.com/sc0ty/subsync/issues/197) |
| [Aegisub/Aegisub](https://github.com/Aegisub/Aegisub) | 3,380 / 337 | 2025-01-01 | [v3.2.2-migrated](https://github.com/Aegisub/Aegisub/releases/tag/v3.2.2-migrated) | NOASSERTION / C++ | 0 / 0 / 0 | 相邻 · 桌面｜src、libaegisub、tests；字幕轨与 ASS 时间编辑、专业排版。浏览器导入走纯文本兼容。 [源码与提交](https://github.com/Aegisub/Aegisub/tree/6f546951b4f004da16ce19ba638bf3eedefb9f31) · [近期 Issue](https://github.com/Aegisub/Aegisub/issues/395) |
| [SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper) | 26,846 / 2,260 | 2026-11-12 | [v1.2.1](https://github.com/SYSTRAN/faster-whisper/releases/tag/v1.2.1) | MIT / Python | 5 / 16 / 16 | 技术 · Python CPU/GPU｜faster_whisper、benchmark、tests；项目已在用的实现，关注模型按需下载、VAD 和依赖兼容。 [源码与提交](https://github.com/SYSTRAN/faster-whisper/tree/6cb639e70786aea42b9233006ae60eaf07190bdb) · [近期 Issue](https://github.com/SYSTRAN/faster-whisper/issues/1708) |
| [ggml-org/whisper.cpp](https://github.com/ggml-org/whisper.cpp) | 55,290 / 6,322 | 2026-11-18 | [v1.9.5](https://github.com/ggml-org/whisper.cpp/releases/tag/v1.9.5) | MIT / C++ | 441 / 961 / 1420 | 技术 · 桌面/移动/多架构｜src、bindings、examples；可量化模型与跨平台原生推理。桌面扩展内打包会新增二进制运维。 [源码与提交](https://github.com/ggml-org/whisper.cpp/tree/5f9823760117f500ebce2527cbb2314572f5fcd6) · [近期 Issue](https://github.com/ggml-org/whisper.cpp/issues/4116) |
| [openai/whisper](https://github.com/openai/whisper) | 113,015 / 13,698 | 2026-08-31 | [v20250625](https://github.com/openai/whisper/releases/tag/v20250625) | MIT / Python | 0 / 1 / 3 | 技术 · Python｜whisper、tests；模型、特征与时间戳原始实现，作为精度和语言覆盖参照。 [源码与提交](https://github.com/openai/whisper/tree/86098128c0b4f24f0e2aa2994de830614b474227) |
| [alphacep/vosk-api](https://github.com/alphacep/vosk-api) | 15,274 / 1,772 | 2026-10-15 | [v0.3.50](https://github.com/alphacep/vosk-api/releases/tag/v0.3.50) | Apache-2.0 / Jupyter Notebook | 0 / 3 / 7 | 技术 · 桌面/移动/嵌入式｜src、android、ios、webjs；流式离线 ASR 与轻量模型，候选 Provider 需单独做语种/延迟对比。 [源码与提交](https://github.com/alphacep/vosk-api/tree/4ab9821510b488efb7740094714a130bd3545e90) · [近期 Issue](https://github.com/alphacep/vosk-api/issues/2072) |
| [LibreTranslate/LibreTranslate](https://github.com/LibreTranslate/LibreTranslate) | 17,787 / 1,866 | 2026-11-14 | [v1.9.6](https://github.com/LibreTranslate/LibreTranslate/releases/tag/v1.9.6) | AGPL-3.0 / Python | 9 / 18 / 42 | 技术 · HTTP API/Docker｜libretranslate、docker；独立推理服务及语种选择。API 可对接，AGPL 代码需遵守分发义务。 [源码与提交](https://github.com/LibreTranslate/LibreTranslate/tree/84cd56c061a7ba3955b49efdaee2ac54dcbca07f) · [近期 Issue](https://github.com/LibreTranslate/LibreTranslate/issues/1036) |
| [ollama/ollama](https://github.com/ollama/ollama) | 187,523 / 19,138 | 2026-11-18 | [v0.40.16](https://github.com/ollama/ollama/releases/tag/v0.40.16) | MIT / Go | 87 / 354 / 612 | 技术 · 桌面/服务器｜openai、server、docs；本机 OpenAI 兼容 HTTP，适配器调用已存在。错误与响应字段按 API 验证。 [源码与提交](https://github.com/ollama/ollama/tree/b8db8d5b5c8daedbbef7bb9ace2221a38bc384c2) · [近期 Issue](https://github.com/ollama/ollama/issues/19740) |
| [mozilla/webextension-polyfill](https://github.com/mozilla/webextension-polyfill) | 3,066 / 234 | 2026-07-30 | [0.12.0](https://github.com/mozilla/webextension-polyfill/releases/tag/0.12.0) | MPL-2.0 / JavaScript | 0 / 0 / 24 | 技术 · WebExtensions｜src、test；规范化 Promise 形式。不会补齐某浏览器根本缺失的 tabCapture/offscreen。 [源码与提交](https://github.com/mozilla/webextension-polyfill/tree/ca8469153288256d64340e09936f34d799e58eca) · [近期 Issue](https://github.com/mozilla/webextension-polyfill/issues/807) |
| [mozilla/web-ext](https://github.com/mozilla/web-ext) | 3,152 / 392 | 2026-11-17 | [10.8.0](https://github.com/mozilla/web-ext/releases/tag/10.8.0) | MPL-2.0 / JavaScript | 8 / 70 / 123 | 技术 · Firefox 开发工具｜src、tests；验证清单、构建、签名和临时运行，适合未来独立 Firefox 端验收。 [源码与提交](https://github.com/mozilla/web-ext/tree/b98f5d9bed144f6261329fb5f91b3d79f2ef778d) · [近期 Issue](https://github.com/mozilla/web-ext/issues/3934) |
| [wxt-dev/wxt](https://github.com/wxt-dev/wxt) | 10,749 / 589 | 2026-11-18 | [wxt-v0.21.5](https://github.com/wxt-dev/wxt/releases/tag/wxt-v0.21.5) | MIT / TypeScript | 66 / 129 / 293 | 技术 · 跨浏览器构建｜packages、templates；按浏览器生成清单、准备商店上传资产。当前 Vite 较小，借鉴平台参数化即可。 [源码与提交](https://github.com/wxt-dev/wxt/tree/081fca99b3fcb0448d0754911e5120ae4eeab3c3) · [近期 Issue](https://github.com/wxt-dev/wxt/issues/2763) |
| [PlasmoHQ/plasmo](https://github.com/PlasmoHQ/plasmo) | 13,180 / 466 | 2026-11-18 | [v0.90.5](https://github.com/PlasmoHQ/plasmo/releases/tag/v0.90.5) | MIT / TypeScript | 0 / 0 / 0 | 技术 · 浏览器扩展框架｜core、packages、cli；内容脚本 UI、后台构建、清单自动化，可参考而无需改框架。 [源码与提交](https://github.com/PlasmoHQ/plasmo/tree/9369e2835de237caa60620b74b12ea3e2d4f3600) · [近期 Issue](https://github.com/PlasmoHQ/plasmo/issues/1178) |

## 功能差距与设计取舍

| 功能 | SubtitleFlow 当前实现 | 对照与差距 | 选择 |
| --- | --- | --- | --- |
| 网页、文件、声音来源 | 原生与导入曾混合，语音需配置 | asbplayer 和 DualSub 将轨道选择与呈现分开 | A，本轮明确导入优先和语音显式选择 |
| 文件持久性 | 文件按标签页保留，原弹窗无法恢复导入状态 | asbplayer 更强调会话与文件来源可见 | A，本轮显示条数及移除 |
| 时间校准 | 随视频时间显示 | DualSub、mpv、Subtitle Edit 有偏移或拉伸校准 | B，先做手工偏移，再观察自动对齐价值 |
| 双轨无 AI | 文件和网页各可显示，双行主要依赖翻译 | DualSub 两个现成轨道即可显示 | B，需处理语言与跨轨匹配，后续独立迭代 |
| Provider 路径 | 适配 OpenAI、本地和 WebSocket | LST 以本地与缓存为明确选择；Ollama 提供兼容 API | A，本轮保留默认离线，强化 HTTPS、WSS 与回环 |
| 站点专项 | 通用 TextTrack，站点名字适配 | Subadub、DualSub 针对选定站点做深度维护 | B，按有公开夹具且无绕过保护需求的播放器逐个纳入 |
| 多浏览器发布 | Chromium 共包 | Mozilla web-ext 和 WXT 按平台生成和签名 | A，采用共享构建与实机分开验收；Firefox 与移动当前 C |
| 界面 | 弹窗启动，独立设置页已有样式预览 | DualSub 把样式预览和当前站点状态显式呈现；Language Reactor 侧栏承担大量学习功能 | 保留现有布局，把文件状态放在文件控件旁，更新状态进入设置 |
| 活跃更新 | 以 GitHub 为发布中心 | WXT、LLPlayer 和上游推理工具通过真实发行管理变化 | 本轮校验标签、ZIP、摘要和不可变发布证明 |

近期重点跟踪：asbplayer 的 ASS 显示反馈，DualSub 的站点 UI 与字幕样式变化，hls.js/Shaka 的字幕轨道修复，whisper.cpp 的跨架构更新，以及 WXT/web-ext 的扩展分发链。详细活动以表中默认分支和发行记录为准。

2026-11-23 补充验证：Subtitle Edit 将时间校准和偏移作为核心字幕工作流，DualSub 提供轨道与时间校准，LLPlayer/Language Reactor 强调字幕导航。基于这些已核实的公开能力，0.0.5 选择低风险的 ±30 秒人工偏移（0.5 秒步进）和 SRT/WebVTT 导出，不引入自动对齐或复杂学习侧栏；后者需要代表性音频、对齐质量基线或独立的产品定位。项目没有复制这些仓库代码，只吸收经过验证的交互模式。

## 升级候选

| 编号 | 优化、价值与依赖 | 参考 | 优先级/难度 | 决定 |
| --- | --- | --- | --- | --- |
| 01 | 修复语法污染，恢复三个扩展入口及 Python 服务 | 本地/远端基线 | A/低 | 本轮 |
| 02 | 文件优先，防止原生和导入重叠 | asbplayer、DualSub | A/低 | 本轮 |
| 03 | 重开弹窗仍显示文件状态，可回退至网页字幕 | asbplayer | A/低 | 本轮 |
| 04 | 启动时传入选择的源语言 | DualSub | A/低 | 本轮 |
| 05 | 显式选择语音识别，默认路径保持离线 | LST | A/低 | 本轮 |
| 06 | 限制云端明文连接与重定向 | Ollama、Chrome 文档 | A/中 | 本轮 |
| 07 | 校验回环服务 Host、Origin 与转发边界 | FastAPI/Starlette | A/中 | 本轮 |
| 08 | 统一源版本、lockfile、manifest、标签 | web-ext、WXT | A/低 | 本轮 |
| 09 | 跨 runner 打包，移除随源码分发的旧 ZIP | WXT | A/低 | 本轮 |
| 10 | 固定 Actions 提交、限制权限与发布环境 | GitHub 官方规范 | A/中 | 本轮 |
| 11 | 发布元数据、SHA-256、不可变资产签名 | GitHub 官方规范 | A/中 | 本轮 |
| 12 | 可选检查新版并记住稍后提醒 | 浏览器分发约束 | A/中 | 本轮 |
| 13 | 说明手动升级、同路径和回滚保留设置 | Chromium 更新约束 | A/低 | 本轮 |
| 14 | 缩小公开页面和 source maps | 扩展 manifest | A/低 | 本轮 |
| 15 | Dependabot、依赖许可检查、漏洞私报入口 | GitHub 官方规范 | A/低 | 本轮 |
| 16 | 构建与回归分开计数、多系统检查 | Shaka、WXT | A/中 | 本轮 |
| 17 | 禁止分支强推并要求 PR 和 CI | GitHub 官方规范 | A/中 | 本轮 |
| 18 | 真实站点夹具覆盖导航、切源和多 iframe | dual-sub-jellyfin、asbplayer | B/中 | 按站点授权和夹具逐个开发 |
| 19 | 导入字幕固定时差调节 | mpv、DualSub | B/中 | 候选，需同步全屏与翻译窗口 |
| 20 | 无 AI 配对两条字幕轨，扩展语言组合 | DualSub | B/高 | 候选，评估对齐规则 |
| 21 | 长字幕轨按窗口加载和局部排序 | hls.js、Shaka | B/中 | 先用性能夹具量化 |
| 22 | 测试 WebVTT EOF、TTML、ASS 样式边界 | vtt.js、W3C、Aegisub | B/中 | 按格式失败样本推进 |
| 23 | 逐字幕暂停和跳转 | Language Reactor | C/中 | 等字幕导航需求明确 |
| 24 | 收藏片段、导出原文或双语 | asbplayer、Subadub | C/中 | 字幕编辑和学习模式独立评估 |
| 25 | FF 事件页产物与 AMO 签名 | dual-sub-jellyfin、web-ext | C/高 | 先确认音频替代及设备验收 |
| 26 | Android/iPad 可用性和商店分发 | Edge、Safari 官方文档 | C/高 | 需设备和发布账号 |
| 27 | 本地翻译字幕预计算和作用域缓存 | LST | B/高 | 先定义隐私与删除语义 |
| 28 | 小模型 ASR 策略和本地吞吐基准 | faster-whisper、Vosk | B/中 | 需代表音频和硬件 |
| 29 | 自动对齐及偏移建议 | ALASS、Subsync | C/高 | 优先手动偏移 |
| 30 | 图像 OCR 读取烧录字幕 | LLPlayer、SubtitleEdit | C/高 | 性能、画质及授权需单独验证 |
| 31 | 监听远端播放器并部署成原生壳或 PWA | VLC、Chrome 权限 | D/高 | 同源与核心使用场景不符 |
| 32 | 公司级自托管推理、配额和认证 | LibreTranslate | C/高 | 当前为用户自配和单机路径 |

本轮实现关注安装可用性、文件控制、默认离线、可验证分发和持续维护。后续通过 GitHub Releases、Issues 和 security advisories 复查变化。项目保持 MIT，许可证不明确或要求额外分发义务的产品仅用于方案比较。
