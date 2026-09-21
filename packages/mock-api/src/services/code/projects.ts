import type { CodePlanStep, CodeTaskType } from "@minsaj/contracts/services";

/**
 * Code project fixtures and plan templates — U2.4.
 *
 * Structure and numeric facts live here; every human-readable string is an i18n
 * key resolved by `@minsaj/i18n/services`. Nothing is fetched, generated, or
 * checked by a real tool: the step tables below are the whole plan model and
 * they are documented in page-specs D-4.
 */

export type CodeStepBlueprint = {
  readonly id: string;
  readonly filePath: string;
  readonly action: "create" | "modify" | "delete";
  readonly additions: number;
  readonly deletions: number;
  /** Diff lines for the proposal hunks; pure code, locale-free by design. */
  readonly hunk: readonly { readonly type: "context" | "added" | "removed"; readonly text: string }[];
};

export type CodeProject = {
  readonly id: string;
  readonly files: readonly string[];
  /** Plan template per task type; order is the proposed order. */
  readonly plans: Readonly<Record<CodeTaskType, readonly string[]>>;
};

const validateHunk = [
  { type: "context", text: "export function save(input) {" },
  { type: "removed", text: "  return store(input);" },
  { type: "added", text: "  if (!isValid(input)) throw new InvalidInput(input);" },
  { type: "added", text: "  return store(input);" },
] as const;

const saveHunk = [
  { type: "context", text: "export function save(input) {" },
  { type: "added", text: "  assert(input !== null && input !== undefined);" },
  { type: "context", text: "  return store(input);" },
] as const;

const testHunk = [
  { type: "added", text: "describe(\"save\", () => {" },
  { type: "added", text: "  it(\"rejects an empty value\", () => {" },
  { type: "added", text: "    expect(() => save(\"\")).toThrow(InvalidInput);" },
  { type: "added", text: "  });" },
] as const;

const moduleHunk = [
  { type: "added", text: "export class Feature {" },
  { type: "added", text: "  constructor(private readonly store: Store) {}" },
  { type: "added", text: "  run(input: Input): Output { return this.store.apply(input); }" },
  { type: "added", text: "}" },
] as const;

const wireHunk = [
  { type: "context", text: "router.post(\"/checkout\", async (req, res) => {" },
  { type: "removed", text: "  return res.json({ ok: save(req.body) });" },
  { type: "added", text: "  const feature = new Feature(store);" },
  { type: "added", text: "  return res.json({ ok: feature.run(req.body) });" },
] as const;

const docsHunk = [
  { type: "context", text: "## Usage" },
  { type: "added", text: "- `save` rejects empty values with `InvalidInput`." },
  { type: "added", text: "- See `tests/checkout.test.ts` for the covered cases." },
] as const;

const auditHunk = [
  { type: "context", text: "export function transform(rows) {" },
  { type: "added", text: "  // legacy call site: migrate before the next release" },
  { type: "context", text: "  return rows.map(normalize);" },
] as const;

const commentsHunk = [
  { type: "context", text: "export function ingest(chunk) {" },
  { type: "added", text: "  // 1. decode, 2. validate, 3. append — order matters" },
  { type: "context", text: "  return append(validate(decode(chunk)));" },
] as const;

/** The step library: one blueprint per stable step identity. */
export const codeStepBlueprints: Readonly<Record<string, CodeStepBlueprint>> = {
  cod_validate_input: { id: "cod_validate_input", filePath: "src/validation.ts", action: "modify", additions: 9, deletions: 2, hunk: validateHunk },
  cod_fix_save: { id: "cod_fix_save", filePath: "src/validation.ts", action: "modify", additions: 4, deletions: 1, hunk: saveHunk },
  cod_write_test: { id: "cod_write_test", filePath: "tests/checkout.test.ts", action: "create", additions: 14, deletions: 0, hunk: testHunk },
  cod_new_module: { id: "cod_new_module", filePath: "src/feature.ts", action: "create", additions: 11, deletions: 0, hunk: moduleHunk },
  cod_wire_route: { id: "cod_wire_route", filePath: "src/routes/checkout.ts", action: "modify", additions: 7, deletions: 3, hunk: wireHunk },
  cod_update_docs: { id: "cod_update_docs", filePath: "README.md", action: "modify", additions: 6, deletions: 0, hunk: docsHunk },
  cod_audit_usage: { id: "cod_audit_usage", filePath: "src/transform.ts", action: "modify", additions: 3, deletions: 0, hunk: auditHunk },
  cod_add_comments: { id: "cod_add_comments", filePath: "src/ingest.ts", action: "modify", additions: 2, deletions: 0, hunk: commentsHunk },
};

export const codeProjects: readonly CodeProject[] = [
  {
    id: "cprj_web_checkout",
    files: ["src/validation.ts", "src/routes/checkout.ts", "tests/checkout.test.ts", "README.md"],
    plans: {
      fix: ["cod_validate_input", "cod_fix_save", "cod_write_test"],
      build: ["cod_new_module", "cod_wire_route", "cod_write_test", "cod_update_docs"],
      review: ["cod_audit_usage", "cod_update_docs"],
      learn: ["cod_add_comments", "cod_write_test"],
    },
  },
  {
    id: "cprj_data_pipeline",
    files: ["src/ingest.ts", "src/transform.ts", "tests/transform.test.ts"],
    plans: {
      fix: ["cod_add_comments", "cod_write_test"],
      build: ["cod_audit_usage", "cod_write_test", "cod_update_docs"],
      review: ["cod_audit_usage"],
      learn: ["cod_add_comments"],
    },
  },
];

export const codeProjectIds = ["cprj_web_checkout", "cprj_data_pipeline"] as const;
export type CodeProjectId = (typeof codeProjectIds)[number];

export function isCodeProjectId(value: string): value is CodeProjectId {
  return (codeProjectIds as readonly string[]).includes(value);
}

export function getCodeProject(projectId: CodeProjectId): CodeProject {
  return codeProjects.find((project) => project.id === projectId) ?? codeProjects[0];
}

/** Plan rationale key for a task type — the documented "why this shape". */
export function planRationaleKeyFor(taskType: CodeTaskType): string {
  return `services.code.rationales.plan_${taskType}`;
}

/** Builds the proposed steps for a scope, in template order. */
export function buildCodePlanSteps(projectId: string, taskType: CodeTaskType): CodePlanStep[] {
  const project = codeProjects.find((candidate) => candidate.id === projectId);
  const template = project?.plans[taskType] ?? ["cod_update_docs"];
  return template.map((stepId) => {
    const blueprint = codeStepBlueprints[stepId];
    return {
      id: blueprint.id,
      filePath: blueprint.filePath,
      action: blueprint.action,
      detailKey: `services.code.steps.${blueprint.id}`,
      rationaleKey: `services.code.rationales.${blueprint.id}`,
      included: true,
      exclusionReasonKey: null,
    };
  });
}
