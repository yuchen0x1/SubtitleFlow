# SubtitleFlow 维护记录

## 改造前审计 · 2026-11-18

| 范围 | 基线证据 |
| --- | --- |
| 仓库 | `yuchen0x1/SubtitleFlow` 公开 MIT 仓库；默认 `main`，当前提交 `4a8f03f`，版本 `0.0.2`；`v0.0.2` 已正式发布为不可变 Release |
| 远端设置 | 访问账号拥有 ADMIN；Issues 开启、Discussions 关闭、Wiki 开启、Pages 未配置。已有描述与 10 个 Topics。基线无主分支保护。Actions 默认只读，私密漏洞报告、Dependabot 安全更新、Secret Scanning 及 push protection 已开启。未发现项目级发布 Secrets |
| 目录与数据流 | `apps/extension` 为 TypeScript、React、MV3；入口为弹窗、设置、content、background、offscreen。会话经 runtime/tab 消息路由，字幕按播放器的 currentTime 查找并渲染至 Shadow DOM。OpenAI 兼容、WebSocket、自选 Python FastAPI 是可选服务 |
| 功能清单 | HTML5 TextTrack、SRT/VTT/ASS/SSA 导入、原文/译文/双语、时间对齐、拖动和样式、暂停/恢复、全屏、用户主动 tabCapture、保留原声、PCM16/VAD、AI 翻译缓存与重试、Whisper 健康/模型查询和转发；站点适配只用于名称/通用检测 |
| 数据 | 设置与用户自填 Key 进扩展本地存储；导入记录按标签页存在浏览器会话存储；会话状态是内存数据。无数据库，旧设置由 normalizeSettings 补默认值。模型缓存由 Whisper 使用可配置目录 |
| 基线验证 | 改造前 npm ci 通过；构建失败，tsc 报三个 TS/TSX 文件尾非法字符；manifest 和 FastAPI 入口也出现相同字面错误；Vitest 18/19，产物回归因无 content.js 失败；远端同一提交 CI 失败。当前版本已通过三系统 CI |
| 维护风险 | 构建与测试依赖存在已知漏洞；包装脚本只支持 Windows，旧 ZIP 和 source map 内嵌在仓库，缺少可校验发布；旧 README 同步工作流会直接写主分支。导入/网页字幕会同时发送，源语言和手工切换的语义不稳定 |
| 安全边界 | 扩展需访问播放网页和用户配置的 Provider，当前保留广泛的 host 权限；本地服务限回环；改造保留不访问模型的默认字幕路径。没有项目密钥随包分发。远端 HTTP/WS 旧配置需要迁移至 HTTPS/WSS，本地回环例外 |
| 依赖和分发 | Node 锁文件 SPDX 覆盖 MIT、MIT-0、Apache-2.0、BSD-2-Clause、BSD-3-Clause、ISC、MPL-2.0、CC-BY-4.0 和 0BSD。浏览器产物包含 React 运行时，开发依赖与 Whisper 组件由各生态安装。没有借用竞品实现。 |

## 版本与证据

| 对象 | 当前版本及入口 | 监测与验收 |
| --- | --- | --- |
| Chrome/Edge Chromium ZIP | [正式发行](https://github.com/yuchen0x1/SubtitleFlow/releases/latest) | [CI](https://github.com/yuchen0x1/SubtitleFlow/actions/workflows/ci.yml) · [Release](https://github.com/yuchen0x1/SubtitleFlow/actions/workflows/release.yml) · [测试记录](testing.md) |
| 可选本地服务 | 随同仓库版本 | Python 解析与 API 检查，真实模型首次下载、GPU 与长时识别按目标机器验收 |
| 扩展商店 | 见平台说明 | 需要发布账号和商店审核；有新版本时对照 [更新验收](updating.md) 记录实际结果 |
| 安全与依赖 | [Security](https://github.com/yuchen0x1/SubtitleFlow/security) 和 [Security workflow](https://github.com/yuchen0x1/SubtitleFlow/actions/workflows/security.yml) | Dependabot 周更、PR 依赖审查、锁文件安全审计，保留风险记录 |
| 兼容性与需补项 | [平台矩阵](platforms.md) 和 [研究清单](research.md) | 真实网站/媒体、跨浏览器全屏、主动音频授权、长时会话与商店更新均需正式环境验收 |

每次改动以 `CONTRIBUTING.md` 的 PR、版本与测试流程同步 Chrome 和 Edge。每 30 天用 `research.md` 中的仓库链接复查近期活动、发行和反馈，在维护 Issue 记录变化。大版本重新验证关键参考路线及许可。竞品代码只有通过单独审核才可纳入。

GitHub 主分支保护要求通过三系统 CI 和依赖审查，须经 PR，禁止强推和删除。当前只有一名维护者，必需独立批准数为 0。稳定版本标签仅管理员可创建，并禁止更新或删除。发布环境仅允许版本标签，仓库启用 CodeQL 默认扫描和不可变发行。

## 发布包暴露面

1. 扫描目标为旧 ZIP 和新版 `dist`，结合 manifest、构建配置与文件清单人工复核。
2. 旧 ZIP 含 source map。新版关闭两个 Vite 构建阶段的 source map，并通过包装门禁拒绝 `.map` 和引用。移除对所有网站公开的 offscreen 页面；它由扩展本身创建。
3. 扩展和 Python 后端增加连接目标校验。ZIP 含项目及 React、React DOM、Scheduler 的许可证文本，发行还带 SHA-256 和版本元数据，发布签名由 GitHub 生成。Key 在浏览器本地保存，扩展内存和本机用户可以读取自填 Key。分发版无预置密钥。
4. 客户端设置无法保护项目级长期密钥，后续涉及计费与长期密钥需放入拥有真实身份验证的服务端。
5. 构建工具链保留仅开发时使用的 picomatch 4.0.7。当前 advisory 无已发行修复。CI 报告此项并针对其精确编号作有限放行，运行时 npm 依赖独立审计，新出现的高危和严重项仍失败。修复版本可用即撤销放行。[上游公告](https://github.com/advisories/GHSA-fc5q-39xc-vjpf)
6. 发布脚本将 HTML、JavaScript、CSS、JSON 和文本条目统一为 LF，避免 Windows 与 Linux 构建因换行符产生不同的 ZIP 校验值。
