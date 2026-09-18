import { notFound } from "next/navigation";
import { isLocale } from "@minsaj/i18n";
import type { ProjectSummary } from "@minsaj/contracts";
import { getOperationsData } from "@/lib/data/operations";
import { ProjectDetailPrototype } from "@/components/domain/operations/project-detail-prototype";

export default async function ProjectDetailPage({ params }: { params: Promise<{ locale: string; projectId: string }> }) {
  const { locale, projectId } = await params;
  if (!isLocale(locale)) notFound();
  const operations = await getOperationsData();
  const project = operations.projects.find((item) => item.id === projectId) ?? ({
    id: projectId.startsWith("prj_") ? projectId : "prj_demo_local",
    name: { ar: "مشروع تجريبي", en: "Demo project" },
    description: { ar: "سياق مشروع أُنشئ في محاكاة الواجهة الأمامية.", en: "Project context created in the frontend simulation." },
    activeRuns: 0,
    conversations: 0,
    updatedAt: new Date().toISOString(),
  } satisfies ProjectSummary);
  return <ProjectDetailPrototype locale={locale} project={project} agents={operations.agents} flows={operations.flows} runs={operations.runs} />;
}
