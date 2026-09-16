"use client";

import { ArrowDown, ArrowUp, Copy, Plus, Trash2 } from "lucide-react";
import type { Locale } from "@nasaq/contracts/services";
import { resolveCreateCopy, template } from "./create-surfaces";
import type { CreateReducerState } from "../state/create-reducer";

/**
 * Deck editor — U2.3.
 *
 * A slide rail plus a one-slide editor for title, body (bullets, one per
 * line), and speaker notes. Reordering, duplicating, and deleting are visible
 * buttons with the final-slide guard; the layout collapses to one slide plus
 * a linear list on small screens, and nothing is drag-only.
 */

const ui = (locale: Locale, key: string) => resolveCreateCopy(locale, `services.create.ui.${key}`);

export function DeckEditor({
  locale,
  state,
  onTitle,
  onSlideSelect,
  onSlideAdd,
  onSlideDuplicate,
  onSlideDelete,
  onSlideMove,
  onSlideTitle,
  onSlideBody,
  onSlideNotes,
}: {
  locale: Locale;
  state: CreateReducerState;
  onTitle: (value: string) => void;
  onSlideSelect: (index: number) => void;
  onSlideAdd: () => void;
  onSlideDuplicate: (id: string) => void;
  onSlideDelete: (id: string) => void;
  onSlideMove: (id: string, direction: "up" | "down") => void;
  onSlideTitle: (id: string, value: string) => void;
  onSlideBody: (id: string, value: string) => void;
  onSlideNotes: (id: string, value: string) => void;
}) {
  const draft = state.session.draft;
  if (draft === null || draft.format !== "deck") return null;
  const { slides, title } = draft;
  const currentIndex = Math.min(state.ui.currentSlideIndex, slides.length - 1);
  const current = slides[Math.max(0, currentIndex)];
  const lastSlide = slides.length <= 1;
  const atCapacity = slides.length >= 16;

  if (current === undefined) {
    return null;
  }

  return (
    <div className="u2-create__editor" data-testid="u2-create-deck" data-format="deck">
      <label className="u2-create__edit-label u2-create__deck-title">
        <span>{ui(locale, "briefGoal")}</span>
        <input
          type="text"
          value={title}
          maxLength={120}
          aria-label={ui(locale, "briefGoal")}
          data-testid="u2-create-title"
          onChange={(event) => onTitle(event.target.value)}
        />
      </label>

      <div className="u2-create__split">
        <aside className="u2-create__rail" aria-label={ui(locale, "deckRailTitle")}>
          <h3>{ui(locale, "deckRailTitle")}</h3>
          <ol className="u2-create__slides" data-testid="u2-create-deck-rail">
            {slides.map((slide, index) => (
              <li key={slide.id} data-slide={slide.id} data-current={index === currentIndex}>
                <button
                  type="button"
                  aria-current={index === currentIndex ? "true" : undefined}
                  data-testid={`u2-create-slide-${slide.id}`}
                  onClick={() => onSlideSelect(index)}
                >
                  <small>{template(ui(locale, "deckSlideCount"), { current: index + 1, total: slides.length })}</small>
                  <span>{slide.title}</span>
                </button>
              </li>
            ))}
          </ol>
          <button type="button" data-testid="u2-create-slide-add" onClick={onSlideAdd} disabled={atCapacity}>
            <Plus size={14} aria-hidden="true" />
            {ui(locale, "deckAddSlide")}
          </button>
          <p className="u2-create__note">{ui(locale, "deckOneSlideNote")}</p>
        </aside>

        <div className="u2-create__canvas">
          <p className="u2-create__meta" data-testid="u2-create-slide-count">
            {template(ui(locale, "deckSlideCount"), { current: currentIndex + 1, total: slides.length })}
          </p>

          <div className="u2-create__slide-tools">
            <button
              type="button"
              data-testid="u2-create-slide-up"
              onClick={() => onSlideMove(current.id, "up")}
              disabled={currentIndex === 0}
            >
              <ArrowUp size={14} aria-hidden="true" />
              {ui(locale, "deckMoveUp")}
            </button>
            <button
              type="button"
              data-testid="u2-create-slide-down"
              onClick={() => onSlideMove(current.id, "down")}
              disabled={currentIndex === slides.length - 1}
            >
              <ArrowDown size={14} aria-hidden="true" />
              {ui(locale, "deckMoveDown")}
            </button>
            <button
              type="button"
              data-testid="u2-create-slide-duplicate"
              onClick={() => onSlideDuplicate(current.id)}
              disabled={atCapacity}
            >
              <Copy size={14} aria-hidden="true" />
              {ui(locale, "deckDuplicateSlide")}
            </button>
            <button
              type="button"
              data-testid="u2-create-slide-delete"
              onClick={() => onSlideDelete(current.id)}
              disabled={lastSlide}
              {...(lastSlide ? { "aria-describedby": "u2-create-last-slide-reason" } : {})}
            >
              <Trash2 size={14} aria-hidden="true" />
              {ui(locale, "deckDeleteSlide")}
            </button>
          </div>
          {lastSlide ? (
            <small id="u2-create-last-slide-reason" className="u2-create__guard-note" data-testid="u2-create-last-slide-guard">
              {ui(locale, "deckLastSlideGuard")}
            </small>
          ) : null}

          <label className="u2-create__edit-label">
            <span>{ui(locale, "deckSlideTitle")}</span>
            <input
              type="text"
              value={current.title}
              maxLength={120}
              aria-label={ui(locale, "deckSlideTitle")}
              data-testid="u2-create-slide-title"
              onChange={(event) => onSlideTitle(current.id, event.target.value)}
            />
          </label>

          <label className="u2-create__edit-label">
            <span>{ui(locale, "deckSlideBody")}</span>
            <textarea
              value={current.bullets.join("\n")}
              rows={Math.max(3, current.bullets.length)}
              maxLength={4000}
              aria-label={ui(locale, "deckSlideBody")}
              data-testid="u2-create-slide-body"
              onChange={(event) => onSlideBody(current.id, event.target.value)}
            />
          </label>

          <label className="u2-create__edit-label">
            <span>{ui(locale, "deckSlideNotes")}</span>
            <textarea
              value={current.notes}
              rows={3}
              maxLength={4000}
              placeholder={ui(locale, "deckNotesPlaceholder")}
              aria-label={ui(locale, "deckSlideNotes")}
              data-testid="u2-create-slide-notes"
              onChange={(event) => onSlideNotes(current.id, event.target.value)}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
