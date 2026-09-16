import Link from "next/link";

export default function NotFound() {
  return (
    <main className="system-page">
      <p className="page-eyebrow">404</p>
      <h1>لم نجد هذه الصفحة</h1>
      <p>قد يكون الرابط قديمًا أو لا تملك حق الوصول إلى المورد.</p>
      <Link className="button button--primary button--default" href="/ar">العودة إلى نَسَق</Link>
    </main>
  );
}
