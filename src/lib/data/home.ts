import { getMockHomeSnapshot } from "@minsaj/mock-api";
import type { HomeSnapshot } from "@minsaj/contracts";

export async function getHomeSnapshot(): Promise<HomeSnapshot> {
  return getMockHomeSnapshot();
}
