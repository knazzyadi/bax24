// src/app/[locale]/(dashboard)/locations/buildings/BuildingsClient.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Building as BuildingIcon, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AdminGuard } from '@/lib/client-guard';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useBuildings } from './useBuildings';
import { BuildingsTable } from './BuildingsTable';
import { BuildingDialog } from './BuildingDialog';
import type { Building, Branch } from './types';

const glassCard =
  'bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300';

interface BuildingsClientProps {
  initialBuildings: Building[];
  initialBranches: Branch[];
  locale: string;
}

export default function BuildingsClient({
  initialBuildings,
  initialBranches,
  locale,
}: BuildingsClientProps) {
  const t = useTranslations('Locations');
  const isRtl = locale === 'ar';

  const {
    buildings,
    branches,
    isLoading,
    isDeleting,
    filters,
    updateFilters,
    deleteBuilding,
    refetch,
  } = useBuildings(initialBuildings, initialBranches);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; id?: string }>({ open: false });

  const handleCreate = () => {
    setEditingBuilding(null);
    setDialogOpen(true);
  };

  const handleEdit = (building: Building) => {
    setEditingBuilding(building);
    setDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setConfirmDialog({ open: true, id });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDialog.id) return;
    try {
      const success = await deleteBuilding(confirmDialog.id);
      if (success) {
        toast.success(t('deleteSuccess'));
        setConfirmDialog({ open: false });
        refetch();
      } else {
        toast.error(t('deleteError'));
      }
    } catch (error) {
      toast.error(t('deleteError'));
    }
  };

  const handleDialogClose = (refetchData?: boolean) => {
    setDialogOpen(false);
    setEditingBuilding(null);
    if (refetchData) refetch();
  };

  return (
    <AdminGuard>
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className={cn(
          'relative min-h-screen p-6 space-y-8',
          isRtl ? 'text-right' : 'text-left'
        )}
      >
        {/* خلفية متدرجة */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

        <header className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/30 dark:border-indigo-800/30 shadow-lg shadow-indigo-500/5">
              <BuildingIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {t('buildings')}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                {isRtl
                  ? 'إدارة المباني والفروع وتنظيم المواقع'
                  : 'Manage buildings, branches and organize locations'}
              </p>
            </div>
          </div>
          <Button
            onClick={handleCreate}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-11 px-5 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200"
          >
            <Plus className="h-4 w-4 ml-2" />
            {t('addBuilding')}
          </Button>
        </header>

        <div className={glassCard}>
          <div className="p-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              </div>
            ) : (
              <BuildingsTable
                data={buildings}
                branches={branches}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                isRtl={isRtl}
              />
            )}
          </div>
        </div>

        <BuildingDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          editingBuilding={editingBuilding}
          branches={branches}
          isRtl={isRtl}
        />

        <ConfirmDialog
          open={confirmDialog.open}
          onOpenChange={(open) => setConfirmDialog({ open, id: confirmDialog.id })}
          onConfirm={handleConfirmDelete}
          title={isRtl ? 'تأكيد الحذف' : 'Confirm Delete'}
          description={
            isRtl
              ? 'هل أنت متأكد من حذف هذا المبنى؟'
              : 'Are you sure you want to delete this building?'
          }
          confirmText={isRtl ? 'حذف' : 'Delete'}
          cancelText={isRtl ? 'إلغاء' : 'Cancel'}
          isLoading={isDeleting}
        />
      </div>
    </AdminGuard>
  );
}