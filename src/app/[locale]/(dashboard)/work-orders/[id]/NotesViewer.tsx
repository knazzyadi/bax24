// src/app/[locale]/(dashboard)/work-orders/[id]/NotesViewer.tsx
"use client";

interface NotesViewerProps {
  notes: string | null;
  isRtl: boolean;
  t: any;
}

export function NotesViewer({ notes, isRtl, t }: NotesViewerProps) {
  if (!notes) return null;

  return (
    <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/30 dark:border-slate-700/30 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
      {notes}
    </div>
  );
}