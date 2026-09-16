/**
 * Deterministic identifier factory.
 *
 * Every U2 fixture, run, stage, artifact, receipt, and handoff id is derived from
 * a seed plus a monotonic counter — never from `Math.random()` or the clock — so
 * the same scenario reproduces the same identifiers.
 */

export type ServiceIdFactory = {
  next(prefix: string): string;
  reset(): void;
  count(): number;
};

export function createServiceIdFactory(seed: string): ServiceIdFactory {
  const normalized = seed.toLowerCase().replace(/[^a-z0-9]+/gu, "_").replace(/^_+|_+$/gu, "") || "seed";
  let counter = 0;
  return {
    next(prefix) {
      counter += 1;
      return `${prefix}${normalized}_${counter}`;
    },
    reset() {
      counter = 0;
    },
    count() {
      return counter;
    },
  };
}
