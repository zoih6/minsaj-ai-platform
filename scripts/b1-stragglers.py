#!/usr/bin/env python3
"""B1 straggler pass: premium-layer gradients + badges + compare-dock."""
from pathlib import Path
from collections import Counter

ROOT = Path("/home/z/my-project")
report = Counter()

PAIRS = [
    ("src/app/globals.css", [
        ("border: 1px solid #d4d1ff", "border: 1px solid var(--u-primary-soft-line)"),
        ("color: #a8c1b6", "color: var(--u-shell-icon)"),
        ("color: #d9e7e1", "color: var(--u-shell-ink-soft)"),
        ("background: linear-gradient(135deg, #6d5ff2, #5143e2 60%, #4a3cd8)", "background: var(--u-primary-grad)"),
        ("background: linear-gradient(135deg, #6d5ff2, #5a4ce6 60%, #5242e0)", "background: var(--u-primary-grad-strong)"),
        ("background: linear-gradient(135deg, #e14b52, var(--u-danger))", "background: var(--u-danger-grad)"),
        ("background: linear-gradient(135deg, #e75a60, #dc4048)", "background: var(--u-danger-grad-strong)"),
        ("color: #0b6c8c", "color: var(--u-cyan-ink)"),
        ("border-color: #c4e8d5", "border-color: var(--u-mint-soft-line)"),
        ("color: #b52f37", "color: var(--u-danger-ink)"),
    ]),
]

for rel, pairs in PAIRS:
    p = ROOT / rel
    t = p.read_text(encoding="utf-8")
    for old, new in pairs:
        c = t.count(old)
        if c:
            report[f"{old[:56]}"] = c
            t = t.replace(old, new)
        else:
            print(f"  !! not found: {old[:70]}")
    p.write_text(t, encoding="utf-8")

for k, v in report.items():
    print(f"  {v} × {k}")
print(f"TOTAL: {sum(report.values())}")
