#!/usr/bin/env python3
"""B1: Mechanical legacy→unified migration.
Phase A: legacy vars -> --u-* (globals.css, comment-safe)
Phase B: hardcoded colors -> semantic tokens (all files)
Prints a report of replacements + anything left unmapped."""
import re, sys
from pathlib import Path
from collections import Counter

ROOT = Path("/home/z/my-project")

# ---------------- Phase A: legacy var migration (globals.css) ----------------
VAR_MAP = {
    "var(--bg)": "var(--u-bg)",
    "var(--surface-subtle)": "var(--u-surface-subtle)",
    "var(--surface-raised)": "var(--u-surface-solid)",
    "var(--surface)": "var(--u-surface)",
    "var(--text-muted)": "var(--u-muted)",
    "var(--text-faint)": "var(--u-faint)",
    "var(--text)": "var(--u-ink)",
    "var(--border-strong)": "var(--u-line-strong)",
    "var(--border)": "var(--u-line)",
    "var(--teal-subtle)": "var(--u-primary-soft)",
    "var(--teal-hover)": "var(--u-primary-strong)",
    "var(--teal)": "var(--u-primary)",
    "var(--amber-ink)": "var(--u-amber-ink)",
    "var(--amber-subtle)": "var(--u-amber-soft)",
    "var(--amber)": "var(--u-amber)",
    "var(--danger-subtle)": "var(--u-danger-soft)",
    "var(--danger)": "var(--u-danger)",
    "var(--info-subtle)": "var(--u-cyan-soft)",
    "var(--info)": "var(--u-cyan)",
    "var(--success-subtle)": "var(--u-mint-soft)",
    "var(--success)": "var(--u-mint)",
    "var(--focus)": "var(--u-primary)",
    "var(--shadow-1)": "var(--u-shadow-sm)",
    "var(--shadow-2)": "var(--u-shadow-md)",
    "var(--forest-hover)": "var(--u-inverse-surface-hover)",
}

def migrate_vars(text: str):
    n = Counter()
    # comment-aware: split into code/comment segments, only replace in code
    pattern = re.compile(r"(/\*.*?\*/)", re.S)
    segments = pattern.split(text)
    for i, seg in enumerate(segments):
        if i % 2 == 1:
            continue  # comment — leave untouched
        for old, new in VAR_MAP.items():
            cnt = seg.count(old)
            if cnt:
                n[old] += cnt
                seg = seg.replace(old, new)
        segments[i] = seg
    return pattern.subn(lambda m: m.group(0), "".join(segments))[0], n

# --forest needs property context: color -> --u-ink (it is a text token)
def migrate_forest(text: str):
    lines = text.split("\n")
    n_color = n_other = 0
    out = []
    for line in lines:
        if re.search(r"var\(--forest\)", line):
            if re.search(r"(\bcolor|^\s*color)\s*:", line) or "color: var(--forest)" in line:
                line = line.replace("var(--forest)", "var(--u-ink)")
                n_color += 1
            else:
                # non-color usage: inspect below (should be none after P0-1)
                n_other += 1
        out.append(line)
    return "\n".join(out), n_color, n_other

