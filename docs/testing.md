# 测试记录

## 已执行

| 检查 | 环境 | 结果 |
| --- | --- | --- |
| `npm test` | Node.js 24.20.0 / Vitest | PASS |
| `npm run typecheck` | TypeScript 5.6 | PASS |
| `npm run build` | Vite 5.4 | PASS |
| 构建后 `options.html` 浏览器渲染 | Edge 158 / BrowserSkill / local HTTP | PASS |

## 尚需真实环境验证

扩展目录在 Edge 的“加载已解压的扩展程序”中实际安装、YouTube 视频、浏览器用户授权、真实 tabCapture 原声回放、云端 API、faster-whisper GPU、DRM 网站和长时间运行需要在带扩展加载权限和服务配置的环境中执行。没有执行的项目不标记为通过。
