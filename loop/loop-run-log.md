# loop-run-log.md — append-only 运行日志

> 每次循环运行追加一条：started / found / acted / escalated / tokens(约) / 结果。

## 2026-09-10

### Run #2 — release-verify（提交与推送门禁）· L2 · 手动触发
- started: 2026-09-10，执行器 Kimi Code（人工监督）
- found: 品牌改造 + loop 骨架共 54 修改 + 2 新增未提交；远端 origin/main 有新基线（#352 等）
- acted: pre-push 门禁 `npx vitest run` → 91 文件 / 778 测试全绿（6.3s）；确认 dist/ 被 gitignore
- 提交策略: 拆两个语义提交 — ①brand 改造 ②loop 工程骨架；推送 origin main
- 结果: 待记录

### Run #1 — release-verify · L2 · 手动触发
- started: 2026-09-10，执行器 Kimi Code（人工监督），Maker/Checker 分离待补（首跑为基础设施建立 + 打包验证）
- found: 品牌改造后未出过正式安装包；需验证 productName/logo/补丁/测试全链路
- acted: 运行 `npm run package:mac:arm64`（verify-target → build → electron-builder --mac --arm64 --publish never，exit 0）
- verified（Checker 角色，独立于执行检查）:
  - dist/dsh-desktop-mac-arm64.dmg 179M、.zip 210M、.blockmap 齐
  - dist/mac-arm64/Aura.app：CFBundleName/DisplayName=Aura，CFBundleIdentifier=io.dsh.desktop（保留正确），版本 0.1.1
  - web-frontend dist 内 dsh-desktop-logo.png/light/dark 三图就位，index.html favicon 指向新图
  - Resources 下 dsh-desktop.patch.yml / dsh-desktop-safe.patch.yml 就位
  - splash.html「正在启动 Aura智能工作台」/「Starting Aura」；safe-mode/recovery title=Aura 系；两页均含 brand-contact 联系方式脚注；windows-menu title=Aura application menu
  - market-installer client.js 与 client-ui client.js 产物内均含 Aura智能工作台 品牌串
  - codesign：adhoc+linker-signed（预期内，无 Developer ID 证书）
- escalated: ①产物 ad-hoc 签名不可分发，正式发布走 CI 签名；②安装包文件名仍为 dsh-desktop-mac-arm64.*，是否随品牌改为 aura-* 待人类决策（牵动 release.yml 与更新源 URL 约定）
- 结果: PASS（本机验证范围）；tokens(约): 120k；耗时约 55s（不含此前 npm install）
- 下一步: 人工 dmg 冒烟 → 决策 artifactName → 进入第 1 周 daily-triage
