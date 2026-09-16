#!/usr/bin/env python3
"""
Nasaq AI — Comprehensive design-debt audit scan (Phase 13 evidence collector).

Measures (comment-aware, context-aware):
  1. Color token families: definitions + var() usages (--u-* / --nq-* / legacy)
  2. Hardcoded colors: hex/rgb/hsl literals split into token-definitions (legit)
     vs rule declarations (violations), per file
  3. Dark mode: [data-theme="dark"] selector occurrences per file, classified
     (foundations token-swap = legit; per-element overrides elsewhere = debt)
  4. Breakpoints: every @media value vs every @container value; @media blocks
     classified portaled-legit vs in-flow-violation
  5. 100vh occurrences (should be 100dvh)
  6. z-index inventory (ladder compliance)
  7. Icon usage in TSX: lucide size distribution, strokeWidth, hand-written <svg>

Output: human-readable report to stdout + JSON to scripts/audit-scan.json
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path("/home/z/my-project")
CSS_FILES = sorted(ROOT.glob("src/app/styles/universal/*.css")) + [ROOT / "src/app/globals.css"]
TSX_DIRS = [ROOT / "src/components", ROOT / "src/features"]

# Classes whose responsive rules are legitimately viewport @media (AGENTS rule 5)
PORTALED = re.compile(
    r"adaptive-dialog|form-dialog|approval-dialog|compare-dialog|usage-event-dialog|"
    r"u2-overlay|universal-command|demo-toast|u-feedback-toast|stop-button|u-toast|"
    r"\[role=[\"']dialog[\"']\]|radix-|Dialog"
)

HEX = re.compile(r"#[0-9a-fA-F]{3,8}\b")
RGBFN = re.compile(r"\brgba?\(")
HSLFN = re.compile(r"\bhsla?\(")
CUSTOM_PROP_DEF = re.compile(r"(--[\w-]+)\s*:")
VAR_USE = re.compile(r"var\(\s*(--[\w-]+)")
MEDIA = re.compile(r"@media[^{]*")
CONTAINER = re.compile(r"@container[^{]*")
BP_VALUE = re.compile(r"\(?\s*(?:min|max)-(?:width|height)\s*:\s*([0-9.]+)(px|rem|em|ch|vw|dvh|vh)")
DARK = re.compile(r"\[data-theme=[\"']dark[\"']\]")
VH100 = re.compile(r":\s*100vh\b")
ZINDEX = re.compile(r"z-index:\s*(-?\d+)")


def strip_comments(css: str) -> str:
    """Replace comment bodies with spaces (preserve length + line structure)."""
    return re.sub(r"/\*.*?\*/", lambda m: re.sub(r"[^\n]", " ", m.group(0)), css, flags=re.S)


def parse_file(path: Path):
    raw = path.read_text(encoding="utf-8")
    css = strip_comments(raw)
    lines = css.split("\n")
    r = {"file": str(path.relative_to(ROOT)), "lines": len(lines)}

    # --- custom property definitions by family ---
    defs = {"u": [], "nq": [], "legacy": []}
    for m in CUSTOM_PROP_DEF.finditer(css):
        name = m.group(1)
        if name.startswith("--u-") or name.startswith("--u-"):
            defs["u"].append(name)
        elif name.startswith("--nq-"):
            defs["nq"].append(name)
        else:
            defs["legacy"].append(name)
    r["defs"] = {k: len(v) for k, v in defs.items()}
    r["defs_legacy_names"] = sorted(set(defs["legacy"]))

    # --- var() usages by family ---
    uses = {"u": 0, "nq": 0, "legacy": 0}
    for m in VAR_USE.finditer(css):
        name = m.group(1)
        if name.startswith("--u-"):
            uses["u"] += 1
        elif name.startswith("--nq-"):
            uses["nq"] += 1
        else:
            uses["legacy"] += 1
    r["uses"] = uses

    # --- hardcoded colors: on custom-prop definition lines vs elsewhere ---
    hex_in_defs = hex_in_rules = rgb_in_defs = rgb_in_rules = 0
    for line in lines:
        prop_defs_on_line = CUSTOM_PROP_DEF.search(line)
        h = len(HEX.findall(line))
        f = len(RGBFN.findall(line)) + len(HSLFN.findall(line))
        if prop_defs_on_line:
            hex_in_defs += h
            rgb_in_defs += f
        else:
            hex_in_rules += h
            rgb_in_rules += f
    r["hardcoded"] = {"hex_in_token_defs": hex_in_defs, "hex_in_rules": hex_in_rules,
                      "fn_in_token_defs": rgb_in_defs, "fn_in_rules": rgb_in_rules}

    # --- dark mode selectors ---
    r["dark_selectors"] = len(DARK.findall(css))

    # --- 100vh ---
    r["100vh"] = len(VH100.findall(css))

    # --- z-index values ---
    r["z_values"] = sorted({int(z) for z in ZINDEX.findall(css)})

    # --- query blocks with brace tracking ---
    media_blocks, container_blocks = [], []
    # tokenize query starts, then track braces
    events = []
    for m in MEDIA.finditer(css):
        events.append((m.start(), m.end(), "media", m.group(0)))
    for m in CONTAINER.Finditer if False else []:
        pass
    for m in re.finditer(r"@container[^{]*", css):
        events.append((m.start(), m.end(), "container", m.group(0)))
    events.sort()
    for start, header_end, kind, header in events:
        depth, i = 0, header_end
        while i < len(css):
            c = css[i]
            if c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    break
            i += 1
        body = css[header_end:i]
        bps = BP_VALUE.findall(header)
        val = [f"{n}{u}" for n, u in bps]
        rec = {"kind": kind, "query": " ".join(header.split())[:100], "values": val,
               "selectors": set()}
        for sel in re.finditer(r"([^{}]+)\{", body):
            s = " ".join(sel.group(1).split())
            if s:
                rec["selectors"].add(s)
        rec["selectors"] = sorted(rec["selectors"])[:40]
        (media_blocks if kind == "media" else container_blocks).append(rec)
    # classify media blocks
    for b in media_blocks:
        joined = " ".join(b["selectors"])
        b["portaled"] = bool(PORTALED.search(joined)) if joined else None
    r["media_blocks"] = media_blocks
    r["container_blocks"] = container_blocks
    return r


def parse_tsx():
    sizes, strokes, hand_svg = {}, {}, {}
    for d in TSX_DIRS:
        for f in d.rglob("*.tsx"):
            raw = strip_comments(f.read_text(encoding="utf-8"))
            lucide = bool(re.search(r"from [\"']lucide-react[\"']", raw))
            for m in re.finditer(r"size=\{?\s*([0-9]+)", raw):
                sizes[m.group(1)] = sizes.get(m.group(1), 0) + 1
            for m in re.finditer(r"strokeWidth=\{?\s*([0-9.]+)", raw):
                strokes[m.group(1)] = strokes.get(m.group(1), 0) + 1
            if "<svg" in raw and not lucide:
                n = raw.count("<svg")
                hand_svg[str(f.relative_to(ROOT))] = n
            elif "<svg" in raw and lucide:
                # svg alongside lucide — likely hand-written too
                n = len(re.findall(r"<svg(?![\w-])", raw))
                if n:
                    hand_svg[str(f.relative_to(ROOT))] = hand_svg.get(str(f.relative_to(ROOT)), 0) + n
    return sizes, strokes, hand_svg


def main():
    files = [parse_file(p) for p in CSS_FILES]
    sizes, strokes, hand_svg = parse_tsx()

    # aggregates
    agg = {
        "css_lines": sum(f["lines"] for f in files),
        "defs": {k: sum(f["defs"][k] for f in files) for k in ("u", "nq", "legacy")},
        "uses": {k: sum(f["uses"][k] for f in files) for k in ("u", "nq", "legacy")},
        "hardcoded_rules": sum(f["hardcoded"]["hex_in_rules"] + f["hardcoded"]["fn_in_rules"] for f in files),
        "hardcoded_token_defs": sum(f["hardcoded"]["hex_in_token_defs"] + f["hardcoded"]["fn_in_token_defs"] for f in files),
        "dark_selectors": sum(f["dark_selectors"] for f in files),
        "vh100": sum(f["100vh"] for f in files),
    }
    media_vals, container_vals = {}, {}
    inflow_violations = []
    for f in files:
        for b in f["media_blocks"]:
            for v in b["values"]:
                media_vals[v] = media_vals.get(v, 0) + 1
            if b["portaled"] is False:
                inflow_violations.append({"file": f["file"], "query": b["query"],
                                           "n_selectors": len(b["selectors"])})
        for b in f["container_blocks"]:
            for v in b["values"]:
                container_vals[v] = container_vals.get(v, 0) + 1

    out = {"aggregate": agg, "media_values": media_vals, "container_values": container_vals,
           "inflow_media_blocks": inflow_violations, "files": files,
           "icon_sizes": sizes, "icon_strokes": strokes, "hand_svgs": hand_svg}
    (ROOT / "scripts/audit-scan.json").write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")

    # ---- human summary ----
    print("=" * 70)
    print("AGGREGATE")
    print(f"  CSS lines total:        {agg['css_lines']}")
    print(f"  defs  --u-*: {agg['defs']['u']}  --nq-*: {agg['defs']['nq']}  legacy: {agg['defs']['legacy']}")
    print(f"  uses  --u-*: {agg['uses']['u']}  --nq-*: {agg['uses']['nq']}  legacy: {agg['uses']['legacy']}")
    print(f"  hardcoded colors in RULES (violations): {agg['hardcoded_rules']}")
    print(f"  hardcoded colors in token defs (legit): {agg['hardcoded_token_defs']}")
    print(f"  [data-theme=dark] selectors: {agg['dark_selectors']}")
    print(f"  100vh occurrences: {agg['vh100']}")
    print(f"  @media distinct values:  {dict(sorted(media_vals.items(), key=lambda x: float(x[0][:-2]) if x[0][-2:] in ('px','em','vh') else 0))}")
    print(f"  @container distinct values: {dict(sorted(container_vals.items(), key=lambda x: float(x[0][:-2]) if x[0][-2:] in ('px','em','vh') else 0))}")
    print(f"  IN-FLOW @media blocks (violations): {len(inflow_violations)}")
    for v in inflow_violations:
        print(f"    - {v['file']}: {v['query']} ({v['n_selectors']} selectors)")
    print(f"  icon sizes: {dict(sorted(sizes.items(), key=lambda x: int(x[0])))}")
    print(f"  icon strokeWidths: {strokes}")
    print(f"  hand-written svg files: {len(hand_svg)} ({sum(hand_svg.values())} svg tags)")
    print("=" * 70)
    print("PER FILE (violations focus)")
    for f in files:
        print(f"  {f['file']}: lines={f['lines']} legacy_uses={f['uses']['legacy']} "
              f"hard_rules={f['hardcoded']['hex_in_rules'] + f['hardcoded']['fn_in_rules']} "
              f"dark={f['dark_selectors']} vh100={f['100vh']} z={f['z_values']}")


if __name__ == "__main__":
    main()
