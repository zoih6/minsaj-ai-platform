import {
  agentDefinitionSchema,
  flowDefinitionSchema,
  homeSnapshotSchema,
  operationsSnapshotSchema,
  runDetailSchema,
  workspaceAdminSnapshotSchema,
  type AgentDefinition,
  type FlowDefinition,
  type HomeSnapshot,
  type OperationsSnapshot,
  type RunDetail,
  type WorkspaceAdminSnapshot,
} from "@nasaq/contracts";

const homeFixture = {
  workspace: {
    id: "ws_horizon",
    name: { ar: "فريق أفق", en: "Horizon Team" },
  },
  balance: {
    available: { amountMinor: 4820, currency: "USD" },
    usedPercent: 37,
    payer: "mixed",
  },
  activeRuns: [
    {
      id: "run_market_research",
      title: { ar: "تحليل إشارات السوق والمنافسين", en: "Analyze market and competitor signals" },
      kind: "agent",
      status: "running",
      progress: 64,
      updatedAt: "2026-09-11T08:42:00.000Z",
      cost: { amountMinor: 86, currency: "USD" },
    },
    {
      id: "run_weekly_watch",
      title: { ar: "رصد المنافسين الأسبوعي", en: "Weekly competitor watch" },
      kind: "flow",
      status: "waiting_for_approval",
      progress: 72,
      updatedAt: "2026-09-11T08:38:00.000Z",
      cost: { amountMinor: 41, currency: "USD" },
    },
    {
      id: "run_sources_review",
      title: { ar: "مراجعة مصادر تقرير الإطلاق", en: "Review launch report sources" },
      kind: "agent",
      status: "planning",
      progress: 18,
      updatedAt: "2026-09-11T08:31:00.000Z",
      cost: { amountMinor: 12, currency: "USD" },
    },
  ],
  approvals: [
    {
      id: "apr_send_digest",
      title: { ar: "إرسال ملخص الرصد إلى فريق المشروع", en: "Send the monitoring digest to the project team" },
      risk: "external_side_effect",
      expiresAt: "2026-09-11T10:15:00.000Z",
      runId: "run_weekly_watch",
    },
  ],
  recentProjects: [
    {
      id: "prj_saudi_launch",
      name: { ar: "إطلاق الخدمة في السوق السعودي", en: "Saudi market launch" },
      description: { ar: "بحث السوق والتموضع وخطة الإطلاق", en: "Market research, positioning, and launch plan" },
      activeRuns: 2,
      conversations: 14,
      updatedAt: "2026-09-11T08:42:00.000Z",
    },
    {
      id: "prj_content_ops",
      name: { ar: "عمليات المحتوى للربع الرابع", en: "Q4 content operations" },
      description: { ar: "تقويم المحتوى والمراجعة وسير الموافقات", en: "Content calendar, review, and approvals" },
      activeRuns: 1,
      conversations: 9,
      updatedAt: "2026-09-10T16:20:00.000Z",
    },
    {
      id: "prj_customer_voice",
      name: { ar: "صوت العميل", en: "Voice of customer" },
      description: { ar: "تحليل المقابلات والمواضيع والفرص", en: "Interview synthesis, themes, and opportunities" },
      activeRuns: 0,
      conversations: 7,
      updatedAt: "2026-09-09T12:05:00.000Z",
    },
  ],
  suggestedModels: [
    {
      id: "mdl_clarity",
      name: "Clarity Pro",
      provider: "Northstar",
      status: "available",
      relativeSpeed: "balanced",
      relativeCost: "medium",
    },
    {
      id: "mdl_sprint",
      name: "Sprint Mini",
      provider: "Vertex Lane",
      status: "available",
      relativeSpeed: "fast",
      relativeCost: "low",
    },
    {
      id: "mdl_depth",
      name: "Depth Reasoner",
      provider: "Cedar Labs",
      status: "degraded",
      relativeSpeed: "slow",
      relativeCost: "high",
    },
  ],
} satisfies HomeSnapshot;

export async function getMockHomeSnapshot(): Promise<HomeSnapshot> {
  await Promise.resolve();
  return homeSnapshotSchema.parse(homeFixture);
}

