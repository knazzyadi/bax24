"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const isRtl = locale === "ar";
  const ticketId = searchParams.get("id");

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <div className="bg-card rounded-2xl border border-border shadow-xl p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {isRtl ? "تم إرسال البلاغ بنجاح" : "Ticket Submitted Successfully"}
        </h1>
        {ticketId && (
          <p className="text-sm text-muted-foreground mb-4">
            {isRtl ? "رقم التذكرة:" : "Ticket ID:"} <span className="font-mono font-bold">{ticketId}</span>
          </p>
        )}
        <p className="text-muted-foreground mb-6">
          {isRtl
            ? "شكراً لك. سيتم مراجعة البلاغ في أقرب وقت وسيتم التواصل معك."
            : "Thank you. Your ticket will be reviewed shortly and you will be contacted."}
        </p>
        <Button onClick={() => router.push(`/${locale}`)} className="w-full">
          {isRtl ? "العودة للرئيسية" : "Back to Home"}
        </Button>
      </div>
    </div>
  );
}