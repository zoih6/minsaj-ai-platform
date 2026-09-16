#!/usr/bin/env python3
"""Pixel-level evidence check: find bright regions in DARK-mode screenshots.
For each dark screenshot, reports clusters of near-white pixels (potential
'unadapted light surfaces') vs the page's overall darkness, plus bottom-strip
analysis (the VLM claimed white bottom bars)."""
from pathlib import Path
from PIL import Image
import sys

EV = Path("/home/z/my-project/docs/audit/evidence")

def analyze(p: Path):
    im = Image.open(p).convert("RGB")
    w, h = im.size
    px = im.load()
    # grid sample every 4px
    bright = []  # (x, y)
    total = 0
    for y in range(0, h, 4):
        for x in range(0, w, 4):
            r, g, b = px[x, y]
            total += 1
            if r > 215 and g > 215 and b > 215:
                bright.append((x, y))
    frac = len(bright) / total if total else 0
    # bottom strip (last 12%)
    strip_y = int(h * 0.88)
    bottom = sum(1 for (x, y) in bright if y >= strip_y)
    # cluster roughly by thirds
    zones = {}
    for (x, y) in bright:
        zx = "left" if x < w/3 else ("mid" if x < 2*w/3 else "right")
        zy = "top" if y < h/3 else ("mid" if y < 2*h/3 else "bottom")
        zones[f"{zy}/{zx}"] = zones.get(f"{zy}/{zx}", 0) + 1
    top_zones = sorted(zones.items(), key=lambda kv: -kv[1])[:3]
    return w, h, frac, bottom, top_zones

print(f"{'file':34} {'size':11} {'bright%':>8} {'bottom':>7}  top-zones")
for p in sorted(EV.glob("*dark*.png")):
    w, h, frac, bottom, zones = analyze(p)
    flag = "  <<<" if frac > 0.05 else ""
    print(f"{p.name:34} {w}x{h:<7} {frac*100:7.2f}% {bottom:7}  {zones}{flag}")
