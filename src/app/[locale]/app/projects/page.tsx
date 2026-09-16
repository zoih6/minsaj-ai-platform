import { notFound } from "next/navigation";
import { isLocale } from "@nasaq/i18n";
import { getOperationsData } from "@/lib/data/operations";
import { ProjectsPrototype } from "@/components/domain/operations/projects-prototype";
import { parseScenarioParam } from "@/lib/surface-states";

export default async function ProjectsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const operations = await getOperationsData();
  return (
    <ProjectsPrototype
      locale={locale}
      initialProjects={operations.projects}
      scenario={parseScenarioParam((await searchParams).state)}
    />
  );
}
