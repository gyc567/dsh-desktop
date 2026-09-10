# daily-triage — 每日巡检（项目适配版 · L1 只报告）

> 来源：loop-engineering 官方 daily-triage 模式的项目级适配。
> 等级：**L1 只报告**。本模式不修改任何代码、不自动修复，只产出分级报告并升级需要人类介入的条目。

## 目标

每天一份对仓库健康状况的分级扫描：CI、issue、PR、依赖安全、文档漂移、loop 自身健康。
非目标：不修代码、不合并 PR、不升级依赖、不回复 issue。

## 触发与节奏

- 瘦循环（GitHub Action）：每日 UTC 07:23（`.github/workflows/loop-daily.yml`），快照 + 仅在需要行动时开/评 issue
- 完整巡检（人工或 agent 会话触发）：`loop/skills/loop-triage/SKILL.md` 流程，本地可跑 `npx vitest run` 时升级为"含测试运行"的完整版

## 扫描项（按本仓库定制）

| 项 | 数据源 | 关注点什么 |
|---|---|---|
| CI 状态 | `gh run list --branch main` | main 上最新运行是否 failure |
| Issue 队列 | `gh issue list` | 无标签未分拣数、>30 天未动数 |
| PR 队列 | `gh pr list` | open 数、statusCheckRollup 失败、长期未评审 |
| 依赖安全 | `npm audit --json`（仅用 lockfile） | high/critical 数 |
| 依赖过期 | `npm outdated --json`（仅查 registry） | major 过期数（minor/patch 不升级级） |
| 文档漂移 | package.json 的 dsh pin vs `docs/development.md` 中的版本串 | 不一致 → escalation |
| README parity | 6 语言 README 中的事实串（`@deepseek-ai/dsh@…`） | 缺失 → escalation（对应 test/readme-parity） |
| Loop 健康 | `loop/STATE.md` 最后更新时间 | >2 天未更新 → escalation（防循环失忆） |

## 输出契约（紧凑格式）

```
## Daily Triage YYYY-MM-DD
### CI       — 结论 + 链接（红才展开）
### Issues   — open/未分拣/陈旧 计数
### PRs      — open/CI 失败 计数
### Deps     — audit high+critical N；major 过期 N
### Docs     — drift 有/无（列出差异）
### Loop     — STATE.md 距今 N 天
### Escalations — 仅当有需人类行动的条目时输出
```

规则：没问题的项一行带过；**只有 Escalations 非空时才通知人类**（写 issue），其余只进 `$GITHUB_STEP_SUMMARY` / STATE.md。

## Escalation 触发器（任一命中 → 通知人类）

1. main 分支任一 workflow 最新运行 failure
2. `npm audit` 出现 high 或 critical
3. 文档漂移（版本 pin 不一致）或 README 事实串缺失
4. 未分拣 issue > 10
5. `loop/STATE.md` 超过 2 天未更新

## Denylist（本模式只读）

`patches/`、`package.json` 的 build/appId/更新源、`release.yml` 签名步骤、`LICENSE`、
`src/shared/brand.ts` 常量值 —— 本模式为 L1，一律不写入任何上述路径（也不写入任何源码路径）。

## 成本（参考官方 registry）

noop ≈ 5k tokens，报告 ≈ 50k，日上限 100k（见 loop-budget.md）。

## 升级路径

连续两周报告准确（人工抽查无误报/漏报）→ 可申请 L2：允许对
`docs/` 漂移类问题自动开 PR（仍走人工合并）。
