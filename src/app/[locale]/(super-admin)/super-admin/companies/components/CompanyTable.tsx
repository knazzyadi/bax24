// src/app/[locale]/(super-admin)/super-admin/companies/components/CompanyTable.tsx
'use client';

import { Pencil, Trash2, Power, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Company } from '../types';

interface CompanyTableProps {
  companies: Company[];
  onEdit: (company: Company) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

export function CompanyTable({ companies, onEdit, onDelete, onToggleStatus }: CompanyTableProps) {
  if (companies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card py-16">
        <div className="mb-4 text-6xl">🏢</div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">لا توجد شركات مسجلة</h3>
        <p className="mt-2 text-sm text-muted-foreground">انقر على 'إضافة شركة جديدة' لإنشاء أول شركة</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="min-w-full bg-card">
        <thead>
          <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b">
            <th className="p-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">#</th>
            <th className="p-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">اسم الشركة</th>
            <th className="p-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">الاسم بالإنجليزية</th>
            <th className="p-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">البريد الإلكتروني</th>
            <th className="p-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">الهاتف</th>
            <th className="p-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">الحالة</th>
            <th className="p-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">الإحصائيات</th>
            <th className="p-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">إجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
          {companies.map((company, index) => (
            <tr key={company.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors">
              <td className="p-3 text-center text-slate-700 dark:text-slate-200">{index + 1}</td>
              <td className="p-3 font-medium text-slate-700 dark:text-slate-200">{company.name}</td>
              <td className="p-3 text-slate-600 dark:text-slate-300">{company.nameEn || '—'}</td>
              <td className="p-3 text-slate-600 dark:text-slate-300">{company.email || '—'}</td>
              <td className="p-3 text-slate-600 dark:text-slate-300">{company.phone || '—'}</td>
              <td className="p-3">
                <Badge
                  variant={company.isActive ? 'default' : 'secondary'}
                  className={company.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}
                >
                  {company.isActive ? 'نشط' : 'غير نشط'}
                </Badge>
              </td>
              <td className="p-3 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1">
                    <span className="font-medium">{company._count?.users || 0}</span>
                    <span className="text-xs text-slate-400">مستخدم</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="font-medium">{company._count?.branches || 0}</span>
                    <span className="text-xs text-slate-400">فرع</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="font-medium">{company._count?.assets || 0}</span>
                    <span className="text-xs text-slate-400">أصل</span>
                  </span>
                </div>
              </td>
              <td className="p-3">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onToggleStatus(company.id)}
                    className={company.isActive 
                      ? 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30' 
                      : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30'}
                    title={company.isActive ? 'تعطيل' : 'تفعيل'}
                  >
                    {company.isActive ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(company)}
                    className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(company.id)}
                    className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}