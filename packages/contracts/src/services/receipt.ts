import { z } from "zod";
import { serviceReceiptIdSchema, serviceRunIdSchema, serviceTimestampSchema } from "./ids";
import { serviceIdSchema, serviceReceiptStorageSchema } from "./enums";
import { serviceLabelSchema } from "./text";

/**
 * SimulationReceipt — an explicit disclosure of what the local simulation did,
 * what was computed locally, what never happened, and where (if anywhere) demo
 * data was stored for this tab.
 *
 * It is not an ExecutionReceipt, invoice, or tamper-evident audit record, and
 * it must never be described as verified, authorized, durable, or executed.
 */
export const simulationReceiptSchema = z.object({
  id: serviceReceiptIdSchema,
  runId: serviceRunIdSchema,
  serviceId: serviceIdSchema,
  mode: z.literal("explicit_simulation"),
  fixtureIds: z.array(serviceLabelSchema).max(24),
  performedLocally: z.array(serviceLabelSchema).min(1).max(24),
  simulated: z.array(serviceLabelSchema).min(1).max(24),
  notPerformed: z.array(serviceLabelSchema).min(1).max(24),
  /** U2 makes no network request from the simulator. */
  networkCalls: z.literal(0),
  persistentStorage: serviceReceiptStorageSchema,
  userDataRead: z.array(serviceLabelSchema).max(24),
  warnings: z.array(serviceLabelSchema).max(12),
  /** Boundary marker required by the mandatory U2 product-agent addendum. */
  productAgentRuntime: z.literal("not_implemented"),
  createdAt: serviceTimestampSchema,
});
export type SimulationReceipt = z.infer<typeof simulationReceiptSchema>;

const boundaryDisclosure = "Product Agent Backend/Runtime not implemented";

/**
 * Renders the receipt as deterministic bilingual text lines. Both languages are
 * produced from the same receipt record so tests can prove the disclosure
 * exists in Arabic and English without duplication drift.
 */
export function describeSimulationReceipt(receipt: SimulationReceipt, locale: "ar" | "en") {
  const labels = locale === "ar"
    ? {
        mode: "وضع التشغيل: محاكاة صريحة",
        local: "حُسب محليًا في المتصفح",
        simulated: "محاكاة معلنة",
        notPerformed: "لم يحدث",
        network: "طلبات الشبكة: 0",
        storage: "التخزين: للتجربة فقط في هذا التبويب",
        boundary: "تشغيل وكلاء المنتج (Backend/Runtime) غير منفّذ",
      }
    : {
        mode: "Mode: explicit simulation",
        local: "Computed locally in the browser",
        simulated: "Declared simulation",
        notPerformed: "Not performed",
        network: "Network calls: 0",
        storage: "Storage: demo-only for this tab",
        boundary: boundaryDisclosure,
      };

  return {
    mode: labels.mode,
    performedLocally: labels.local,
    simulated: labels.simulated,
    notPerformed: labels.notPerformed,
    network: labels.network,
    storage: labels.storage,
    boundary: labels.boundary,
  };
}
