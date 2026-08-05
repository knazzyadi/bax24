// src/app/[locale]/(dashboard)/tickets/[id]/page.tsx
"use client";

// =========================
// Imports
// =========================
import React, { use } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Image from "next/image";
import {
  CheckCircle2,
  MapPin,
  Package,
  User,
  FileText,
  Loader2,
  Calendar,
  ShieldAlert,
  Info,
  Ban,
  AlertCircle,
  ImageIcon,
  ArrowLeft,
  Clock,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";

import { TicketActions } from "./TicketActions";

// =========================
// Types
// =========================
type StatusKey = "PENDING" | "APPROVED" | "REJECTED";

type RoomLocation =
  | {
      name: string;
      nameEn?: string | null;
      floor?: {
        name: string;
        nameEn?: string | null;
        building?: {
          name: string;
          nameEn?: string | null;
        } | null;
      } | null;
    }
  | null
  | undefined;

type Attachment = {
  id: string;
  url: string;
  originalName?: string | null;
};

type Ticket = {
  id: string;
  code: string;
  title: string;
  description: string;
  status: string;

  type?: string | null;
  rejectionReason?: string | null;

  createdAt: string;
  updatedAt: string;

  reporterName?: string | null;
  reporterEmail?: string | null;
  phone?: string | null;

  room?: RoomLocation;
  attachments?: Attachment[];

  asset?: {
    name?: string | null;
    code?: string | null;
  } | null;

  workOrder?: {
    id: string;
    code?: string | null;
  } | null;
};

interface TicketDetailsPageProps {
  params: Promise<{ id: string }>;
}

// =========================
// Constants
// =========================
const STATUS_CONFIG: Record<
  StatusKey,
  {
    label: { ar: string; en: string };
    hex: string;
    icon: LucideIcon;
    glow: string;
    bg: string;
  }
> = {
  PENDING: {
    label: { ar: "معلق", en: "Pending" },
    hex: "#f59e0b",
    icon: Clock,
    glow: "shadow-amber-500/20",
    bg: "bg-amber-50 dark:bg-amber-950/30",
  },
  APPROVED: {
    label: { ar: "مقبول", en: "Approved" },
    hex: "#10b981",
    icon: CheckCircle2,
    glow: "shadow-emerald-500/20",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
  },
  REJECTED: {
    label: { ar: "مرفوض", en: "Rejected" },
    hex: "#ef4444",
    icon: XCircle,
    glow: "shadow-rose-500/20",
    bg: "bg-rose-50 dark:bg-rose-950/30",
  },
};

const GLASS_CARD =
  "bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300";

// =========================
// Helper Functions
// =========================
function getStatusDisplay(status: string, isRtl: boolean) {
  const config = STATUS_CONFIG[status as StatusKey] || STATUS_CONFIG.PENDING;
  return {
    label: isRtl ? config.label.ar : config.label.en,
    hex: config.hex,
    icon: config.icon,
    glow: config.glow,
    bg: config.bg,
  };
}

function getFullLocation(room: RoomLocation, isRtl: boolean): string {
  if (!room) return "—";
  const floor = room.floor;
  const building = floor?.building;
  const buildingName = building
    ? isRtl
      ? building.name
      : building.nameEn || building.name
    : "";
  const floorName = floor
    ? isRtl
      ? floor.name
      : floor.nameEn || floor.name
    : "";
  const roomName = isRtl ? room.name : room.nameEn || room.name;
  return [buildingName, floorName, roomName].filter(Boolean).join(" - ");
}

// =========================
// Component: TicketDetailsPage
// =========================
export default function TicketDetailsPage({ params }: TicketDetailsPageProps) {
  // ----- Hooks -----
  const { id } = use(params);
  const router = useRouter();
  const locale = useLocale();
  const isRtl = locale === "ar";

  // ----- State -----
  const [ticket, setTicket] = React.useState<Ticket | null>(null);
  const [loading, setLoading] = React.useState(true);

  // ----- Data Fetching (useEffect) -----
  React.useEffect(() => {
    const fetchTicket = async () => {
      try {
        const res = await fetch(`/api/tickets/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            toast.error(isRtl ? "التذكرة غير موجودة" : "Ticket not found");
            router.push(`/${locale}/tickets`);
            return;
          }
          throw new Error();
        }
        const data = await res.json();
        setTicket(data);
      } catch {
        toast.error(isRtl ? "فشل تحميل التذكرة" : "Failed to load ticket");
        router.push(`/${locale}/tickets`);
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [id, locale, router, isRtl]);

  // ----- Loading State -----
  if (loading) {
    return (
      <div className="relative min-h-[60vh] flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 dark:text-indigo-400" />
      </div>
    );
  }
  if (!ticket) return null;

  // ----- Derived Data -----
  const statusInfo = getStatusDisplay(ticket.status, isRtl);
  const StatusIcon = statusInfo.icon;
  const ticketType =
    ticket.type === "MAINTENANCE"
      ? isRtl
        ? "تذكرة صيانة"
        : "Maintenance Ticket"
      : ticket.type === "INCIDENT"
      ? isRtl
        ? "تذكرة حادث"
        : "Incident Ticket"
      : ticket.type || (isRtl ? "غير محدد" : "Not specified");

  const images: Attachment[] = ticket.attachments || [];
  const hasImages = Array.isArray(images) && images.length > 0;

  // ----- Render -----
  return (
    <div className="relative space-y-8 p-6">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

      {/* Header */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/30 dark:border-indigo-800/30 shadow-lg shadow-indigo-500/5">
            <ShieldAlert className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {isRtl ? "تذكرة" : "Ticket"} {ticket.code || ticket.id.slice(-6)}
              </h1>
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border border-slate-200/30 dark:border-slate-700/30 shadow-sm"
                style={{
                  backgroundColor: `${statusInfo.hex}20`,
                  color: statusInfo.hex,
                  boxShadow: `0 0 15px ${statusInfo.hex}25`,
                }}
              >
                <StatusIcon size={14} />
                {statusInfo.label}
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {isRtl ? "تفاصيل ومعالجة التذكرة" : "Ticket details and handling"}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(`/${locale}/tickets`)}
          className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400"
        >
          <ArrowLeft className="h-4 w-4 ml-2" />
          {isRtl ? "العودة إلى البلاغات" : "Back to Tickets"}
        </Button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Ticket Details */}
          <div className={GLASS_CARD}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40">
                <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {isRtl ? "تفاصيل التذكرة" : "Ticket Details"}
              </h2>
            </div>

            <div className="space-y-6">
              {/* Type & Status */}
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {isRtl ? "نوع التذكرة" : "Ticket Type"}
                  </div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    {ticketType}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    {isRtl ? "حالة التذكرة" : "Status"}
                  </div>
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border border-slate-200/30 dark:border-slate-700/30 shadow-sm"
                    style={{
                      backgroundColor: `${statusInfo.hex}20`,
                      color: statusInfo.hex,
                      boxShadow: `0 0 15px ${statusInfo.hex}25`,
                    }}
                  >
                    <StatusIcon size={14} />
                    {statusInfo.label}
                  </span>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {isRtl ? "موضوع التذكرة" : "Ticket Title"}
                </div>
                <p className="font-semibold text-lg text-slate-800 dark:text-slate-100">
                  {ticket.title}
                </p>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {isRtl ? "وصف التذكرة" : "Description"}
                </div>
                <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/30 dark:border-slate-700/30 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {ticket.description}
                </div>
              </div>

              {/* Attachments */}
              <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">
                  <ImageIcon className="h-3.5 w-3.5 text-indigo-400" />
                  {isRtl ? "المرفقات" : "Attachments"}
                </div>
                {hasImages ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {images.map((img) => (
                      <a
                        key={img.id}
                        href={img.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block overflow-hidden rounded-xl border border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
                      >
                        <Image
                          src={img.url}
                          alt={img.originalName || (isRtl ? "مرفق" : "Attachment")}
                          width={400}
                          height={200}
                          className="w-full h-32 object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/30 dark:border-slate-700/30 text-center text-sm text-slate-400 dark:text-slate-500">
                    {isRtl ? "لا توجد مرفقات لهذه التذكرة" : "No attachments for this ticket"}
                  </div>
                )}
              </div>

              {/* Location & Asset */}
              <div className="grid sm:grid-cols-2 gap-5 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <MapPin className="h-3.5 w-3.5" />
                    {isRtl ? "الموقع" : "Location"}
                  </div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    {getFullLocation(ticket.room, isRtl)}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <Package className="h-3.5 w-3.5" />
                    {isRtl ? "الأصل المرتبط" : "Associated Asset"}
                  </div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    {ticket.asset?.name || (isRtl ? "لا يوجد" : "None")}
                    {ticket.asset?.code && ` (${ticket.asset.code})`}
                  </p>
                </div>
              </div>

              {/* Rejection Reason */}
              {ticket.status === "REJECTED" && ticket.rejectionReason && (
                <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                    <Ban className="h-3.5 w-3.5 text-rose-400" />
                    {isRtl ? "سبب الرفض" : "Rejection Reason"}
                  </div>
                  <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-800/30 text-sm text-rose-700 dark:text-rose-300 font-medium leading-relaxed">
                    {ticket.rejectionReason}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional Info */}
          <div className={GLASS_CARD}>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {isRtl ? "معلومات إضافية" : "Additional Info"}
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-200/30 dark:border-slate-800/30">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {isRtl ? "تاريخ الإنشاء" : "Created At"}
                </span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {new Date(ticket.createdAt).toLocaleDateString(
                    isRtl ? "ar-SA" : "en-US"
                  )}
                </span>
              </div>
              {ticket.updatedAt !== ticket.createdAt && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {isRtl ? "آخر تحديث" : "Last Updated"}
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {new Date(ticket.updatedAt).toLocaleDateString(
                      isRtl ? "ar-SA" : "en-US"
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-6">
          {/* Reporter Info */}
          <div className={GLASS_CARD}>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
                <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {isRtl ? "بيانات المبلّغ" : "Reporter Info"}
              </h3>
            </div>
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950/40 dark:to-purple-950/40 flex items-center justify-center">
                  <User className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {isRtl ? "الاسم" : "Name"}
                  </p>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    {ticket.reporterName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-800/30 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {isRtl ? "تاريخ التذكرة" : "Ticket Date"}
                  </p>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    {new Date(ticket.createdAt).toLocaleDateString(
                      isRtl ? "ar-SA" : "en-US"
                    )}
                  </p>
                </div>
              </div>

              {ticket.reporterEmail && (
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-800/30 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {isRtl ? "البريد الإلكتروني" : "Email"}
                    </p>
                    <p className="font-semibold text-slate-700 dark:text-slate-300 break-all">
                      {ticket.reporterEmail}
                    </p>
                  </div>
                </div>
              )}

              {ticket.phone && (
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-800/30 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {isRtl ? "رقم الهاتف" : "Phone"}
                    </p>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      {ticket.phone}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <TicketActions ticketId={ticket.id} currentStatus={ticket.status} />

          {/* Status Message (if not pending) */}
          {ticket.status !== "PENDING" && (
            <div
              className={cn(
                "p-4 rounded-2xl border text-center font-semibold",
                ticket.status === "APPROVED"
                  ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-300"
                  : "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/50 dark:border-rose-800/30 text-rose-700 dark:text-rose-300"
              )}
            >
              {ticket.status === "APPROVED"
                ? isRtl
                  ? "✅ تم اعتماد هذه التذكرة مسبقاً"
                  : "✅ This ticket has been approved"
                : isRtl
                ? "❌ تم رفض هذه التذكرة"
                : "❌ This ticket has been rejected"}
            </div>
          )}

          {/* Associated Work Order */}
          {ticket.workOrder && (
            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-800/30">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {isRtl ? "أمر العمل المرتبط:" : "Associated Work Order:"}
                <Link
                  href={`/${locale}/work-orders/${ticket.workOrder.id}`}
                  className="text-indigo-600 dark:text-indigo-400 underline ml-2 font-semibold hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                >
                  {ticket.workOrder.code || ticket.workOrder.id}
                </Link>
              </p>
            </div>
          )}

          {/* Quick Help */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200/30 dark:border-indigo-800/30 flex items-start gap-3">
            <Info className="h-5 w-5 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
              {isRtl
                ? "بعد قبول التذكرة سيتم إنشاء طلب عمل تلقائياً لمتابعة الإجراء."
                : "Upon approval, a work order will be automatically created for further processing."}
            </div>
          </div>

          {/* Back Button */}
          <Button
            onClick={() => router.push(`/${locale}/tickets`)}
            variant="outline"
            className="w-full rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400 font-medium h-11 transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4 ml-2" />
            {isRtl ? "عودة إلى قائمة البلاغات" : "Back to Tickets"}
          </Button>
        </div>
      </div>
    </div>
  );
}