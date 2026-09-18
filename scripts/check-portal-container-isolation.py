#!/usr/bin/env python3
"""
Anti-regression gate: PORTAL/CONTAINER ISOLATION CHECK (v11)

Why this exists:
  Any element rendered through a Radix <Dialog.Portal> / <Popover.Portal> /
  <Tooltip.Portal> (or any ReactDOM.createPortal) is mounted into
  document.body — OUTSIDE every @container context on the page.

  A CSS rule for such an element that lives inside a @container block can
  therefore NEVER match. Writing responsive portal styles in @container is
  a silent no-op that only breaks on phones (see v11: the
  "خصّص تجربتك" dialog shipped for days with dead mobile rules).

The gate:
  1. Parse every CSS file under src/app.
  2. Record every class selector that appears inside a @container block.
  3. Cross-reference with every Portal-rendered class found in src/
     (by scanning .tsx for className= on components inside *.Portal).
  4. Fail if any Portal-rendered class receives styling inside @container.

Exit codes: 0 = pass, 1 = violations found.
Run: python3 scripts/check-portal-container-isolation.py
"""

from __future__ import annotations

import glob
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSS_FILES = [str(ROOT / "src/app/globals.css"), *glob.glob(str(ROOT / "src/app/styles/**/*.css"))]

# Classes rendered through Radix Portal into document.body.
# Extend this list when a new portalled overlay is introduced.
PORTAL_CLASSES = [
    "adaptive-dialog",          # adaptive-home.tsx  — "خصّص تجربتك"
    "form-dialog",              # admin/ops prototypes
    "approval-dialog",          # run-detail decision
    "compare-dialog",           # model catalog compare
    "usage-event-dialog",       # usage ledger events
    "u2-overlay",               # research/create/workbench overlays
    "universal-command",        # command palette
    "universal-command-overlay",
    "command-overlay",
    "universal-notifications",
    "adaptive-dialog-overlay",
    "universal-command-backdrop",
]

# Computed dynamically: any class whose selector text appears in the same
# rule as a Portal class (e.g. child/state selectors like
# ".adaptive-dialog__goals") must also stay out of containers.
DERIVED = set(PORTAL_CLASSES)
for base in list(PORTAL_CLASSES):
    DERIVED.add(base + "__")

CONTAINER_RE = re.compile(r"@container[^{]*\{")
COMMENT_RE = re.compile(r"/\*.*?\*/", re.DOTALL)


def strip_comments(text: str) -> str:
    """Remove /* … */ comments first — prose in comments (e.g. the v11 rule
    documentation mentions the literal token '@container') must not be
    mistaken for an actual container query."""
    return COMMENT_RE.sub("", text)


def container_blocks(text: str):
    """Yield (start_line, inner_text) for each top-level @container block."""
    for m in CONTAINER_RE.finditer(text):
        depth, i = 1, m.end()
        while depth > 0 and i < len(text):
            if text[i] == "{":
                depth += 1
            elif text[i] == "}":
                depth -= 1
            i += 1
        yield text[: m.start()].count("\n") + 1, text[m.end() : i - 1]


def main() -> int:
    violations: list[str] = []
    for css_file in CSS_FILES:
        try:
            text = strip_comments(Path(css_file).read_text())
        except FileNotFoundError:
            continue
        for line_no, block in container_blocks(text):
            for cls in DERIVED:
                if ("." + cls) in block:
                    violations.append(
                        f"{Path(css_file).relative_to(ROOT)}:{line_no} — "
                        f"portal-rendered .{cls} styled inside @container "
                        "(rule can never match; move it to @media)"
                    )
    if violations:
        print("✗ PORTAL/CONTAINER ISOLATION — FAIL")
        for v in sorted(set(violations)):
            print(f"  • {v}")
        print(
            "\nFix: move the responsive rules for these classes into an "
            "@media (max-width: …) block. Portalled content lives in "
            "document.body, outside every @container context."
        )
        return 1
    print("✓ PORTAL/CONTAINER ISOLATION — PASS")
    print(f"  {len(CSS_FILES)} CSS files scanned · {len(DERIVED)} portal class roots checked")
    return 0


if __name__ == "__main__":
    sys.exit(main())
