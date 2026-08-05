// src/app/[locale]/(super-admin)/super-admin/branches/BranchTable.tsx
'use client';

import { Share2, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Branch } from './types';

interface BranchTableProps {
  branches: Branch[];
  onEdit: (branch: Branch) => void;
  onDelete: (id: string) => void;
  onCopyLink: (branch: Branch) => void;
}

export function BranchTable({ branches, onEdit, onDelete, onCopyLink }: BranchTableProps) {
  if (branches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card py-16">
        <div className="mb-4 text-6xl">📂</div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">لا توجد فروع مسجلة</h3>
        <p className="mt-2 text-sm text-muted-foreground">انقر على «إضافة فرع جديد» لإنشاء أول فرع</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="min-w-full bg-card">
        <thead>
          <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b">
            <th className="p-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">#</th>
            <th className="p-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">اسم الفرع (عربي)</th>
            <th className="p-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">الاسم بالإنجليزية</th>
            <th className="p-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">الكود</th>
            <th className="p-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">الشركة</th>
            <th className="p-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">رابط البلاغات</th>
            <th className="p-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">إجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
          {branches.map((branch, index) => {
            const hasPublic = !!(branch.slug && branch.publicToken);
            return (
              <tr key={branch.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors">
                <td className="p-3 text-center text-slate-700 dark:text-slate-200">{index + 1}</td>
                <td className="p-3 font-medium text-slate-700 dark:text-slate-200">{branch.name}</td>
                <td className="p-3 text-slate-600 dark:text-slate-300">{branch.nameEn || '—'}</td>
                <td className="p-3 font-mono text-slate-600 dark:text-slate-300">{branch.code}</td>
                <td className="p-3 text-slate-600 dark:text-slate-300">{branch.company?.name || '—'}</td>
                <td className="p-3">
                  {hasPublic ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCopyLink(branch)}
                      className="gap-1 text-indigo-600 dark:text-indigo-400 border-indigo-200 hover:bg-indigo-50 dark:border-indigo-800 dark:hover:bg-indigo-950/30"
                    >
                      <Share2 className="h-4 w-4" />
                      نسخ الرابط
                    </Button>
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-slate-500">غير متوفر</span>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(branch)}
                      className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(branch.id)}
                      className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}