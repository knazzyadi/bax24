// [id]/components/TicketImagesCard.tsx
"use client";

import { FileText, Loader2 } from "lucide-react";

export function TicketImagesCard({ attachments, isRtl, t }: any) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40">
          <FileText className="h-5 w-5 text-rose-600 dark:text-rose-400" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {isRtl ? "صور التذكرة" : "Ticket Images"}
        </h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {attachments.map((att: any) => (
          <a
            key={att.id}
            href={att.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block overflow-hidden rounded-xl border border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
          >
            <img
              src={att.url}
              alt={att.originalName || "Attachment"}
              className="w-full h-32 object-cover hover:scale-105 transition-transform duration-300"
            />
          </a>
        ))}
      </div>
    </div>
  );
}