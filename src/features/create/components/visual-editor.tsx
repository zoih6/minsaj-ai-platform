"use client";

import type { Locale } from "@nasaq/contracts/services";
import { createVisualVariants, getCreateVisualVariant } from "@nasaq/mock-api/services";
import { resolveCreateCopy } from "./create-surfaces";
import type { CreateReducerState } from "../state/create-reducer";

/**
 * Visual concept editor — U2.3.
 *
 * Four local demo variants rendered as deterministic inline SVG. Each variant
 * carries ratio, palette, and a text description of its differences; the
 * caption and alt text are editable, and the alt text is required before the
 * draft can be requested for review. No crop, no render, no export.
 */

const ui = (locale: Locale, key: string) => resolveCreateCopy(locale, `services.create.ui.${key}`);
const vis = (locale: Locale, key: string) => resolveCreateCopy(locale, `services.create.visuals.${key}`);

const ratioSizes = {
  ratio_1_1: { width: 220, height: 220 },
  ratio_4_3: { width: 264, height: 198 },
  ratio_16_9: { width: 320, height: 180 },
} as const;

function VariantSvg({ composition, palette, ratio, label }: {
  composition: "orbit" | "grid" | "waves" | "arch";
  palette: readonly string[];
  ratio: "ratio_1_1" | "ratio_4_3" | "ratio_16_9";
  label: string;
}) {
  const { width, height } = ratioSizes[ratio];
  const [primary, secondary, background] = [
    palette[0] ?? "#554ce6",
    palette[1] ?? "#16bfea",
    palette[2] ?? "#f3f1ff",
  ];

  return (
    <svg
      className="u2-create__visual-svg"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label}
      data-testid="u2-create-visual-svg"
    >
      <rect x={0} y={0} width={width} height={height} fill={background} />
      {composition === "orbit" ? (
        <>
          <circle cx={width / 2} cy={height / 2} r={Math.min(width, height) / 4} fill={primary} />
          <circle cx={width / 2 + 30} cy={height / 2 - 30} r={18} fill={secondary} />
          <circle cx={width / 2 - 36} cy={height / 2 + 22} r={12} fill={primary} opacity={0.7} />
          <circle cx={width / 2 + 18} cy={height / 2 + 40} r={8} fill={secondary} opacity={0.8} />
        </>
      ) : null}
      {composition === "grid" ? (
        <>
          {[0, 1, 2].map((row) => [0, 1, 2].map((column) => (
            <rect
              key={`${row}-${column}`}
              x={20 + column * ((width - 40) / 3 + 6)}
              y={20 + row * ((height - 40) / 3 + 6)}
              width={(width - 40) / 3 - 8}
              height={(height - 40) / 3 - 8}
              rx={8}
              fill={(row + column) % 2 === 0 ? primary : secondary}
              opacity={(row + column) % 2 === 0 ? 0.9 : 0.75}
            />
          )))}
        </>
      ) : null}
      {composition === "waves" ? (
        <>
          {[0, 1, 2, 3].map((index) => (
            <path
              key={index}
              d={`M 0 ${height / 2 + index * 16 - 24} q ${width / 4} ${-24 + index * 8} ${width / 2} 0 t ${width / 2} 0`}
              fill="none"
              stroke={index % 2 === 0 ? primary : secondary}
              strokeWidth={6 - index}
              opacity={0.85 - index * 0.12}
            />
          ))}
        </>
      ) : null}
      {composition === "arch" ? (
        <>
          <path d={`M ${width * 0.2} ${height * 0.85} L ${width * 0.2} ${height * 0.45} A ${width * 0.12} ${height * 0.28} 0 0 1 ${width * 0.44} ${height * 0.45} L ${width * 0.44} ${height * 0.85} Z`} fill={primary} />
          <path d={`M ${width * 0.5} ${height * 0.85} L ${width * 0.5} ${height * 0.35} A ${width * 0.11} ${height * 0.26} 0 0 1 ${width * 0.72} ${height * 0.35} L ${width * 0.72} ${height * 0.85} Z`} fill={secondary} opacity={0.85} />
          <path d={`M ${width * 0.78} ${height * 0.85} L ${width * 0.78} ${height * 0.5} A ${width * 0.08} ${height * 0.2} 0 0 1 ${width * 0.94} ${height * 0.5} L ${width * 0.94} ${height * 0.85} Z`} fill={primary} opacity={0.65} />
        </>
      ) : null}
    </svg>
  );
}

