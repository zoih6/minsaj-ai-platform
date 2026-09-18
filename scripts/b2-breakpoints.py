#!/usr/bin/env python3
"""B2: Breakpoint unification.
- ops-page container ladder: 1120/980/840 merge into 1040/880 (4 documented bands: 1040/880/640/430)
- nq-flow: 560/720/900 merge into 640/880
- service-space: 900 -> 880
- preview/viewport: 1120->1180, 680->640, 620->640, 840(mobile-nav)->768
- motion: 820(shell transition)->768, 600(dialog sheet anim)->640 (aligns with sheet geometry = real fix)
- marketing: 600->640, 380->430
- 100vh -> +100dvh pair (6 sites)
Report every change; nothing silent."""
from pathlib import Path
from collections import Counter

ROOT = Path("/home/z/my-project")
report = Counter()

# (file, old, new, count_expected_note)
CHANGES = [
    # ---- ops-page ladder consolidation ----
    ("src/app/globals.css", "@container ops-page (max-width: 1120px) {", "@container ops-page (max-width: 1040px) {"),
    ("src/app/globals.css", "@container ops-page (max-width: 980px) {", "@container ops-page (max-width: 1040px) {"),
    ("src/app/globals.css", "@container ops-page (max-width: 840px) {", "@container ops-page (max-width: 880px) {"),
    # ---- nq-flow consolidation ----
    ("src/app/styles/universal/workbench.css", "@container nq-flow (max-width: 560px) {", "@container nq-flow (max-width: 640px) {"),
    ("src/app/styles/universal/workbench.css", "@container nq-flow (max-width: 720px) {", "@container nq-flow (max-width: 640px) {"),
    ("src/app/styles/universal/workbench.css", "@container nq-flow (max-width: 900px) {", "@container nq-flow (max-width: 880px) {"),
    # ---- service-space ----
    ("src/app/styles/universal/workspaces.css", "@container service-space (max-width: 900px) {", "@container service-space (max-width: 880px) {"),
    # ---- preview/viewport drift in globals ----
    ("src/app/globals.css", "@media (max-width: 1120px) {\n  .preview-hero", "@media (max-width: 1180px) {\n  .preview-hero"),
    ("src/app/globals.css", "@media (max-width: 1120px) {\n  .workbench", "@media (max-width: 1180px) {\n  .workbench"),
    ("src/app/globals.css", "@media (max-width: 840px) {\n  .mobile-nav", "@media (max-width: 768px) {\n  .mobile-nav"),
    ("src/app/globals.css", "@media (max-width: 680px) {", "@media (max-width: 640px) {"),
    ("src/app/globals.css", "@media (max-width: 620px) {", "@media (max-width: 640px) {"),
    # ---- motion: shell transition boundary + dialog sheet animation aligns geometry ----
    ("src/app/styles/universal/motion.css", "@media (max-width: 820px) {\n  .universal-shell-sidebar", "@media (max-width: 768px) {\n  .universal-shell-sidebar"),
    ("src/app/styles/universal/motion.css", "@media (max-width: 600px) {", "@media (max-width: 640px) {"),
    # ---- marketing ladder alignment ----
    ("src/app/styles/universal/responsive.css", "@media (max-width: 600px) {", "@media (max-width: 640px) {"),
    ("src/app/styles/universal/responsive.css", "@media (max-width: 380px) {", "@media (max-width: 430px) {"),
    # ---- 100vh -> paired dvh ----
    ("src/app/globals.css", ".route-loading { min-height: 100vh;", ".route-loading { min-height: 100vh; min-height: 100dvh;"),
    ("src/app/globals.css", ".chat-start { min-height: calc(100vh - 162px);", ".chat-start { min-height: calc(100vh - 162px); min-height: calc(100dvh - 162px);"),
    ("src/app/globals.css", ".conversation-demo { width: min(920px,100%); min-height: calc(100vh - 150px);", ".conversation-demo { width: min(920px,100%); min-height: calc(100vh - 150px); min-height: calc(100dvh - 150px);"),
    ("src/app/globals.css", ".builder-shell { display: grid; grid-template-columns: 194px minmax(420px,1fr) 260px; min-height: calc(100vh - 119px); }", ".builder-shell { display: grid; grid-template-columns: 194px minmax(420px,1fr) 260px; min-height: calc(100vh - 119px); min-height: calc(100dvh - 119px); }"),
    ("src/app/globals.css", ".flow-editor-shell { display: grid; grid-template-columns: 196px minmax(0,1fr) 258px; height: calc(100vh - 119px); min-height: 620px; }", ".flow-editor-shell { display: grid; grid-template-columns: 196px minmax(0,1fr) 258px; height: calc(100vh - 119px); height: calc(100dvh - 119px); min-height: 620px; }"),
]

# product-preview-page min-height 100vh (line 176 block)
for rel in ["src/app/globals.css"]:
    p = ROOT / rel
    t = p.read_text(encoding="utf-8")
    old = """.product-preview-page {
  min-height: 100vh;"""
    new = """.product-preview-page {
  min-height: 100vh;
  min-height: 100dvh;"""
    if old in t:
        t = t.replace(old, new)
        report[f"{rel}: product-preview-page +100dvh"] = 1
    p.write_text(t, encoding="utf-8")

for rel, old, new in CHANGES:
    p = ROOT / rel
    if not p.exists():
        print(f"  !! missing file {rel}")
        continue
    t = p.read_text(encoding="utf-8")
    c = t.count(old)
    if c == 0:
        print(f"  !! NOT FOUND in {rel}: {old[:70]}")
        continue
    t = t.replace(old, new)
    p.write_text(t, encoding="utf-8")
    report[f"{rel.split('/')[-1]}: {old[:44]} -> {new[13:57] if 'container' in new else new[:44]}"] = c

print()
for k, v in sorted(report.items()):
    print(f"  {v} × {k}")
print(f"\nTOTAL: {sum(report.values())} changes")
