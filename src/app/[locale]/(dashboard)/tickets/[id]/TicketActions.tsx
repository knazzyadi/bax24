// src/app/[locale]/(dashboard)/tickets/[id]/TicketActions.tsx
"use client";

// =========================
// Imports
// =========================
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
import { cn } from "@/lib/utils";

// =========================
// Types
// =========================
interface TicketActionsProps {
  ticketId: string;
  currentStatus: string; // PENDING, APPROVED, REJECTED
}

// =========================
// Component: TicketActions
// =========================
export function TicketActions({ ticketId, currentStatus }: TicketActionsProps) {
  const router = useRouter();
  const locale = useLocale();
  const isRtl = locale === "ar";

  // ----- State -----
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  // إذا لم تكن الحالة معلقة لا تظهر الأزرار
  if (currentStatus !== "PENDING") return null;

  // ----- Handlers -----
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

      toast.success(
        isRtl
          ? "✅ تم قبول البلاغ"
          : "✅ Ticket accepted"
      );

      setTimeout(() => {
        router.push(`/${locale}/tickets`);
      }, 500);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : isRtl
            ? "تعذر الاتصال بالخادم"
            : "Server error";

      toast.error(message);
    } finally {
      setIsApproving(false);
    }
  };

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

      setTimeout(() => {
        router.push(`/${locale}/tickets`);
      }, 500);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : isRtl
            ? "خطأ في الشبكة"
            : "Network error";

      toast.error(message);
    } finally {
      setIsRejecting(false);
      setRejectReason("");
    }
  };

  // ----- Render -----
  return (
    <div className="space-y-3" dir={isRtl ? "rtl" : "ltr"}>
      {/* ✅ زر قبول - بتدرج indigo → purple */}
      <Button
        onClick={handleApprove}
        disabled={isApproving || isRejecting}
        className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200 gap-2"
      >
        {isApproving ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Check className="h-5 w-5" />
        )}
        {isRtl ? "قبول واعتماد البلاغ" : "Accept & Create Work Order"}
      </Button>

      {/* ❌ زر رفض - مع AlertDialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogTrigger
          disabled={isApproving || isRejecting}
          className={cn(
            "w-full h-12 rounded-xl border border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-medium transition-all duration-200 flex items-center justify-center gap-2",
            (isApproving || isRejecting) && "opacity-50 cursor-not-allowed"
          )}
        >
          <Ban className="h-5 w-5" />
          {isRtl ? "رفض البلاغ" : "Reject Ticket"}
        </AlertDialogTrigger>

        <AlertDialogContent
          className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl shadow-xl max-w-[400px]"
          dir={isRtl ? "rtl" : "ltr"}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {isRtl ? "رفض البلاغ" : "Reject Ticket"}
            </AlertDialogTitle>

            <AlertDialogDescription className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              {isRtl
                ? "يرجى كتابة سبب الرفض ليتم توثيقه في سجل النظام."
                : "Please provide a reason for rejection to be recorded."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={
                isRtl ? "اكتب التوضيح هنا..." : "Write your reason here..."
              }
              className="rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all p-4 min-h-[100px] resize-none"
            />
          </div>

          <AlertDialogFooter className="flex flex-col gap-3 pt-2">
            <Button
              onClick={handleReject}
              disabled={isRejecting || !rejectReason.trim()}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white font-medium shadow-lg shadow-rose-500/20 hover:shadow-rose-500/30 transition-all duration-200"
            >
              {isRejecting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                isRtl ? "تأكيد الرفض" : "Confirm Rejection"
              )}
            </Button>

            <AlertDialogCancel className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400 font-medium transition-all duration-200">
              {isRtl ? "إلغاء" : "Cancel"}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}