export function VisualEditor({
  locale,
  state,
  onCaption,
  onAlt,
}: {
  locale: Locale;
  state: CreateReducerState;
  onCaption: (value: string) => void;
  onAlt: (value: string) => void;
}) {
  const draft = state.session.draft;
  if (draft === null || draft.format !== "visual") return null;
  const variant = getCreateVisualVariant(draft.variantId) ?? createVisualVariants[0];
  if (variant === undefined) {
    return null;
  }
  const altMissing = draft.altText.trim() === "";
  // While the alt text is missing, the graphic still needs an honest label;
  // the required-alt gate blocks review until the user writes a real one.
  const svgLabel = altMissing ? `${ui(locale, "visualAltRequired")} ${ui(locale, "visualDemoNote")}` : draft.altText;

  return (
    <div className="u2-create__editor" data-testid="u2-create-visual" data-format="visual">
      <div className="u2-create__split u2-create__split--visual">
        <div className="u2-create__canvas u2-create__canvas--visual">
          <h3>{ui(locale, "visualVariantTitle")}</h3>
          <VariantSvg composition={variant.composition} palette={draft.palette} ratio={draft.ratio} label={svgLabel} />
          <dl className="u2-create__visual-meta" data-testid="u2-create-visual-meta">
            <div>
              <dt>{ui(locale, "visualRatioTitle")}</dt>
              <dd data-testid="u2-create-visual-ratio">{vis(locale, `ratios.${draft.ratio}`)}</dd>
            </div>
            <div>
              <dt>{ui(locale, "visualPaletteTitle")}</dt>
              <dd>
                <span className="u2-create__swatches" aria-hidden="true">
                  {draft.palette.map((color) => <i key={color} style={{ background: color }} />)}
                </span>
                <span>{draft.palette.join(" · ")}</span>
              </dd>
            </div>
            <div>
              <dt>{ui(locale, "visualConceptTitle")}</dt>
              <dd data-testid="u2-create-visual-concept">{vis(locale, `concepts.${conceptKey(variant.id)}`)}</dd>
            </div>
          </dl>
          <p className="u2-create__note" data-testid="u2-create-visual-demo">{ui(locale, "visualDemoNote")}</p>

          <label className="u2-create__edit-label">
            <span>{ui(locale, "visualCaptionLabel")}</span>
            <input
              type="text"
              value={draft.caption}
              maxLength={120}
              aria-label={ui(locale, "visualCaptionLabel")}
              data-testid="u2-create-visual-caption"
              onChange={(event) => onCaption(event.target.value)}
            />
          </label>
          <label className="u2-create__edit-label">
            <span>{ui(locale, "visualAltLabel")}</span>
            <textarea
              value={draft.altText}
              rows={2}
              maxLength={600}
              aria-label={ui(locale, "visualAltLabel")}
              aria-required="true"
              data-testid="u2-create-visual-alt"
              onChange={(event) => onAlt(event.target.value)}
            />
          </label>
          {altMissing ? (
            <p className="u2-create__error" role="alert" data-testid="u2-create-alt-required">{ui(locale, "visualAltRequired")}</p>
          ) : null}
        </div>

        <aside className="u2-create__rail" aria-label={ui(locale, "visualComparisonTitle")}>
          <h3>{ui(locale, "visualComparisonTitle")}</h3>
          <ul className="u2-create__visual-variants" data-testid="u2-create-visual-comparison">
            {createVisualVariants.map((candidate) => (
              <li key={candidate.id} data-variant={candidate.id} data-selected={candidate.id === draft.variantId}>
                <VariantSvg composition={candidate.composition} palette={candidate.palette} ratio={candidate.ratio} label={vis(locale, `differences.${candidate.id}`)} />
                <div>
                  <strong>{vis(locale, `concepts.${conceptKey(candidate.id)}`)}</strong>
                  <p>{vis(locale, `differences.${candidate.id}`)}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="u2-create__note">{vis(locale, "rationales.demo_assets")}</p>
        </aside>
      </div>
    </div>
  );
}

function conceptKey(variantId: string): string {
  const index = createVisualVariants.findIndex((variant) => variant.id === variantId);
  return `c${Math.max(1, index + 1)}`;
}
