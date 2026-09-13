# STATE.md — 主状态文件（release-verify + 未来 daily-triage 共用）

> 每次循环运行必须先读本文件、运行结束时更新本文件、并修剪已解决条目。
> 格式：事实 + 时间戳，不写过程性描述。

## 当前焦点

- [done] 品牌改造后首个正式安装包验证（release-verify Run #1）— 2026-09-10 ✅
  - 结果：dist/dsh-desktop-mac-arm64.dmg (179M) + .zip (210M) 产出；Aura.app 检查通过
  - 验证明细：CFBundleName/DisplayName=Aura；appId io.dsh.desktop 未变；占位 logo 已注入
    web-frontend dist；两个 patch yml 就位；splash/safe-mode/recovery 页品牌与联系方式
    就位；market-installer 与 client-ui 品牌串在产物内
  - 签名状态：本机无 Developer ID 证书，ad-hoc 签名——产物仅供本机验证，不可分发
  - 待人工：dmg 安装冒烟（拖入 Applications、首次启动、侧边栏品牌名渲染、关于页联系方式）

## 待办队列（按优先级）

0. [done] 更新源隐患根除 — 2026-09-11 ✅（Run #12 修复 355a25a + Run #13 重出包 aura.6）
1. [done] CI 全平台打包 + 正式 release 上线 — 2026-09-11 ✅（Run #8/#9）
   - https://github.com/gyc567/dsh-desktop/releases/latest = v0.1.1-aura.5，
     12 资产（mac arm64/x64 dmg+zip+blockmap、win exe+blockmap、4 个 latest*.yml），未签名仅供测试
   - 修复 4 个真实缺陷：preload 跨入口 chunk（6234916）、Apple secrets 硬失败（27eb277）、
     UKey self-hosted job 无限排队（c5c0884）、Windows runner pwsh 语法（6605dd9）
2. [escalated] 文档漂移：`docs/development.md` 仍写 `@deepseek-ai/dsh@0.1.1-rc.2`，
   实际 pin 是 0.1.2-rc.1（daily-triage Run #3 首次快照发现，人工修复后该项即转绿）
3. [info] npm audit 4 个 high（dsh-ppt/pptxgenjs 传递依赖，`fixAvailable: false`）—
   上游修复前持续跟踪，不阻断
4. [manual] dmg 安装冒烟（人类已认领，进行中）—— 现可直接用 releases/latest 的 aura-mac-arm64.dmg
5. [manual] 替换正式设计 logo（换 build/ 下 PNG + 重跑 install-brand-assets）
6. [infra] 配齐 DESKTOP_* Apple secrets + DESKTOP_WINDOWS_SIGNING_PIN（+ UKey self-hosted runner）
   后，publish 链恢复全自动发布并出签名包；届时 Run #9 的手动发布流程退役。
   同一 Apple Developer 账号兼作 iOS TestFlight 分发（Run #15 决策 2）
7. [done] 手机 Phase 1 — Android Capacitor 壳 — 2026-09-13 ✅（Run #16，549c987 起 6 提交）
   - mobile-android.yml tag 出 aura-mobile-android.apk（12.4MB，CI 验证通过）；配对协议/
     WS mux/移动 UI 全复用 src/main/mobile/，壳零 token 逻辑（Cookie 在隧道源）
   - 待办: 真机联调（人类认领）；MOBILE_ANDROID_* 4 个 secret（配后正式自签名）；
     下次桌面 tag 发版把 APK 并入 release 资产；Phase 2 iOS TestFlight 排期
8. （后续）contract-guard / patch-sentinel 上线（第 2-4 周）

## 最近巡检

- 2026-09-11 Run #9 手动发布：releases/latest 已解析（v0.1.1-aura.5，非 prerelease），12 资产齐备，
  verify-release-assets 本地校验通过，版本号三平台一致（0.1.1-aura.5）
- 2026-09-11 Run #8 CI 全平台打包：tag v0.1.1-aura.5 → run 34548803084 三平台全绿；
  旧 tag aura.1~aura.3 的 releases 页无产物（publish 链被 UKey job 堵死，已根治）

- 2026-09-10 daily-triage **线上验证通过**（workflow_dispatch × 2，Run #4）：
  CI 成功 / Issues 1 open（= 循环追踪 issue #1）/ PRs 0 open / audit high+critical 4 /
  major 过期 7 / 文档漂移 1 项（escalated → issue #1）/ README parity 通过 / STATE age 0 天
- 2026-09-10 daily-triage 首次快照（本地干跑）：Issues 0 open / PRs 0 open /
  audit high+critical 4 / major 过期 7 / **文档漂移 1 项（escalated）** / README parity 通过 /
  STATE.md age 0 天。明日起由 GitHub Actions 每日 UTC 07:23 自动执行。
- 环境变更记录：本仓库 issues 原为禁用（上游继承），已于 Run #4 启用——
  这是循环的 escalation 通道，也是未来的 issue-triage 模式的前置条件。

## 已完成（近期）

- 2026-09-10：品牌改造实施完成，778 测试全绿，electron-vite build 通过
- [done] 品牌改造 + loop 骨架已推送 origin/main（9dfce60 + 8bce4eb）— 2026-09-10 ✅
  - pre-push 门禁：778/778 测试全绿；拆分为 brand / loop 两个语义提交

## 风险与升级提示

- 打包若因签名失败：本机无 Apple 签名证书时需以 CSC_IDENTITY_AUTO_DISCOVERY=false 重跑（未签名产物仅供本机验证，不可分发）
- 占位 logo 为文字版，正式发布前需替换正式设计图（仅需换 build/ 下 PNG + 重跑 install-brand-assets）
