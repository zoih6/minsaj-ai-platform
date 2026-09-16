import type { Locale, ResearchPlan, ResearchReportState, ResearchSessionState } from "@nasaq/contracts/services";
import { getResearchTopic, type ResearchTopicId } from "./topics";
import { computeClaimVerdicts, type ResearchClaimVerdict } from "./claims";
import type { ServiceEvidenceRef } from "@nasaq/contracts/services";

/**
 * Deterministic report draft builder — U2.2.
 *
 * The first report draft is composed locally from the matrix and the plan, so
 * the same session state always produces the same draft. The user edits from
 * there; every save after that is a new version owned by the artifact layer.
 *
 * Section bodies are fixture data (locale literals), composed from claim
 * statements and evidence counts. The claim *statements* themselves stay i18n
 * keys; the body text references them by name so the report reads as a draft
 * the user can rewrite, not as generated prose claiming model authorship.
 */

type ReportDraftInput = {
  readonly topicId: ResearchTopicId;
  readonly locale: Locale;
  readonly plan: ResearchPlan;
  readonly verdicts: readonly ResearchClaimVerdict[];
  readonly evidence: readonly ServiceEvidenceRef[];
  readonly activitySummary: { queries: number; scans: number; extracts: number; total: number };
};

export function buildResearchReportDraft(input: ReportDraftInput): ResearchReportState {
  const topic = getResearchTopic(input.topicId);
  const ar = input.locale === "ar";
  const supported = input.verdicts.filter((verdict) => verdict.support === "supported");
  const conflicted = input.verdicts.filter((verdict) => verdict.support === "conflicted");
  const unsupported = input.verdicts.filter((verdict) => verdict.support === "unsupported");
  const partial = input.verdicts.filter((verdict) => verdict.support === "partially_supported");

  const strongest = supported[0];
  const summaryBody = ar
    ? `مسودة ملخص حول: ${topic.defaultQuestion.ar}. أقوى نتيجة مدعومة حتى الآن: ${input.verdicts.length > 0 ? `ادعاء «${strongest?.claimId ?? "—"}» مدعوم بدليلين أو أكثر` : "لا ادعاءات مدعومة بعد"}. قرار مقصود: ${topic.defaultDecision.ar}.`
    : `Draft summary for: ${topic.defaultQuestion.en}. Strongest supported finding so far: ${input.verdicts.length > 0 ? `claim "${strongest?.claimId ?? "—"}" is supported by resolvable evidence` : "no supported claims yet"}. Intended decision: ${topic.defaultDecision.en}.`;

  const findingsBody = (verdict: ResearchClaimVerdict) => {
    const evidenceTitles = verdict.evidenceIds
      .map((id) => input.evidence.find((item) => item.id === id)?.sourceTitle ?? id)
      .slice(0, 3)
      .join(ar ? "؛ " : "; ");
    return ar
      ? `الادعاء ${verdict.claimId} بحالة «${verdict.support}» بـ ${verdict.supportsCount} داعم و${verdict.contradictsCount} معارض و${verdict.contextCount} سياقي. مصادر: ${evidenceTitles}.`
      : `Claim ${verdict.claimId} is "${verdict.support}" with ${verdict.supportsCount} supporting, ${verdict.contradictsCount} contradicting, and ${verdict.contextCount} contextual refs. Sources: ${evidenceTitles}.`;
  };

  const evidenceBody = ar
    ? `${conflicted.length} ادعاء متعارض، و${unsupported.length} غير مدعوم، و${partial.length} سياقي فقط. الأدلة من مصادر غير متاحة تبقى قابلة للعرض مع تنبيه أن موقعها غير قابل للتحقق في هذه الجلسة.`
    : `${conflicted.length} conflicted, ${unsupported.length} unsupported, and ${partial.length} context-only claims. Evidence from unavailable sources remains viewable with a note that its locator cannot be verified in this session.`;

  const sections: ResearchReportState["sections"] = [
    {
      id: "sec_summary",
      headingKey: "services.research.report.summary_heading",
      body: summaryBody,
      evidenceIds: strongest ? [...strongest.evidenceIds] : [],
      reviewed: false,
    },
    ...input.plan.axes
      .filter((axis) => axis.included)
      .slice(0, 4)
      .map((axis) => ({
        id: `sec_${axis.id}`,
        headingKey: axis.labelKey,
        body: findingsBody(
          input.verdicts.find((verdict) => verdict.claimId.startsWith("clm")) ?? input.verdicts[0] ?? { claimId: "—", support: "unsupported", supportsCount: 0, contradictsCount: 0, contextCount: 0, evidenceIds: [], unverifiableEvidenceIds: [] } satisfies ResearchClaimVerdict,
        ),
        evidenceIds: [],
        reviewed: false,
      })),
    {
      id: "sec_evidence_uncertainty",
      headingKey: "services.research.report.evidence_heading",
      body: evidenceBody,
      evidenceIds: [],
      reviewed: false,
    },
  ];

  return {
    sections: sections.slice(0, 16),
    limitationKeys: [...topic.limitationKeys],
    receiptSummaryKey: "services.research.report.receipt_summary",
    saved: false,
  };
}

/** Convenience: draft from a full session (used by the reducer and presets). */
export function draftReportForSession(session: ResearchSessionState, locale: Locale, evidence: readonly ServiceEvidenceRef[]): ResearchReportState {
  const topicId: ResearchTopicId = session.sources[0]?.topicId === "zero_match" || session.sources[0]?.topicId === "remote_onboarding"
    ? (session.sources[0]?.topicId as ResearchTopicId)
    : "waiting_time_q3";
  const plan = session.planVersions.find((version) => version.version === session.approvedPlanVersion)?.plan
    ?? session.planVersions[0]?.plan;
  if (plan === undefined) {
    return {
      sections: [{ id: "sec_summary", headingKey: "services.research.report.summary_heading", body: getResearchTopic(topicId).defaultQuestion[locale], evidenceIds: [], reviewed: false }],
      limitationKeys: [...getResearchTopic(topicId).limitationKeys],
      receiptSummaryKey: "services.research.report.receipt_summary",
      saved: false,
    };
  }
  const verdicts = computeClaimVerdicts(
    session.claims,
    evidence,
    session.evidenceIds,
    session.sources.filter((source) => source.excluded).map((source) => source.id),
  );
  const activitySummary = {
    queries: session.activity.entries.filter((entry) => entry.kind === "query").length,
    scans: session.activity.entries.filter((entry) => entry.kind === "scan").length,
    extracts: session.activity.entries.filter((entry) => entry.kind === "extract").length,
    total: session.activity.entries.length,
  };
  return buildResearchReportDraft({ topicId, locale, plan, verdicts, evidence, activitySummary });
}
