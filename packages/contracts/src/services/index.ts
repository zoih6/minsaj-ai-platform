/**
 * U2 Service bounded context — public surface.
 *
 * This module owns every U2 session/run/stage/event/receipt/handoff type. It is
 * intentionally separate from the prototype Agent/Flow shapes exported by
 * `@minsaj/contracts`: `ServiceRun` is not `AgentRun` or `FlowRun`, and
 * `SimulationReceipt` is not an `ExecutionReceipt`.
 *
 * Ownership rules (mandatory addendum section 4):
 * - contract shapes are Zod-first and carry a `Service*` name or a service
 *   namespace;
 * - nothing here may be promoted to a canonical Backend schema;
 * - product-agent Backend/Runtime remains NO-GO and not implemented.
 */

export * from "./enums";
export * from "./ids";
// `ServiceEventName` is owned by ./events; ./enums exports the raw name enum.
export type { ServiceEventNameValue } from "./enums";
export * from "./text";
export * from "./stages";
export * from "./inputs";
export * from "./session";
export * from "./run";
export * from "./evidence";
export * from "./artifacts";
export * from "./receipt";
export * from "./handoff";
export * from "./events";
export * from "./transitions";
export * from "./learn";
export * from "./research";
export * from "./create";

// The locale type is shared with the prototype contracts; U2 does not own or widen it.
export type { Locale } from "../index";
