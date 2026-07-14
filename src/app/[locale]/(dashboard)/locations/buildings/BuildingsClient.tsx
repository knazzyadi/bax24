// src/app/[locale]/(dashboard)/locations/buildings/BuildingsClient.tsx

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Building, Plus } from 'lucide-react';
import { useBuildings } from './hooks/useBuildings';
import { BuildingForm } from './components/BuildingForm';
import { BuildingsTable } from './components/BuildingsTable';
import { DeleteBuildingDialog } from './components/DeleteBuildingDialog';
import { Building as BuildingType } from './types';

interface BuildingsClientProps {
  initialBuildings: BuildingType[];
  initialBranches: Branch[];
  locale: string;
}

export default function BuildingsClient({
  initialBuildings,
  initialBranches,
  locale,
}: BuildingsClientProps) {
  const t = useTranslations('Locations');
  const isRTL = locale === 'ar';

  const {
    buildings,
    branches,
    isLoading,
    isSaving,
    isDeleting,
    filters,
    updateFilters,
    createBuilding,
    updateBuilding,
    deleteBuilding,
  } = useBuildings(initialBuildings, initialBranches);

  const [showForm, setShowForm] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<BuildingType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState('');

  const handleAdd = () => {
    setEditingBuilding(null);
    setShowForm(true);
  };

  const handleEdit = (building: BuildingType) => {
    setEditingBuilding(building);
    setShowForm(true);
  };

  const handleDeleteClick = (id: string) => {
    const building = buildings.find((b) => b.id === id);
    if (!building) return;
    setDeletingId(id);
    setDeletingName(building.name);
    setDeleteDialogOpen(true);
  };

  const handleSave = async (data: any) => {
    if (editingBuilding) {
      return updateBuilding(editingBuilding.id, data);
    } else {
      return createBuilding(data);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    await deleteBuilding(deletingId);
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
            <Building className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {t('buildings')}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isRTL ? 'إدارة المباني والفروع وتنظيم المواقع' : 'Manage buildings, branches and organize locations'}
            </p>
          </div>
        </div>
        {!showForm && (
          <button
            onClick={handleAdd}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-12 px-6 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t('addBuilding')}
          </button>
        )}
      </div>

      {/* نموذج الإضافة/التعديل */}
      {showForm && (
        <BuildingForm
          editingBuilding={editingBuilding}
          branches={branches}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingBuilding(null);
          }}
          isSaving={isSaving}
          locale={locale}
        />
      )}

      {/* جدول المباني */}
      <BuildingsTable
        buildings={buildings}
        branches={branches}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        search={filters.search}
        onSearchChange={(value) => updateFilters({ search: value })}
        branchFilter={filters.branchId}
        onBranchFilterChange={(value) => updateFilters({ branchId: value })}
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
      <DeleteBuildingDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        buildingName={deletingName}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        locale={locale}
      />
    </div>
  );
}