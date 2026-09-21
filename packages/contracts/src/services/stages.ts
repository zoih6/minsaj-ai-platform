import { z } from "zod";
import { serviceIdSchema, serviceStageStatusSchema, serviceIds, type ServiceId } from "./enums";
import { serviceStageIdSchema } from "./ids";
import { serviceLabelSchema } from "./text";

/**
 * Stage blueprint + stage instance.
 *
 * A stage is a visible domain phase (diagnostic, source review, diff review). It
 * is not an agent step or a tool-call attempt. `titleKey` resolves through the
 * typed i18n service namespaces so no language is hard-coded in the domain.
 */

export const serviceStageSchema = z.object({
  id: serviceStageIdSchema,
  serviceId: serviceIdSchema,
  key: z.string().min(3).max(40),
  index: z.number().int().nonnegative().max(24),
  status: serviceStageStatusSchema,
  titleKey: serviceLabelSchema,
  reviewPoint: z.boolean(),
});
export type ServiceStage = z.infer<typeof serviceStageSchema>;

export type ServiceStageBlueprint = {
  readonly key: string;
  readonly titleKey: string;
  readonly reviewPoint: boolean;
};

/**
 * Foundation stage blueprints. These mirror the stage tables of
 * docs/01-product/U2-SERVICE-DEPTH.md sections 11.3–16.3 so each domain has a
 * genuinely different sequence. Service slices own their stage behaviour; the
 * blueprint only fixes identity, order, and review points.
 */
