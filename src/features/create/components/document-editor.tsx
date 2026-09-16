"use client";

import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import type { Locale } from "@nasaq/contracts/services";
import { resolveCreateCopy, template } from "./create-surfaces";
import type { CreateReducerState } from "../state/create-reducer";

/**
 * Document editor — U2.3.
 *
 * Structure rail (the outline) + canvas (editable blocks) + a proposed
 * alternative for the recommendation section. Every structural action is a
 * visible, keyboard-reachable button: nothing here is drag-only. The preview
 * is a separate read-only render of the same draft, so switching never loses
 * an edit.
 */

const ui = (locale: Locale, key: string) => resolveCreateCopy(locale, `services.create.ui.${key}`);

export function DocumentEditor({
  locale,
  state,
  onTitle,
  onOutlineLabel,
  onOutlineAdd,
  onOutlineRemove,
  onBlockAdd,
  onBlockText,
  onBlockDelete,
  onBlockMove,
  onAlternativeAccept,
  onAlternativeReject,
  onPreviewToggle,
}: {
  locale: Locale;
  state: CreateReducerState;
  onTitle: (value: string) => void;
  onOutlineLabel: (id: string, label: string) => void;
  onOutlineAdd: (label: string) => void;
  onOutlineRemove: (id: string) => void;
  onBlockAdd: (blockType: "heading" | "paragraph" | "list") => void;
  onBlockText: (id: string, text: string) => void;
  onBlockDelete: (id: string) => void;
  onBlockMove: (id: string, direction: "up" | "down") => void;
  onAlternativeAccept: (id: string) => void;
  onAlternativeReject: (id: string) => void;
  onPreviewToggle: () => void;
}) {
  const draft = state.session.draft;
  if (draft === null || draft.format !== "document") return null;
  const { outline, blocks, title } = draft;
  const previewing = state.ui.previewing;
  const alternative = state.session.alternatives.find((candidate) => candidate.status === "proposed") ?? null;
  const decidedAlternative = state.session.alternatives.find((candidate) => candidate.status !== "proposed") ?? null;
  const lastBlock = blocks.length <= 1;

  if (previewing) {
    return (
      <div className="u2-create__editor" data-testid="u2-create-document" data-format="document">
        <div className="u2-create__actions">
          <button type="button" data-testid="u2-create-preview-toggle" onClick={onPreviewToggle}>
            <Pencil size={14} aria-hidden="true" />
            {ui(locale, "editLabel")}
          </button>
        </div>
        <section className="u2-create__preview" data-testid="u2-create-doc-preview" aria-label={ui(locale, "docPreviewTitle")}>
          <h3 data-testid="u2-create-doc-preview-title">{title}</h3>
          {blocks.map((block) => {
            if (block.type === "heading") {
              return <h4 key={block.id}>{block.text}</h4>;
            }
            if (block.type === "list") {
              return (
                <ul key={block.id}>
                  {block.text.split("·").map((item, index) => item.trim() === "" ? null : <li key={index}>{item.trim()}</li>)}
                </ul>
              );
            }
            return <p key={block.id}>{block.text}</p>;
          })}
          <p className="u2-create__note">{ui(locale, "docPreviewNote")}</p>
        </section>
      </div>
    );
  }

  return (
    <div className="u2-create__editor" data-testid="u2-create-document" data-format="document">
      <div className="u2-create__actions">
        <button type="button" data-testid="u2-create-preview-toggle" onClick={onPreviewToggle}>
          <Eye size={14} aria-hidden="true" />
          {ui(locale, "previewLabel")}
        </button>
      </div>

      <div className="u2-create__split">
        <aside className="u2-create__rail" aria-label={ui(locale, "docOutlineTitle")}>
          <h3>{ui(locale, "docOutlineTitle")}</h3>
          <ol className="u2-create__outline" data-testid="u2-create-outline">
            {outline.map((item) => (
              <li key={item.id}>
                <label className="u2-create__edit-label">
                  <span>{`${ui(locale, "docOutlineTitle")} ${item.id}`}</span>
                  <input
                    type="text"
                    value={item.label}
                    maxLength={120}
                    aria-label={`${ui(locale, "docOutlineTitle")}: ${item.label}`}
                    data-testid={`u2-create-outline-label-${item.id}`}
                    onChange={(event) => onOutlineLabel(item.id, event.target.value)}
                  />
                </label>
                {outline.length > 1 ? (
                  <button type="button" data-testid={`u2-create-outline-remove-${item.id}`} onClick={() => onOutlineRemove(item.id)}>
                    <Trash2 size={14} aria-hidden="true" />
                    {ui(locale, "docOutlineRemove")}
                  </button>
                ) : null}
              </li>
            ))}
          </ol>
          <OutlineAdd locale={locale} onAdd={onOutlineAdd} />
        </aside>

        <div className="u2-create__canvas">
          <label className="u2-create__edit-label">
            <span>{ui(locale, "docBlocksTitle")}</span>
            <input
              type="text"
              value={title}
              maxLength={120}
              aria-label={ui(locale, "briefGoal")}
              data-testid="u2-create-title"
              onChange={(event) => onTitle(event.target.value)}
            />
          </label>

          <ul className="u2-create__blocks" data-testid="u2-create-blocks">
            {blocks.map((block, index) => (
              <li key={block.id} data-block={block.id} data-type={block.type}>
                <div className="u2-create__block-head">
                  <span className="u2-create__tag">{ui(locale, `docType${block.type.charAt(0).toUpperCase()}${block.type.slice(1)}`)}</span>
                  <div className="u2-create__block-tools">
                    <button
                      type="button"
                      data-testid={`u2-create-block-up-${block.id}`}
                      onClick={() => onBlockMove(block.id, "up")}
                      disabled={index === 0}
                    >
                      {ui(locale, "docMoveUp")}
                    </button>
                    <button
                      type="button"
                      data-testid={`u2-create-block-down-${block.id}`}
                      onClick={() => onBlockMove(block.id, "down")}
                      disabled={index === blocks.length - 1}
                    >
                      {ui(locale, "docMoveDown")}
                    </button>
                    <button
                      type="button"
                      data-testid={`u2-create-block-delete-${block.id}`}
                      onClick={() => onBlockDelete(block.id)}
                      disabled={lastBlock}
                      {...(lastBlock ? { "aria-describedby": "u2-create-last-block-reason" } : {})}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                      {ui(locale, "docDeleteBlock")}
                    </button>
                  </div>
                </div>
                {lastBlock ? <small id="u2-create-last-block-reason" className="u2-create__guard-note">{ui(locale, "deckLastSlideGuard")}</small> : null}
                <label className="u2-create__edit-label">
                  <span>{`${ui(locale, "docBlockLabel")} ${block.id}`}</span>
                  <textarea
                    value={block.text}
                    rows={block.type === "heading" ? 1 : 3}
                    maxLength={4000}
                    aria-label={`${ui(locale, "docBlockLabel")} (${block.type})`}
                    data-testid={`u2-create-block-text-${block.id}`}
                    onChange={(event) => onBlockText(block.id, event.target.value)}
                  />
                </label>
              </li>
            ))}
          </ul>

          <div className="u2-create__block-add" role="group" aria-label={ui(locale, "docAddBlock")}>
            <button type="button" data-testid="u2-create-block-add-heading" onClick={() => onBlockAdd("heading")}>
              <Plus size={14} aria-hidden="true" />
              {ui(locale, "docAddHeading")}
            </button>
            <button type="button" data-testid="u2-create-block-add-paragraph" onClick={() => onBlockAdd("paragraph")}>
              <Plus size={14} aria-hidden="true" />
              {ui(locale, "docAddParagraph")}
            </button>
            <button type="button" data-testid="u2-create-block-add-list" onClick={() => onBlockAdd("list")}>
              <Plus size={14} aria-hidden="true" />
              {ui(locale, "docAddList")}
            </button>
          </div>

          {alternative !== null ? (
            <section className="u2-create__alternative" data-testid="u2-create-alternative" data-status="proposed">
              <h3>{ui(locale, "docAltTitle")}</h3>
              <p className="u2-create__alt-intent">{resolveCreateCopy(locale, alternative.intentKey)}</p>
              <dl>
                <div>
                  <dt>{ui(locale, "docAltCurrent")}</dt>
                  <dd>{blocks.find((block) => block.id === alternative.blockId)?.text ?? ""}</dd>
                </div>
                <div>
                  <dt>{ui(locale, "docAltProposed")}</dt>
                  <dd>{alternative.proposedText}</dd>
                </div>
              </dl>
              <div className="u2-create__actions">
                <button type="button" data-testid="u2-create-alt-accept" onClick={() => onAlternativeAccept(alternative.id)}>{ui(locale, "docAltAccept")}</button>
                <button type="button" data-testid="u2-create-alt-reject" onClick={() => onAlternativeReject(alternative.id)}>{ui(locale, "docAltReject")}</button>
              </div>
            </section>
          ) : null}
          {decidedAlternative !== null ? (
            <p className="u2-create__note" data-testid="u2-create-alt-note" role="status">
              {decidedAlternative.status === "accepted" ? ui(locale, "docAltAccepted") : ui(locale, "docAltRejected")}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function OutlineAdd({ locale, onAdd }: { locale: Locale; onAdd: (label: string) => void }) {
  return (
    <form
      className="u2-create__outline-add"
      onSubmit={(event) => {
        event.preventDefault();
        const input = event.currentTarget.elements.namedItem("outline-label");
        if (input instanceof HTMLInputElement && input.value.trim() !== "") {
          onAdd(input.value);
          input.value = "";
        }
      }}
    >
      <label className="u2-create__edit-label">
        <span>{ui(locale, "docAddOutline")}</span>
        <input type="text" name="outline-label" maxLength={120} placeholder={ui(locale, "docOutlinePlaceholder")} data-testid="u2-create-outline-add-input" />
      </label>
      <button type="submit" data-testid="u2-create-outline-add">
        <Plus size={14} aria-hidden="true" />
        {ui(locale, "docAddOutline")}
      </button>
    </form>
  );
}

export function documentSlideCountText(locale: Locale, current: number, total: number) {
  return template(ui(locale, "deckSlideCount"), { current, total });
}
