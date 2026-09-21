import type {
  CodeCheckResult,
  CodeChecks,
  CodeDiffHunk,
  CodeFileChange,
  CodeImpact,
  CodePlan,
  CodePlanStep,
  CodeProposal,
} from "@minsaj/contracts/services";
import { codeStepBlueprints, buildCodePlanSteps, planRationaleKeyFor } from "./projects";

/**
 * Code plan, proposal, diff, checks, and impact rules — U2.4.
 *
 * Every rule below is deterministic and documented:
 *
 * 1. a plan is built from the scope's task template; excluding a step never
 *    deletes it (it keeps its identity and reason) and reordering is a swap;
 * 2. the proposal is derived from the *included* steps only — an excluded step
 *    contributes no file change and no hunk;
 * 3. risk notes are rules, not guesses: a plan touching code without a test
 *    step declares `risk_no_test`, route wiring declares `risk_wide_route`,
 *    doc updates declare `risk_docs_drift`, and nothing else is a risk;
 * 4. the four static checks are local rules over the included steps — no tool
 *    runs, ever; `warn` is honest and visible, `fail` is reserved for an
 *    empty plan which cannot reach this stage;
 * 5. the impact summary is the sum of the included steps' additions and
 *    deletions plus the check tallies, so the receipt cannot disagree with
 *    the plan the user actually approved.
 */

export function buildCodePlan(projectId: string, taskType: "build" | "fix" | "review" | "learn"): CodePlan {
  const steps = buildCodePlanSteps(projectId, taskType);
  return {
    steps,
    rationaleKeys: [planRationaleKeyFor(taskType)],
    revisedByUser: false,
  };
}

export function reorderCodePlanStep(plan: CodePlan, stepId: string, direction: "up" | "down"): CodePlan {
  const index = plan.steps.findIndex((step) => step.id === stepId);
  if (index === -1) {
    return plan;
  }
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= plan.steps.length) {
    return plan;
  }
  const steps = [...plan.steps];
  const [moved] = steps.splice(index, 1);
  steps.splice(target, 0, moved);
  return { ...plan, steps, revisedByUser: true };
}

export function excludeCodePlanStep(plan: CodePlan, stepId: string, reasonKey: string): CodePlan {
  const steps = plan.steps.map((step) =>
    step.id === stepId ? { ...step, included: false, exclusionReasonKey: reasonKey } : step,
  );
  return { ...plan, steps, revisedByUser: true };
}

export function restoreCodePlanStep(plan: CodePlan, stepId: string): CodePlan {
  const steps = plan.steps.map((step) =>
    step.id === stepId ? { ...step, included: true, exclusionReasonKey: null } : step,
  );
  return { ...plan, steps, revisedByUser: true };
}

/** Included steps, in plan order — the only steps that can reach the proposal. */
export function activeCodePlanSteps(plan: CodePlan): readonly CodePlanStep[] {
  return plan.steps.filter((step) => step.included);
}

export function buildCodeProposal(plan: CodePlan): CodeProposal {
  const included = activeCodePlanSteps(plan);
  const fileChanges: CodeFileChange[] = [];
  const diffHunks: CodeDiffHunk[] = [];
  const byPath = new Map<string, CodeFileChange>();

  for (const step of included) {
    const blueprint = codeStepBlueprints[step.id];
    if (blueprint === undefined) {
      continue;
    }
    const existing = byPath.get(blueprint.filePath);
    if (existing === undefined) {
      const change: CodeFileChange = {
        path: blueprint.filePath,
        change: blueprint.action === "create" ? "added" : blueprint.action === "delete" ? "deleted" : "modified",
        additions: blueprint.additions,
        deletions: blueprint.deletions,
      };
      byPath.set(blueprint.filePath, change);
      fileChanges.push(change);
    } else {
      byPath.set(blueprint.filePath, {
        ...existing,
        additions: existing.additions + blueprint.additions,
        deletions: existing.deletions + blueprint.deletions,
      });
    }
    diffHunks.push({
      filePath: blueprint.filePath,
      header: `@@ -1,3 +1,${3 + blueprint.additions} @@`,
      lines: blueprint.hunk.map((line) => ({ type: line.type, text: line.text })),
    });
  }

  return {
    fileChanges: [...byPath.values()],
    diffHunks,
    riskNoteKeys: riskNotesFor(included),
  };
}

/** Documented risk rules — see the module docstring, rule 3. */
export function riskNotesFor(steps: readonly CodePlanStep[]): string[] {
  const ids = new Set(steps.map((step) => step.id));
  const risks: string[] = [];
  const hasTest = ids.has("cod_write_test");
  const touchesCode = [...ids].some((id) => id !== "cod_update_docs");
  if (touchesCode && !hasTest) {
    risks.push("services.code.risks.risk_no_test");
  }
  if (ids.has("cod_wire_route")) {
    risks.push("services.code.risks.risk_wide_route");
  }
  if (ids.has("cod_update_docs")) {
    risks.push("services.code.risks.risk_docs_drift");
  }
  return risks.length === 0 ? ["services.code.risks.risk_none"] : risks;
}

export function buildCodeChecks(plan: CodePlan): CodeChecks {
  const ids = new Set(activeCodePlanSteps(plan).map((step) => step.id));
  const hasTest = ids.has("cod_write_test");
  const hasWire = ids.has("cod_wire_route");
  const results: CodeCheckResult[] = [
    { id: "check_format", nameKey: "services.code.checks.check_format", status: "pass", detailKey: "services.code.checkDetails.check_format_pass", durationMs: 40 },
    {
      id: "check_lint",
      nameKey: "services.code.checks.check_lint",
      status: hasWire && !hasTest ? "warn" : "pass",
      detailKey: hasWire && !hasTest ? "services.code.checkDetails.check_lint_warn" : "services.code.checkDetails.check_lint_pass",
      durationMs: 65,
    },
    { id: "check_types", nameKey: "services.code.checks.check_types", status: "pass", detailKey: "services.code.checkDetails.check_types_pass", durationMs: 120 },
    {
      id: "check_smoke",
      nameKey: "services.code.checks.check_smoke",
      status: hasTest ? "pass" : "warn",
      detailKey: hasTest ? "services.code.checkDetails.check_smoke_pass" : "services.code.checkDetails.check_smoke_warn",
      durationMs: 90,
    },
  ];
  return { results, acknowledged: false };
}

export function buildCodeImpact(plan: CodePlan, checks: CodeChecks): CodeImpact {
  const included = activeCodePlanSteps(plan);
  const additions = included.reduce((sum, step) => sum + (codeStepBlueprints[step.id]?.additions ?? 0), 0);
  const deletions = included.reduce((sum, step) => sum + (codeStepBlueprints[step.id]?.deletions ?? 0), 0);
  const paths = new Set(included.map((step) => codeStepBlueprints[step.id]?.filePath ?? step.filePath));
  return {
    filesChanged: paths.size,
    additions,
    deletions,
    checksPassed: checks.results.filter((result) => result.status === "pass").length,
    checksWarned: checks.results.filter((result) => result.status === "warn").length,
    checksFailed: checks.results.filter((result) => result.status === "fail").length,
  };
}

/** Fast mode adopts the proposed plan without a review round-trip. */
export function adoptCodePlanAsIs(plan: CodePlan): CodePlan {
  return { ...plan, revisedByUser: false };
}
