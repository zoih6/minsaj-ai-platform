#!/usr/bin/env bash
# Measure the 4 editor/builder routes for layout health at given viewport.
# Usage: measure-editors.sh <width> <height> [label]
set -u
BASE="http://localhost:3000"
W="${1:-375}"; H="${2:-812}"; LABEL="${3:-shot}"
ROUTES=(
  "ar/app/agents"
  "ar/app/agents/new"
  "ar/app/agents/agt_market_researcher/edit"
  "ar/app/flows"
  "ar/app/flows/new"
  "ar/app/flows/flw_weekly_watch/edit"
)
agent-browser open "$BASE/ar" >/dev/null 2>&1
agent-browser wait 600 >/dev/null 2>&1
agent-browser set viewport "$W" "$H" >/dev/null
for route in "${ROUTES[@]}"; do
  agent-browser open "$BASE/$route" >/dev/null 2>&1
  agent-browser wait --load networkidle >/dev/null 2>&1
  agent-browser wait 400 >/dev/null 2>&1
  json=$(agent-browser eval "JSON.stringify({
    overflow: document.documentElement.scrollWidth - window.innerWidth,
    shellDisplay: (() => { const s = document.querySelector('.builder-shell, .flow-editor-shell'); if (!s) return 'none'; return getComputedStyle(s).display + '/' + getComputedStyle(s).gridTemplateColumns.split(' ').length + 'col'; })(),
    shellCols: (() => { const s = document.querySelector('.builder-shell, .flow-editor-shell'); return s ? getComputedStyle(s).gridTemplateColumns : 'none'; })(),
    containerCtx: (() => { let el = document.querySelector('.builder-page, .flow-editor-page'); return el ? getComputedStyle(el).containerName : 'no-page'; })()
  })" 2>/dev/null | grep '^"' | tail -1)
  echo "[$LABEL ${W}x${H}] $route => $json"
done
