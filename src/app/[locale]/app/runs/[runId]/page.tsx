import { notFound } from "next/navigation";
import { isLocale } from "@nasaq/i18n";
import { getOperationsData, getRunData } from "@/lib/data/operations";
import { RunDetailPrototype } from "@/components/domain/operations/run-detail-prototype";

export default async function RunDetailPage({ params }: { params: Promise<{ locale: string; runId: string }> }) {
  const { locale, runId } = await params;
  if (!isLocale(locale)) notFound();
  const [specific, base, operations] = await Promise.all([getRunData(runId), getRunData("run_weekly_watch"), getOperationsData()]);
  if (!base) notFound();
  const summary = operations.runs.find((item) => item.id === runId);
  const run = specific ?? (summary ? { ...base, summary, approval: summary.status === "waiting_for_approval" ? base.approval : undefined } : null);
  if (!run) notFound();
  return <RunDetailPrototype locale={locale} initialRun={run} />;
}
