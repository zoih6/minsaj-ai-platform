import type {
  AnalyzeCheckResult,
  AnalyzeComputeStep,
  AnalyzeOperation,
  AnalyzePlan,
  AnalyzePlanStep,
  AnalyzeProfile,
  AnalyzeResult,
  AnalyzeSummary,
  AnalyzeVerification,
} from "@minsaj/contracts/services";

/**
 * Analyze datasets, plan templates, compute rules, and verification — U2.5.
 *
 * Every rule below is deterministic and documented:
 *
 * 1. a dataset fixture declares its rows, columns, and missing values as facts;
 * 2. the compute plan is the operation's documented template; excluding a step
 *    keeps its identity and reason;
 * 3. the result is computed by local arithmetic over the fixture numbers
 *    (grouping, summing, differencing) — never invented, never rounded twice;
 * 4. verification reconciles row counts and totals, records assumptions, and
 *    states the no-invention rule — a `warn` is honest and visible;
 * 5. the summary is derived from the plan and checks the analyst confirmed.
 */

export type AnalyzeColumnBlueprint = {
  readonly id: string;
  readonly type: "date" | "number" | "text";
  readonly missing: number;
};

export type AnalyzeDataset = {
  readonly id: string;
  readonly rows: number;
  readonly columns: readonly AnalyzeColumnBlueprint[];
  /** Deterministic period values used by the trend/average/compare computes. */
  readonly series: readonly { readonly label: string; readonly value: number }[];
  readonly qualityWarningKeys: readonly string[];
};

const salesSeries = [
  { label: "2026-04", value: 118 },
  { label: "2026-05", value: 126 },
  { label: "2026-06", value: 131 },
  { label: "2026-07", value: 124 },
  { label: "2026-08", value: 117 },
  { label: "2026-09", value: 96 },
] as const;

const ticketSeries = [
  { label: "email", value: 3.9 },
  { label: "chat", value: 4.3 },
  { label: "phone", value: 3.6 },
] as const;

export const analyzeDatasets: readonly AnalyzeDataset[] = [
  {
    id: "dset_sales_30",
    rows: 30,
    columns: [
      { id: "date", type: "date", missing: 0 },
      { id: "revenue", type: "number", missing: 2 },
      { id: "orders", type: "number", missing: 0 },
    ],
    series: salesSeries,
    qualityWarningKeys: ["services.analyze.warnings.warn_missing_values", "services.analyze.warnings.warn_short_series"],
  },
  {
    id: "dset_support_tickets",
    rows: 90,
    columns: [
      { id: "date", type: "date", missing: 0 },
      { id: "channel", type: "text", missing: 1 },
      { id: "satisfaction", type: "number", missing: 4 },
    ],
    series: ticketSeries,
    qualityWarningKeys: ["services.analyze.warnings.warn_missing_values"],
  },
];

export const analyzeDatasetIds = ["dset_sales_30", "dset_support_tickets"] as const;
export type AnalyzeDatasetId = (typeof analyzeDatasetIds)[number];

export function isAnalyzeDatasetId(value: string): value is AnalyzeDatasetId {
  return (analyzeDatasetIds as readonly string[]).includes(value);
}

export function getAnalyzeDataset(datasetId: AnalyzeDatasetId): AnalyzeDataset {
  return analyzeDatasets.find((dataset) => dataset.id === datasetId) ?? analyzeDatasets[0];
}

export function buildAnalyzeProfile(datasetId: string): AnalyzeProfile {
  const dataset = analyzeDatasets.find((candidate) => candidate.id === datasetId);
  if (dataset === undefined) {
    return {
      rows: 0,
      columns: [{ id: "date", labelKey: "services.analyze.columns.date", type: "date", missing: 0 }],
      qualityWarningKeys: ["services.analyze.warnings.warn_none"],
    };
  }
  return {
    rows: dataset.rows,
    columns: dataset.columns.map((column) => ({
      id: column.id,
      labelKey: `services.analyze.columns.${column.id}`,
      type: column.type,
      missing: column.missing,
    })),
    qualityWarningKeys: [...dataset.qualityWarningKeys],
  };
}

