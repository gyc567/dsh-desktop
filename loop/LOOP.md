# LOOP.md — Aura智能工作台（dsh-desktop）循环工程总纲

> 引入方式：基于 https://github.com/cobusgreyling/loop-engineering 方法论，项目级落地。
> 就绪度等级：L0 草案 → L1 只报告 → L2 带验证器的小修复 → L3 无人值守。
> 第一周规则：任何新循环必须先以 L1 只报告运行，验证器连续判断正确才可升级。

## 全局目标

让 Aura智能工作台的开发、迭代与自进化由"人驱动 prompt"转为"循环发现工作 → 交给 agent → 验证结果 → 持久化状态"。

## 全局非目标

- 不替代人类做架构决策、品牌决策、上游升级决策。
- 不做无人值守的合并与发布（本仓库为签名发布桌面应用，爆炸半径大）。

## Denylist（所有循环永不可自动修改）

- `patches/`（补丁重生成必须人触发，见 docs/development.md 流程）
- `package.json` 的 `build`/`appId`/更新源字段、`electron-builder.dev.cjs`
- `.github/workflows/release.yml` 的签名/公证步骤、`scripts/generation-poc.mjs` 硬编码路径
- `build/*.html`、`LICENSE`、`src/shared/brand.ts` 的品牌常量值（改品牌是人决策）
- 任何密钥/证书/签名配置

## 铁律

1. Maker/Checker 分离：实现循环与验证循环不得为同一会话。
2. 验证器判据：`npx vitest run`（778 测试）+ `npm run build` 全绿，隔离 worktree 中执行。
3. 永不自动合并；自动修复一律以 PR 提交，PR 描述标注 `Loop Engineering — <模式名>`。
4. 无状态文件 = 循环失忆 = 不允许运行；每次运行先读 STATE、再写 STATE、修剪已解决项。
5. 同一目标自动修复 >3 次无进展 → 熔断上报人类。

## 循环登记簿

| 模式 | 等级 | 触发 | 状态文件 | 日 token 上限 |
|---|---|---|---|---|
| release-verify（发布产物验证） | L2 | 手动/发版前 | STATE.md | 200k |
| daily-triage（规划中） | L1 | 每日 | STATE.md | 100k |
| patch-sentinel（规划中，自定义） | L2 | 上游发版事件 | state/patch-sentinel-state.md | 800k |
| contract-guard（规划中，自定义） | L1 | 每日 | state/contract-guard-state.md | 50k |

## 升级规则

L1→L2：验证器连续两周与人类判断一致；L2→L3：验证器连续一周正确 + denylist 审计无越界。
STATE 超过 30 天未活跃 → 自动降级一级。

## 工具

官方 CLI 可用于体检/估价：`npx @cobusgreyling/loop doctor .` / `audit` / `cost`。
执行器 Agent 无关（claude/grok/codex/opencode 或 Kimi Code 手动触发循环 prompt）。
