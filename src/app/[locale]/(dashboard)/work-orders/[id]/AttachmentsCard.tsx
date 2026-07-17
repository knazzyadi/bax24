// [id]/components/AttachmentsCard.tsx
"use client";

import { FileText } from "lucide-react";
import { AttachmentsManager } from "@/components/work-order/AttachmentsManager";

export function AttachmentsCard({ workOrderId, canUpload, canDelete, isRtl }: any) {
  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40">
          <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {isRtl ? "مرفقات PDF" : "PDF Attachments"}
        </h2>
      </div>
      <AttachmentsManager
        workOrderId={workOrderId}
        canUpload={canUpload}
        canDelete={canDelete}
        maxFiles={5}
      />
    </div>
  );
}