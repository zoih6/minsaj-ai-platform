#!/usr/bin/env bash
# verify-sweep-v12.sh — control-bar-aware responsive regression sweep.
# Inherits ALL v11 sentinels (30 routes × 3 viewports × 2 themes + dialog
# bottom-sheet geometry):
#   - zero horizontal overflow, correct sidebar mode, theme attr applied
#   - no portalled overlap with mobile nav, no squeezed desktop grids
#   - portalled dialog opens as a full-width bottom sheet on phones
# NEW v12 sentinel — the "scattered control group" regression (owner report
# 2026-09-17: goals bar / filter toolbars shattering into stranded rows on
# phones). At phone size, on the two densest control-bar surfaces:
#   - every .mj-control-bar__group renders its chips on ONE row (no wrap pile)
#   - every .mj-control-bar is at most two composed rows (≤ 100px)
#   - every .mj-chip honors the 44px touch floor
# NEW v12.1 sentinel — the "distorted logo" regression (owner report
# 2026-09-18: header symbol squashed/stretched vs the official artwork).
# On the marketing header + app sidebar, at phone AND desktop size:
#   - every .minsaj-mark renders at the master's intrinsic 534/396 ratio (±2%)
#   - the mark fits inside its square wrapper (no overflow bleeding into chrome)
# NEW v12.2 sentinel — the "messed-up mobile header" regression (owner report
# 2026-09-19: home-page top bar ملخبط on phones — the v18 rewrite dropped the
# header-collapse rules, so five inline links overflowed off-screen while the
# hamburger stayed display:none). On the marketing page, per locale and band:
#   - ≤1180px: inline links hidden, hamburger visible at ≥44px touch size
#   - ≥1200px: inline links visible, hamburger hidden
#   - every rendered header control stays on-screen; nav stays one row (≤70px)
#   - mobile sheet menu carries every inline section link (menu parity)
# Usage: BASE=http://localhost:PORT bash scripts/verify-sweep-v12.sh
set -u
BASE="${BASE:-http://localhost:3000}"
ROUTES=(
  "ar/app/home" "ar/app/chat" "ar/app/projects" "ar/app/runs" "ar/app/library"
  "ar/app/learn" "ar/app/research" "ar/app/create" "ar/app/code" "ar/app/analyze" "ar/app/explore"
  "ar/app/agents" "ar/app/flows" "ar/app/knowledge" "ar/app/models" "ar/app/models/routing"
  "ar/app/skills" "ar/app/tools" "ar/app/settings" "ar/app/team" "ar/app/billing" "ar/app/usage"
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
    value = {'parse': 'error'}
print(value.get(sys.argv[2], 'NA'))
" "$1" "$2"
}

