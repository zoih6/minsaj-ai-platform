#!/usr/bin/env python3
"""B1 pass 3: dissolve dark per-element rules now handled by theme tokens.
Each deletion verified against its token counterpart."""
from pathlib import Path

ROOT = Path("/home/z/my-project")

DELETIONS = {
    "src/app/styles/universal/workbench.css": [
        # light rules already use --u-danger-ink/--u-amber-ink (auto dark values)
        """
/* Dark refinements — status notes (keep AA on dark) */
:root[data-theme="dark"] .u2-learn__error { color: var(--u-danger-ink); }
:root[data-theme="dark"] .u2-learn__hint,
:root[data-theme="dark"] .u2-learn__outcome--partially_correct { color: var(--u-amber-ink); }
:root[data-theme="dark"] .u2-learn__outcome--wrong,
:root[data-theme="dark"] .u2-learn__outcome--skipped { color: var(--u-danger-ink); }
""",
    ],
    "src/app/styles/universal/home.css": [
        # hero/cover/why-card light rules now use --u-hero-surface/--u-cover-*/--u-card-tint
        """
/* Dark refinements — home */
:root[data-theme="dark"] .adaptive-home__hero { background: linear-gradient(145deg,#1b1a38,#141a30 58%,var(--u-surface)); }
""",
        """
/* Dark refinements — pastel covers & tinted cards become deep service-tinted.
   White glass chips on the covers stay (sticker effect reads well on dark). */
:root[data-theme="dark"] .adaptive-recent-card__cover { color: #a99bff; background: linear-gradient(145deg,#241f4d,#1a1b3a); }
:root[data-theme="dark"] .adaptive-recent-card__cover--2 { color: #4cc4e0; background: linear-gradient(145deg,#0e3242,#0d2030); }
:root[data-theme="dark"] .adaptive-recent-card__cover--3 { color: #ef85b6; background: linear-gradient(145deg,#40173a,#2e1430); }
:root[data-theme="dark"] .adaptive-why-card { background: linear-gradient(145deg,#1c1938,#12152c); }
""",
    ],
    "src/app/styles/universal/library.css": [
        # light rules now use --u-cover-* tokens (theme-aware)
        """
/* Dark refinements — library covers */
:root[data-theme="dark"] .universal-library-item__cover { color: #a99bff; background: linear-gradient(145deg,#241f4d,#1a1b3a); }
:root[data-theme="dark"] .universal-library-item__cover--2 { color: #4cc4e0; background: linear-gradient(145deg,#0e3242,#0d2030); }
:root[data-theme="dark"] .universal-library-item__cover--3 { color: #7a92e8; background: linear-gradient(145deg,#18234d,#141a38); }
:root[data-theme="dark"] .universal-library-item__cover--4 { color: #ef85b6; background: linear-gradient(145deg,#40173a,#2e1430); }
""",
    ],
    "src/app/styles/universal/marketing.css": [
        # light rule uses var(--u-hero-grad) (dark value in theme block)
        """
:root[data-theme="dark"] .universal-hero__copy h1 span { background: linear-gradient(90deg, #8d80f8 4%, #a78bfa 38%, #38b8d9 70%, #3ecb9a); background-clip: text; -webkit-background-clip: text; }
""",
        # note uses --u-mint-ink/--u-mint-soft now
        """
:root[data-theme="dark"] .universal-adaptive-note { color: #8fd8b8; background: rgba(62, 203, 154, 0.12); }
""",
        # final-cta uses --u-surface-tint now
        """
:root[data-theme="dark"] .universal-final-cta { background: #17153a; }
""",
        # marketing brand mark -> primary token
        (".luma-brand__mark { width: 36px; height: 36px; display: grid; place-items: center; color: #655cf6; filter: drop-shadow(0 5px 10px rgba(94,82,235,.2)); }",
         ".luma-brand__mark { width: 36px; height: 36px; display: grid; place-items: center; color: var(--u-primary); filter: drop-shadow(0 5px 10px rgba(94,82,235,.2)); }"),
    ],
    "src/app/globals.css": [
        # .button--primary is flat var(--u-primary) in light; keep it flat & token-driven in dark too.
        # The premium gradient lives in .luma-button--primary (foundations) — single gradient vocabulary.
        """
:root[data-theme="dark"] .button--primary { background: linear-gradient(135deg, #6659ea, #584ae4 60%, #4f41d9); }
:root[data-theme="dark"] .button--primary:hover { background: linear-gradient(135deg, #6d61ef, #6153e8 60%, #584ade); }
""",
    ],
}

total = 0
for rel, blocks in DELETIONS.items():
    p = ROOT / rel
    t = p.read_text(encoding="utf-8")
    for b in blocks:
        if isinstance(b, tuple):
            old, new = b
            if old in t:
                t = t.replace(old, new)
                total += 1
                print(f"  REPLACED in {rel}: {old[:60]}...")
            else:
                print(f"  !! NOT FOUND in {rel}: {old[:60]}...")
            continue
        if b in t:
            t = t.replace(b, "\n")
            total += 1
            print(f"  DELETED block in {rel} ({len(b)} chars)")
        else:
            print(f"  !! NOT FOUND in {rel}: {b.strip()[:70]}...")
    p.write_text(t, encoding="utf-8")

print(f"\nDONE: {total} blocks processed")
