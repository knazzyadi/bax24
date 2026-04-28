// src/app/[locale]/(dashboard)/tickets/[id]/page.tsx
"use client";

import React, { use } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";

import { PageContainer } from "@/components/shared/detail/PageContainer";
import { DetailHeader } from "@/components/shared/detail/DetailHeader";
import { InfoCard } from "@/components/shared/detail/InfoCard";
import { SidebarCard } from "@/components/shared/detail/SidebarCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TicketActions } from "./TicketActions";

interface TicketDetailsPageProps {
  params: Promise<{ id: string }>;
}

// دالة مساعدة لعرض الموقع كامل
function getFullLocation(room: any, isRtl: boolean): string {
  if (!room) return "—";
  const floor = room.floor;
  const building = floor?.building;
  const buildingName = building ? (isRtl ? building.name : building.nameEn || building.name) : "";
  const floorName = floor ? (isRtl ? floor.name : floor.nameEn || floor.name) : "";
  const roomName = isRtl ? room.name : room.nameEn || room.name;
  const parts = [buildingName, floorName, roomName].filter(p => p);
  return parts.join(" - ");
}

export default function TicketDetailsPage({ params }: TicketDetailsPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [ticket, setTicket] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

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
      } catch (error) {
        toast.error(isRtl ? "فشل تحميل التذكرة" : "Failed to load ticket");
        router.push(`/${locale}/tickets`);
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [id, locale, router, isRtl]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!ticket) return null;

  const statusObj = ticket.status
    ? {
        name: ticket.status,
        label:
          ticket.status === "PENDING"
            ? isRtl ? "معلق" : "Pending"
            : ticket.status === "APPROVED"
            ? isRtl ? "مقبول" : "Approved"
            : isRtl ? "مرفوض" : "Rejected",
      }
    : null;

  const ticketType =
    ticket.type === "MAINTENANCE"
      ? isRtl ? "تذكرة صيانة" : "Maintenance Ticket"
      : ticket.type === "INCIDENT"
      ? isRtl ? "تذكرة حادث" : "Incident Ticket"
      : ticket.type || (isRtl ? "غير محدد" : "Not specified");

  const images = ticket.images || ticket.ticketImages || [];
  const hasImages = Array.isArray(images) && images.length > 0;

  return (
    <PageContainer>
      <DetailHeader
        icon={<ShieldAlert size={28} />}
        title={`${isRtl ? "تذكرة" : "Ticket"} ${ticket.code || ticket.id.slice(-6)}`}
        subtitle={isRtl ? "تفاصيل ومعالجة التذكرة" : "Ticket details and handling"}
        actions={null}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* العمود الأيمن (المعلومات الرئيسية) */}
        <div className="lg:col-span-2 space-y-8">
          <InfoCard title={isRtl ? "تفاصيل التذكرة" : "Ticket Details"} icon={<FileText className="h-5 w-5" />}>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <div className="text-xs font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {isRtl ? "نوع التذكرة" : "Ticket Type"}
                  </div>
                  <p className="font-bold text-foreground">{ticketType}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    <ShieldAlert className="h-3 w-3" /> {isRtl ? "حالة التذكرة" : "Status"}
                  </div>
                  <StatusBadge status={statusObj} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-black text-muted-foreground uppercase tracking-wider">
                  {isRtl ? "موضوع التذكرة" : "Ticket Title"}
                </div>
                <p className="font-black text-lg text-foreground">{ticket.title}</p>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-black text-muted-foreground uppercase tracking-wider">
                  {isRtl ? "وصف التذكرة" : "Description"}
                </div>
                <p className="text-base leading-relaxed text-foreground/80">{ticket.description}</p>
              </div>

              <div className="pt-2 border-t border-primary/20">
                <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  <span className="font-black text-xs uppercase tracking-widest">
                    {isRtl ? "الصور المرفقة" : "Attached Images"}
                  </span>
                </div>
                {hasImages ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {images.map((img: any) => (
                      <a
                        key={img.id}
                        href={img.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block overflow-hidden rounded-xl border border-primary/20 hover:shadow-md transition-shadow"
                      >
                        <img
                          src={img.url}
                          alt={isRtl ? "صورة التذكرة" : "Ticket image"}
                          className="w-full h-32 object-cover hover:scale-105 transition-transform duration-200"
                        />
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="bg-secondary/20 rounded-xl p-4 text-center text-muted-foreground text-sm font-medium">
                    {isRtl ? "لا توجد صور مرفقة بهذه التذكرة" : "No images attached to this ticket"}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6 pt-2 border-t border-primary/20">
                <div className="space-y-1">
                  <div className="text-xs font-black text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-3 w-3" /> {isRtl ? "الموقع" : "Location"}
                  </div>
                  <p className="font-bold text-foreground">{getFullLocation(ticket.room, isRtl)}</p>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-black text-muted-foreground flex items-center gap-2">
                    <Package className="h-3 w-3" /> {isRtl ? "الأصل المرتبط" : "Associated Asset"}
                  </div>
                  <p className="font-bold text-foreground">
                    {ticket.asset?.name || (isRtl ? "لا يوجد" : "None")}
                    {ticket.asset?.code && ` (${ticket.asset.code})`}
                  </p>
                </div>
              </div>
            </div>
          </InfoCard>

          <InfoCard title={isRtl ? "معلومات إضافية" : "Additional Info"} icon={<Calendar className="h-5 w-5" />}>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-bold text-muted-foreground">{isRtl ? "تاريخ الإنشاء" : "Created At"}</span>
                <span className="font-bold">
                  {new Date(ticket.createdAt).toLocaleDateString(isRtl ? "ar-SA" : "en-US")}
                </span>
              </div>
              {ticket.updatedAt !== ticket.createdAt && (
                <div className="flex justify-between items-center py-2 border-t border-primary/20 mt-2 pt-2">
                  <span className="text-sm font-bold text-muted-foreground">{isRtl ? "آخر تحديث" : "Last Updated"}</span>
                  <span className="font-bold">
                    {new Date(ticket.updatedAt).toLocaleDateString(isRtl ? "ar-SA" : "en-US")}
                  </span>
                </div>
              )}
            </div>
          </InfoCard>

          {ticket.status === "REJECTED" && ticket.rejectionReason && (
            <InfoCard title={isRtl ? "سبب الرفض" : "Rejection Reason"} icon={<Ban className="h-5 w-5" />}>
              <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-800">
                <p className="text-red-700 dark:text-red-300 font-medium whitespace-pre-wrap">
                  {ticket.rejectionReason}
                </p>
              </div>
            </InfoCard>
          )}
        </div>

        {/* العمود الأيسر (البيانات الجانبية) */}
        <div className="space-y-8">
          <SidebarCard title={isRtl ? "بيانات المبلّغ" : "Reporter Info"} icon={<User className="h-5 w-5" />}>
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <User size={24} />
                </div>
                <div>
                  <p className="text-xs font-black text-muted-foreground uppercase">{isRtl ? "الاسم" : "Name"}</p>
                  <p className="font-black text-lg">{ticket.reporterName}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-muted/20 flex items-center justify-center text-muted-foreground">
                  <Calendar size={24} />
                </div>
                <div>
                  <p className="text-xs font-black text-muted-foreground uppercase">{isRtl ? "تاريخ التذكرة" : "Ticket Date"}</p>
                  <p className="font-black text-lg">
                    {new Date(ticket.createdAt).toLocaleDateString(isRtl ? "ar-SA" : "en-US")}
                  </p>
                </div>
              </div>
              {ticket.reporterEmail && (
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-muted/20 flex items-center justify-center text-muted-foreground">
                    <FileText size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-muted-foreground uppercase">{isRtl ? "البريد الإلكتروني" : "Email"}</p>
                    <p className="font-bold">{ticket.reporterEmail}</p>
                  </div>
                </div>
              )}
              {ticket.phone && (
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-muted/20 flex items-center justify-center text-muted-foreground">
                    <FileText size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-muted-foreground uppercase">{isRtl ? "رقم الهاتف" : "Phone"}</p>
                    <p className="font-bold">{ticket.phone}</p>
                  </div>
                </div>
              )}

              {/* أزرار القبول والرفض: تم نقلها إلى مكون TicketActions */}
              <TicketActions ticketId={ticket.id} currentStatus={ticket.status} />

              {ticket.status !== "PENDING" && (
                <div
                  className={cn(
                    "p-3 rounded-xl border text-center font-bold mt-4",
                    ticket.status === "APPROVED"
                      ? "bg-green-500/10 text-green-600 border-green-500/20"
                      : "bg-red-500/10 text-red-500 border-red-500/20"
                  )}
                >
                  {ticket.status === "APPROVED"
                    ? (isRtl ? "✅ تم اعتماد هذه التذكرة مسبقاً" : "✅ This ticket has been approved")
                    : (isRtl ? "❌ تم رفض هذه التذكرة" : "❌ This ticket has been rejected")}
                </div>
              )}

              {ticket.workOrder && (
                <div className="mt-4 p-3 bg-primary/10 rounded-xl">
                  <p className="text-sm font-bold">
                    {isRtl ? "أمر العمل المرتبط:" : "Associated Work Order:"}
                    <Link href={`/${locale}/work-orders/${ticket.workOrder.id}`} className="text-primary underline ml-2">
                      {ticket.workOrder.code || ticket.workOrder.id}
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </SidebarCard>

          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-primary/10 border border-primary/30 flex items-start gap-3">
              <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="text-xs font-bold text-muted-foreground">
                {isRtl
                  ? "بعد قبول التذكرة سيتم إنشاء طلب عمل تلقائياً لمتابعة الإجراء."
                  : "Upon approval, a work order will be automatically created for further processing."}
              </div>
            </div>
            <Button
              onClick={() => router.push(`/${locale}/tickets`)}
              variant="outline"
              className="w-full rounded-full border-primary text-primary hover:bg-primary/10 font-black h-11 gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {isRtl ? "عودة إلى قائمة البلاغات" : "Back to Tickets"}
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}