#!/usr/bin/env python3
"""B1 last pass: shell stragglers + globals micro-remaining."""
from pathlib import Path
from collections import Counter

ROOT = Path("/home/z/my-project")
report = Counter()

MAPS = {
    "src/app/styles/universal/shell.css": [
        ("linear-gradient(180deg, #10132a 0%, #0d1020 60%, #0b0e1c 100%)", "var(--u-shell-grad-bg)"),
        ("color: #f0f1fa", "color: var(--u-shell-ink)"),
        ("color: #e9eaf6", "color: var(--u-shell-ink)"),
        ("background: #e75f9d", "background: var(--u-shell-alert)"),
        ("background: #edeff7", "background: var(--u-shell-hover)"),
        ("background: #e4f6ef", "background: var(--u-mint-soft)"),
        ("background: #e8e9f2", "background: var(--u-shell-hover)"),
    ],
    "src/app/globals.css": [
        ("--mark-line-one: #c8c3ff; --mark-line-two: #d58b43;", "--mark-line-one: #a8efff; --mark-line-two: #ffd2e8;"),
        ("background: linear-gradient(180deg, #262a4e, var(--u-shell-bg-2))", "background: var(--u-ink-grad)"),
        ("background: linear-gradient(180deg, #2e3358, #1a1e39)", "background: var(--u-ink-grad-hover)"),
        ("border-color: #bfc2d9", "border-color: var(--u-line-strong)"),
        ("background: linear-gradient(135deg, #6d5ff2, #5143e2)", "background: var(--u-primary-grad)"),
        ("border-color: #c9c6ef !important", "border-color: var(--u-primary-soft-line) !important"),
        ("background: #cfd2e8", "background: var(--u-line-strong)"),
        ("background: #edecfb", "background: var(--u-primary-soft)"),
        ("border: 1px solid #dedbf8", "border: 1px solid var(--u-primary-soft-line)"),
    ],
}

for rel, pairs in MAPS.items():
    p = ROOT / rel
    t = p.read_text(encoding="utf-8")
    for old, new in pairs:
        c = t.count(old)
        if c:
            report[f"{rel.split('/')[-1]}: {old[:48]}"] = c
            t = t.replace(old, new)
        else:
            print(f"  !! not found in {rel}: {old[:64]}")
    p.write_text(t, encoding="utf-8")

for k, v in report.items():
    print(f"  {v} × {k}")
print(f"TOTAL: {sum(report.values())}")
