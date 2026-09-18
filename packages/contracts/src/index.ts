import { z } from "zod";

export const localeSchema = z.enum(["ar", "en"]);
export type Locale = z.infer<typeof localeSchema>;

export const runStatusSchema = z.enum([
  "queued",
  "planning",
  "running",
  "waiting_for_input",
  "waiting_for_approval",
  "completed",
  "completed_with_warnings",
  "failed_retryable",
  "cancelled",
]);
export type RunStatus = z.infer<typeof runStatusSchema>;

export const localizedTextSchema = z.object({
  ar: z.string(),
  en: z.string(),
});
export type LocalizedText = z.infer<typeof localizedTextSchema>;

export const moneySchema = z.object({
  amountMinor: z.number().int().safe(),
  currency: z.string().min(3).max(3),
});
export type Money = z.infer<typeof moneySchema>;

export const modelSummarySchema = z.object({
  id: z.string().startsWith("mdl_"),
  name: z.string(),
  provider: z.string(),
  status: z.enum(["available", "degraded", "unavailable"]),
  relativeSpeed: z.enum(["fast", "balanced", "slow"]),
  relativeCost: z.enum(["low", "medium", "high"]),
});
export type ModelSummary = z.infer<typeof modelSummarySchema>;

export const runSummarySchema = z.object({
  id: z.string().startsWith("run_"),
  title: localizedTextSchema,
  kind: z.enum(["agent", "flow"]),
  status: runStatusSchema,
  progress: z.number().min(0).max(100).optional(),
  updatedAt: z.string(),
  cost: moneySchema,
});
export type RunSummary = z.infer<typeof runSummarySchema>;

export const projectSummarySchema = z.object({
  id: z.string().startsWith("prj_"),
  name: localizedTextSchema,
  description: localizedTextSchema,
  activeRuns: z.number().int().nonnegative(),
  conversations: z.number().int().nonnegative(),
  updatedAt: z.string(),
});
export type ProjectSummary = z.infer<typeof projectSummarySchema>;

export const approvalSummarySchema = z.object({
  id: z.string().startsWith("apr_"),
  title: localizedTextSchema,
  risk: z.enum(["write_internal", "external_side_effect", "destructive"]),
  expiresAt: z.string(),
  runId: z.string().startsWith("run_"),
});
export type ApprovalSummary = z.infer<typeof approvalSummarySchema>;

export const homeSnapshotSchema = z.object({
  workspace: z.object({
    id: z.string().startsWith("ws_"),
    name: localizedTextSchema,
  }),
  balance: z.object({
    available: moneySchema,
    usedPercent: z.number().min(0).max(100),
    payer: z.enum(["platform_credits", "byok", "mixed"]),
  }),
  activeRuns: z.array(runSummarySchema),
  approvals: z.array(approvalSummarySchema),
  recentProjects: z.array(projectSummarySchema),
  suggestedModels: z.array(modelSummarySchema),
});
export type HomeSnapshot = z.infer<typeof homeSnapshotSchema>;

export const agentStatusSchema = z.enum(["draft", "published", "archived"]);
export type AgentStatus = z.infer<typeof agentStatusSchema>;

export const agentSummarySchema = z.object({
  id: z.string().startsWith("agt_"),
  name: localizedTextSchema,
  description: localizedTextSchema,
  status: agentStatusSchema,
  version: z.number().int().positive(),
  model: z.string(),
  toolCount: z.number().int().nonnegative(),
  runCount: z.number().int().nonnegative(),
  updatedAt: z.string(),
  projectIds: z.array(z.string().startsWith("prj_")),
});
export type AgentSummary = z.infer<typeof agentSummarySchema>;

export const toolRiskSchema = z.enum(["read", "write_internal", "external_side_effect", "destructive"]);
export type ToolRisk = z.infer<typeof toolRiskSchema>;

