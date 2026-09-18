import { z } from "zod";

/**
 * Bounded text helpers for U2 simulation data.
 *
 * U2 renders user-provided and fixture strings. Contracts reject control
 * characters and bidirectional overrides so hostile input cannot reorder
 * interface text, and cap length so no surface receives unbounded data.
 */

const CONTROL_CHARACTERS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u;
const BIDI_OVERRIDES = /[\u202a-\u202e\u2066-\u2069]/u;

export function hasControlCharacters(value: string) {
  return CONTROL_CHARACTERS.test(value);
}

export function hasBidiOverrides(value: string) {
  return BIDI_OVERRIDES.test(value);
}

/** Short label: titles, stage names, artifact names. */
export const serviceLabelSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .refine((value) => !hasControlCharacters(value), { message: "control_characters_not_allowed" })
  .refine((value) => !hasBidiOverrides(value), { message: "bidi_overrides_not_allowed" });

/** User-authored free text: briefs, questions, notes. */
export const serviceUserTextSchema = z
  .string()
  .trim()
  .min(1)
  .max(600)
  .refine((value) => !hasControlCharacters(value), { message: "control_characters_not_allowed" })
  .refine((value) => !hasBidiOverrides(value), { message: "bidi_overrides_not_allowed" });

/** Longer fixture or artifact prose. */
export const serviceProseSchema = z
  .string()
  .trim()
  .min(1)
  .max(4000)
  .refine((value) => !hasControlCharacters(value), { message: "control_characters_not_allowed" });

/**
 * Display-only external references. Only http/https are accepted; a fixture URL
 * is never fetched by U2 and always carries provenance that says so.
 */
export const serviceExternalUrlSchema = z
  .string()
  .trim()
  .max(300)
  .refine((value) => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch {
      return false;
    }
  }, { message: "unsupported_url_scheme" });

/** Relative in-product path, used by route registries and handoffs. */
export const serviceRoutePathSchema = z.string().regex(/^\/[a-z0-9\-/[\]]*$/u).max(160);
