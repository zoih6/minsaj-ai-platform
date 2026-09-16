/**
 * Research slice simulation data — U2.2.
 *
 * Topics, deterministic plan/activity/claim rules, source coverage, report
 * drafts, and edge-state presets. No React, no fetch, no randomness, no clock:
 * the same inputs always produce the same plan, activity log, matrix, and
 * report draft, and every source stays a seeded fixture that was never
 * retrieved live.
 */

export * from "./topics";
export * from "./plan";
export * from "./sources";
export * from "./claims";
export * from "./activity";
export * from "./report";
export * from "./presets";