export const agentDefinitionSchema = z.object({
  summary: agentSummarySchema,
  objective: localizedTextSchema,
  instructions: localizedTextSchema,
  modelPolicy: z.object({
    primary: z.string(),
    fallback: z.string(),
    payer: z.enum(["platform_credits", "byok"]),
  }),
  knowledge: z.array(z.object({ id: z.string(), name: localizedTextSchema, sourceCount: z.number().int().nonnegative() })),
  tools: z.array(z.object({ id: z.string(), name: localizedTextSchema, risk: toolRiskSchema, enabled: z.boolean() })),
  approvalPolicy: z.enum(["always_external", "workspace_policy", "manual_only"]),
  budgetLimit: moneySchema,
});
export type AgentDefinition = z.infer<typeof agentDefinitionSchema>;

export const flowStatusSchema = z.enum(["draft", "published", "archived"]);
export type FlowStatus = z.infer<typeof flowStatusSchema>;

export const flowSummarySchema = z.object({
  id: z.string().startsWith("flw_"),
  name: localizedTextSchema,
  description: localizedTextSchema,
  status: flowStatusSchema,
  version: z.number().int().positive(),
  nodeCount: z.number().int().positive(),
  runCount: z.number().int().nonnegative(),
  activeRuns: z.number().int().nonnegative(),
  updatedAt: z.string(),
  projectId: z.string().startsWith("prj_"),
});
export type FlowSummary = z.infer<typeof flowSummarySchema>;

export const flowNodeSchema = z.object({
  id: z.string().startsWith("node_"),
  type: z.enum(["input", "agent", "transform", "approval", "output"]),
  label: localizedTextSchema,
  description: localizedTextSchema,
});
export type FlowNode = z.infer<typeof flowNodeSchema>;

export const flowDefinitionSchema = z.object({
  summary: flowSummarySchema,
  nodes: z.array(flowNodeSchema),
  edges: z.array(z.object({ from: z.string().startsWith("node_"), to: z.string().startsWith("node_") })),
  validation: z.object({ errors: z.number().int().nonnegative(), warnings: z.number().int().nonnegative() }),
});
export type FlowDefinition = z.infer<typeof flowDefinitionSchema>;

export const runStepSchema = z.object({
  id: z.string().startsWith("step_"),
  label: localizedTextSchema,
  kind: z.enum(["plan", "model", "tool", "approval", "artifact"]),
  status: z.enum(["queued", "running", "completed", "waiting_for_approval", "skipped", "failed"]),
  detail: localizedTextSchema,
  cost: moneySchema,
});
export type RunStep = z.infer<typeof runStepSchema>;

export const runEventSchema = z.object({
  sequence: z.number().int().positive(),
  occurredAt: z.string(),
  kind: z.enum(["created", "status", "plan", "tool", "approval", "artifact", "cost"]),
  label: localizedTextSchema,
  detail: localizedTextSchema,
});
export type RunEvent = z.infer<typeof runEventSchema>;

export const approvalDetailSchema = approvalSummarySchema.extend({
  status: z.enum(["pending", "approved", "denied", "expired"]),
  explanation: localizedTextSchema,
  payloadPreview: localizedTextSchema,
  actionDigest: z.string().startsWith("sha256:"),
});
export type ApprovalDetail = z.infer<typeof approvalDetailSchema>;

export const runDetailSchema = z.object({
  summary: runSummarySchema,
  projectId: z.string().startsWith("prj_"),
  initiator: z.string(),
  objective: localizedTextSchema,
  agentId: z.string().startsWith("agt_").optional(),
  flowId: z.string().startsWith("flw_").optional(),
  steps: z.array(runStepSchema),
  events: z.array(runEventSchema),
  approval: approvalDetailSchema.optional(),
  receipt: z.object({
    model: z.string(),
    payer: z.enum(["platform_credits", "byok"]),
    inputUnits: z.number().int().nonnegative(),
    outputUnits: z.number().int().nonnegative(),
    tools: z.array(z.string()),
    reserved: moneySchema,
    actual: moneySchema,
  }),
});
export type RunDetail = z.infer<typeof runDetailSchema>;

export const operationsSnapshotSchema = z.object({
  projects: z.array(projectSummarySchema),
  agents: z.array(agentSummarySchema),
  flows: z.array(flowSummarySchema),
  runs: z.array(runSummarySchema),
  pendingApprovalCount: z.number().int().nonnegative(),
});
export type OperationsSnapshot = z.infer<typeof operationsSnapshotSchema>;

