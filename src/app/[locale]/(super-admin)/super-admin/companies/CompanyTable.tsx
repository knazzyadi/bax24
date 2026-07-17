// src/app/[locale]/(super-admin)/super-admin/companies/CompanyTable.tsx
'use client';

import { useTranslations } from 'next-intl';
import { Pencil, Trash2, Power, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/shared/DataTable';
import type { Company } from './types';
import { cn } from '@/lib/utils';

interface CompanyTableProps {
  companies: Company[];
  onEdit: (company: Company) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

export function CompanyTable({
  companies,
  onEdit,
  onDelete,
  onToggleStatus,
}: CompanyTableProps) {
  const t = useTranslations('SuperAdmin');

  // تعريف الأعمدة
  const columns = [
    {
      key: 'index',
      header: '#',
      cell: (_: Company, index: number) => (
        <span className="text-slate-500 dark:text-slate-400">{index + 1}</span>
      ),
      className: 'w-12 text-center',
    },
    {
      key: 'name',
      header: t('companyName'),
      cell: (company: Company) => (
        <span className="font-medium text-slate-700 dark:text-slate-200">
          {company.name}
        </span>
      ),
    },
    {
      key: 'nameEn',
      header: t('companyNameEn'),
      cell: (company: Company) => (
        <span className="text-slate-600 dark:text-slate-300">
          {company.nameEn || '—'}
        </span>
      ),
    },
    {
      key: 'email',
      header: t('email'),
      cell: (company: Company) => (
        <span className="text-slate-600 dark:text-slate-300">
          {company.email || '—'}
        </span>
      ),
    },
    {
      key: 'phone',
      header: t('phone'),
      cell: (company: Company) => (
        <span className="text-slate-600 dark:text-slate-300">
          {company.phone || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('status'),
      cell: (company: Company) => (
        <Badge
          variant={company.isActive ? 'default' : 'secondary'}
          className={cn(
            company.isActive
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
          )}
        >
          {company.isActive ? t('active') : t('inactive')}
        </Badge>
      ),
    },
    {
      key: 'stats',
      header: t('statistics'),
      cell: (company: Company) => {
        const userCount = company._count?.users || 0;
        const branchCount = company._count?.branches || 0;
        const assetCount = company._count?.assets || 0;

        return (
          <div className="flex items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {userCount}
              </span>
              <span className="text-xs text-slate-400">{t('users')}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {branchCount}
              </span>
              <span className="text-xs text-slate-400">{t('branches')}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {assetCount}
              </span>
              <span className="text-xs text-slate-400">{t('assets')}</span>
            </span>
          </div>
        );
      },
    },
    {
      key: 'createdAt',
      header: t('createdAt'),
      cell: (company: Company) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {new Date(company.createdAt).toLocaleDateString('ar-SA')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('actions'),
      cell: (company: Company) => {
        const hasUsers = (company._count?.users || 0) > 0;
        const hasBranches = (company._count?.branches || 0) > 0;
        const canDelete = !hasUsers && !hasBranches;

        return (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleStatus(company.id)}
              className={cn(
                company.isActive
                  ? 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                  : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30'
              )}
              title={company.isActive ? t('deactivate') : t('activate')}
            >
              {company.isActive ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(company)}
              className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
              title={t('edit')}
            >
              <Pencil className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(company.id)}
              disabled={!canDelete}
              className={cn(
                'text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30',
                !canDelete && 'opacity-50 cursor-not-allowed'
              )}
              title={
                !canDelete
                  ? t('cannotDeleteHasUsersOrBranches')
                  : t('delete')
              }
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
      className: 'w-48',
    },
  ];

  return (
    <DataTable
      data={companies}
      columns={columns}
      emptyMessage={t('noCompanies')}
    />
  );
}