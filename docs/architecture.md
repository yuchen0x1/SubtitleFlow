# SubtitleFlow 架构

浏览器扩展由 Service Worker、Offscreen Document、Content Script、Shadow DOM overlay、Popup 和 Options 组成。

Service Worker 管理标签页会话和消息协议。Offscreen Document 负责用户主动启动的 tab audio、AudioContext、原声回放、PCM 分段和 WebSocket。Content Script 负责视频检测、原生字幕读取、播放时间同步和渲染。AI Provider 通过统一接口连接 OpenAI 兼容服务、本地 HTTP 服务和 WebSocket ASR。

字幕显示依赖视频 `currentTime` 查找 `SubtitleTimeline`，因此暂停、快进、快退和倍速不会依赖翻译响应到达时间。

导入文件保存在标签页的会话存储，重开弹窗时可读取，导航或关闭标签页时清除。文件存在时覆盖网页轨道，手动选择语音识别才创建 Offscreen Document。设置和用户提供的密钥留在扩展本地存储，旧设置缺少新字段时用离线字幕和关闭更新提醒作为默认值。

版本检查使用固定的 GitHub Releases API 和可信仓库地址，缓存只包含版本和资产元数据。扩展更新由商店管理，或由原安装目录手动替换。架构与验收证据见 [维护记录](maintenance.md)。
