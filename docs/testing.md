# SubtitleFlow 验收

## 改造前

2026-11-18，`29e8e46`，Windows / Node.js 24.20.0。npm ci 通过；构建、TypeScript 与本地服务编译失败；单元与产物检查 18/19，构建产物用例因缺失 `dist/content.js` 失败。

## 可重复检查

```text
npm ci
npm run typecheck
npm run build
npm test
npm run pack:dist
npm audit --omit=dev --audit-level=high --registry=https://registry.npmjs.org
```

CI 矩阵在 Ubuntu、Windows、macOS 构建同一 MV3 包。到 [Actions](https://github.com/yuchen0x1/SubtitleFlow/actions) 查看每个提交的结果。UI 验收用真实安装的扩展和合成 HTML5 视频，测试原生字幕、导入覆盖、重开弹窗、移除和停止。模拟更新场景覆盖数值版本比较、已是最新、新版本、稍后提醒、错误来源或哈希缺失、网络故障。

## v0.0.5 本地结果

| 检查 | 结果 |
| --- | --- |
| Windows / Node.js 26，TypeScript、构建与 Chromium ZIP | 通过；21 个文件，SHA-256 `79982fa7122ec43d326a0f821c6adde4f3e2a001b8b76efe319fed5db2d44409` |
| Vitest | 17 个测试文件，56 项通过；覆盖偏移边界、导出格式和偏移后的 overlay 渲染 |
| npm 运行时依赖审计 | `npm audit --omit=dev --audit-level=high` 0 项；审计脚本可处理 npm 的零漏洞报告 |
| UI / 浏览器实机 | 未执行商业视频网站、DRM、长时 ASR 和真实下载；待安装 v0.0.5 后按下方清单验收 |

## v0.0.2 本地结果

| 检查 | 结果 |
| --- | --- |
| Windows / Node.js 24，TypeScript、构建、ZIP 结构与 SHA-256 | 通过 |
| Vitest | 13 个测试文件，24 项通过 |
| Chromium 扩展运行 | Edge 158.0.4370.26 和 Chrome 157.0.8103.79，真实弹窗在合成视频完成原生字幕、导入覆盖、重开恢复、停止、移除再回到原生字幕。两端都没有创建音频捕获文档 |
| Python 3.11 HTTP / WebSocket | 8 项检查通过，覆盖健康检查、模型列表、参数限制、Origin 与 Host 防护和错误响应 |
| 手动安装包升级与回滚 | 隔离 Edge 中使用 v0.0.1 正式 ZIP，从同一路径升级至本地 v0.0.2，再回滚至 v0.0.1。每次关闭浏览器并换包后重启。扩展 ID、语言设置均保留，旧设置的新增字段正确使用默认值 |
| 发行版在线检查 | 两个隔离浏览器都正确显示网络失败提示。最新版本发现与稍后提示行为由测试夹具覆盖 |
| npm 发行运行时依赖 | 0 项已知公告。构建工具保留一项已记录的 picomatch 例外 |

## 手动验收清单

- 用 Chrome/Edge 分别加载发行包。打开字幕可通过 `TextTrack` 读取的页面、导入 SRT/VTT/ASS/SSA、验证跳播、暂停、全屏和停止。
- 保留旧设置与扩展目录，使用经过签名验证的包升级。检查同一扩展 ID、配置保留和重新打开视频。模拟中断、磁盘不足、校验或签名失败时保留旧目录，加载失败时恢复旧版本。
- 从浏览器工具栏触发采集，分别验证真实 tabCapture 授权、原声回放、暂停/继续、停止和音频轨释放。验证自配 HTTPS/WSS Provider 与本地 Whisper 模型。
- 商店发布后另外验证安装、浏览器后台更新、旧版迁移及新版本首次启动。
- 记录真实网站、DRM、iframe、长时运行、操作系统和浏览器版本。合成夹具不覆盖商业视频网站与硬件加速。
