/**
 * App-scope route fallback — a shell-matched skeleton instead of a full
 * branded screen: preserves layout geometry (CLS ≈ 0) and makes in-app
 * navigation feel continuous. Locale comes from the segment; the skeleton
 * is language-neutral (no copy to read while loading).
 */
export default function AppLoading() {
  return (
    <div className="route-skeleton" role="status" aria-busy="true" aria-live="polite">
      <span className="u-sr-busy">Loading workspace… · جارٍ تجهيز مساحة العمل…</span>
      <div className="route-skeleton__header">
        <span className="u-skeleton u-skeleton--chip" aria-hidden="true" style={{ inlineSize: "112px" }} />
        <span className="u-skeleton u-skeleton--title" aria-hidden="true" />
        <span className="u-skeleton u-skeleton--line w-55" aria-hidden="true" />
      </div>
      <div className="route-skeleton__body">
        {Array.from({ length: 6 }, (_, index) => (
          <div className="u-skeleton-card" key={index} aria-hidden="true">
            <div className="u-skeleton-card__cover" />
            <span className="u-skeleton u-skeleton--chip" style={{ inlineSize: "68px" }} />
            <span className="u-skeleton u-skeleton--title" />
            <span className="u-skeleton u-skeleton--line w-70" />
            <span className="u-skeleton u-skeleton--line w-40" />
          </div>
        ))}
      </div>
    </div>
  );
}