export const mockScenario = "happy" as const;

const operationsFixture = {
  projects: homeFixture.recentProjects,
  agents: [
    {
      id: "agt_market_researcher",
      name: { ar: "باحث السوق", en: "Market researcher" },
      description: { ar: "يجمع المصادر ويقارن الأدلة ويصوغ مذكرة قرار موثقة.", en: "Collects sources, compares evidence, and drafts a cited decision memo." },
      status: "published",
      version: 4,
      model: "Clarity Pro",
      toolCount: 3,
      runCount: 28,
      updatedAt: "2026-09-11T08:42:00.000Z",
      projectIds: ["prj_saudi_launch"],
    },
    {
      id: "agt_document_reviewer",
      name: { ar: "مراجع المستندات", en: "Document reviewer" },
      description: { ar: "يستخرج المخاطر والأسئلة والقرارات المفتوحة دون تغيير المصدر.", en: "Extracts risks, questions, and open decisions without changing the source." },
      status: "draft",
      version: 2,
      model: "Depth Reasoner",
      toolCount: 2,
      runCount: 11,
      updatedAt: "2026-09-10T14:18:00.000Z",
      projectIds: ["prj_saudi_launch", "prj_customer_voice"],
    },
    {
      id: "agt_content_coordinator",
      name: { ar: "منسق المحتوى", en: "Content coordinator" },
      description: { ar: "ينظم المسودات والمراجعة مع إبقاء النشر خلف موافقة بشرية.", en: "Coordinates drafting and review while keeping publishing behind human approval." },
      status: "published",
      version: 7,
      model: "Sprint Mini",
      toolCount: 4,
      runCount: 43,
      updatedAt: "2026-09-09T16:05:00.000Z",
      projectIds: ["prj_content_ops"],
    },
  ],
  flows: [
    {
      id: "flw_weekly_watch",
      name: { ar: "رصد المنافسين الأسبوعي", en: "Weekly competitor watch" },
      description: { ar: "بحث، مقارنة أدلة، مراجعة بشرية، ثم ملخص للفريق.", en: "Research, evidence comparison, human review, then a team digest." },
      status: "published",
      version: 6,
      nodeCount: 5,
      runCount: 19,
      activeRuns: 1,
      updatedAt: "2026-09-11T08:38:00.000Z",
      projectId: "prj_saudi_launch",
    },
    {
      id: "flw_content_review",
      name: { ar: "مراجعة تقويم المحتوى", en: "Content calendar review" },
      description: { ar: "تحقق من التقويم، تعليقات، موافقة، ثم حزمة مراجعة.", en: "Validate the calendar, collect comments, approve, then create a review pack." },
      status: "draft",
      version: 3,
      nodeCount: 6,
      runCount: 8,
      activeRuns: 0,
      updatedAt: "2026-09-10T12:25:00.000Z",
      projectId: "prj_content_ops",
    },
    {
      id: "flw_interview_synthesis",
      name: { ar: "تلخيص مقابلات العملاء", en: "Customer interview synthesis" },
      description: { ar: "ملفات، موضوعات، أدلة، ثم تقرير قابل للمراجعة.", en: "Files, themes, evidence, then a reviewable report." },
      status: "published",
      version: 2,
      nodeCount: 4,
      runCount: 12,
      activeRuns: 0,
      updatedAt: "2026-09-09T12:05:00.000Z",
      projectId: "prj_customer_voice",
    },
  ],
  runs: [
    ...homeFixture.activeRuns,
    {
      id: "run_content_pack",
      title: { ar: "تجهيز حزمة مراجعة المحتوى", en: "Prepare the content review pack" },
      kind: "flow",
      status: "completed",
      progress: 100,
      updatedAt: "2026-09-10T15:20:00.000Z",
      cost: { amountMinor: 63, currency: "USD" },
    },
    {
      id: "run_interview_themes",
      title: { ar: "استخراج موضوعات مقابلات العملاء", en: "Extract customer interview themes" },
      kind: "agent",
      status: "completed_with_warnings",
      progress: 100,
      updatedAt: "2026-09-09T11:55:00.000Z",
      cost: { amountMinor: 74, currency: "USD" },
    },
  ],
  pendingApprovalCount: 1,
} satisfies OperationsSnapshot;

