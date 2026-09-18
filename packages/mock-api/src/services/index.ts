/**
 * U2 Service simulation data — fixtures, scenario plans, deterministic runner,
 * and the typed mock service client.
 *
 * Everything here is local simulation data. Nothing in this module performs a
 * network call, reads a file, calls a model, or persists beyond an explicitly
 * provided storage adapter in the web app.
 */

export * from "./ids";
export * from "./clock";
export * from "./plans";
export * from "./fixtures";
export * from "./runner";
export * from "./client";
export * from "./learn";
export * from "./research";
export * from "./create";
