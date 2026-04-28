"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Check, Loader2, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";

interface TicketActionsProps {
  ticketId: string;
  currentStatus: string; // PENDING, APPROVED, REJECTED
}

export function TicketActions({ ticketId, currentStatus }: TicketActionsProps) {
  const router = useRouter();
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  // إذا لم تكن الحالة معلقة لا تظهر الأزرار
  if (currentStatus !== "PENDING") return null;

  // ✅ قبول البلاغ
  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error || (isRtl ? "فشل قبول البلاغ" : "Accept failed")
        );
      }

      // عرض إشعار النجاح
      toast.success(
        isRtl
          ? "✅ تم قبول البلاغ"
          : "✅ Ticket accepted"
      );

      // تأخير بسيط لضمان ظهور الإشعار ثم الانتقال إلى صفحة البلاغات
      setTimeout(() => {
        router.push(`/${locale}/tickets`);
      }, 500);
    } catch (err: any) {
      toast.error(
        err.message || (isRtl ? "تعذر الاتصال بالخادم" : "Server error")
      );
    } finally {
      setIsApproving(false);
    }
  };

  // ❌ رفض البلاغ
  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error(
        isRtl
          ? "يرجى كتابة سبب الرفض"
          : "Please provide a rejection reason"
      );
      return;
    }

    setIsRejecting(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "REJECTED",
          rejectionReason: rejectReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error || (isRtl ? "فشل رفض البلاغ" : "Reject failed")
        );
      }

      toast.success(
        isRtl
          ? "❌ تم رفض البلاغ"
          : "❌ Ticket rejected"
      );

      setRejectDialogOpen(false);

      // تأخير بسيط ثم الانتقال
      setTimeout(() => {
        router.push(`/${locale}/tickets`);
      }, 500);
    } catch (err: any) {
      toast.error(
        err.message || (isRtl ? "خطأ في الشبكة" : "Network error")
      );
    } finally {
      setIsRejecting(false);
      setRejectReason("");
    }
  };

  return (
    <div className="space-y-3" dir={isRtl ? "rtl" : "ltr"}>
      {/* ✅ زر قبول */}
      <Button
        onClick={handleApprove}
        disabled={isApproving || isRejecting}
        className="w-full h-14 rounded-full bg-primary hover:bg-primary/90 text-white font-black text-base gap-2 shadow-md"
      >
        {isApproving ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Check size={20} />
        )}
        {isRtl ? "قبول واعتماد البلاغ" : "Accept & Create Work Order"}
      </Button>

      {/* ❌ زر رفض */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogTrigger
          disabled={isApproving || isRejecting}
          className="w-full h-14 rounded-full border-red-500/30 text-red-500 hover:bg-red-500/5 font-black text-base gap-2 inline-flex items-center justify-center"
        >
          <Ban size={20} />
          {isRtl ? "رفض البلاغ" : "Reject Ticket"}
        </AlertDialogTrigger>

        <AlertDialogContent
          className="bg-card border-border rounded-2xl max-w-[400px]"
          dir={isRtl ? "rtl" : "ltr"}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground text-xl font-black text-right">
              {isRtl ? "رفض البلاغ" : "Reject Ticket"}
            </AlertDialogTitle>

            <AlertDialogDescription className="text-muted-foreground font-bold text-right">
              {isRtl
                ? "يرجى كتابة سبب الرفض ليتم توثيقه في سجل النظام."
                : "Please provide a reason for rejection to be recorded."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-2">
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={
                isRtl ? "اكتب التوضيح هنا..." : "Write your reason here..."
              }
              className="rounded-2xl bg-background border-border min-h-[100px] font-bold text-right"
            />
          </div>

          <AlertDialogFooter className="flex flex-col gap-2 pt-4">
            <Button
              onClick={handleReject}
              disabled={isRejecting || !rejectReason.trim()}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full font-black h-11 w-full"
            >
              {isRejecting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                isRtl ? "تأكيد الرفض" : "Confirm Rejection"
              )}
            </Button>

            <AlertDialogCancel className="rounded-full font-black h-11 w-full border-none hover:bg-secondary">
              {isRtl ? "تراجع" : "Cancel"}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}