# ---- v11 sentinel: portaled dialog must be a phone bottom sheet ----
# Checks the "خصّص تجربتك" dialog (the v11 regression target) end-to-end.
dialog_check() {
  local theme="$1"
  agent-browser set viewport 375 812 >/dev/null 2>&1
  agent-browser open "$BASE/ar/app/home" >/dev/null 2>&1
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

# ---- v12 sentinel: control bars must not shatter on phones ----
# Goals bar (label + pills + tail) and the ops toolbar (6 filter chips) are
# the densest instances of the mj-control-bar primitive.
controlbar_check() {
  local theme="$1"
  agent-browser set viewport 375 812 >/dev/null 2>&1
  local route
  for route in "ar/app/home" "ar/app/runs"; do
    agent-browser open "$BASE/$route" >/dev/null 2>&1
    agent-browser wait --load networkidle >/dev/null 2>&1
    agent-browser wait 350 >/dev/null 2>&1
    json=$(agent-browser eval "JSON.stringify({
      bars: document.querySelectorAll('.mj-control-bar').length,
      chips: document.querySelectorAll('.mj-chip').length,
      groupSingleRow: (() => {
        for (const g of document.querySelectorAll('.mj-control-bar__group')) {
          const kids = [...g.children].filter(c => { const r = c.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
          if (!kids.length) continue;
          const first = kids[0].getBoundingClientRect();
          for (const k of kids) {
            const r = k.getBoundingClientRect();
            if (Math.abs((first.y + first.height/2) - (r.y + r.height/2)) > 2) return false;
          }
        }
        return true;
      })(),
      barHeightOk: (() => {
        for (const bar of document.querySelectorAll('.mj-control-bar')) {
          if (bar.getBoundingClientRect().height > 100) return false;
        }
        return true;
      })(),
      chipTouchOk: (() => {
        for (const c of document.querySelectorAll('.mj-chip')) {
          if (c.getBoundingClientRect().height < 43.5) return false;
        }
        return true;
      })(),
      pageOverflow: document.documentElement.scrollWidth - window.innerWidth
    })" 2>/dev/null | grep '^"' | tail -1)

    ba=$(get_metric "$json" bars); ch=$(get_metric "$json" chips)
    sr=$(get_metric "$json" groupSingleRow); bh=$(get_metric "$json" barHeightOk)
    ct=$(get_metric "$json" chipTouchOk); po=$(get_metric "$json" pageOverflow)

    ok=1; reason=""
    [ "$ba" = "0" ] && { ok=0; reason="no-control-bar-found"; }
    [ "$ch" = "0" ] && { ok=0; reason="$reason no-chips-found"; }
    [ "$sr" != "True" ] && { ok=0; reason="$reason group-not-single-row"; }
    [ "$bh" != "True" ] && { ok=0; reason="$reason bar-over-100px"; }
    [ "$ct" != "True" ] && { ok=0; reason="$reason chip-under-44px"; }
    [ "$po" != "0" ] && { ok=0; reason="$reason page-overflow=$po"; }

    if [ $ok -eq 1 ]; then PASS=$((PASS+1)); else FAIL=$((FAIL+1)); FAILED_LIST="${FAILED_LIST}\n  [$theme/controlbar] $route → $reason"; fi
  done
}

# ---- v12.1 sentinel: the official logo must never distort ----
# MinsajMark paints the owner's 534×396 master via background-size 100% 100%,
# so the BOX ratio IS the rendered artwork ratio. Guard both surfaces where
# the mark lives (marketing header, app sidebar) at phone + desktop widths.
logo_check() {
  local theme="$1"
  local combo route vw
  for combo in "ar 375" "ar/app/home 375" "ar 1440" "ar/app/home 1440"; do
    set -- $combo; route="$1"; vw="$2"
    agent-browser set viewport "$vw" 900 >/dev/null 2>&1
    agent-browser open "$BASE/$route" >/dev/null 2>&1
    agent-browser wait --load networkidle >/dev/null 2>&1
    agent-browser wait 350 >/dev/null 2>&1
    json=$(agent-browser eval "JSON.stringify({
      marks: document.querySelectorAll('.minsaj-mark').length,
      ratioOk: (() => {
        for (const m of document.querySelectorAll('.minsaj-mark')) {
          const r = m.getBoundingClientRect();
          if (r.width < 1 || r.height < 1) continue;
          if (Math.abs(r.width / r.height - 534 / 396) / (534 / 396) > 0.02) return false;
        }
        return true;
      })(),
      wrapperFitOk: (() => {
        const sel = '.luma-brand__mark > .minsaj-mark, .universal-shell-brand > span > .minsaj-mark';
        for (const m of document.querySelectorAll(sel)) {
          const wrap = m.parentElement;
          const r = m.getBoundingClientRect();
          const w = wrap.getBoundingClientRect();
          if (w.width < 1) continue;
          if (r.left < w.left - 1 || r.right > w.right + 1 || r.top < w.top - 1 || r.bottom > w.bottom + 1) return false;
        }
        return true;
      })(),
      pageOverflow: document.documentElement.scrollWidth - window.innerWidth
    })" 2>/dev/null | grep '^"' | tail -1)

    mk=$(get_metric "$json" marks); ro=$(get_metric "$json" ratioOk)
    wf=$(get_metric "$json" wrapperFitOk); po=$(get_metric "$json" pageOverflow)

    ok=1; reason=""
    [ "$mk" = "0" ] && { ok=0; reason="no-minsaj-mark-found"; }
    [ "$ro" != "True" ] && { ok=0; reason="$reason ratio-off-534x396"; }
    [ "$wf" != "True" ] && { ok=0; reason="$reason mark-overflows-wrapper"; }
    [ "$po" != "0" ] && { ok=0; reason="$reason page-overflow=$po"; }

    if [ $ok -eq 1 ]; then PASS=$((PASS+1)); else FAIL=$((FAIL+1)); FAILED_LIST="${FAILED_LIST}\n  [$theme/logo] $route@${vw}w → $reason"; fi
  done
}

# ---- v12.2 sentinel: the marketing header must collapse on narrow ports ----
marketing_header_check() {
  local theme="$1"
  local combo route vw want
  for combo in "ar 375 collapsed" "en 375 collapsed" "ar 768 collapsed" "en 768 collapsed" "ar 1440 expanded"; do
    set -- $combo; route="$1"; vw="$2"; want="$3"
    agent-browser set viewport "$vw" 900 >/dev/null 2>&1
    agent-browser open "$BASE/$route" >/dev/null 2>&1
    agent-browser wait --load networkidle >/dev/null 2>&1
    agent-browser wait 350 >/dev/null 2>&1
    json=$(agent-browser eval "JSON.stringify({
      nav: !!document.querySelector('.universal-nav'),
      linksDisp: (() => { const l = document.querySelector('.universal-nav__links'); return l ? getComputedStyle(l).display : 'missing'; })(),
      burgerDisp: (() => { const b = document.querySelector('.universal-menu-button'); return b ? getComputedStyle(b).display : 'missing'; })(),
      burgerW: (() => { const b = document.querySelector('.universal-menu-button'); return b ? Math.round(b.getBoundingClientRect().width) : 0; })(),
      navH: (() => { const n = document.querySelector('.universal-nav'); return n ? Math.round(n.getBoundingClientRect().height) : 999; })(),
      chromeOnScreen: (() => {
        const nav = document.querySelector('.universal-nav');
        if (!nav) return false;
        const els = [nav.querySelector('.luma-brand'), nav.querySelector('.luma-locale'), nav.querySelector('.universal-menu-button'), ...nav.querySelectorAll('.universal-nav__links a')];
        for (const el of els) {
          if (!el || getComputedStyle(el).display === 'none') continue;
          const b = el.getBoundingClientRect();
          if (b.width < 1 && b.height < 1) continue;
          if (b.x < -1 || b.right > window.innerWidth + 1) return false;
        }
        return true;
      })(),
      pageOverflow: document.documentElement.scrollWidth - window.innerWidth
    })" 2>/dev/null | grep '^"' | tail -1)

    nv=$(get_metric "$json" nav); ld=$(get_metric "$json" linksDisp)
    bd=$(get_metric "$json" burgerDisp); bw=$(get_metric "$json" burgerW)
    nh=$(get_metric "$json" navH); co=$(get_metric "$json" chromeOnScreen)
    po=$(get_metric "$json" pageOverflow)

    ok=1; reason=""
    [ "$nv" != "True" ] && { ok=0; reason="no-marketing-nav"; }
    if [ "$want" = "collapsed" ]; then
      [ "$ld" = "flex" ] && { ok=0; reason="$reason links-visible-should-collapse"; }
      { [ "$bd" != "grid" ] && [ "$bd" != "flex" ]; } && { ok=0; reason="$reason burger-hidden=$bd"; }
      [ "$bw" -lt 43 ] 2>/dev/null && { ok=0; reason="$reason burger-under-44px=$bw"; }
    else
      [ "$ld" != "flex" ] && { ok=0; reason="$reason links-hidden-should-expand=$ld"; }
      [ "$bd" != "none" ] && { ok=0; reason="$reason burger-visible-should-hide=$bd"; }
    fi
    [ "$nh" -gt 70 ] 2>/dev/null && { ok=0; reason="$reason nav-height=$nh"; }
    [ "$co" != "True" ] && { ok=0; reason="$reason header-chrome-off-screen"; }
    [ "$po" != "0" ] && { ok=0; reason="$reason page-overflow=$po"; }

    if [ $ok -eq 1 ]; then PASS=$((PASS+1)); else FAIL=$((FAIL+1)); FAILED_LIST="${FAILED_LIST}\n  [$theme/mktheader] $route@${vw}w/$want → $reason"; fi
  done

  # menu-parity probe: the sheet menu must carry every inline section link
  agent-browser set viewport 375 812 >/dev/null 2>&1
  agent-browser open "$BASE/ar" >/dev/null 2>&1
  agent-browser wait --load networkidle >/dev/null 2>&1
  agent-browser wait 350 >/dev/null 2>&1
  agent-browser eval "document.querySelector('.universal-menu-button') && document.querySelector('.universal-menu-button').click(); 'ok'" >/dev/null 2>&1
  agent-browser wait 450 >/dev/null 2>&1
  json=$(agent-browser eval "JSON.stringify({
    parity: (() => {
      const menu = document.querySelector('.universal-mobile-menu');
      const inline = document.querySelector('.universal-nav__links');
      if (!menu || !inline) return false;
      const m = [...menu.querySelectorAll('a')].map(a => a.getAttribute('href'));
      return [...inline.querySelectorAll('a')].map(a => a.getAttribute('href')).every(h => m.includes(h));
    })(),
    menuInViewport: (() => {
      const menu = document.querySelector('.universal-mobile-menu');
      if (!menu) return false;
      const b = menu.getBoundingClientRect();
      return b.height > 10 && b.x >= 0 && b.right <= window.innerWidth;
    })()
  })" 2>/dev/null | grep '^"' | tail -1)

  pa=$(get_metric "$json" parity); mv=$(get_metric "$json" menuInViewport)

  ok=1; reason=""
  [ "$pa" != "True" ] && { ok=0; reason="sheet-menu-missing-inline-links"; }
  [ "$mv" != "True" ] && { ok=0; reason="$reason sheet-menu-not-in-viewport"; }

  if [ $ok -eq 1 ]; then PASS=$((PASS+1)); else FAIL=$((FAIL+1)); FAILED_LIST="${FAILED_LIST}\n  [$theme/mktmenu] parity → $reason"; fi
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
  # v12 control-bar sentinel (once per theme, at phone size)
  controlbar_check "$THEME"
  echo "[$THEME/controlbar] running total: $PASS pass / $FAIL fail"
  # v12.1 logo-ratio sentinel (once per theme, phone + desktop, header + sidebar)
  logo_check "$THEME"
  echo "[$THEME/logo] running total: $PASS pass / $FAIL fail"
  # v12.2 marketing-header collapse sentinel (phone + tablet + desktop, both
  # directions, plus the sheet-menu parity probe)
  marketing_header_check "$THEME"
  echo "[$THEME/mktheader] running total: $PASS pass / $FAIL fail"
done

TOTAL=$((PASS+FAIL))
echo "==================== SWEEP v12 RESULT ===================="
echo "routes: ${#ROUTES[@]} × 3 viewports × 2 themes + 2 dialog + 4 controlbar + 8 logo + 12 marketing-header sentinels = $TOTAL checks"
echo "PASS: $PASS / $TOTAL"
[ -n "$FAILED_LIST" ] && echo -e "FAILED:$FAILED_LIST"
[ $FAIL -eq 0 ] && echo "ALL GREEN"
exit $([ $FAIL -eq 0 ] && echo 0 || echo 1)
