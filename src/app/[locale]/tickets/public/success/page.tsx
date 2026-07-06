// src/app/[locale]/tickets/public/success/page.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { CheckCircle, FileText, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

// =========================
// تنسيقات موحدة (نفس باقي الصفحات)
// =========================
const glassCard =
  "bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl shadow-xl";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const isRtl = locale === "ar";
  const ticketId = searchParams.get("id");
  const slug = searchParams.get("slug");
  const token = searchParams.get("token");

  // زر تقديم بلاغ جديد
  const handleNewTicket = () => {
    if (slug && token) {
      router.push(`/${locale}/tickets/public/${slug}/${token}`);
    } else {
      router.push(`/${locale}`);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6">
      {/* خلفية متدرجة موحّدة (نفس باقي الصفحات) */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 -z-10" />

      <div className={cn(glassCard, "p-8 max-w-md w-full text-center relative overflow-hidden")}>
        {/* خلفية متدرجة خفيفة عند التمرير */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-50/30 to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-950/20 opacity-50" />

        <div className="relative z-10">
          {/* أيقونة النجاح مع خلفية متدرجة (مثل باقي الصفحات) */}
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 dark:from-emerald-500/20 dark:to-green-500/20 border border-emerald-200/30 dark:border-emerald-800/30 shadow-lg shadow-emerald-500/5">
              <CheckCircle className="h-12 w-12 text-emerald-500 dark:text-emerald-400" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            {isRtl ? "تم إرسال البلاغ بنجاح" : "Ticket Submitted Successfully"}
          </h1>

          {ticketId && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {isRtl ? "رقم التذكرة:" : "Ticket ID:"}{" "}
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {ticketId}
              </span>
            </p>
          )}

          <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
            {isRtl
              ? "شكراً لك. سيتم مراجعة البلاغ في أقرب وقت وسيتم التواصل معك."
              : "Thank you. Your ticket will be reviewed shortly and you will be contacted."}
          </p>

          {/* الأزرار */}
          <div className="space-y-3">
            {slug && token && (
              <Button
                onClick={handleNewTicket}
                variant="outline"
                className="w-full gap-2 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400 font-medium h-12"
              >
                <FileText className="h-4 w-4" />
                {isRtl ? "تقديم بلاغ جديد" : "Submit Another Ticket"}
              </Button>
            )}
            <Button
              onClick={() => router.push(`/${locale}`)}
              className="w-full gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-12 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
              {isRtl ? "العودة للرئيسية" : "Back to Home"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}