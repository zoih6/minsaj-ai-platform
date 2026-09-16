#!/usr/bin/env python3
"""B1-a: Precise legacy-variable inventory + hardcoded color census.
Comment-aware (strips /* */ comments before counting)."""
import re, json, sys
from pathlib import Path
from collections import Counter, defaultdict

ROOT = Path("/home/z/my-project")
CSS_DIRS = [ROOT / "src", ROOT / "packages"]

# All legacy (non --u-*, non --nq-, non --service) custom props we know of
LEGACY_VARS = [
    "bg", "surface", "surface-subtle", "surface-raised",
    "text", "text-muted", "text-faint",
    "border", "border-strong",
    "forest", "forest-hover",
    "teal", "teal-hover", "teal-subtle",
    "amber", "amber-ink", "amber-subtle",
    "danger", "danger-subtle",
    "info", "info-subtle",
    "success", "success-subtle",
    "focus", "shadow-1", "shadow-2",
    "sidebar-width", "sidebar-collapsed",
    "luma-accent", "luma-glow", "luma-ink", "luma-line",
]

HEX_RE = re.compile(r"#[0-9a-fA-F]{3,8}\b")
RGBA_RE = re.compile(r"\brgba?\(\s*[\d.]+")

def strip_comments(css: str) -> str:
    return re.sub(r"/\*.*?\*/", "", css, flags=re.S)

per_file = {}
legacy_counter = Counter()
hex_counter = Counter()
rgba_counter = Counter()
forest_contexts = []  # (file, line, line-content) for --forest usage

for d in CSS_DIRS:
    for f in sorted(d.rglob("*.css")):
        if "node_modules" in str(f):
            continue
        raw = f.read_text(encoding="utf-8", errors="replace")
        code = strip_comments(raw)
        file_stat = {"legacy": 0, "legacy_detail": {}, "hex": 0, "rgba": 0}
        for var in LEGACY_VARS:
            # usage = var(--name) not followed by a dash (word boundary)
            pat = re.compile(r"var\(--" + re.escape(var) + r"\b(?![\w-])")
            n = len(pat.findall(code))
            if n:
                file_stat["legacy_detail"][var] = n
                legacy_counter[var] += n
                file_stat["legacy"] += n
                if var == "forest":
                    for i, line in enumerate(code.splitlines(), 1):
                        if re.search(r"var\(--forest\b(?![\w-])", line):
                            forest_contexts.append((str(f.relative_to(ROOT)), i, line.strip()[:150]))
        hx = HEX_RE.findall(code)
        # exclude hex inside var definitions of the two canonical token blocks?
        file_stat["hex"] = len(hx)
        for h in hx:
            hex_counter[h.lower()] += 1
        file_stat["rgba"] = len(RGBA_RE.findall(code))
        if file_stat["legacy"] or file_stat["hex"] or file_stat["rgba"]:
            per_file[str(f.relative_to(ROOT))] = file_stat

print("=" * 70)
print("LEGACY VAR USAGE BY VARIABLE (total {}):".format(sum(legacy_counter.values())))
for var, n in legacy_counter.most_common():
    print(f"  --{var:22s} {n:5d}")
print()
print("=" * 70)
print("LEGACY+HARDCODED BY FILE:")
for f, s in sorted(per_file.items(), key=lambda kv: -(kv[1]["legacy"] + kv[1]["hex"] + kv[1]["rgba"])):
    print(f"  {f:65s} legacy={s['legacy']:4d} hex={s['hex']:4d} rgba={s['rgba']:4d}")
print()
print("=" * 70)
print("TOP 40 HARDCODED HEX (comment-stripped, includes token definitions):")
for h, n in hex_counter.most_common(40):
    print(f"  {h:10s} {n:5d}")
print()
print("=" * 70)
print("FOREST USAGE CONTEXTS ({} total):".format(len(forest_contexts)))
for fc in forest_contexts:
    print(f"  {fc[0]}:{fc[1]}: {fc[2]}")

out = {
    "legacy_by_var": dict(legacy_counter),
    "by_file": {k: v for k, v in per_file.items()},
    "hex_top": dict(hex_counter.most_common(80)),
    "total_hex": sum(hex_counter.values()),
    "total_rgba": sum(v["rgba"] for v in per_file.values()),
}
(ROOT / "scripts" / "b1-inventory.json").write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")
print("\nSaved: scripts/b1-inventory.json")