const agentDefinitionFixture = {
  summary: operationsFixture.agents[0]!,
  objective: {
    ar: "إنتاج مذكرة قرار موثقة عن فرصة السوق، مع فصل الدليل عن الافتراض.",
    en: "Produce a cited market-opportunity decision memo that separates evidence from assumptions.",
  },
  instructions: {
    ar: "ابدأ بخطة قصيرة. استخدم مصادر حديثة ومسموحة فقط. اربط كل ادعاء بمصدر، وصرّح عند نقص الدليل. لا ترسل أو تنشر أي مخرج دون موافقة.",
    en: "Start with a short plan. Use only recent, allowed sources. Tie each claim to evidence and disclose gaps. Never send or publish an output without approval.",
  },
  modelPolicy: { primary: "Clarity Pro", fallback: "Sprint Mini", payer: "platform_credits" },
  knowledge: [
    { id: "col_launch", name: { ar: "إطلاق السوق", en: "Market launch" }, sourceCount: 8 },
    { id: "col_voice", name: { ar: "صوت العميل", en: "Voice of customer" }, sourceCount: 14 },
  ],
  tools: [
    { id: "tool_web_search", name: { ar: "بحث الويب", en: "Web search" }, risk: "read", enabled: true },
    { id: "tool_project_files", name: { ar: "ملفات المشروع", en: "Project files" }, risk: "read", enabled: true },
    { id: "tool_save_artifact", name: { ar: "حفظ مخرج داخل المشروع", en: "Save project artifact" }, risk: "write_internal", enabled: true },
    { id: "tool_send_digest", name: { ar: "إرسال ملخص للفريق", en: "Send team digest" }, risk: "external_side_effect", enabled: false },
  ],
  approvalPolicy: "always_external",
  budgetLimit: { amountMinor: 120, currency: "USD" },
} satisfies AgentDefinition;

const flowDefinitionFixture = {
  summary: operationsFixture.flows[0]!,
  nodes: [
    { id: "node_input", type: "input", label: { ar: "سؤال السوق", en: "Market question" }, description: { ar: "هدف التشغيل ونطاقه", en: "Run objective and scope" } },
    { id: "node_research", type: "agent", label: { ar: "باحث السوق", en: "Market researcher" }, description: { ar: "يجمع مصادر القراءة", en: "Collects read-only sources" } },
    { id: "node_compare", type: "transform", label: { ar: "مقارنة الأدلة", en: "Compare evidence" }, description: { ar: "يفصل الدليل والافتراض", en: "Separates evidence and assumptions" } },
    { id: "node_approval", type: "approval", label: { ar: "موافقة بشرية", en: "Human approval" }, description: { ar: "توقف قبل الأثر الخارجي", en: "Pause before external impact" } },
    { id: "node_output", type: "output", label: { ar: "ملخص الفريق", en: "Team digest" }, description: { ar: "مخرج قابل للمراجعة", en: "Reviewable output" } },
  ],
  edges: [
    { from: "node_input", to: "node_research" },
    { from: "node_research", to: "node_compare" },
    { from: "node_compare", to: "node_approval" },
    { from: "node_approval", to: "node_output" },
  ],
  validation: { errors: 0, warnings: 1 },
} satisfies FlowDefinition;

