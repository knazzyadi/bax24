// src/app/[locale]/(dashboard)/work-orders/[id]/edit/components/EditForm.tsx
"use client";

import {
  BasicInfoCard,
  LocationCard,
  NotesCard,
  GuidelinesCard,
} from "@/app/[locale]/(dashboard)/work-orders/shared";
import { glassCard } from "@/app/[locale]/(dashboard)/work-orders/constants";
import { Button } from "@/components/ui/button";
import { Loader2, Save, X, MapPin } from "lucide-react";

interface EditFormProps {
  formData: any;
  setFormData: (data: any) => void;
  priorities: any[];
  statuses: any[];
  assetTypes: any[];
  buildings: any[];
  floors: any[];
  rooms: any[];
  loadingFloors: boolean;
  loadingRooms: boolean;
  onSave: (data: any) => Promise<void>;
  isSaving: boolean;
  isRtl: boolean;
  t: any;
  workOrderTypes: any[];
}

export function EditForm({
  formData,
  setFormData,
  priorities,
  statuses,
  assetTypes,
  buildings,
  floors,
  rooms,
  loadingFloors,
  loadingRooms,
  onSave,
  isSaving,
  isRtl,
  t,
  workOrderTypes,
}: EditFormProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        {/* المعلومات الأساسية */}
        <div className={glassCard}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40">
              <span className="h-5 w-5 text-indigo-600 dark:text-indigo-400">📋</span>
            </div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t("basicInfo")}</h2>
          </div>
          <BasicInfoCard
            formData={formData}
            setFormData={setFormData}
            priorities={priorities}
            statuses={statuses}
            workOrderTypes={workOrderTypes}
            isRtl={isRtl}
            t={t}
          />
        </div>

        {/* الموقع والأصل - حاوية مدمجة */}
        <div className={glassCard}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
              <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              {isRtl ? "الموقع والأصل" : "Location & Asset"}
            </h2>
          </div>
          <LocationCard
            formData={formData}
            setFormData={setFormData}
            buildings={buildings}
            floors={floors}
            rooms={rooms}
            locationLevel={formData.locationLevel || "building"}
            setLocationLevel={(level: any) =>
              setFormData({ ...formData, locationLevel: level })
            }
            loadingFloors={loadingFloors}
            loadingRooms={loadingRooms}
            isRtl={isRtl}
            // الأصول
            assetTypes={assetTypes}
            assets={[]}
            selectedAssetIds={formData.assetIds || []}
            loadingAssets={false}
            assetDialogOpen={false}
            tempSelectedAssetIds={[]}
            onOpenAssetDialog={() => {}}
            onConfirmAssetSelection={() => {}}
            onRemoveAsset={(id: string) => {
              setFormData({
                ...formData,
                assetIds: formData.assetIds.filter((aid: string) => aid !== id),
              });
            }}
            onTempAssetChange={() => {}}
            onAssetDialogOpenChange={() => {}}
            isLocationSelected={!!formData.roomId}
            t={t}
          />
        </div>
      </div>

      <div className="space-y-6">
        <NotesCard
          value={formData.notes || ""}
          onChange={(value) => setFormData({ ...formData, notes: value })}
          isRtl={isRtl}
          t={t}
        />

        <GuidelinesCard isRtl={isRtl} />

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400 h-12 font-medium"
          >
            <X className="h-4 w-4 mr-2" />
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-12 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200"
          >
            {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
            {t("save")}
          </Button>
        </div>
      </div>
    </form>
  );
}