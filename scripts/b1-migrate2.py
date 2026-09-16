#!/usr/bin/env python3
"""B1 pass 2: workbench status colors + globals leftovers."""
from pathlib import Path
from collections import Counter

ROOT = Path("/home/z/my-project")
report = Counter()

WB_MAP = [
    ("#235c4b", "var(--u-mint-ink)"),
    ("#6d4d10", "var(--u-amber-ink)"),
    ("#8d2f2f", "var(--u-danger-ink)"),
    ("#eaf8f3", "var(--u-mint-soft)"),
    ("rgba(32, 191, 143, .35)", "var(--u-mint-soft-line)"),
    ("rgba(32, 191, 143, .4)", "var(--u-mint-soft-line)"),
    ("rgba(32, 191, 143, .45)", "var(--u-mint-soft-line)"),
    ("rgba(32, 191, 143, .55)", "var(--u-mint-soft-line)"),
    ("rgba(197, 74, 74, .35)", "var(--u-danger-soft-line)"),
    ("rgba(197, 74, 74, .4)", "var(--u-danger-soft-line)"),
    ("rgba(197, 74, 74, .5)", "var(--u-danger-soft-line)"),
    ("rgba(197, 74, 74, .55)", "var(--u-danger-soft-line)"),
    ("rgba(214, 158, 46, .4)", "var(--u-amber-soft-line)"),
    ("rgba(214, 158, 46, .45)", "var(--u-amber-soft-line)"),
    ("rgba(214, 158, 46, .5)", "var(--u-amber-soft-line)"),
]

GL_MAP = [
    # dead green selection rule -> remove entire rule (foundations owns ::selection)
    ("::selection { background: __DELETE_SELECTION__; color: var(--u-ink); }\n", ""),
    # brief top strip: dark ink border strip (inverse emphasis)
    ("border-block-start: 3px solid var(--forest);", "border-block-start: 3px solid var(--u-ink);"),
]

for rel, pairs in {
    "src/app/styles/universal/workbench.css": WB_MAP,
    "src/app/globals.css": GL_MAP,
}.items():
    p = ROOT / rel
    t = p.read_text(encoding="utf-8")
    for old, new in pairs:
        c = t.count(old)
        if c:
            report[f"{rel}: {old[:44]} -> {new[:44]}"] = c
            t = t.replace(old, new)
    p.write_text(t, encoding="utf-8")

for k, v in report.items():
    print(f"  {v:3d} × {k}")
print(f"TOTAL: {sum(report.values())}")
