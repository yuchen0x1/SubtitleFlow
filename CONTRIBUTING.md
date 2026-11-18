# 参与开发

使用 Node.js 24、npm 和 Python 3.11。运行 `npm ci`、`npm run typecheck`、`npm run build`、`npm test`、`npm run pack:dist`。从 `main` 创建短期功能或修复分支，发起 PR 并等待 CI。解决冲突时先更新分支，再重跑检查。紧急修复同样从 `main` 发起小范围 PR。

涉及字幕或播放器的修改需检查 Chrome 和 Edge。使用公开样本或合成夹具，提供实际验证环境与结果。涉及持久化字段时用旧值跑一次兼容测试。

发版前更新 `package.json` 和 lockfile、扩展 manifest 和 CHANGELOG。将发布准备 PR 合并进 `main` 并确认 CI 通过，再从该提交创建 `vMAJOR.MINOR.PATCH` 标签。Release 工作流构建、校验、上传并发布。发布成功后验证下载、签名和升级指南。商店提交使用同一版本资产，参阅 [更新与回滚](docs/updating.md)。
