#!/usr/bin/env bash
# verify-sweep-audit-en.sh — portal-dialog-aware responsive regression sweep.
# Inherits ALL v10 sentinels (30 routes × 3 viewports × 2 themes):
#   - zero horizontal overflow, correct sidebar mode, theme attr applied
#   - no portalled overlap with mobile nav, no squeezed desktop grids
# NEW v11 sentinel — the portal/container isolation regression that shipped
# the "خصّص تجربتك" bug: every portalled dialog must open as a full-width
# bottom sheet on phones (left=0, width=viewport, top-only radius).
# Usage: BASE=http://localhost:PORT bash scripts/verify-sweep-audit-en.sh
set -u
BASE="${BASE:-http://localhost:3000}"
ROUTES=(
  "en/app/home" "en/app/chat" "en/app/projects" "en/app/runs" "en/app/library"
  "en/app/learn" "en/app/research" "en/app/create" "en/app/code" "en/app/analyze" "en/app/explore"
  "en/app/agents" "en/app/flows" "en/app/knowledge" "en/app/models" "en/app/models/routing"
  "en/app/skills" "en/app/tools" "en/app/settings" "en/app/team" "en/app/billing" "en/app/usage"
  "en/app/agents/new"
  "en/app/agents/agt_market_researcher/edit"
  "en/app/flows/new"
  "en/app/flows/flw_weekly_watch/edit"
  "en/app/runs/run_weekly_watch"
  "en/app/projects/prj_saudi_launch"
  "en/app/knowledge/col_launch"
  "en/app/models/mdl_clarity"
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
    value = {'parse': 'error'}
print(value.get(sys.argv[2], 'NA'))
" "$1" "$2"
}

# ---- v11 sentinel: portaled dialog must be a phone bottom sheet ----
# Checks the "خصّص تجربتك" dialog (the v11 regression target) end-to-end.
dialog_check() {
  local theme="$1"
  agent-browser set viewport 375 812 >/dev/null 2>&1
  agent-browser open "$BASE/en/app/home" >/dev/null 2>&1
  agent-browser wait --load networkidle >/dev/null 2>&1
  agent-browser wait 350 >/dev/null 2>&1
  agent-browser find first ".adaptive-personalize" click >/dev/null 2>&1
  agent-browser wait 400 >/dev/null 2>&1
  json=$(agent-browser eval "JSON.stringify({found: !!document.querySelector('.adaptive-dialog'), sheet: (() => { const d = document.querySelector('.adaptive-dialog'); if (!d) return false; const r = d.getBoundingClientRect(); return Math.abs(r.left) < 1 && Math.abs(r.width - window.innerWidth) < 1 && Math.abs(r.bottom - window.innerHeight) < 3; })(), radius: (() => { const d = document.querySelector('.adaptive-dialog'); return d ? getComputedStyle(d).borderRadius : 'n/a'; })(), singleCol: (() => { const g = document.querySelector('.adaptive-dialog__goals'); return g ? getComputedStyle(g).gridTemplateColumns.split(' ').length === 1 : false; })(), pageOverflow: document.documentElement.scrollWidth - window.innerWidth})" 2>/dev/null | grep '^"' | tail -1)

  fd=$(get_metric "$json" found); sh=$(get_metric "$json" sheet)
  ra=$(get_metric "$json" radius); sc=$(get_metric "$json" singleCol)
  po=$(get_metric "$json" pageOverflow)

  ok=1; reason=""
  [ "$fd" != "True" ] && { ok=0; reason="dialog-not-found"; }
  [ "$sh" != "True" ] && { ok=0; reason="$reason not-bottom-sheet"; }
  [ "$ra" != "24px 24px 0px 0px" ] && { ok=0; reason="$reason radius=$ra"; }
  [ "$sc" != "True" ] && { ok=0; reason="$reason goals-not-single-col"; }
  [ "$po" != "0" ] && { ok=0; reason="$reason page-overflow=$po"; }

  if [ $ok -eq 1 ]; then PASS=$((PASS+1)); else FAIL=$((FAIL+1)); FAILED_LIST="${FAILED_LIST}\n  [$theme/dialog] home → $reason"; fi
  # close dialog for the next iteration
  agent-browser press Escape >/dev/null 2>&1
}

