// src/app/[locale]/(dashboard)/locations/floors/FloorsTable.tsx
'use client';

import { Pencil, Trash2, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Floor, Building } from './types';

interface FloorsTableProps {
  floors: Floor[];
  buildings: Building[];
  onEdit: (floor: Floor) => void;
  onDelete: (id: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  buildingFilter: string;
  onBuildingFilterChange: (value: string) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
  isLoading: boolean;
  locale: string;
}

export function FloorsTable({
  floors,
  buildings,
  onEdit,
  onDelete,
  search,
  onSearchChange,
  buildingFilter,
  onBuildingFilterChange,
  sortBy,
  sortOrder,
  onSort,
  isLoading,
  locale,
}: FloorsTableProps) {
  const t = useTranslations('Locations');
  const isRTL = locale === 'ar';

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <ChevronUp className="h-3 w-3 opacity-30" />;
    return sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  };

  if (floors.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 text-6xl">📚</div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {isRTL ? 'لا توجد أدوار' : 'No Floors Found'}
        </h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {isRTL
            ? 'ابدأ بإضافة دور جديد لتنظيم الطوابق'
            : 'Start by adding a new floor to organize levels'}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* شريط البحث والتصفية */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className={cn(
            "absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400",
            isRTL ? "right-3" : "left-3"
          )} />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={isRTL ? 'بحث بالاسم أو الكود...' : 'Search by name or code...'}
            className={cn(
              "w-full h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 text-sm",
              isRTL ? "pr-9 pl-3" : "pl-9 pr-3"
            )}
          />
        </div>
        <select
          value={buildingFilter}
          onChange={(e) => onBuildingFilterChange(e.target.value)}
          className="h-10 px-3 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 text-sm appearance-none min-w-[160px]"
        >
          <option value="">{isRTL ? 'جميع المباني' : 'All Buildings'}</option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {/* الجدول */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/50 dark:bg-slate-800/30">
            <tr>
              <th className={cn(
                "p-3 text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider",
                isRTL ? "text-right" : "text-left"
              )}>
                #
              </th>
              <th
                className={cn(
                  "p-3 text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 select-none",
                  isRTL ? "text-right" : "text-left"
                )}
                onClick={() => onSort('buildingId')}
              >
                <span className="flex items-center gap-1">
                  {isRTL ? 'المبنى' : 'Building'}
                  <SortIcon field="buildingId" />
                </span>
              </th>
              <th
                className={cn(
                  "p-3 text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 select-none",
                  isRTL ? "text-right" : "text-left"
                )}
                onClick={() => onSort('name')}
              >
                <span className="flex items-center gap-1">
                  {isRTL ? 'الاسم' : 'Name'}
                  <SortIcon field="name" />
                </span>
              </th>
              <th className={cn(
                "p-3 text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider",
                isRTL ? "text-right" : "text-left"
              )}>
                {isRTL ? 'الاسم بالإنجليزية' : 'English Name'}
              </th>
              <th
                className={cn(
                  "p-3 text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 select-none",
                  isRTL ? "text-right" : "text-left"
                )}
                onClick={() => onSort('code')}
              >
                <span className="flex items-center gap-1">
                  {isRTL ? 'الكود' : 'Code'}
                  <SortIcon field="code" />
                </span>
              </th>
              <th
                className={cn(
                  "p-3 text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 select-none",
                  isRTL ? "text-right" : "text-left"
                )}
                onClick={() => onSort('order')}
              >
                <span className="flex items-center gap-1">
                  {isRTL ? 'الترتيب' : 'Order'}
                  <SortIcon field="order" />
                </span>
              </th>
              <th className={cn(
                "p-3 text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider",
                isRTL ? "text-right" : "text-left"
              )}>
                {isRTL ? 'الإجراءات' : 'Actions'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center">
                  <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                </td>
              </tr>
            ) : (
              floors.map((floor, index) => (
                <tr
                  key={floor.id}
                  className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors"
                >
                  <td className={cn(
                    "p-3 text-slate-600 dark:text-slate-300",
                    isRTL ? "text-right" : "text-left"
                  )}>{index + 1}</td>
                  <td className={cn(
                    "p-3 font-medium text-slate-700 dark:text-slate-200",
                    isRTL ? "text-right" : "text-left"
                  )}>{floor.building.name}</td>
                  <td className={cn(
                    "p-3 font-medium text-slate-700 dark:text-slate-200",
                    isRTL ? "text-right" : "text-left"
                  )}>{floor.name}</td>
                  <td className={cn(
                    "p-3 text-slate-600 dark:text-slate-300",
                    isRTL ? "text-right" : "text-left"
                  )}>{floor.nameEn || '—'}</td>
                  <td className={cn(
                    "p-3 font-mono text-slate-600 dark:text-slate-300",
                    isRTL ? "text-right" : "text-left"
                  )}>{floor.code}</td>
                  <td className={cn(
                    "p-3 text-slate-600 dark:text-slate-300",
                    isRTL ? "text-right" : "text-left"
                  )}>{floor.order}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEdit(floor)}
                        className="p-2 rounded-full text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all duration-200 hover:scale-110"
                        title={isRTL ? 'تعديل' : 'Edit'}
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => onDelete(floor.id)}
                        className="p-2 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all duration-200 hover:scale-110"
                        title={isRTL ? 'حذف' : 'Delete'}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}