const runDetailFixture = {
  summary: operationsFixture.runs[1]!,
  projectId: "prj_saudi_launch",
  initiator: "Sarah Alharbi",
  objective: { ar: "رصد تغيرات المنافسين وإعداد ملخص أسبوعي قابل للمراجعة.", en: "Monitor competitor changes and prepare a reviewable weekly digest." },
  flowId: "flw_weekly_watch",
  steps: [
    { id: "step_plan", label: { ar: "تثبيت النطاق", en: "Fix scope" }, kind: "plan", status: "completed", detail: { ar: "8 منافسين · آخر 7 أيام", en: "8 competitors · last 7 days" }, cost: { amountMinor: 2, currency: "USD" } },
    { id: "step_search", label: { ar: "قراءة المصادر", en: "Read sources" }, kind: "tool", status: "completed", detail: { ar: "12 صفحة عامة · دون تسجيل دخول", en: "12 public pages · no authentication" }, cost: { amountMinor: 14, currency: "USD" } },
    { id: "step_compare", label: { ar: "مقارنة التغيرات", en: "Compare changes" }, kind: "model", status: "completed", detail: { ar: "4 تغيرات ذات صلة", en: "4 relevant changes" }, cost: { amountMinor: 25, currency: "USD" } },
    { id: "step_approval", label: { ar: "موافقة الإرسال", en: "Approve sending" }, kind: "approval", status: "waiting_for_approval", detail: { ar: "لن يرسل قبل قرارك", en: "Nothing sends before your decision" }, cost: { amountMinor: 0, currency: "USD" } },
    { id: "step_artifact", label: { ar: "ملخص الفريق", en: "Team digest" }, kind: "artifact", status: "queued", detail: { ar: "مخرج داخلي بعد الموافقة", en: "Internal output after approval" }, cost: { amountMinor: 0, currency: "USD" } },
  ],
  events: [
    { sequence: 1, occurredAt: "2026-09-11T08:31:00.000Z", kind: "created", label: { ar: "أُنشئ التشغيل", en: "Run created" }, detail: { ar: "ثُبت إصدار التدفق 6", en: "Flow version 6 pinned" } },
    { sequence: 2, occurredAt: "2026-09-11T08:32:00.000Z", kind: "plan", label: { ar: "اعتمدت الخطة", en: "Plan accepted" }, detail: { ar: "4 خطوات وبوابة موافقة", en: "4 steps and one approval gate" } },
    { sequence: 3, occurredAt: "2026-09-11T08:34:00.000Z", kind: "tool", label: { ar: "قُرئت المصادر", en: "Sources read" }, detail: { ar: "12 طلب قراءة ناجحًا", en: "12 successful read calls" } },
    { sequence: 4, occurredAt: "2026-09-11T08:37:00.000Z", kind: "cost", label: { ar: "تحدّثت التكلفة", en: "Cost updated" }, detail: { ar: "$0.41 من $1.20", en: "$0.41 of $1.20" } },
    { sequence: 5, occurredAt: "2026-09-11T08:38:00.000Z", kind: "approval", label: { ar: "موافقة مطلوبة", en: "Approval required" }, detail: { ar: "إرسال ملخص إلى 4 أعضاء", en: "Send a digest to 4 members" } },
  ],
  approval: {
    id: "apr_send_digest",
    title: { ar: "إرسال ملخص الرصد إلى فريق المشروع", en: "Send the monitoring digest to the project team" },
    risk: "external_side_effect",
    expiresAt: "2026-09-11T10:15:00.000Z",
    runId: "run_weekly_watch",
    status: "pending",
    explanation: { ar: "هذا الفعل يرسل محتوى إلى أربعة أعضاء في مساحة العمل، لذلك يتوقف التنفيذ حتى قرارك.", en: "This action sends content to four workspace members, so execution pauses for your decision." },
    payloadPreview: { ar: "الموضوع: رصد المنافسين الأسبوعي · المستلمون: فريق إطلاق السوق · المرفق: ملخص.pdf", en: "Subject: Weekly competitor watch · Recipients: Market launch team · Attachment: digest.pdf" },
    actionDigest: "sha256:demo-7f82c6a0",
  },
  receipt: {
    model: "Clarity Pro",
    payer: "platform_credits",
    inputUnits: 8420,
    outputUnits: 1280,
    tools: ["web_search.read", "project_files.read"],
    reserved: { amountMinor: 120, currency: "USD" },
    actual: { amountMinor: 41, currency: "USD" },
  },
} satisfies RunDetail;