export const knowledgeCollectionSchema = z.object({
  id: z.string().startsWith("col_"),
  name: localizedTextSchema,
  description: localizedTextSchema,
  status: z.enum(["ready", "indexing", "stale", "failed"]),
  visibility: z.enum(["workspace", "project"]),
  sourceCount: z.number().int().nonnegative(),
  chunkCount: z.number().int().nonnegative(),
  usedByAgents: z.number().int().nonnegative(),
  updatedAt: z.string(),
});
export type KnowledgeCollection = z.infer<typeof knowledgeCollectionSchema>;

export const knowledgeSourceSchema = z.object({
  id: z.string().startsWith("src_"),
  collectionId: z.string().startsWith("col_"),
  name: localizedTextSchema,
  origin: z.string(),
  kind: z.enum(["file", "url", "text"]),
  status: z.enum(["validating", "scanning", "extracting", "indexing", "ready", "stale", "failed"]),
  chunkCount: z.number().int().nonnegative(),
  sensitivity: z.enum(["standard", "restricted"]),
  updatedAt: z.string(),
});
export type KnowledgeSource = z.infer<typeof knowledgeSourceSchema>;

export const catalogModelSchema = modelSummarySchema.extend({
  description: localizedTextSchema,
  contextWindow: z.number().int().positive(),
  access: z.enum(["platform", "byok", "both"]),
  capabilities: z.array(z.enum(["reasoning", "vision", "files", "tools", "structured_output"])),
  inputPricePerMillion: z.number().nonnegative(),
  outputPricePerMillion: z.number().nonnegative(),
});
export type CatalogModel = z.infer<typeof catalogModelSchema>;

export const toolCatalogItemSchema = z.object({
  id: z.string().startsWith("tool_"),
  name: localizedTextSchema,
  description: localizedTextSchema,
  category: z.enum(["search", "files", "communication", "data"]),
  risk: toolRiskSchema,
  status: z.enum(["available", "connected", "review_required"]),
  usedBy: z.number().int().nonnegative(),
});
export type ToolCatalogItem = z.infer<typeof toolCatalogItemSchema>;

export const skillCatalogItemSchema = z.object({
  id: z.string().startsWith("skl_"),
  name: localizedTextSchema,
  description: localizedTextSchema,
  sourceUrl: z.string().url(),
  version: z.string(),
  license: z.string(),
  trust: z.enum(["reviewed", "review_needed", "blocked"]),
  permissions: z.array(z.string()),
  usedBy: z.number().int().nonnegative(),
});
export type SkillCatalogItem = z.infer<typeof skillCatalogItemSchema>;

export const usageEventSchema = z.object({
  id: z.string().startsWith("use_"),
  title: localizedTextSchema,
  projectName: localizedTextSchema,
  model: z.string(),
  payer: z.enum(["platform_credits", "byok"]),
  estimated: moneySchema,
  reserved: moneySchema,
  actual: moneySchema,
  inputUnits: z.number().int().nonnegative(),
  outputUnits: z.number().int().nonnegative(),
  status: z.enum(["reserved", "settling", "settled", "adjusted"]),
  occurredAt: z.string(),
  runId: z.string().startsWith("run_"),
});
export type UsageEvent = z.infer<typeof usageEventSchema>;

export const teamMemberSchema = z.object({
  id: z.string().startsWith("mem_"),
  name: localizedTextSchema,
  email: z.string().email(),
  initials: z.string().min(1).max(3),
  role: z.enum(["owner", "admin", "builder", "reviewer", "viewer"]),
  status: z.enum(["active", "pending", "suspended"]),
  lastActiveAt: z.string().nullable(),
});
export type TeamMember = z.infer<typeof teamMemberSchema>;

export const workspaceAdminSnapshotSchema = z.object({
  collections: z.array(knowledgeCollectionSchema),
  sources: z.array(knowledgeSourceSchema),
  models: z.array(catalogModelSchema),
  tools: z.array(toolCatalogItemSchema),
  skills: z.array(skillCatalogItemSchema),
  usageEvents: z.array(usageEventSchema),
  members: z.array(teamMemberSchema),
});
export type WorkspaceAdminSnapshot = z.infer<typeof workspaceAdminSnapshotSchema>;

export function localize(value: LocalizedText, locale: Locale): string {
  return value[locale];
}
