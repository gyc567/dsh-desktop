# loop-triage 技能 — daily-triage 的执行手册

触发词：daily triage、每日巡检、loop triage、仓库体检。
执行方式：Agent 无关（Kimi Code / Claude Code / codex / opencode 均可手动触发）。

## 前置

1. 读本文件与 `loop/patterns/daily-triage.md`
2. 读 `loop/STATE.md`（上次巡检遗留的 Escalations 是否已处理）
3. 确认当前等级为 L1：只报告，不改代码

## 步骤

1. **CI**：`gh run list --branch main --limit 5 --json workflowName,conclusion,url,createdAt`
2. **Issues**：`gh issue list --state open --limit 50 --json number,title,labels,createdAt`
   - 未分拣 = labels 为空；陈旧 = createdAt 距今 >30 天且无评论
3. **PRs**：`gh pr list --state open --json number,title,isDraft,statusCheckRollup`
4. **依赖安全**：`npm audit --json`（node 解析 vulnerabilities 按 severity 计数）
5. **依赖过期**：`npm outdated --json`（只统计 major）
6. **文档漂移**：`node -p` 取 package.json 里 `@deepseek-ai/dsh` 的实际版本，与
   `grep -o '@deepseek-ai/dsh@[0-9a-zA-Z.-]*' docs/development.md` 比对
7. **README parity**：对上一步版本串，grep 6 个 README（en/zh/ja/ru/es/pt）是否都含该串
8. **Loop 健康**：`git log -1 --format=%ct -- loop/STATE.md` 距今天数
9. （可选，本地完整版）`npx vitest run` —— 在 Action 里不跑，本地触发时跑

## 输出

按 daily-triage.md 的输出契约写报告；**Escalations 非空时**在 STATE.md 的
"待办队列"顶部插入条目并标注 `[escalated]`；然后更新 STATE.md 的
"最近巡检"一行和 loop-run-log.md（append 一条 Run 记录）。

## 红线

- 不修改任何源码、`patches/`、`package.json` 元数据、`release.yml`、`LICENSE`
- 不创建/合并/评论任何 PR
- 报告只陈述事实 + 链接，不臆测原因（CI 红了就贴链接，不猜谁干的）

## 成本自检

开始前和结束后各看一眼本次会话 token 消耗，记入 run-log 的 tokens(约) 字段；
单次超过 100k 要在 run-log 标注原因。
