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

1. [decision] 安装包文件名仍为 dsh-desktop-mac-arm64.*（electron-builder artifactName 取
   `name` 字段而非 productName）。是否改为 aura-mac-arm64.*？涉及 release.yml 发布脚本与
   更新服务器 URL 约定，需人类决策后统一切换
2. [manual] dmg 安装冒烟（见上）
3. [manual] 替换正式设计 logo（换 build/ 下 PNG + 重跑 install-brand-assets）
4. （后续）daily-triage 循环上线（第 1 周）

## 已完成（近期）

- 2026-09-10：品牌改造实施完成，778 测试全绿，electron-vite build 通过
- 2026-09-10：loop/ 骨架建立（LOOP.md / STATE.md / loop-budget.md / loop-run-log.md），首个循环 release-verify 登记为 L2

## 风险与升级提示

- 打包若因签名失败：本机无 Apple 签名证书时需以 CSC_IDENTITY_AUTO_DISCOVERY=false 重跑（未签名产物仅供本机验证，不可分发）
- 占位 logo 为文字版，正式发布前需替换正式设计图（仅需换 build/ 下 PNG + 重跑 install-brand-assets）
