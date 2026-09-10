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

1. [escalated] 文档漂移：`docs/development.md` 仍写 `@deepseek-ai/dsh@0.1.1-rc.2`，
   实际 pin 是 0.1.2-rc.1（daily-triage Run #3 首次快照发现，人工修复后该项即转绿）
2. [info] npm audit 4 个 high（dsh-ppt/pptxgenjs 传递依赖，`fixAvailable: false`）—
   上游修复前持续跟踪，不阻断
3. [done] 安装包文件名已统一切换为 aura-mac-arm64.* / aura-windows-*-setup.exe（Run #6，
   4ddb3a6 之后的提交；已清 dist 重建验证）。首个 CI release 留意 latest.yml 指向新文件名
4. [manual] dmg 安装冒烟（人类已认领，进行中）
5. [manual] 替换正式设计 logo（换 build/ 下 PNG + 重跑 install-brand-assets）
6. （后续）contract-guard / patch-sentinel 上线（第 2-4 周）

## 最近巡检

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