# ---------------- Phase B: hardcoded color -> token ----------------
# (file, find, replace) exact-string pairs
HEX_MAP_GLOBAL = [
    ("#d8d5ff", "var(--u-primary-soft-line)"),
    ("#f0d9b4", "var(--u-amber-soft-line)"),
    ("#cdeadd", "var(--u-mint-soft-line)"),
    ("#c8dfe9", "var(--u-cyan-soft-line)"),
    ("#f2c5c3", "var(--u-danger-soft-line)"),
    ("#dca54e", "var(--u-amber-line-strong)"),
    ("#c39261", "var(--u-amber-line-strong)"),
    ("#8a4d18", "var(--u-amber-ink)"),
    ("#7a4a10", "var(--u-amber-ink)"),
    ("#74491f", "var(--u-amber-ink)"),
    ("#6d4d10", "var(--u-amber-ink)"),
    ("#8c5a12", "var(--u-amber-ink)"),
    ("#8d2f2f", "var(--u-danger-ink)"),
    ("#235c4b", "var(--u-mint-ink)"),
    ("#477063", "var(--u-mint-ink)"),
    ("#39715f", "var(--u-mint-ink)"),
    ("#0d5c72", "var(--u-cyan-ink)"),
    ("#204e5d", "var(--u-cyan-ink)"),
    ("#315f6e", "var(--u-cyan-ink)"),
    ("#eaf8f3", "var(--u-mint-soft)"),
    ("#e4f6ef", "var(--u-mint-soft)"),
    ("#e4f3fa", "var(--u-cyan-soft)"),
    ("#078ebd", "var(--u-cyan)"),
    ("#d7373f", "var(--u-danger)"),
    ("#e9ebf5", "var(--u-line)"),
    ("#e4e6ef", "var(--u-line)"),
    ("#edeff7", "var(--u-shell-hover)"),
    ("#f0f1fa", "var(--u-shell-ink)"),
    ("#e9eaf6", "var(--u-shell-ink)"),
    ("#b8bad6", "var(--u-shell-ink-soft)"),
    ("#14172e", "var(--u-shell-bg-2)"),
    ("#191d38", "var(--u-shell-bg)"),
    ("#bfe3d5", "__DELETE_SELECTION__"),  # old green selection (dead rule)
    ("#e1e6e2", "var(--u-line)"),
    ("#2fd693", "var(--u-shell-online)"),
    ("#e75f9d", "var(--u-shell-alert)"),
    ("#b63d54", "var(--u-danger-ink)"),
    ("#fff0f3", "var(--u-danger-soft)"),
    ("#13785b", "var(--u-mint-ink)"),
    ("#e9f8f2", "var(--u-mint-soft)"),
    ("#bfe0d3", "var(--u-mint-soft-line)"),
    ("#11684f", "var(--u-mint-ink)"),
    ("#d4d0ff", "var(--u-primary-soft-line)"),
    ("#dad7ff", "var(--u-primary-soft-line)"),
    ("#655cf6", "var(--u-primary)"),
    ("#9a9cb0", "var(--u-faint)"),
    ("#d2d3e4", "var(--u-line-strong)"),
    ("#a6a7b7", "var(--u-line-strong)"),
    ("#d8d5ff;", "var(--u-primary-soft-line);"),
]

RGBA_MAP = [
    ("rgba(32,191,143,.35)", "var(--u-mint-soft-line)"),
    ("rgba(32,191,143,.4)", "var(--u-mint-soft-line)"),
    ("rgba(32,191,143,.45)", "var(--u-mint-soft-line)"),
    ("rgba(32,191,143,.55)", "var(--u-mint-soft-line)"),
    ("rgba(32, 191, 143, .35)", "var(--u-mint-soft-line)"),
    ("rgba(32, 191, 143, .4)", "var(--u-mint-soft-line)"),
    ("rgba(32, 191, 143, .45)", "var(--u-mint-soft-line)"),
    ("rgba(32, 191, 143, .55)", "var(--u-mint-soft-line)"),
    ("rgba(197,74,74,.4)", "var(--u-danger-soft-line)"),
    ("rgba(197,74,74,.5)", "var(--u-danger-soft-line)"),
    ("rgba(197,74,74,.55)", "var(--u-danger-soft-line)"),
    ("rgba(197, 74, 74, .4)", "var(--u-danger-soft-line)"),
    ("rgba(197, 74, 74, .5)", "var(--u-danger-soft-line)"),
    ("rgba(197, 74, 74, .55)", "var(--u-danger-soft-line)"),
    ("rgba(214,158,46,.4)", "var(--u-amber-soft-line)"),
    ("rgba(214,158,46,.45)", "var(--u-amber-soft-line)"),
    ("rgba(214, 158, 46, .4)", "var(--u-amber-soft-line)"),
    ("rgba(214, 158, 46, .45)", "var(--u-amber-soft-line)"),
    ("rgba(9,20,15,.54)", "var(--u-scrim)"),
    ("rgba(182,61,84,.08)", "rgba(182,61,84,.08)"),  # keep (shadow halo, near-invisible)
]

GRAD_MAP_GLOBALS = [
    ("linear-gradient(135deg, #6d5ff2, #5143e2 55%, #4a3cd8)", "var(--u-primary-grad)"),
]

