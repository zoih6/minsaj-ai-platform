#!/usr/bin/env bash
# verify-sweep-v8.sh — FULL-coverage responsive regression sweep.
# 30 routes (incl. ALL dynamic sub-pages: builders, editors, details) × 3 viewports.
# Asserts: zero horizontal overflow, correct sidebar mode, no portalled overlap.
#
# HISTORY: v3-v6 sweeps covered list pages only; the agent-builder/flow-editor
# sub-pages were never swept and shipped a 3-column 874px layout on phones
# (caught by the user on production). This sweep closes that coverage gap
# PERMANENTLY — any new route must be added here before delivery.
set -u
BASE="http://localhost:3000"
ROUTES=(
  # ---- list / static pages (22) ----
  "ar/app/home" "ar/app/chat" "ar/app/projects" "ar/app/runs" "ar/app/library"
  "ar/app/learn" "ar/app/research" "ar/app/create" "ar/app/code" "ar/app/analyze" "ar/app/explore"
  "ar/app/agents" "ar/app/flows" "ar/app/knowledge" "ar/app/models" "ar/app/models/routing"
  "ar/app/skills" "ar/app/tools" "ar/app/settings" "ar/app/team" "ar/app/billing" "ar/app/usage"
  # ---- dynamic sub-pages (8) — the v8 gap, never skip these ----
  "ar/app/agents/new"
  "ar/app/agents/agt_market_researcher/edit"
  "ar/app/flows/new"
  "ar/app/flows/flw_weekly_watch/edit"
  "ar/app/runs/run_weekly_watch"
  "ar/app/projects/prj_saudi_launch"
  "ar/app/knowledge/col_launch"
  "ar/app/models/mdl_clarity"
)
declare -A VP=( [mobile]=375x812 [tablet]=768x1024 [desktop]=1440x900 )
declare -A MODE=( [mobile]=drawer [tablet]=rail [desktop]=expanded )

PASS=0; FAIL=0; FAILED_LIST=""

get_metric() {
  python3 -c "
import json,sys
raw = sys.argv[1].strip()
try:
    value = json.loads(json.loads(raw))
except Exception:
    try:
        value = json.loads(raw)
    except Exception:
        value = {'parse': 'error'}
print(value.get(sys.argv[2], 'NA'))
" "$1" "$2"
}

for vp in mobile tablet desktop; do
  w=${VP[$vp]%x*}; h=${VP[$vp]#*x}
  agent-browser open "$BASE/ar" >/dev/null 2>&1
  agent-browser wait 500 >/dev/null 2>&1
  agent-browser set viewport "$w" "$h" >/dev/null
  for route in "${ROUTES[@]}"; do
    agent-browser open "$BASE/$route" >/dev/null 2>&1
    agent-browser wait --load networkidle >/dev/null 2>&1
    agent-browser wait 400 >/dev/null 2>&1
    json=$(agent-browser eval "JSON.stringify({overflow: document.documentElement.scrollWidth - window.innerWidth, mode: (document.querySelector('.universal-app-shell')||{}).getAttribute ? document.querySelector('.universal-app-shell').getAttribute('data-sidebar') : 'none', overlap: (() => { const t = document.querySelector('.universal-shell-mobile-nav'); if (!t) return false; const tb = t.getBoundingClientRect(); for (const el of document.querySelectorAll('.u-feedback-toast, .demo-toast, .u2-overlay__content, .form-dialog')) { const r = el.getBoundingClientRect(); if (r.height > 0 && r.bottom > tb.top + 4 && r.top < tb.bottom - 4) return true; } return false; })(), squeezed: (() => { const s = document.querySelector('.builder-shell, .flow-editor-shell'); if (!s) return false; const cs = getComputedStyle(s); if (cs.display.includes('grid')) { const cols = cs.gridTemplateColumns.split(' ').filter(c => c !== '0px'); const vw = window.innerWidth; const minWidth = cols.reduce((a, c) => a + (parseFloat(c) || 0), 0); return cols.length >= 3 && minWidth > vw; } return false; })()})" 2>/dev/null | grep '^"' | tail -1)

    ov=$(get_metric "$json" overflow)
    md=$(get_metric "$json" mode)
    ol=$(get_metric "$json" overlap)
    sq=$(get_metric "$json" squeezed)

    ok=1; reason=""
    [ "$ov" != "0" ] && { ok=0; reason="overflow=$ov"; }
    [ "$md" != "${MODE[$vp]}" ] && { ok=0; reason="$reason mode=$md(want ${MODE[$vp]})"; }
    [ "$ol" = "True" ] && { ok=0; reason="$reason overlap"; }
    [ "$sq" = "True" ] && { ok=0; reason="$reason squeezed-desktop-grid"; }

    if [ $ok -eq 1 ]; then PASS=$((PASS+1)); else FAIL=$((FAIL+1)); FAILED_LIST="${FAILED_LIST}\n  [$vp] $route → $reason"; fi
  done
  echo "[$vp] done: running total $PASS pass / $FAIL fail"
done

echo "==================== SWEEP v8 RESULT ===================="
echo "routes: ${#ROUTES[@]} × 3 viewports = $((PASS+FAIL)) checks"
echo "PASS: $PASS / $((PASS+FAIL))"
[ -n "$FAILED_LIST" ] && echo -e "FAILED:$FAILED_LIST"
[ $FAIL -eq 0 ] && echo "ALL GREEN"
exit $([ $FAIL -eq 0 ] && echo 0 || echo 1)
