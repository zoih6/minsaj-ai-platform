"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, ChevronDown, Crown, KeyRound, Mail, MoreHorizontal, Plus, ShieldCheck, UserCheck, Users, X } from "lucide-react";
import { Badge } from "@nasaq/ui";
import { localize, type Locale, type TeamMember } from "@nasaq/contracts";
import { DemoToast, LibraryToolbar, OperationsStats } from "@/components/domain/operations/shared";

import { ScrollFx } from "@/components/universal/scroll-fx";
const roleLabels = {
  owner: { ar: "مالك", en: "Owner" }, admin: { ar: "مسؤول", en: "Admin" }, builder: { ar: "منشئ", en: "Builder" }, reviewer: { ar: "مراجع", en: "Reviewer" }, viewer: { ar: "مشاهد", en: "Viewer" },
} as const;

function roleSummary(role: TeamMember["role"], ar: boolean) {
  return {
    owner: ar ? "كل الصلاحيات ونقل الملكية" : "All permissions and ownership transfer",
    admin: ar ? "إدارة الفريق والسياسات دون الملكية" : "Manage team and policy without ownership",
    builder: ar ? "إنشاء الوكلاء والتدفقات والمصادر" : "Build agents, flows, and sources",
    reviewer: ar ? "مراجعة المخرجات واتخاذ قرارات الموافقة" : "Review outputs and decide approvals",
    viewer: ar ? "عرض الموارد دون تعديل أو تفويض" : "View resources without changes or delegation",
  }[role];
}

