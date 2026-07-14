// src/app/[locale]/(dashboard)/locations/rooms/components/RoomsTable.tsx

'use client';

import { Pencil, Trash2, Search, ChevronUp, ChevronDown, DoorOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Room, Floor } from '../types';

const glassCard =
  'bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl shadow-sm';

interface RoomsTableProps {
  rooms: Room[];
  floors: Floor[];
  onEdit: (room: Room) => void;
  onDelete: (id: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  floorFilter: string;
  onFloorFilterChange: (value: string) => void;
  buildingFilter: string;
  onBuildingFilterChange: (value: string) => void;
  buildings: { id: string; name: string }[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
  isLoading: boolean;
  locale: string;
}

export function RoomsTable({
  rooms,
  floors,
  onEdit,
  onDelete,
  search,
  onSearchChange,
  floorFilter,
  onFloorFilterChange,
  buildingFilter,
  onBuildingFilterChange,
  buildings,
  sortBy,
  sortOrder,
  onSort,
  isLoading,
  locale,
}: RoomsTableProps) {
  const t = useTranslations('Locations');
  const isRTL = locale === 'ar';

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <ChevronUp className="h-3 w-3 opacity-30" />;
    return sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  };

  if (rooms.length === 0 && !isLoading) {
    return (
      <div className={glassCard}>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 text-6xl">🚪</div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {isRTL ? 'لا توجد غرف' : 'No Rooms Found'}
          </h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {isRTL
              ? 'ابدأ بإضافة غرفة جديدة لتنظيم المساحات'
              : 'Start by adding a new room to organize spaces'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={glassCard}>
      {/* شريط البحث والتصفية */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={isRTL ? 'بحث بالاسم أو الكود...' : 'Search by name or code...'}
            className="w-full h-10 pr-9 pl-3 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 text-sm"
          />
        </div>
        <select
          value={buildingFilter}
          onChange={(e) => onBuildingFilterChange(e.target.value)}
          className="h-10 px-3 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 text-sm appearance-none min-w-[140px]"
        >
          <option value="">{isRTL ? 'جميع المباني' : 'All Buildings'}</option>
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select
          value={floorFilter}
          onChange={(e) => onFloorFilterChange(e.target.value)}
          className="h-10 px-3 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 text-sm appearance-none min-w-[140px]"
        >
          <option value="">{isRTL ? 'جميع الأدوار' : 'All Floors'}</option>
          {floors.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      {/* الجدول */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/50 dark:bg-slate-800/30">
            <tr>
              <th className="p-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                #
              </th>
              <th
                className="p-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 select-none"
                onClick={() => onSort('floorId')}
              >
                <span className="flex items-center gap-1">
                  {isRTL ? 'الدور' : 'Floor'}
                  <SortIcon field="floorId" />
                </span>
              </th>
              <th
                className="p-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 select-none"
                onClick={() => onSort('name')}
              >
                <span className="flex items-center gap-1">
                  {isRTL ? 'الاسم' : 'Name'}
                  <SortIcon field="name" />
                </span>
              </th>
              <th className="p-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {isRTL ? 'الاسم بالإنجليزية' : 'English Name'}
              </th>
              <th
                className="p-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 select-none"
                onClick={() => onSort('code')}
              >
                <span className="flex items-center gap-1">
                  {isRTL ? 'الكود' : 'Code'}
                  <SortIcon field="code" />
                </span>
              </th>
              <th
                className="p-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 select-none"
                onClick={() => onSort('order')}
              >
                <span className="flex items-center gap-1">
                  {isRTL ? 'الترتيب' : 'Order'}
                  <SortIcon field="order" />
                </span>
              </th>
              <th className="p-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
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
              rooms.map((room, index) => (
                <tr
                  key={room.id}
                  className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors"
                >
                  <td className="p-3 text-slate-600 dark:text-slate-300">{index + 1}</td>
                  <td className="p-3 font-medium text-slate-700 dark:text-slate-200">
                    {room.floor.building.name} - {room.floor.name}
                  </td>
                  <td className="p-3 font-medium text-slate-700 dark:text-slate-200">{room.name}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{room.nameEn || '—'}</td>
                  <td className="p-3 font-mono text-slate-600 dark:text-slate-300">{room.code}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{room.order}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEdit(room)}
                        className="p-2 rounded-full text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all duration-200 hover:scale-110"
                        title={isRTL ? 'تعديل' : 'Edit'}
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => onDelete(room.id)}
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