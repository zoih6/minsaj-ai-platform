#!/usr/bin/env python3
"""B3: Icon size normalization — 21 values -> 6 UI + 3 brand.
UI ladder: 12/14/16/18/20/24 · Brand ladder: 28/34/46."""
import re
from pathlib import Path
from collections import Counter

MAP = {
    "11": "12", "13": "14", "15": "16", "17": "18", "19": "18", "21": "20", "22": "20",
    "29": "28", "30": "28", "31": "28", "36": "34", "42": "46",
}
report = Counter()
files_changed = 0

for f in Path("/home/z/my-project/src").rglob("*.tsx"):
    t = f.read_text(encoding="utf-8", errors="replace")
    orig = t
    for old, new in MAP.items():
        # only exact numeric size props on components
        t = re.sub(rf"size=\{{{old}\}}", f"size={{{new}}}", t)
    if t != orig:
        before = Counter(re.findall(r"size=\{(\d+)\}", orig))
        after = Counter(re.findall(r"size=\{(\d+)\}", t))
        for size in set(before) | set(after):
            if before.get(size, 0) != after.get(size, 0):
                report[f"{size} -> {MAP.get(size, size)}"] = after.get(size, 0) - before.get(size, 0)
        f.write_text(t, encoding="utf-8")
        files_changed += 1

print(f"Files changed: {files_changed}")
final = Counter()
for f in Path("/home/z/my-project/src").rglob("*.tsx"):
    for m in re.findall(r"size=\{(\d+)\}", f.read_text(encoding="utf-8", errors="replace")):
        final[int(m)] += 1
print("FINAL LADDER:")
for size in sorted(final):
    print(f"  {size}px × {final[size]}")