export const serviceStageBlueprints: Record<ServiceId, readonly ServiceStageBlueprint[]> = {
  learn: [
    { key: "lrn_brief", titleKey: "services.learn.stages.lrn_brief", reviewPoint: false },
    { key: "lrn_diagnostic", titleKey: "services.learn.stages.lrn_diagnostic", reviewPoint: false },
    { key: "lrn_path_review", titleKey: "services.learn.stages.lrn_path_review", reviewPoint: true },
    { key: "lrn_lesson", titleKey: "services.learn.stages.lrn_lesson", reviewPoint: false },
    { key: "lrn_check", titleKey: "services.learn.stages.lrn_check", reviewPoint: false },
    { key: "lrn_feedback", titleKey: "services.learn.stages.lrn_feedback", reviewPoint: false },
    { key: "lrn_checkpoint", titleKey: "services.learn.stages.lrn_checkpoint", reviewPoint: true },
    { key: "lrn_complete", titleKey: "services.learn.stages.lrn_complete", reviewPoint: false },
  ],
  research: [
    { key: "rsh_brief", titleKey: "services.research.stages.rsh_brief", reviewPoint: false },
    { key: "rsh_clarify", titleKey: "services.research.stages.rsh_clarify", reviewPoint: false },
    { key: "rsh_plan_review", titleKey: "services.research.stages.rsh_plan_review", reviewPoint: true },
    { key: "rsh_source_activity", titleKey: "services.research.stages.rsh_source_activity", reviewPoint: false },
    { key: "rsh_source_review", titleKey: "services.research.stages.rsh_source_review", reviewPoint: true },
    { key: "rsh_claim_matrix", titleKey: "services.research.stages.rsh_claim_matrix", reviewPoint: true },
    { key: "rsh_report_edit", titleKey: "services.research.stages.rsh_report_edit", reviewPoint: false },
    { key: "rsh_complete", titleKey: "services.research.stages.rsh_complete", reviewPoint: false },
  ],
  create: [
    { key: "crt_format", titleKey: "services.create.stages.crt_format", reviewPoint: false },
    { key: "crt_brief", titleKey: "services.create.stages.crt_brief", reviewPoint: false },
    { key: "crt_structure", titleKey: "services.create.stages.crt_structure", reviewPoint: true },
    { key: "crt_variants", titleKey: "services.create.stages.crt_variants", reviewPoint: true },
    { key: "crt_edit", titleKey: "services.create.stages.crt_edit", reviewPoint: false },
    { key: "crt_review", titleKey: "services.create.stages.crt_review", reviewPoint: true },
    { key: "crt_version", titleKey: "services.create.stages.crt_version", reviewPoint: false },
    { key: "crt_complete", titleKey: "services.create.stages.crt_complete", reviewPoint: false },
  ],
  code: [
    { key: "cod_scope", titleKey: "services.code.stages.cod_scope", reviewPoint: false },
    { key: "cod_plan", titleKey: "services.code.stages.cod_plan", reviewPoint: true },
    { key: "cod_proposal", titleKey: "services.code.stages.cod_proposal", reviewPoint: false },
    { key: "cod_diff_review", titleKey: "services.code.stages.cod_diff_review", reviewPoint: true },
    { key: "cod_working_copy", titleKey: "services.code.stages.cod_working_copy", reviewPoint: false },
    { key: "cod_preview_checks", titleKey: "services.code.stages.cod_preview_checks", reviewPoint: true },
    { key: "cod_receipt", titleKey: "services.code.stages.cod_receipt", reviewPoint: false },
  ],
  analyze: [
    { key: "ana_source", titleKey: "services.analyze.stages.ana_source", reviewPoint: false },
    { key: "ana_profile", titleKey: "services.analyze.stages.ana_profile", reviewPoint: false },
    { key: "ana_question", titleKey: "services.analyze.stages.ana_question", reviewPoint: false },
    { key: "ana_plan", titleKey: "services.analyze.stages.ana_plan", reviewPoint: true },
    { key: "ana_compute", titleKey: "services.analyze.stages.ana_compute", reviewPoint: false },
    { key: "ana_result", titleKey: "services.analyze.stages.ana_result", reviewPoint: false },
    { key: "ana_verify", titleKey: "services.analyze.stages.ana_verify", reviewPoint: true },
    { key: "ana_complete", titleKey: "services.analyze.stages.ana_complete", reviewPoint: false },
  ],
  explore: [
    { key: "exp_seed", titleKey: "services.explore.stages.exp_seed", reviewPoint: false },
    { key: "exp_map", titleKey: "services.explore.stages.exp_map", reviewPoint: false },
    { key: "exp_node", titleKey: "services.explore.stages.exp_node", reviewPoint: false },
    { key: "exp_trail", titleKey: "services.explore.stages.exp_trail", reviewPoint: false },
    { key: "exp_checkpoint", titleKey: "services.explore.stages.exp_checkpoint", reviewPoint: true },
    { key: "exp_complete", titleKey: "services.explore.stages.exp_complete", reviewPoint: false },
  ],
};

export function getServiceStageBlueprints(serviceId: ServiceId): readonly ServiceStageBlueprint[] {
  return serviceStageBlueprints[serviceId];
}

export function getServiceStageBlueprint(serviceId: ServiceId, key: string): ServiceStageBlueprint | undefined {
  return serviceStageBlueprints[serviceId].find((stage) => stage.key === key);
}

/**
 * Builds the deterministic stage list for a session. Stage identity is derived
 * from the blueprint key, never from randomness or from wall-clock time.
 */
export function createServiceStages(serviceId: ServiceId, currentKey?: string): ServiceStage[] {
  const blueprints = getServiceStageBlueprints(serviceId);
  const activeIndex = currentKey ? blueprints.findIndex((stage) => stage.key === currentKey) : 0;
  const resolvedActive = activeIndex >= 0 ? activeIndex : 0;

  return blueprints.map((blueprint, index) => ({
    id: `stg_${blueprint.key}`,
    serviceId,
    key: blueprint.key,
    index,
    status: index < resolvedActive ? "completed" : index === resolvedActive ? "active" : "pending",
    titleKey: blueprint.titleKey,
    reviewPoint: blueprint.reviewPoint,
  }));
}

export function isKnownServiceId(value: string): value is ServiceId {
  return (serviceIds as readonly string[]).includes(value);
}