# file-specific
WORKBENCH_MAP = [
    ("#f0a3a6", "var(--u-danger-ink)"),
    ("#e0b76a", "var(--u-amber-ink)"),
]
HOME_MAP = [
    ("linear-gradient(145deg,#f5f3ff,#f6fbff 58%,#ffffff)", "var(--u-hero-surface)"),
    ("linear-gradient(145deg,#ece9ff,#f7f6ff)", "var(--u-cover-1-grad)"),
    ("linear-gradient(145deg,#e3f7fd,#f5fcff)", "var(--u-cover-2-grad)"),
    ("linear-gradient(145deg,#ffebf5,#fff7fb)", "var(--u-cover-3-grad)"),
    ("linear-gradient(145deg,#f1efff,#fafaff)", "var(--u-card-tint)"),
    ("#635bff", "var(--u-cover-1-ink)"),
    ("#d34f94", "var(--u-cover-3-ink)"),
]
LIBRARY_MAP = [
    ("linear-gradient(145deg,#ebe9ff,#f8f7ff)", "var(--u-cover-1-grad)"),
    ("linear-gradient(145deg,#e3f7fd,#f7fdff)", "var(--u-cover-2-grad)"),
    ("linear-gradient(145deg,#e8edff,#f7f9ff)", "var(--u-cover-4-grad)"),
    ("linear-gradient(145deg,#ffeaf5,#fff8fb)", "var(--u-cover-3-grad)"),
    ("#6259f2", "var(--u-cover-1-ink)"),
    ("#4766e5", "var(--u-cover-4-ink)"),
    ("#d84f94", "var(--u-cover-3-ink)"),
    ("background: white;", "background: var(--u-surface);"),
]
MARKETING_MAP = [
    ("linear-gradient(90deg, #5b50ef 4%, #7d5af0 38%, #078ebd 70%, #118d70)", "var(--u-hero-grad)"),
    ("linear-gradient(135deg,#776dff,#23bfe2)", "var(--u-avatar-grad)"),
    ("#20ba85", "var(--u-mint)"),
    ("#f2f1ff", "var(--u-surface-tint)"),
    ("#477063", "var(--u-mint-ink)"),
]
SHELL_MAP = [
    ("#b7adff", "var(--u-shell-accent)"),
    ("#9ca2c6", "var(--u-shell-icon)"),
    ("#c3c8e8", "var(--u-shell-icon-bright)"),
    ("#8e94b8", "var(--u-shell-icon-dim)"),
    ("#2fd693", "var(--u-shell-online)"),
    ("rgba(47, 214, 147, 0.16)", "var(--u-shell-online-halo)"),
    ("linear-gradient(135deg, #7a68fa, #5548e0)", "var(--u-shell-grad-new)"),
    ("linear-gradient(180deg, #9b8eff, #6d5ff2)", "var(--u-shell-grad-link)"),
    ("linear-gradient(135deg, #6d5ff2, #4a3cd8)", "var(--u-shell-grad-avatar)"),
    ("linear-gradient(135deg, #6d5ff2, #4337c6)", "var(--u-shell-grad-avatar-top)"),
    ("#8d80ff", "var(--u-shell-accent)"),
    ("#e4e0ff", "var(--u-shell-accent)"),
]
STATES_MAP = []
MOTION_MAP = [
    ("rgba(85, 72, 224, 0.08)", "rgba(85, 72, 224, 0.08)"),  # skeleton hi — token-adjacent, keep
]

def apply_map(text, pairs, counter, label):
    for old, new in pairs:
        if old == new:
            continue
        cnt = text.count(old)
        if cnt:
            counter[f"{label}: {old} -> {new}"] = cnt
            text = text.replace(old, new)
    return text

def main():
    report = Counter()
    gpath = ROOT / "src/app/globals.css"
    g = gpath.read_text(encoding="utf-8")

    # Phase A
    g, var_counts = migrate_vars(g)
    report.update({f"globals var: {k}": v for k, v in var_counts.items()})
    g, n_fc, n_fo = migrate_forest(g)
    report["globals var: var(--forest)->var(--u-ink) (color:)"] = n_fc
    if n_fo:
        print(f"!! WARNING: {n_fo} NON-COLOR var(--forest) uses need manual review")
        for line in g.split("\n"):
            if "var(--forest)" in line:
                print("   ->", line.strip()[:140])

    # Phase B globals
    g = apply_map(g, HEX_MAP_GLOBAL, report, "globals hex")
    g = apply_map(g, RGBA_MAP, report, "globals rgba")
    g = apply_map(g, GRAD_MAP_GLOBALS, report, "globals grad")
    gpath.write_text(g, encoding="utf-8")

    # other files
    others = {
        "src/app/styles/universal/workbench.css": WORKBENCH_MAP,
        "src/app/styles/universal/home.css": HOME_MAP,
        "src/app/styles/universal/library.css": LIBRARY_MAP,
        "src/app/styles/universal/marketing.css": MARKETING_MAP,
        "src/app/styles/universal/shell.css": SHELL_MAP,
        "src/app/styles/universal/motion.css": MOTION_MAP,
        "src/app/styles/universal/states.css": STATES_MAP,
    }
    for rel, pairs in others.items():
        p = ROOT / rel
        t = p.read_text(encoding="utf-8")
        t = apply_map(t, pairs, report, rel.split("/")[-1])
        p.write_text(t, encoding="utf-8")

    print("=" * 66)
    print("REPLACEMENTS:")
    for k, v in sorted(report.items(), key=lambda kv: -kv[1]):
        print(f"  {v:4d} × {k}")
    print("=" * 66)
    print(f"TOTAL: {sum(report.values())}")

if __name__ == "__main__":
    main()