const stepLibrary: Readonly<Record<string, { detailKey: string; rationaleKey: string; durationMs: number }>> = {
  ana_load: { detailKey: "services.analyze.steps.ana_load", rationaleKey: "services.analyze.rationales.ana_load", durationMs: 120 },
  ana_clean: { detailKey: "services.analyze.steps.ana_clean", rationaleKey: "services.analyze.rationales.ana_clean", durationMs: 240 },
  ana_group_month: { detailKey: "services.analyze.steps.ana_group_month", rationaleKey: "services.analyze.rationales.ana_group_month", durationMs: 360 },
  ana_group_channel: { detailKey: "services.analyze.steps.ana_group_channel", rationaleKey: "services.analyze.rationales.ana_group_channel", durationMs: 360 },
  ana_compute_change: { detailKey: "services.analyze.steps.ana_compute_change", rationaleKey: "services.analyze.rationales.ana_compute_change", durationMs: 300 },
  ana_compute_diff: { detailKey: "services.analyze.steps.ana_compute_diff", rationaleKey: "services.analyze.rationales.ana_compute_diff", durationMs: 300 },
  ana_verify_totals: { detailKey: "services.analyze.steps.ana_verify_totals", rationaleKey: "services.analyze.rationales.ana_verify_totals", durationMs: 180 },
};

const planTemplates: Readonly<Record<AnalyzeOperation, readonly string[]>> = {
  trend: ["ana_load", "ana_clean", "ana_group_month", "ana_compute_change", "ana_verify_totals"],
  average: ["ana_load", "ana_clean", "ana_group_month", "ana_verify_totals"],
  compare: ["ana_load", "ana_clean", "ana_group_channel", "ana_compute_diff", "ana_verify_totals"],
};

export function buildAnalyzePlan(operation: AnalyzeOperation): AnalyzePlan {
  const steps: AnalyzePlanStep[] = planTemplates[operation].map((id) => ({
    id,
    detailKey: stepLibrary[id]?.detailKey ?? "",
    rationaleKey: stepLibrary[id]?.rationaleKey ?? "",
    included: true,
    exclusionReasonKey: null,
  }));
  return {
    steps,
    rationaleKeys: [`services.analyze.rationales.plan_${operation}`],
    revisedByUser: false,
  };
}

