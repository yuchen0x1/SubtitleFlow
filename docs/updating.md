# 安装、更新与回滚

## 从 GitHub 安装或更新

1. 打开 [SubtitleFlow Releases](https://github.com/yuchen0x1/SubtitleFlow/releases/latest)，下载对应版本的 Chromium ZIP、`SHA256SUMS`，按需下载 `release-metadata.json`。
2. 在下载目录校验签名与完整性。需要支持 `release verify-asset` 的 GitHub CLI。将示例中的版本替换成发行页标签。

   ```powershell
   gh release verify v0.0.4 -R yuchen0x1/SubtitleFlow
   gh release verify-asset v0.0.4 SubtitleFlow-0.0.4-Chromium.zip -R yuchen0x1/SubtitleFlow
   Get-FileHash .\SubtitleFlow-0.0.4-Chromium.zip -Algorithm SHA256
   ```

   macOS/Linux 使用 `shasum -a 256 SubtitleFlow-0.0.4-Chromium.zip`。核对输出与 `SHA256SUMS`，任何校验失败都应保留原安装并重新获取可信资产。旧版 v0.0.1 早于不可变 Release。

3. 首次安装时解压，在 Chrome 的 `chrome://extensions` 或 Edge 的 `edge://extensions` 开启开发者模式，选择“加载已解压的扩展程序”，选中含 `manifest.json` 的目录。
4. 更新时先停止当前字幕会话。将现有加载目录完整备份到同一磁盘的独立位置，在临时目录解压并校验文件齐全，然后用新目录替换原路径的内容。在扩展管理页点击“重新加载”，刷新视频页并检查版本。保留原路径和原扩展项目，可以避免因扩展 ID 改变而丢失原配置。
5. 若解压中断、空间不足、版本加载失败或更新后功能异常，保留或恢复原目录，重新加载并刷新视频页。避免先卸载扩展，浏览器卸载时会清除扩展自己的设置。运行中的识别和导入文件属于会话数据，更新时应先保存原字幕文件。

ZIP 发行采用手动安装，扩展本身不会下载或执行代码。设置页可手动检查，启用提示后打开弹窗才会每日检查。提醒只接受固定 GitHub 仓库内版本更高的不可变正式发布及符合命名、来源、摘要的上传资产。稍后提醒会隐藏该版本七天。GitHub 请求异常时仍可使用本地字幕，手动检查会报告错误。提醒读取 GitHub API 的元数据，数字签名和下载字节由上面的 CLI 与哈希验证。

## 商店发行

Chrome Web Store 与 Edge Add-ons 为已上架扩展提供签名、安装和浏览器更新。将同一版本 ZIP 提交至对应发布后台，等待审核后用上一版商店安装验证原扩展 ID、设置保留和新版加载。需要对应开发者账号、扩展条目与发布授权。商店回滚通过重新提交修复版本完成，由浏览器管理下载与安装。

[Chrome 扩展分发](https://developer.chrome.com/docs/extensions/how-to/distribute) · [Edge 商店更新](https://learn.microsoft.com/en-us/microsoft-edge/extensions/update/update-extension) · [GitHub Release attestation](https://docs.github.com/en/code-security/concepts/supply-chain-security/immutable-releases)。
