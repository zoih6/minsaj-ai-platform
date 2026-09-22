// W-DS Phase 3 — update audit-matrix status for NAV-01..05 (+ NAV-06 partial note).
// Replaces the trailing `confirmed` status of each NAV row with the measured
// phase-3 resolution. Run from repo root.
import fs from 'node:fs';

const FILE = 'docs/03-design/reconstruction/UI-UX-AUDIT-MATRIX.csv';
const RESOLUTIONS = {
  'NAV-01': 'resolved-in-phase-3 (nav-probe before/after on the phase2 vs phase3 builds: headerHeights@390 [109,65] → [56] on all 10 probed routes — ONE single-row 56px grammar everywhere, second-row cells 6 → 0, near-solid 0.95 chrome per D-1; evidence/baselines/phase3/)',
  'NAV-02': 'resolved-in-phase-3 (chromeRatio@390 15.5–21.2% → 14.5% uniform — ≤15.5% gate B-5; @430 13.1% ≤14.5%; 56px header + 66px floating dock incl. hairline; evidence/baselines/phase3/)',
  'NAV-03': 'resolved-in-phase-3 (identityDuplicated cells 4 → 0 — the header announces the workspace mark only, page identity belongs to the route h1 per R-NAV-3; evidence/baselines/phase3/)',
  'NAV-04': 'resolved-in-phase-3 (dockDialects 2 → 1 — one floating dock grammar on every route: 16px inline inset, radius 16px, ONE shadow token + ONE hairline per the D-4 working rule, active = primary + soft pill + 3px indicator; evidence/baselines/phase3/)',
  'NAV-05': 'resolved-in-phase-3 (drawer registers 1 → 2 weighted tiers: T1 core 13px/600/48px with primary pill + 3px indicator, T2/T3/T4 13.5px/500/44px soft tint; utility group labelled «مساحتي» and pinned out of the scroll; operations fold behind its «التشغيل» disclosure on the phone band; evidence/baselines/phase3/)',
  'NAV-06': 'partially-addressed-in-phase-3 (global trigger is now the single icon <768 / inline field ≥768 — the two-row search tray deleted with NAV-01 per NAVIGATION-ARCHITECTURE §6; the collection-scope rule and per-page field cleanup remain open for their phase)',
};

let txt = fs.readFileSync(FILE, 'utf8');
const lines = txt.split('\n');
let touched = 0;
for (let i = 0; i < lines.length; i++) {
  const id = lines[i].split(',')[0];
  if (!(id in RESOLUTIONS)) continue;
  if (!/,\s*confirmed\s*$/.test(lines[i].replace(/\r$/, ''))) {
    console.log(`SKIP ${id}: status is not plain "confirmed" — manual review needed`);
    continue;
  }
  lines[i] = lines[i].replace(/\r$/, '').replace(/,\s*confirmed\s*$/, `,"${RESOLUTIONS[id]}"`) + (txt.includes('\r\n') ? '\r' : '');
  touched++;
}
fs.writeFileSync(FILE, lines.join('\n'));
console.log(`updated ${touched} rows`);
