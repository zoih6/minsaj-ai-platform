import type {
  ResearchAudience,
  ResearchClarifyAnswer,
  ResearchPlan,
  ResearchPlanAxis,
  ResearchScope,
  ResearchSourceType,
} from "@minsaj/contracts/services";
import { getResearchTopic, type ResearchTopicId } from "./topics";

/**
 * Deterministic research plan rules — U2.2.
 *
 * The whole planner is here, with no randomness, no clock, and no model call.
 * The same brief, clarify answers, and topic always produce the same axes,
 * source types, and timebox, and the rationale keys below are the complete
 * explanation of why:
 *
 * 1. axes come from the topic's declared axes, filtered by scope:
 *    - `recent` drops the `axis_history` axis (the past is out of scope);
 *    - `academic` swaps `axis_history` for `axis_methods` when both exist;
 *    - `broad` keeps every axis the topic declares;
 * 2. source types start from `internal_report + survey` and grow with audience:
 *    - `team` adds `news`, `public` adds `news + academic_paper`;
 *    - an `academic` scope adds `academic_paper` and drops `blog`;
 * 3. the timebox follows the scope: recent 15, broad 30, academic 30 minutes;
 * 4. a clarification answer can only mark a topic axis excluded — it never
 *    invents an axis that the fixture does not declare;
 * 5. Fast mode proposes the same plan but the surface states it is not
 *    clarified, so approval remains an explicit user act in both modes.
 */

export type ResearchPlanRequest = {
  readonly topicId: ResearchTopicId;
  readonly scope: ResearchScope;
  readonly audience: ResearchAudience;
  readonly clarifyAnswers: readonly ResearchClarifyAnswer[];
  readonly version: number;
};

const axisExcludedByClarify: Record<string, string> = {
  rsh_clarify_window: "axis_history",
  rsh_clarify_depth: "axis_methods",
};

export function buildResearchPlan(request: ResearchPlanRequest): ResearchPlan {
  const topic = getResearchTopic(request.topicId);
  const rationaleKeys: string[] = ["plan_rule_axes", "plan_rule_source_types"];

  let axes: ResearchPlanAxis[] = topic.axes.map((axis) => ({
    id: axis.id,
    labelKey: axis.labelKey,
    reasonKey: axis.reasonKey,
    included: true,
  }));

  if (request.scope === "recent") {
    axes = axes.filter((axis) => axis.id !== "axis_history");
    rationaleKeys.push("plan_rule_recent_drops_history");
  }
  if (request.scope === "academic") {
    const hasMethods = axes.some((axis) => axis.id === "axis_methods");
    if (hasMethods) {
      axes = axes.filter((axis) => axis.id !== "axis_history");
      rationaleKeys.push("plan_rule_academic_prefers_methods");
    }
  }
  if (axes.length > 0 && request.scope === "broad") {
    rationaleKeys.push("plan_rule_broad_keeps_all");
  }

  // A clarification answer may exclude one axis; the exclusion is visible in
  // the plan review with its recorded reason, never silent.
  for (const answer of request.clarifyAnswers) {
    const excludedAxis = axisExcludedByClarify[answer.questionId];
    if (excludedAxis === undefined) continue;
    if (answer.choiceKey === null || answer.choiceKey.endsWith("c1")) continue;
    axes = axes.map((axis) => (axis.id === excludedAxis ? { ...axis, included: false } : axis));
    rationaleKeys.push(`plan_rule_clarify_excluded_${excludedAxis}`);
  }
  if (axes.length === 0) {
    // Never an empty plan: the first declared axis stays, with its reason.
    const fallback = topic.axes[0];
    if (fallback !== undefined) {
      axes = [{ id: fallback.id, labelKey: fallback.labelKey, reasonKey: fallback.reasonKey, included: true }];
      rationaleKeys.push("plan_rule_minimum_one_axis");
    }
  }

  const sourceTypes: ResearchSourceType[] = ["internal_report", "survey"];
  if (request.audience === "team" || request.audience === "public") {
    sourceTypes.push("news");
    rationaleKeys.push("plan_rule_audience_adds_news");
  }
  if (request.audience === "public") {
    sourceTypes.push("academic_paper");
    rationaleKeys.push("plan_rule_audience_public_adds_paper");
  }
  if (request.scope === "academic") {
    if (!sourceTypes.includes("academic_paper")) sourceTypes.push("academic_paper");
    rationaleKeys.push("plan_rule_scope_academic_adds_paper");
  }

  const timeboxMinutes = request.scope === "recent" ? 15 : 30;
  rationaleKeys.push(request.scope === "recent" ? "plan_rule_timebox_recent" : "plan_rule_timebox_deep");

  return {
    version: request.version,
    axes: axes.slice(0, 6),
    sourceTypes: [...new Set(sourceTypes)].slice(0, 6),
    includeHints: [`plan_hint_${request.topicId}`],
    excludeHints: [],
    timeboxMinutes,
    rationaleKeys: [...new Set(rationaleKeys)].slice(0, 6),
    revisedByUser: false,
  };
}
