#!/usr/bin/env node
// ============================================================================
// W-DS Phase 6 — Sign-off matrix, LIVE (VISUAL-QA-CHECKLIST.md §5)
// ----------------------------------------------------------------------------
// The sign-off matrix stops being a static table and becomes an executed
// protocol: every push is CLASSIFIED by its diff into one of the four
// §5 change classes, the required gates and the approver are printed, and
// --check ENFORCES the owner-approval evidence: a token amendment or a
// pattern change may not land unless the same push records its sign-off
// in docs/05-process/SIGN-OFF-LOG.md (the durable ledger the owner's
// approvals are documented into — chat approval first, ledger entry in the
// same commit, per the repo's documents-with-the-code law).
//
//   §5 matrix (verbatim):
//   | Change class                | Required gates            | Approver |
//   | Token amendment             | A + B (spot 390/1440)+G-7 | Owner    |
//   | New/changed pattern         | A + B full protocol       | Owner    |
//   | Route within existing patt. | A + B-1..B-5, B-8         | Reviewer |
//   | Copy-only / a11y fix        | A                         | Reviewer |
//
// Usage:
//   node scripts/visual-qa/signoff.mjs [--base HEAD~1] [--check]
//
// Exit codes: 0 = classified (and, with --check, evidence present) ·
//             1 = missing sign-off evidence for an Owner class ·
//             2 = git/diff unavailable.
// ============================================================================

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const SIGNOFF_LOG = 'docs/05-process/SIGN-OFF-LOG.md';

const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const BASE = flag('--base') || 'HEAD~1';
const CHECK = args.includes('--check');

// ---- §5 change classes (precedence: token > pattern > route > copy) --------
const CLASSES = [
  {
    id: 'token-amendment',
    gates: 'A + B (spot 390/1440) + G-7',
    approver: 'Owner',
    signals: [
      'src/app/styles/universal/foundations.css',
      'src/app/styles/universal/layout.css',
      'docs/03-design/reconstruction/DESIGN-TOKENS.md',
    ],
  },
  {
    id: 'pattern-change',
    gates: 'A + B full protocol',
    approver: 'Owner',
    signals: [
      'src/components/universal/',
      'src/components/app-shell/',
      'src/features/',
      'src/app/styles/universal/',
      'packages/ui/',
      'docs/03-design/reconstruction/PAGE-PATTERNS-AND-MOTION.md',
    ],
    // NEW route files (a page.tsx absent from the base) are pattern changes:
    // "any new route starts as a row in the IA table before code" (AGENT-GUIDE 7).
    newRouteFiles: true,
  },
  {
    id: 'route-within-patterns',
    gates: 'A + B-1..B-5, B-8',
    approver: 'Reviewer',
    signals: [
      'src/components/domain/',
      'src/lib/',
      'packages/mock-api/',
      'packages/contracts/',
      'src/app/',
    ],
  },
  {
    id: 'copy-a11y',
    gates: 'A',
    approver: 'Reviewer',
    signals: ['packages/i18n/'],
    fallback: true,
  },
];

const git = (cliArgs) =>
  execFileSync('git', cliArgs, { cwd: ROOT, encoding: 'utf8' }).trim();

let baseRev, headRev, changed;
try {
  baseRev = git(['rev-parse', '--verify', BASE]);
  headRev = git(['rev-parse', '--verify', 'HEAD']);
  changed = git(['diff', '--name-only', `${baseRev}..${headRev}`])
    .split('\n')
    .filter(Boolean);
} catch (e) {
  console.error(`[signoff] git diff unavailable: ${String(e.message).split('\n')[0]}`);
  process.exit(2);
}

// Route files new in this range (pattern change by definition).
const baseFiles = new Set(
  git(['ls-tree', '-r', '--name-only', baseRev]).split('\n').filter(Boolean)
);
const newRoutes = changed.filter(
  (f) => /(^|\/)page\.tsx$/.test(f) && !baseFiles.has(f)
);

const matched = new Map(); // classId → matched signals
for (const cls of CLASSES) {
  const hits = [];
  for (const f of changed) {
    if (cls.signals.some((prefix) => f.startsWith(prefix) || f === prefix.replace(/\/$/, ''))) hits.push(f);
  }
  if (cls.newRouteFiles && newRoutes.length) hits.push(...newRoutes);
  if (hits.length || (cls.fallback && !matched.size)) matched.set(cls.id, hits);
}

// Precedence: the most demanding class present wins.
const winner =
  ['token-amendment', 'pattern-change', 'route-within-patterns', 'copy-a11y'].find(
    (id) => matched.has(id) && (matched.get(id).length || matched.get(id) === undefined)
  ) || 'copy-a11y';
const cls = CLASSES.find((c) => c.id === winner);
const winnerHits = (matched.get(winner) || []).slice(0, 6);

console.log(`
W-DS sign-off matrix (§5) — LIVE classification
  range:  ${BASE.slice(0, 12)}..HEAD (${changed.length} file(s) changed)
  class:  ${cls.id}
  gates:  ${cls.gates}
  approver: ${cls.approver}
  signals: ${winnerHits.length ? winnerHits.join(', ') : 'fallback (no class-specific paths)'}
${newRoutes.length ? `  new routes: ${newRoutes.join(', ')}` : ''}
`);

if (CHECK) {
  if (cls.approver === 'Owner') {
    const logRecorded = changed.includes(SIGNOFF_LOG) && fs.existsSync(path.join(ROOT, SIGNOFF_LOG));
    if (!logRecorded) {
      console.error(`✗ signoff --check FAILED:
  This push is classified "${cls.id}" (approver: Owner) but does not touch
  ${SIGNOFF_LOG}. Record the owner's approval as a new dated entry in the
  SAME push (chat approval first, ledger entry with it — documents travel
  with the code), then push again.`);
      process.exit(1);
    }
    const log = fs.readFileSync(path.join(ROOT, SIGNOFF_LOG), 'utf8');
    // Timezone-tolerant freshness: an entry dated within ±1 day of the HEAD
    // commit's date satisfies the check (session zones vs git/CI UTC).
    const commitDate = new Date(execFileSync('git', ['log', '-1', '--format=%cI'], { cwd: ROOT, encoding: 'utf8' }).trim());
    const entryDates = [...log.matchAll(/^### (\d{4}-\d{2}-\d{2})/gm)].map((m) => new Date(m[1] + 'T00:00:00Z'));
    const fresh = entryDates.some(
      (d) => Math.abs(d - commitDate) <= 36 * 60 * 60 * 1000
    );
    if (!fresh) {
      console.error(`✗ signoff --check FAILED: ${SIGNOFF_LOG} changed, but no entry dated within ±1 day of the HEAD commit (${commitDate.toISOString().slice(0, 10)}) was found.`);
      process.exit(1);
    }
    console.log(`✓ signoff --check PASS — owner approval recorded in ${SIGNOFF_LOG} (fresh entry vs ${commitDate.toISOString().slice(0, 10)}).`);
  } else {
    console.log(`✓ signoff --check PASS — "${cls.id}" is Reviewer-approved (gates: ${cls.gates}).`);
  }
}