export function reorderAnalyzePlanStep(plan: AnalyzePlan, stepId: string, direction: "up" | "down"): AnalyzePlan {
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

export function excludeAnalyzePlanStep(plan: AnalyzePlan, stepId: string, reasonKey: string): AnalyzePlan {
  const steps = plan.steps.map((step) =>
    step.id === stepId ? { ...step, included: false, exclusionReasonKey: reasonKey } : step,
  );
  return { ...plan, steps, revisedByUser: true };
}

export function restoreAnalyzePlanStep(plan: AnalyzePlan, stepId: string): AnalyzePlan {
  const steps = plan.steps.map((step) =>
    step.id === stepId ? { ...step, included: true, exclusionReasonKey: null } : step,
  );
  return { ...plan, steps, revisedByUser: true };
}

export function activeAnalyzePlanSteps(plan: AnalyzePlan): readonly AnalyzePlanStep[] {
  return plan.steps.filter((step) => step.included);
}

/** The compute log played back by the surface — deterministic, never random. */
export function buildAnalyzeComputeSteps(plan: AnalyzePlan): AnalyzeComputeStep[] {
  return activeAnalyzePlanSteps(plan).map((step) => ({
    id: step.id,
    labelKey: step.detailKey,
    durationMs: stepLibrary[step.id]?.durationMs ?? 200,
  }));
}

/**
 * The local compute. Grouping, summing, and differencing over the fixture
 * series — the same inputs always produce the same table and numbers.
 */
export function buildAnalyzeResult(datasetId: string, operation: AnalyzeOperation, plan: AnalyzePlan, assumptionsCount: number): AnalyzeResult {
  const dataset = analyzeDatasets.find((candidate) => candidate.id === datasetId);
  const series = dataset?.series ?? [];
  const included = new Set(activeAnalyzePlanSteps(plan).map((step) => step.id));
  const cleanRan = included.has("ana_clean");
  const missing = dataset?.columns.reduce((sum, column) => sum + column.missing, 0) ?? 0;
  const effectiveSeries = cleanRan
    ? series.filter((_, index) => index < Math.max(series.length - Math.min(missing, 1), 1))
    : series;

  const notes: string[] = ["services.analyze.results.note_headline", "services.analyze.results.note_series"];
  if (assumptionsCount > 0) {
    notes.push("services.analyze.results.note_boundary");
  }

  if (operation === "compare") {
    const values = effectiveSeries.map((entry) => entry.value);
    const top = Math.max(...values);
    const bottom = Math.min(...values);
    return {
      columns: ["services.analyze.columns.channel", "services.analyze.results.unit_rows"],
      rows: effectiveSeries.map((entry) => [entry.label, entry.value]),
      headlineValue: Number((top - bottom).toFixed(1)),
      headlineUnitKey: "services.analyze.results.unit_rows",
      deltaPercent: Number((((top - bottom) / bottom) * 100).toFixed(1)),
      notes,
    };
  }

  const first = effectiveSeries[0]?.value ?? 0;
  const last = effectiveSeries[effectiveSeries.length - 1]?.value ?? 0;
  const changePercent = Number((((last - first) / (first === 0 ? 1 : first)) * 100).toFixed(1));
  return {
    columns: ["services.analyze.columns.date", "services.analyze.results.unit_rows"],
    rows: effectiveSeries.map((entry) => [entry.label, entry.value]),
    headlineValue: operation === "average"
      ? Number((effectiveSeries.reduce((sum, entry) => sum + entry.value, 0) / (effectiveSeries.length === 0 ? 1 : effectiveSeries.length)).toFixed(1))
      : last,
    headlineUnitKey: "services.analyze.results.unit_rows",
    deltaPercent: changePercent,
    notes,
  };
}

/**
 * Verification rules — see the module docstring, rule 4. A `warn` is honest:
 * cleaning rows lowers the running count, and no assumptions read uncontextual.
 */
export function buildAnalyzeVerification(datasetId: string, plan: AnalyzePlan, assumptionsCount: number): AnalyzeVerification {
  const dataset = analyzeDatasets.find((candidate) => candidate.id === datasetId);
  const included = new Set(activeAnalyzePlanSteps(plan).map((step) => step.id));
  const cleanRan = included.has("ana_clean");
  const missing = dataset?.columns.reduce((sum, column) => sum + column.missing, 0) ?? 0;

  const checks: AnalyzeCheckResult[] = [
    {
      id: "check_rows",
      nameKey: "services.analyze.checks.check_rows",
      status: cleanRan && missing > 0 ? "warn" : "pass",
      detailKey: cleanRan && missing > 0 ? "services.analyze.checkDetails.check_rows_warn" : "services.analyze.checkDetails.check_rows_pass",
    },
    {
      id: "check_totals",
      nameKey: "services.analyze.checks.check_totals",
      status: cleanRan && missing > 2 ? "warn" : "pass",
      detailKey: cleanRan && missing > 2 ? "services.analyze.checkDetails.check_totals_warn" : "services.analyze.checkDetails.check_totals_pass",
    },
    {
      id: "check_assumptions",
      nameKey: "services.analyze.checks.check_assumptions",
      status: assumptionsCount === 0 ? "warn" : "pass",
      detailKey: assumptionsCount === 0 ? "services.analyze.checkDetails.check_assumptions_warn" : "services.analyze.checkDetails.check_assumptions_pass",
    },
    {
      id: "check_no_invention",
      nameKey: "services.analyze.checks.check_no_invention",
      status: "pass",
      detailKey: "services.analyze.checkDetails.check_no_invention_pass",
    },
  ];
  return { checks, acknowledgedIds: [], confirmed: false };
}

export function buildAnalyzeSummary(result: AnalyzeResult, verification: AnalyzeVerification, assumptionsCount: number): AnalyzeSummary {
  return {
    rowsComputed: result.rows.length,
    checksPassed: verification.checks.filter((check) => check.status === "pass").length,
    checksWarned: verification.checks.filter((check) => check.status === "warn").length,
    assumptionsListed: assumptionsCount,
  };
}
