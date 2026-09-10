#!/usr/bin/env bash
# Thin-loop daily snapshot (L1 report-only) for loop-engineering daily-triage.
# Read-only against the repo; the only write is an escalation issue comment (workflow-gated).
# Outputs: markdown to $GITHUB_STEP_SUMMARY (or stdout), ESCALATED=true|false to $GITHUB_ENV.
set -uo pipefail
export LC_ALL=en_US.UTF-8 LANG=en_US.UTF-8

REPO="${GITHUB_REPOSITORY:-gyc567/dsh-desktop}"
OUT="${GITHUB_STEP_SUMMARY:-/dev/stdout}"
TODAY="$(date -u +%F)"
ESCALATED=false
ESC_FILE="$(mktemp)"
trap 'rm -f "$ESC_FILE"' EXIT
: > "$ESC_FILE"
esc() { ESCALATED=true; printf '%s\n' "- $1" >> "$ESC_FILE"; }

# read_stdin <js> — run a single-line node program against stdin
read_stdin() { node -e "$1"; }

# --- CI (main branch latest runs) ---
CI_LINES="$(gh run list --repo "$REPO" --branch main --limit 10 \
  --json workflowName,conclusion,url \
  --jq -r '.[] | "\(.workflowName)\t\(.conclusion // "pending")\t\(.url)"' 2>/dev/null || echo $'gh unavailable\t-\t-')"
CI_FAILS="$(printf '%s\n' "$CI_LINES" | awk -F'\t' '$2=="failure"' | wc -l | tr -d ' ')"
[ "$CI_FAILS" != "0" ] && esc "main 分支有 $CI_FAILS 个 workflow 运行失败（见 CI 区链接）"

# --- Issues ---
ISSUE_JSON="$(gh issue list --repo "$REPO" --state open --limit 100 \
  --json number,title,labels,createdAt 2>/dev/null || echo '[]')"
ISSUE_TOTAL="$(printf '%s' "$ISSUE_JSON" | read_stdin 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).length)}catch(e){console.log("?")}})')"
ISSUE_UNTRIAGED="$(printf '%s' "$ISSUE_JSON" | read_stdin 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const a=JSON.parse(s);console.log(a.filter(i=>!i.labels||i.labels.length===0).length)}catch(e){console.log("?")}})')"
if [ "$ISSUE_UNTRIAGED" != "?" ] && [ "$ISSUE_UNTRIAGED" -gt 10 ]; then
  esc "未分拣 issue 达 $ISSUE_UNTRIAGED 个（>10）"
fi

# --- PRs ---
PR_JSON="$(gh pr list --repo "$REPO" --state open --limit 50 \
  --json number,title,isDraft,statusCheckRollup 2>/dev/null || echo '[]')"
PR_TOTAL="$(printf '%s' "$PR_JSON" | read_stdin 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).length)}catch(e){console.log("?")}})')"
PR_FAILING="$(printf '%s' "$PR_JSON" | read_stdin 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const a=JSON.parse(s);console.log(a.filter(p=>Array.isArray(p.statusCheckRollup)&&p.statusCheckRollup.some(c=>c&&c.conclusion==="FAILURE")).length)}catch(e){console.log("?")}})')"

# --- npm audit (lockfile only, no install) ---
AUDIT="$({ npm audit --json 2>/dev/null || true; } | read_stdin 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const v=JSON.parse(s).vulnerabilities||{};const n={critical:0,high:0,moderate:0,low:0};for(const o of Object.values(v)){if(o.severity&&n[o.severity]!==undefined)n[o.severity]++}console.log(JSON.stringify(n))}catch(e){console.log("{}")}})')"
AUDIT_HIGH="$(printf '%s' "$AUDIT" | read_stdin 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const n=JSON.parse(s);console.log((n.high||0)+(n.critical||0))}catch(e){console.log("?")}})')"
if [ "$AUDIT_HIGH" != "?" ] && [ "$AUDIT_HIGH" -gt 0 ]; then
  esc "npm audit 发现 $AUDIT_HIGH 个 high/critical 漏洞"
fi

# --- npm outdated (registry query only) ---
MAJOR_OUTDATED="$({ npm outdated --json 2>/dev/null || true; } | read_stdin 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const o=JSON.parse(s);let n=0;for(const k of Object.keys(o)){const v=o[k];const cur=String(v.current||"").split(".")[0];const lat=String(v.latest||"").split(".")[0];if(cur&&lat&&cur!==lat&&k!=="electron"&&k!=="electron-builder")n++}console.log(n)}catch(e){console.log(0)}})')"

# --- Docs drift: package.json dsh pin vs development.md ---
# The dsh dep is a file: tarball path (file:packages/harness-.../deepseek-ai-dsh-0.1.2-rc.1.tgz);
# extract the semver from the tarball name before comparing.
DSH_DEP="$(node -e 'const p=require("./package.json");const d=p.dependencies||{};const k=Object.keys(d).find(x=>x==="@deepseek-ai/dsh"||x.startsWith("@deepseek-ai/dsh-"));console.log(k?d[k]:"")')"
PIN_NUM="$(printf '%s' "$DSH_DEP" | sed -n 's/.*deepseek-ai-dsh-\([0-9][0-9a-zA-Z.-]*\)\.tgz/\1/p')"
[ -z "$PIN_NUM" ] && PIN_NUM="$(printf '%s' "$DSH_DEP" | sed 's/^[^0-9]*//;s/[^0-9a-zA-Z.-].*$//')"
DOC_VER="$(grep -o '@deepseek-ai/dsh@[0-9][0-9a-zA-Z.-]*' docs/development.md 2>/dev/null | sort -u | tr '\n' ' ' | sed 's/ $//')"
if [ -n "$PIN_NUM" ] && [ -n "$DOC_VER" ]; then
  case "$DOC_VER" in
    *"$PIN_NUM"*) : ;;
    *) esc "文档漂移：package.json pin $PIN_NUM 与 development.md 中的 $DOC_VER 不一致" ;;
  esac
