#!/usr/bin/env python3
"""B1 final sweep: remaining hardcodes -> tokens across all files."""
from pathlib import Path
from collections import Counter

ROOT = Path("/home/z/my-project")
report = Counter()

MAPS = {
    "src/app/globals.css": [
        ("color: #0b6b4e", "color: var(--u-mint-ink)"),
        ("color: #714217", "color: var(--u-amber-ink)"),
        ("color: #812d29", "color: var(--u-danger-ink)"),
        ("background: #e4e9e5", "background: var(--u-line)"),
        ("background: #e5e8e6", "background: var(--u-line)"),
        ("background: #e7e9e7", "background: var(--u-line)"),
        ("background-color: #f6f6f2", "background-color: var(--u-bg-deep)"),
        ("stroke: #97aaa0", "stroke: var(--u-line-strong)"),
        ("border-color: #dfb888", "border-color: var(--u-amber-line-strong)"),
        ("border-color: #d4d1ff", "border-color: var(--u-primary-soft-line)"),
        ("background: linear-gradient(90deg, #6d5ff2, #5143e2)", "background: var(--u-primary)"),
    ],
    "src/app/styles/universal/workbench.css": [
        ("background: linear-gradient(145deg, #f8f8fd, #f4f5fb)", "background: var(--u-surface-subtle)"),
        ("border-color: #c4c7dd", "border-color: var(--u-line-strong)"),
        ("color: #0d9463", "color: var(--u-mint)"),
        ("background: linear-gradient(135deg, #6d5ff2, #5143e2 60%, #4a3cd8) !important", "background: var(--u-primary-grad) !important"),
        ("border-color: #bfc2d9", "border-color: var(--u-line-strong)"),
        ("border-color: #c9c6e0", "border-color: var(--u-line-strong)"),
    ],
    "src/app/styles/universal/home.css": [
        ("background: #a6a7b7", "background: var(--u-line-strong)"),
        ("color: #9a9cb0", "color: var(--u-faint)"),
        ("border-color: #d2d3e4", "border-color: var(--u-line-strong)"),
        ("color: #078ebd", "color: var(--u-cover-2-ink)"),
    ],
    "src/app/styles/universal/marketing.css": [
        ("border: 1px solid #dad7ff", "border: 1px solid var(--u-primary-soft-line)"),
        ("background: #eaf8f3", "background: var(--u-mint-soft)"),
    ],
    "src/app/styles/universal/motion.css": [
        # feedback state accents: theme-aware strong hues (dual role: text + action bg)
        ("--u-feedback-accent: #b63d54; --u-feedback-soft: #fff0f3;", "--u-feedback-accent: var(--u-danger); --u-feedback-soft: var(--u-danger-soft);"),
        ("--u-feedback-accent: #13785b; --u-feedback-soft: #e9f8f2;", "--u-feedback-accent: var(--u-mint); --u-feedback-soft: var(--u-mint-soft);"),
        ("border-color: #b63d54", "border-color: var(--u-danger)"),
        ("border: 1px solid #bfe0d3", "border: 1px solid var(--u-mint-soft-line)"),
        ("color: #11684f", "color: var(--u-mint-ink)"),
        ("border-color: #d4d0ff", "border-color: var(--u-primary-soft-line)"),
        ("background: rgba(250,249,255,.98)", "background: var(--u-glass-strong)"),
    ],
}

for rel, pairs in MAPS.items():
    p = ROOT / rel
    t = p.read_text(encoding="utf-8")
    for old, new in pairs:
        c = t.count(old)
        if c:
            report[f"{rel.split('/')[-1]}: {old[:52]}"] = c
            t = t.replace(old, new)
        else:
            print(f"  !! not found in {rel}: {old[:60]}")
    p.write_text(t, encoding="utf-8")

print()
for k, v in sorted(report.items()):
    print(f"  {v:3d} × {k}")
print(f"TOTAL: {sum(report.values())}")
