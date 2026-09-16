#!/usr/bin/env bash
# Interaction tests on the fixed editor pages at mobile 375px.
set -u
BASE="http://localhost:3000"
agent-browser open "$BASE/ar" >/dev/null 2>&1
agent-browser wait 500 >/dev/null 2>&1
agent-browser set viewport 375 812 >/dev/null

echo "== 1. Agent builder: step navigation =="
agent-browser open "$BASE/ar/app/agents/agt_market_researcher/edit" >/dev/null 2>&1
agent-browser wait --load networkidle >/dev/null 2>&1; agent-browser wait 500 >/dev/null 2>&1
agent-browser eval "
(() => {
  const results = {};
  const stepsNav = document.querySelector('.builder-steps nav');
  results.stepButtonsVisible = stepsNav ? getComputedStyle(stepsNav).display : 'missing';
  // click step 4 (tools)
  const btns = stepsNav ? stepsNav.querySelectorAll('button') : [];
  if (btns[3]) btns[3].click();
  return 'nav=' + results.stepButtonsVisible + ' btns=' + btns.length;
})()" 2>/dev/null | tail -1
agent-browser wait 400 >/dev/null 2>&1
agent-browser eval "
(() => {
  const heading = document.querySelector('.builder-section__heading h2');
  const overflow = document.documentElement.scrollWidth - window.innerWidth;
  const active = document.querySelector('.builder-steps nav button.is-active');
  return JSON.stringify({heading: heading ? heading.textContent.slice(0,40) : 'none', overflow, activeStep: active ? active.textContent.trim() : 'none'});
})()" 2>/dev/null | grep '^"' | tail -1

echo "== 2. Agent builder: topbar buttons usable =="
agent-browser eval "
(() => {
  const actions = document.querySelectorAll('.builder-topbar__actions .button');
  const rects = [...actions].map(b => { const r = b.getBoundingClientRect(); return Math.round(r.width) + 'x' + Math.round(r.height); });
  const publish = actions[actions.length - 1];
  const usable = publish ? publish.getBoundingClientRect().width >= 40 : false;
  return JSON.stringify({buttons: rects, publishUsable: usable});
})()" 2>/dev/null | grep '^"' | tail -1

echo "== 3. Flow editor: add node + select =="
agent-browser open "$BASE/ar/app/flows/flw_weekly_watch/edit" >/dev/null 2>&1
agent-browser wait --load networkidle >/dev/null 2>&1; agent-browser wait 500 >/dev/null 2>&1
agent-browser eval "
(() => {
  const palette = document.querySelector('.node-palette__list');
  const buttons = palette ? palette.querySelectorAll('button') : [];
  const display = palette ? getComputedStyle(palette).display + '/' + getComputedStyle(palette).gridTemplateColumns.split(' ').length + 'col' : 'missing';
  if (buttons[1]) buttons[1].click(); // add agent node
  return JSON.stringify({paletteDisplay: display, paletteButtons: buttons.length});
})()" 2>/dev/null | grep '^"' | tail -1
agent-browser wait 400 >/dev/null 2>&1
agent-browser eval "
(() => {
  const nodes = document.querySelectorAll('.flow-node');
  const inspector = document.querySelector('.node-inspector');
  const ir = inspector ? inspector.getBoundingClientRect() : null;
  return JSON.stringify({nodeCount: nodes.length, inspectorVisible: ir ? (ir.width > 300 && ir.height > 100) : false, overflow: document.documentElement.scrollWidth - window.innerWidth});
})()" 2>/dev/null | grep '^"' | tail -1

echo "== 4. Flow editor: canvas scrollable (pan) =="
agent-browser eval "
(() => {
  const scroll = document.querySelector('.flow-canvas-scroll');
  return JSON.stringify({scrollable: scroll ? (scroll.scrollWidth > scroll.clientWidth) : 'missing', scrollWidth: scroll ? scroll.scrollWidth : 0, clientWidth: scroll ? scroll.clientWidth : 0});
})()" 2>/dev/null | grep '^"' | tail -1

echo "== 5. DemoToast offset above tab bar (publish toast) =="
agent-browser eval "
(() => {
  const btns = document.querySelectorAll('.builder-topbar__actions .button');
  const publish = btns[btns.length - 1];
  if (publish) publish.click();
  return 'clicked';
})()" 2>/dev/null | tail -1
agent-browser wait 300 >/dev/null 2>&1
agent-browser eval "
(() => {
  const toast = document.querySelector('.demo-toast');
  const tab = document.querySelector('.universal-tab-bar, [data-tabbar]');
  if (!toast) return JSON.stringify({toast: 'not-rendered'});
  const tr = toast.getBoundingClientRect();
  const tb = tab ? tab.getBoundingClientRect() : {top: 9999};
  return JSON.stringify({toastBottom: Math.round(tr.bottom), tabTop: Math.round(tb.top), clear: tr.bottom <= tb.top});
})()" 2>/dev/null | grep '^"' | tail -1
