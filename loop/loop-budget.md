# loop-budget.md — 预算与熔断

## 日 token 上限

| 循环 | 上限 | noop 估算 | 单次报告估算 | 单次动作估算 |
|---|---|---|---|---|
| release-verify | 200k | 3k | 30k | 150k |
| daily-triage | 100k | 5k | 50k | 200k |
| patch-sentinel | 800k | 3k | 80k | 500k |
| contract-guard | 50k | 2k | 20k | — |

单日全部循环总计上限：2M token。超出即暂停所有 L2+ 循环并上报。

## 熔断条件（命中任一即停）

1. 同一目标自动修复 >3 次无进展
2. 验证器与实现者为同一会话
3. 循环试图修改 Denylist 内路径
4. STATE.md 缺失或超过 30 天未更新
5. 单日花费超对应上限的 150%

## Kill switch

删除对应循环的 STATE 条目并在 loop-run-log.md 记录停止原因，即视为关停该循环。
