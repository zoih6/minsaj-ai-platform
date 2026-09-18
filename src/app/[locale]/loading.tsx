export default function Loading() {
  return (
    <div className="route-loading" role="status" aria-live="polite" aria-busy="true" aria-atomic="true">
      <span className="route-loading__mark" aria-hidden="true" />
      <strong>منسج · MINSAJ</strong>
      <span>تهيئة مساحة العمل · Preparing workspace</span>
    </div>
  );
}