fi

# --- README parity (fact string present in all 6 languages) ---
README_MISSING=""
if [ -n "$PIN_NUM" ]; then
  for f in README.md README.zh.md README.ja.md README.ru.md README.es.md README.pt.md; do
    grep -q "@deepseek-ai/dsh@$PIN_NUM" "$f" 2>/dev/null || README_MISSING="$README_MISSING $f"
  done
fi
[ -n "$README_MISSING" ] && esc "README parity：以下文件缺事实串$README_MISSING"

# --- Loop health: STATE.md freshness ---
STATE_AGE_DAYS=999
if git cat-file -e HEAD:loop/STATE.md 2>/dev/null; then
  STATE_TS="$(git log -1 --format=%ct -- loop/STATE.md)"
  STATE_AGE_DAYS=$(( ($(date +%s) - STATE_TS) / 86400 ))
  if [ "$STATE_AGE_DAYS" -gt 2 ]; then
    esc "loop/STATE.md 已 $STATE_AGE_DAYS 天未更新（防循环失忆）"
  fi
fi

# --- Report ---
{
  echo "## Daily Triage $TODAY (thin loop)"
  echo
  echo "### CI"
  printf '%s\n' "$CI_LINES" | while IFS=$'\t' read -r name concl url; do
    [ -n "$concl" ] && echo "- $name: $concl ($url)"
  done
  echo
  echo "### Issues — open: $ISSUE_TOTAL, untriaged: $ISSUE_UNTRIAGED"
  echo "### PRs — open: $PR_TOTAL, CI failing: $PR_FAILING"
  echo "### Deps — audit high+critical: $AUDIT_HIGH; major outdated (excl. electron): $MAJOR_OUTDATED"
  echo "### Docs — package.json pin: ${PIN_NUM:-unknown}; development.md says: ${DOC_VER:-unknown}"
  echo "### Loop — STATE.md age: $STATE_AGE_DAYS days"
  echo
  if [ -s "$ESC_FILE" ]; then
    echo "### Escalations (human action required)"
    cat "$ESC_FILE"
  else
    echo "### Escalations — none today"
  fi
} >> "$OUT"

# --- Escalation gate for workflow ---
if [ -n "${GITHUB_ENV:-}" ]; then
  echo "ESCALATED=$ESCALATED" >> "$GITHUB_ENV"
fi
exit 0
