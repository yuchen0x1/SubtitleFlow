# SubtitleFlow 架构

浏览器扩展由 Service Worker、Offscreen Document、Content Script、Shadow DOM overlay、Popup 和 Options 组成。

Service Worker 管理标签页会话和消息协议。Offscreen Document 负责用户主动启动的 tab audio、AudioContext、原声回放、PCM 分段和 WebSocket。Content Script 负责视频检测、原生字幕读取、播放时间同步和渲染。AI Provider 通过统一接口连接 OpenAI 兼容服务、本地 HTTP 服务和 WebSocket ASR。

字幕显示依赖视频 `currentTime` 查找 `SubtitleTimeline`，因此暂停、快进、快退和倍速不会依赖翻译响应到达时间。
