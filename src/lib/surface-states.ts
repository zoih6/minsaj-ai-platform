/**
 * Surface scenario override — shared, environment-neutral (server + client).
 *
 * QA/demo flags (`?state=loading|empty|error`) let any data surface preview
 * its PRD UX-003 states without touching data. Parsed server-side in the
 * route (searchParams) and passed down as a plain prop — no effects needed
 * in client components.
 */

export type SurfaceStateOverride = "loading" | "empty" | "error" | null;

export function parseScenarioParam(value: string | string[] | undefined): SurfaceStateOverride {
  const flag = Array.isArray(value) ? value[0] : value;
  if (flag === "loading" || flag === "empty" || flag === "error") return flag;
  return null;
}