const workspaceAdminFixture = {
  collections: [
    { id: "col_launch", name: { ar: "إطلاق السوق", en: "Market launch" }, description: { ar: "أبحاث السوق واللوائح والتموضع وقرارات الإطلاق.", en: "Market research, regulations, positioning, and launch decisions." }, status: "ready", visibility: "project", sourceCount: 8, chunkCount: 246, usedByAgents: 2, updatedAt: "2026-09-11T08:34:00.000Z" },
    { id: "col_policy", name: { ar: "مكتبة السياسات", en: "Policy library" }, description: { ar: "سياسات تشغيل ومراجعة وموافقات مع إصدارات موثقة.", en: "Operating, review, and approval policies with documented versions." }, status: "ready", visibility: "workspace", sourceCount: 12, chunkCount: 384, usedByAgents: 3, updatedAt: "2026-09-10T14:18:00.000Z" },
    { id: "col_voice", name: { ar: "صوت العميل", en: "Voice of customer" }, description: { ar: "مقابلات العملاء والموضوعات والاقتباسات المؤيدة.", en: "Customer interviews, themes, and supporting quotes." }, status: "indexing", visibility: "project", sourceCount: 14, chunkCount: 198, usedByAgents: 1, updatedAt: "2026-09-11T08:41:00.000Z" },
    { id: "col_archive", name: { ar: "أرشيف المنافسين", en: "Competitor archive" }, description: { ar: "لقطات تاريخية تحتاج إعادة فهرسة قبل الاستخدام.", en: "Historical snapshots that need reindexing before use." }, status: "stale", visibility: "workspace", sourceCount: 19, chunkCount: 521, usedByAgents: 0, updatedAt: "2026-08-28T09:10:00.000Z" },
  ],
  sources: [
    { id: "src_launch_brief", collectionId: "col_launch", name: { ar: "موجز إطلاق السوق", en: "Market launch brief" }, origin: "launch-brief-v3.pdf", kind: "file", status: "ready", chunkCount: 42, sensitivity: "standard", updatedAt: "2026-09-11T08:12:00.000Z" },
    { id: "src_regulator", collectionId: "col_launch", name: { ar: "بوابة اللوائح الرسمية", en: "Official regulation portal" }, origin: "https://regulations.example/market", kind: "url", status: "ready", chunkCount: 68, sensitivity: "standard", updatedAt: "2026-09-11T07:55:00.000Z" },
    { id: "src_decisions", collectionId: "col_policy", name: { ar: "سجل قرارات التشغيل", en: "Operations decision log" }, origin: "workspace://decision-log", kind: "text", status: "ready", chunkCount: 31, sensitivity: "restricted", updatedAt: "2026-09-10T14:18:00.000Z" },
    { id: "src_interviews", collectionId: "col_voice", name: { ar: "مقابلات سبتمبر", en: "September interviews" }, origin: "interviews-september.zip", kind: "file", status: "indexing", chunkCount: 57, sensitivity: "restricted", updatedAt: "2026-09-11T08:41:00.000Z" },
    { id: "src_archive_2025", collectionId: "col_archive", name: { ar: "لقطات ٢٠٢٥", en: "2025 snapshots" }, origin: "competitor-snapshots-2025.pdf", kind: "file", status: "stale", chunkCount: 119, sensitivity: "standard", updatedAt: "2026-08-28T09:10:00.000Z" },
  ],
  models: [
    { id: "mdl_clarity", name: "Clarity Pro", provider: "Northstar", status: "available", relativeSpeed: "balanced", relativeCost: "medium", description: { ar: "نموذج متوازن للبحث والتحليل والمخرجات الموثقة.", en: "A balanced model for research, analysis, and cited outputs." }, contextWindow: 200000, access: "both", capabilities: ["reasoning", "vision", "files", "tools", "structured_output"], inputPricePerMillion: 3, outputPricePerMillion: 15 },
    { id: "mdl_sprint", name: "Sprint Mini", provider: "Vertex Lane", status: "available", relativeSpeed: "fast", relativeCost: "low", description: { ar: "سريع للفرز والتحويل والمهام المتكررة منخفضة المخاطر.", en: "Fast for triage, transformation, and low-risk repetitive tasks." }, contextWindow: 128000, access: "platform", capabilities: ["files", "tools", "structured_output"], inputPricePerMillion: 0.4, outputPricePerMillion: 1.6 },
    { id: "mdl_depth", name: "Depth Reasoner", provider: "Cedar Labs", status: "degraded", relativeSpeed: "slow", relativeCost: "high", description: { ar: "استدلال عميق للقرارات المركبة مع زمن استجابة أعلى.", en: "Deep reasoning for complex decisions with higher latency." }, contextWindow: 256000, access: "byok", capabilities: ["reasoning", "files", "tools", "structured_output"], inputPricePerMillion: 8, outputPricePerMillion: 32 },
    { id: "mdl_vision", name: "Canvas Vision", provider: "Northstar", status: "available", relativeSpeed: "balanced", relativeCost: "medium", description: { ar: "فهم المستندات المرئية والجداول والمخططات.", en: "Understands visual documents, tables, and diagrams." }, contextWindow: 128000, access: "both", capabilities: ["vision", "files", "structured_output"], inputPricePerMillion: 2.5, outputPricePerMillion: 10 },
  ],
  tools: [
    { id: "tool_web_search", name: { ar: "بحث الويب", en: "Web search" }, description: { ar: "يقرأ صفحات عامة ويعيد المصادر مع كل نتيجة.", en: "Reads public pages and returns sources with every result." }, category: "search", risk: "read", status: "connected", usedBy: 3 },
    { id: "tool_project_files", name: { ar: "ملفات المشروع", en: "Project files" }, description: { ar: "يقرأ الملفات المسموحة ضمن نطاق المشروع.", en: "Reads allowed files within project scope." }, category: "files", risk: "read", status: "connected", usedBy: 3 },
    { id: "tool_save_artifact", name: { ar: "حفظ مخرج", en: "Save artifact" }, description: { ar: "يحفظ نسخة داخلية موثقة في المشروع.", en: "Saves a documented internal artifact in the project." }, category: "files", risk: "write_internal", status: "available", usedBy: 2 },
    { id: "tool_send_digest", name: { ar: "إرسال ملخص", en: "Send digest" }, description: { ar: "يرسل بريدًا إلى قائمة مصرح بها خلف بوابة موافقة.", en: "Emails an authorized list behind an approval gate." }, category: "communication", risk: "external_side_effect", status: "review_required", usedBy: 1 },
  ],
  skills: [
    { id: "skl_document_review", name: { ar: "مراجعة المستند", en: "Document review" }, description: { ar: "منهج منظم لاستخراج المخاطر والأسئلة والقرارات المفتوحة.", en: "A structured method for extracting risks, questions, and open decisions." }, sourceUrl: "https://github.com/anthropics/skills", version: "1.3.0", license: "Apache-2.0", trust: "reviewed", permissions: ["read:project_files"], usedBy: 2 },
    { id: "skl_prompt_architect", name: { ar: "مهندس التعليمات", en: "Prompt architect" }, description: { ar: "يصقل تعليمات الوكيل ويضيف معايير تحقق واضحة.", en: "Refines agent instructions and adds explicit verification criteria." }, sourceUrl: "https://github.com/ckelsoe/prompt-architect", version: "0.9.2", license: "MIT", trust: "reviewed", permissions: ["read:instructions", "write:draft"], usedBy: 1 },
    { id: "skl_release_notes", name: { ar: "ملاحظات الإصدار", en: "Release notes" }, description: { ar: "ينظم التغييرات في صيغة موجهة للمستخدم.", en: "Organizes changes into a user-facing release format." }, sourceUrl: "https://github.com/addyosmani/agent-skills", version: "0.6.0", license: "MIT", trust: "review_needed", permissions: ["read:repository"], usedBy: 0 },
  ],
  usageEvents: [
    { id: "use_weekly_watch", title: { ar: "رصد المنافسين الأسبوعي", en: "Weekly competitor watch" }, projectName: { ar: "إطلاق السوق السعودي", en: "Saudi market launch" }, model: "Clarity Pro", payer: "platform_credits", estimated: { amountMinor: 96, currency: "USD" }, reserved: { amountMinor: 120, currency: "USD" }, actual: { amountMinor: 112, currency: "USD" }, inputUnits: 8420, outputUnits: 1280, status: "settled", occurredAt: "2026-09-11T08:42:00.000Z", runId: "run_weekly_watch" },
    { id: "use_market_research", title: { ar: "تحليل إشارات السوق", en: "Market signal analysis" }, projectName: { ar: "إطلاق السوق السعودي", en: "Saudi market launch" }, model: "Clarity Pro", payer: "byok", estimated: { amountMinor: 82, currency: "USD" }, reserved: { amountMinor: 0, currency: "USD" }, actual: { amountMinor: 0, currency: "USD" }, inputUnits: 10240, outputUnits: 2180, status: "settled", occurredAt: "2026-09-11T08:31:00.000Z", runId: "run_market_research" },
    { id: "use_content_pack", title: { ar: "حزمة مراجعة المحتوى", en: "Content review pack" }, projectName: { ar: "عمليات المحتوى", en: "Content operations" }, model: "Sprint Mini", payer: "platform_credits", estimated: { amountMinor: 68, currency: "USD" }, reserved: { amountMinor: 80, currency: "USD" }, actual: { amountMinor: 63, currency: "USD" }, inputUnits: 5600, outputUnits: 940, status: "settled", occurredAt: "2026-09-10T15:20:00.000Z", runId: "run_content_pack" },
    { id: "use_interview_themes", title: { ar: "موضوعات مقابلات العملاء", en: "Customer interview themes" }, projectName: { ar: "صوت العميل", en: "Voice of customer" }, model: "Depth Reasoner", payer: "byok", estimated: { amountMinor: 74, currency: "USD" }, reserved: { amountMinor: 0, currency: "USD" }, actual: { amountMinor: 0, currency: "USD" }, inputUnits: 18300, outputUnits: 3240, status: "adjusted", occurredAt: "2026-09-09T11:55:00.000Z", runId: "run_interview_themes" },
  ],
  members: [
    { id: "mem_sarah", name: { ar: "سارة الحربي", en: "Sarah Alharbi" }, email: "sarah@nasaq.demo", initials: "س", role: "owner", status: "active", lastActiveAt: "2026-09-11T08:45:00.000Z" },
    { id: "mem_yousef", name: { ar: "يوسف خالد", en: "Yousef Khaled" }, email: "yousef@nasaq.demo", initials: "ي", role: "admin", status: "active", lastActiveAt: "2026-09-11T08:21:00.000Z" },
    { id: "mem_maya", name: { ar: "مايا ناصر", en: "Maya Nasser" }, email: "maya@nasaq.demo", initials: "م", role: "builder", status: "active", lastActiveAt: "2026-09-10T17:20:00.000Z" },
    { id: "mem_omar", name: { ar: "عمر أمين", en: "Omar Amin" }, email: "omar@nasaq.demo", initials: "ع", role: "reviewer", status: "active", lastActiveAt: "2026-09-10T14:05:00.000Z" },
    { id: "mem_lina", name: { ar: "لينا حسن", en: "Lina Hassan" }, email: "lina@example.com", initials: "ل", role: "viewer", status: "pending", lastActiveAt: null },
  ],
} satisfies WorkspaceAdminSnapshot;

export async function getMockWorkspaceAdminSnapshot(): Promise<WorkspaceAdminSnapshot> {
  await Promise.resolve();
  return workspaceAdminSnapshotSchema.parse(workspaceAdminFixture);
}

export async function getMockOperationsSnapshot(): Promise<OperationsSnapshot> {
  await Promise.resolve();
  return operationsSnapshotSchema.parse(operationsFixture);
}

export async function getMockAgentDefinition(id = "agt_market_researcher"): Promise<AgentDefinition | null> {
  await Promise.resolve();
  if (id !== agentDefinitionFixture.summary.id && id !== "new") return null;
  return agentDefinitionSchema.parse(agentDefinitionFixture);
}

export async function getMockFlowDefinition(id = "flw_weekly_watch"): Promise<FlowDefinition | null> {
  await Promise.resolve();
  if (id !== flowDefinitionFixture.summary.id && id !== "new") return null;
  return flowDefinitionSchema.parse(flowDefinitionFixture);
}

export async function getMockRunDetail(id = "run_weekly_watch"): Promise<RunDetail | null> {
  await Promise.resolve();
  if (id !== runDetailFixture.summary.id) return null;
  return runDetailSchema.parse(runDetailFixture);
}
