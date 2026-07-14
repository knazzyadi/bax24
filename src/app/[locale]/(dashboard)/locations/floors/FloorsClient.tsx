// src/app/[locale]/(dashboard)/locations/floors/FloorsClient.tsx

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Layers, Plus } from 'lucide-react';
import { useFloors } from './hooks/useFloors';
import { FloorForm } from './components/FloorForm';
import { FloorsTable } from './components/FloorsTable';
import { DeleteFloorDialog } from './components/DeleteFloorDialog';
import { Floor as FloorType } from './types';

interface FloorsClientProps {
  initialFloors: FloorType[];
  initialBuildings: Building[];
  locale: string;
}

export default function FloorsClient({
  initialFloors,
  initialBuildings,
  locale,
}: FloorsClientProps) {
  const t = useTranslations('Locations');
  const isRTL = locale === 'ar';

  const {
    floors,
    buildings,
    isLoading,
    isSaving,
    isDeleting,
    filters,
    updateFilters,
    createFloor,
    updateFloor,
    deleteFloor,
  } = useFloors(initialFloors, initialBuildings);

  const [showForm, setShowForm] = useState(false);
  const [editingFloor, setEditingFloor] = useState<FloorType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState('');

  const handleAdd = () => {
    setEditingFloor(null);
    setShowForm(true);
  };

  const handleEdit = (floor: FloorType) => {
    setEditingFloor(floor);
    setShowForm(true);
  };

  const handleDeleteClick = (id: string) => {
    const floor = floors.find((f) => f.id === id);
    if (!floor) return;
    setDeletingId(id);
    setDeletingName(floor.name);
    setDeleteDialogOpen(true);
  };

  const handleSave = async (data: any) => {
    if (editingFloor) {
      return updateFloor(editingFloor.id, data);
    } else {
      return createFloor(data);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    await deleteFloor(deletingId);
    setDeleteDialogOpen(false);
    setDeletingId(null);
    setDeletingName('');
  };

  return (
    <div className="relative space-y-8 p-6">
      {/* خلفية متدرجة خفيفة */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

      {/* رأس الصفحة */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/30 dark:border-indigo-800/30 shadow-lg shadow-indigo-500/5">
            <Layers className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {t('floors')}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isRTL ? 'إدارة الأدوار وتنظيم الطوابق حسب المباني' : 'Manage floors and organize levels by buildings'}
            </p>
          </div>
        </div>
        {!showForm && (
          <button
            onClick={handleAdd}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-12 px-6 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t('addFloor')}
          </button>
        )}
      </div>

      {/* نموذج الإضافة/التعديل */}
      {showForm && (
        <FloorForm
          editingFloor={editingFloor}
          buildings={buildings}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingFloor(null);
          }}
          isSaving={isSaving}
          locale={locale}
        />
      )}

      {/* جدول الأدوار */}
      <FloorsTable
        floors={floors}
        buildings={buildings}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        search={filters.search}
        onSearchChange={(value) => updateFilters({ search: value })}
        buildingFilter={filters.buildingId}
        onBuildingFilterChange={(value) => updateFilters({ buildingId: value })}
        sortBy={filters.sortBy}
        sortOrder={filters.sortOrder}
        onSort={(field) => {
          if (filters.sortBy === field) {
            updateFilters({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' });
          } else {
            updateFilters({ sortBy: field as any, sortOrder: 'asc' });
          }
        }}
        isLoading={isLoading}
        locale={locale}
      />

      {/* حوار تأكيد الحذف */}
      <DeleteFloorDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        floorName={deletingName}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        locale={locale}
      />
    </div>
  );
}