export function TeamPrototype({ locale, initialMembers }: { locale: Locale; initialMembers: TeamMember[] }) {
  const ar = locale === "ar";
  const [members, setMembers] = useState(initialMembers);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamMember["role"]>("viewer");
  const [notice, setNotice] = useState("");
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(""), 2800); return () => window.clearTimeout(timer); }, [notice]);
  const normalized = query.trim().toLocaleLowerCase(locale);
  const visible = members.filter((member) => (!normalized || `${localize(member.name, locale)} ${member.email}`.toLocaleLowerCase(locale).includes(normalized)) && (filter === "all" || member.status === filter || member.role === filter));

  function invite() {
    if (!email.trim()) return;
    const localPart = email.split("@")[0] || "New member";
    setMembers((items) => [...items, { id: `mem_demo_${Date.now()}`, name: { ar: localPart, en: localPart }, email: email.trim(), initials: localPart.slice(0, 1).toUpperCase(), role, status: "pending", lastActiveAt: null }]);
    setInviteOpen(false); setEmail(""); setRole("viewer");
    setNotice(ar ? "أُنشئت دعوة محلية؛ لم يُرسل بريد حقيقي." : "A local invitation was created; no real email was sent.");
  }

  return <div className="ops-page team-page">
    <ScrollFx /><header className="page-header ops-page-header"><div className="page-header__copy"><p className="page-eyebrow">{ar ? "وصول قابل للمراجعة" : "Reviewable access"}</p><h1 className="page-title">{ar ? "الفريق والأدوار" : "Team and roles"}</h1><p className="page-description">{ar ? "ادعُ الأعضاء بأقل صلاحية لازمة، واجعل سلطة الموافقات والميزانية والإنشاء ظاهرة." : "Invite members with least privilege and keep approval, budget, and builder authority visible."}</p></div><Dialog.Root open={inviteOpen} onOpenChange={setInviteOpen}><Dialog.Trigger asChild><button className="button button--primary button--default" type="button"><Plus size={16} />{ar ? "دعوة عضو" : "Invite member"}</button></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="command-overlay" /><Dialog.Content className="form-dialog invite-dialog" aria-describedby="invite-description"><div className="form-dialog__header"><div><Dialog.Title>{ar ? "دعوة عضو إلى فريق أفق" : "Invite a member to Horizon Team"}</Dialog.Title><Dialog.Description id="invite-description">{ar ? "تبدأ الدعوة بدور محدد ويمكن إلغاؤها قبل القبول." : "The invitation starts with a specific role and can be revoked before acceptance."}</Dialog.Description></div><Dialog.Close asChild><button className="icon-button" type="button" aria-label={ar ? "إغلاق" : "Close"}><X size={16} /></button></Dialog.Close></div><label className="field"><span>{ar ? "البريد الإلكتروني" : "Email address"}</span><div className="input-with-prefix"><Mail size={16} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="member@example.com" /></div></label><label className="field"><span>{ar ? "الدور الأولي" : "Initial role"}</span><select value={role} onChange={(event) => setRole(event.target.value as TeamMember["role"])}>{(Object.keys(roleLabels) as TeamMember["role"][]).filter((id) => id !== "owner").map((id) => <option value={id} key={id}>{localize(roleLabels[id], locale)}</option>)}</select></label><div className="role-preview"><span><ShieldCheck size={18} /></span><div><strong>{localize(roleLabels[role], locale)}</strong><p>{roleSummary(role, ar)}</p></div></div><label className="field"><span>{ar ? "رسالة اختيارية" : "Optional message"}</span><textarea placeholder={ar ? "أضف سياقًا موجزًا للدعوة…" : "Add a short invitation context…"} /></label><div className="source-security-note"><Mail size={16} /><p>{ar ? "محاكاة Frontend: لن يُرسل بريد أو يُنشأ رمز دعوة حقيقي." : "Frontend simulation: no email or real invitation token will be created."}</p></div><div className="form-dialog__actions"><Dialog.Close asChild><button className="button button--quiet button--default" type="button">{ar ? "إلغاء" : "Cancel"}</button></Dialog.Close><button className="button button--primary button--default" type="button" disabled={!email.trim()} onClick={invite}>{ar ? "إنشاء دعوة تجريبية" : "Create demo invite"}</button></div></Dialog.Content></Dialog.Portal></Dialog.Root></header><OperationsStats items={[
    { label: ar ? "أعضاء نشطون" : "Active members", value: String(members.filter((item) => item.status === "active").length), detail: ar ? "ضمن المساحة" : "In workspace" },
    { label: ar ? "دعوات معلقة" : "Pending invites", value: String(members.filter((item) => item.status === "pending").length), detail: ar ? "قابلة للإلغاء" : "Revocable" },
    { label: ar ? "مخوّلون بالموافقة" : "Can approve", value: String(members.filter((item) => ["owner", "admin", "reviewer"].includes(item.role)).length), detail: ar ? "بحسب النطاق" : "By scope" },
    { label: ar ? "مالكو المساحة" : "Workspace owners", value: "1", detail: ar ? "محمي من الإزالة" : "Removal protected" },
  ]} /><LibraryToolbar locale={locale} query={query} onQueryChange={setQuery} activeFilter={filter} onFilterChange={setFilter} resultCount={visible.length} filters={[
    { id: "all", label: ar ? "الكل" : "All" }, { id: "active", label: ar ? "نشط" : "Active" }, { id: "pending", label: ar ? "دعوات" : "Invites" }, { id: "admin", label: ar ? "مسؤولون" : "Admins" }, { id: "reviewer", label: ar ? "مراجعون" : "Reviewers" },
  ]} /><section className="team-table-card"><div className="team-table-head"><span>{ar ? "العضو" : "Member"}</span><span>{ar ? "الدور" : "Role"}</span><span>{ar ? "الوصول" : "Access"}</span><span>{ar ? "آخر نشاط" : "Last active"}</span><span /></div>{visible.map((member) => <div className="team-member-row" key={member.id}><span className="team-member-identity"><i>{member.initials}</i><span><strong>{localize(member.name, locale)}</strong><small>{member.email}</small></span>{member.role === "owner" ? <Crown size={14} /> : null}</span><span data-label={ar ? "الدور" : "Role"}><label className="inline-role-select"><select aria-label={ar ? `دور ${localize(member.name, locale)}` : `${localize(member.name, locale)} role`} value={member.role} disabled={member.role === "owner"} onChange={(event) => { const nextRole = event.target.value as TeamMember["role"]; setMembers((items) => items.map((item) => item.id === member.id ? { ...item, role: nextRole } : item)); setNotice(ar ? "تغير الدور محليًا وسُجلت معاينة الأثر." : "Role changed locally and the impact preview was recorded."); }}>{(Object.keys(roleLabels) as TeamMember["role"][]).map((id) => <option key={id} value={id}>{localize(roleLabels[id], locale)}</option>)}</select><ChevronDown size={14} /></label></span><span data-label={ar ? "الوصول" : "Access"}><Badge tone={member.status === "active" ? "success" : member.status === "pending" ? "warning" : "danger"}>{member.status === "active" ? (ar ? "نشط" : "Active") : member.status === "pending" ? (ar ? "دعوة معلقة" : "Pending invite") : (ar ? "موقوف" : "Suspended")}</Badge></span><span data-label={ar ? "آخر نشاط" : "Last active"} className="member-activity">{member.lastActiveAt ? (ar ? "مؤخرًا" : "Recently") : (ar ? "لم ينضم" : "Not joined")}</span><button className="icon-button" type="button" aria-label={ar ? `إجراءات ${localize(member.name, locale)}` : `${localize(member.name, locale)} actions`}><MoreHorizontal size={16} /></button></div>)}</section><section className="roles-explainer"><div className="section-heading"><div><p className="section-kicker">{ar ? "نموذج الصلاحيات" : "Permission model"}</p><h2>{ar ? "الأدوار لا تُخفي السلطة" : "Roles make authority explicit"}</h2></div><button className="button button--outline button--compact" type="button"><KeyRound size={14} />{ar ? "عرض المصفوفة" : "View matrix"}</button></div><div>{(["admin", "builder", "reviewer", "viewer"] as TeamMember["role"][]).map((id) => <article key={id}><span>{id === "admin" ? <ShieldCheck size={16} /> : id === "reviewer" ? <UserCheck size={16} /> : id === "builder" ? <Users size={16} /> : <Check size={16} />}</span><strong>{localize(roleLabels[id], locale)}</strong><p>{roleSummary(id, ar)}</p></article>)}</div></section>{notice ? <DemoToast message={notice} /> : null}</div>;
}
