import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@minsaj/i18n";
import { ChatPrototype } from "@/components/domain/chat-prototype";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: locale === "ar" ? "اسأل وتحدّث — منسج" : "Ask & talk — Minsaj" };
}

export default async function ChatPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  /* W9-5/م2 · D-W9-H (Bible §6.2): «اسأل» is a chat surface, not a generic
     workbench — the route now mounts the purpose-built chat prototype
     (stream 720 + sticky composer + bubbles + streaming caret). The generic
     ServiceWorkspace stays on the six workbench services; nothing is removed. */
  return <ChatPrototype locale={locale} />;
}
