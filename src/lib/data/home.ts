import { getMockHomeSnapshot } from "@nasaq/mock-api";
import type { HomeSnapshot } from "@nasaq/contracts";

export async function getHomeSnapshot(): Promise<HomeSnapshot> {
  return getMockHomeSnapshot();
}
