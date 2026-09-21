import { z } from "zod";
import {
  codeSessionStateSchema,
  createSessionStateSchema,
  handoffBundleSchema,
  learnSessionStateSchema,
  researchSessionStateSchema,
  serviceArtifactSchema,
  serviceSessionSchema,
  serviceTimestampSchema,
  simulationReceiptSchema,
  type ServiceSession,
  type ServiceArtifact,
  type HandoffBundle,
  type SimulationReceipt,
} from "@minsaj/contracts/services";

/**
 * Local demo storage adapter.
 *
 * This is tab-scoped demonstration storage, not account storage, cloud sync, or
 * memory. It never holds file bytes, source content, credentials, or tokens: the
 * snapshot schema has no field for them, and oversized snapshots are refused
 * instead of silently truncated.
 */

export const demoStoreKey = "minsaj:u2:session:v1";
export const demoStoreVersion = 1 as const;
export const demoStoreMaxBytes = 256 * 1024;

/**
 * Domain blocks.
 *
 * The workbench never interprets these: a service slice owns its own state
 * shape and the store only guarantees it is versioned, typed, and cleared with
 * the rest of the demo data. Learn is the first block; every other service
 * adds its own entry when its slice lands, which keeps the shared store from
 * growing service-specific fields.
 */
export const demoStoreDomainBlockSchema = z.discriminatedUnion("serviceId", [
  z.object({
    serviceId: z.literal("learn"),
    stateVersion: z.literal(1),
    payload: learnSessionStateSchema,
  }),
  z.object({
    serviceId: z.literal("research"),
    stateVersion: z.literal(1),
    payload: researchSessionStateSchema,
  }),
  z.object({
    serviceId: z.literal("create"),
    stateVersion: z.literal(1),
    payload: createSessionStateSchema,
  }),
  z.object({
    serviceId: z.literal("code"),
    stateVersion: z.literal(1),
    payload: codeSessionStateSchema,
  }),
]);
export type ServiceDomainBlock = z.infer<typeof demoStoreDomainBlockSchema>;

export const demoStoreSnapshotSchema = z.object({
  version: z.literal(demoStoreVersion),
  savedAt: serviceTimestampSchema,
  sessions: z.array(serviceSessionSchema).max(12),
  artifacts: z.array(serviceArtifactSchema).max(24),
  receipts: z.array(simulationReceiptSchema).max(24),
  handoffs: z.array(handoffBundleSchema).max(12),
  /** Optional so a snapshot written before U2.1 still parses. */
  domains: z.array(demoStoreDomainBlockSchema).max(6).optional(),
});
export type DemoStoreSnapshot = z.infer<typeof demoStoreSnapshotSchema>;

export type ServiceStoreStatus = "memory" | "session" | "corrupt_recovered" | "quota_exceeded" | "unavailable";

export type ServiceStoreReadResult = {
  snapshot: DemoStoreSnapshot | null;
  status: ServiceStoreStatus;
};

export type ServiceStoreWriteResult = { ok: true; bytes: number } | { ok: false; status: ServiceStoreStatus };

export type ServiceSessionStore = {
  readonly kind: "memory" | "session";
  read(): ServiceStoreReadResult;
  write(snapshot: DemoStoreSnapshot): ServiceStoreWriteResult;
  clear(): void;
};

export type ServiceStorageBackend = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export function createMemoryStorageBackend(initial: Record<string, string> = {}): ServiceStorageBackend {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => { map.set(key, value); },
    removeItem: (key) => { map.delete(key); },
  };
}

export function createSessionStorageBackend(storage: Pick<Storage, "getItem" | "setItem" | "removeItem">): ServiceStorageBackend {
  return {
    getItem: (key) => storage.getItem(key),
    setItem: (key, value) => storage.setItem(key, value),
    removeItem: (key) => storage.removeItem(key),
  };
}

export function createServiceSessionStore(options: {
  backend: ServiceStorageBackend;
  kind: "memory" | "session";
  key?: string;
}): ServiceSessionStore {
  const key = options.key ?? demoStoreKey;

  return {
    kind: options.kind,
    read() {
      let raw: string | null;
      try {
        raw = options.backend.getItem(key);
      } catch {
        return { snapshot: null, status: "unavailable" };
      }
      if (raw === null || raw === "") return { snapshot: null, status: options.kind };

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        // Corrupt JSON: clear the invalid payload and continue in a clean state.
        options.backend.removeItem(key);
        return { snapshot: null, status: "corrupt_recovered" };
      }

      const result = demoStoreSnapshotSchema.safeParse(parsed);
      if (!result.success) {
        options.backend.removeItem(key);
        return { snapshot: null, status: "corrupt_recovered" };
      }
      return { snapshot: result.data, status: options.kind };
    },
    write(snapshot) {
      const payload = JSON.stringify(snapshot);
      if (payload.length > demoStoreMaxBytes) {
        return { ok: false, status: "quota_exceeded" };
      }
      try {
        options.backend.setItem(key, payload);
        return { ok: true, bytes: payload.length };
      } catch {
        return { ok: false, status: "quota_exceeded" };
      }
    },
    clear() {
      try {
        options.backend.removeItem(key);
      } catch {
        // Clearing is best-effort; the caller reports status separately.
      }
    },
  };
}

/** Convenience for the browser: falls back to memory when sessionStorage is blocked. */
export function createBrowserServiceSessionStore(): ServiceSessionStore {
  if (typeof window === "undefined") {
    return createServiceSessionStore({ backend: createMemoryStorageBackend(), kind: "memory" });
  }
  try {
    return createServiceSessionStore({ backend: createSessionStorageBackend(window.sessionStorage), kind: "session" });
  } catch {
    return createServiceSessionStore({ backend: createMemoryStorageBackend(), kind: "memory" });
  }
}

export function buildDemoSnapshot(input: {
  savedAt: string;
  sessions: readonly ServiceSession[];
  artifacts: readonly ServiceArtifact[];
  receipts: readonly SimulationReceipt[];
  handoffs: readonly HandoffBundle[];
  domains?: readonly ServiceDomainBlock[];
}): DemoStoreSnapshot {
  return {
    version: demoStoreVersion,
    savedAt: input.savedAt,
    sessions: [...input.sessions].slice(-12),
    artifacts: [...input.artifacts].slice(-24),
    receipts: [...input.receipts].slice(-24),
    handoffs: [...input.handoffs].slice(-12),
    domains: [...(input.domains ?? [])].slice(-6),
  };
}

export function snapshotTimestamp(now: number) {
  return new Date(now).toISOString();
}