for THEME in ${THEMES:-light dark}; do
  # Pin the theme BEFORE any route load (next-themes reads localStorage first paint)
  agent-browser open "$BASE/ar" >/dev/null 2>&1
  agent-browser wait 600 >/dev/null 2>&1
  agent-browser storage local set theme "$THEME" >/dev/null 2>&1
  for vp in mobile tablet desktop; do
    w=${VP[$vp]%x*}; h=${VP[$vp]#*x}
    agent-browser set viewport "$w" "$h" >/dev/null
    for route in "${ROUTES[@]}"; do
      agent-browser open "$BASE/$route" >/dev/null 2>&1
      agent-browser wait --load networkidle >/dev/null 2>&1
      agent-browser wait 350 >/dev/null 2>&1
      json=$(agent-browser eval "JSON.stringify({overflow: document.documentElement.scrollWidth - window.innerWidth, mode: (document.querySelector('.universal-app-shell')||{}).getAttribute ? document.querySelector('.universal-app-shell').getAttribute('data-sidebar') : 'none', themeAttr: document.documentElement.getAttribute('data-theme'), overlap: (() => { const t = document.querySelector('.universal-shell-mobile-nav'); if (!t) return false; const tb = t.getBoundingClientRect(); for (const el of document.querySelectorAll('.u-feedback-toast, .demo-toast, .u2-overlay__content, .form-dialog')) { const r = el.getBoundingClientRect(); if (r.height > 0 && r.bottom > tb.top + 4 && r.top < tb.bottom - 4) return true; } return false; })(), squeezed: (() => { const s = document.querySelector('.builder-shell, .flow-editor-shell'); if (!s) return false; const cs = getComputedStyle(s); if (cs.display.includes('grid')) { const cols = cs.gridTemplateColumns.split(' ').filter(c => c !== '0px'); const vw = window.innerWidth; const minWidth = cols.reduce((a, c) => a + (parseFloat(c) || 0), 0); return cols.length >= 3 && minWidth > vw; } return false; })()})" 2>/dev/null | grep '^"' | tail -1)

      ov=$(get_metric "$json" overflow)
      md=$(get_metric "$json" mode)
      th=$(get_metric "$json" themeAttr)
      ol=$(get_metric "$json" overlap)
      sq=$(get_metric "$json" squeezed)

      ok=1; reason=""
      [ "$ov" != "0" ] && { ok=0; reason="overflow=$ov"; }
      [ "$md" != "${MODE[$vp]}" ] && { ok=0; reason="$reason mode=$md(want ${MODE[$vp]})"; }
      [ "$th" != "$THEME" ] && { ok=0; reason="$reason theme=$th(want $THEME)"; }
      [ "$ol" = "True" ] && { ok=0; reason="$reason overlap"; }
      [ "$sq" = "True" ] && { ok=0; reason="$reason squeezed-desktop-grid"; }

      if [ $ok -eq 1 ]; then PASS=$((PASS+1)); else FAIL=$((FAIL+1)); FAILED_LIST="${FAILED_LIST}\n  [$THEME/$vp] $route → $reason"; fi
    done
    echo "[$THEME/$vp] running total: $PASS pass / $FAIL fail"
  done
  # v11 dialog sentinel (once per theme, at phone size)
  dialog_check "$THEME"
  echo "[$THEME/dialog] running total: $PASS pass / $FAIL fail"
done

TOTAL=$((PASS+FAIL))
echo "==================== SWEEP v11 RESULT ===================="
echo "routes: ${#ROUTES[@]} × 3 viewports × 2 themes + 2 dialog sentinels = $TOTAL checks"
echo "PASS: $PASS / $TOTAL"
[ -n "$FAILED_LIST" ] && echo -e "FAILED:$FAILED_LIST"
[ $FAIL -eq 0 ] && echo "ALL GREEN"
exit $([ $FAIL -eq 0 ] && echo 0 || echo 1)
