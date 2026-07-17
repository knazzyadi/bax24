// src/app/[locale]/(dashboard)/maintenance/new/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Calendar, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// ========== المكونات المنفصلة ==========
import { BasicInfoSection } from "./BasicInfoSection";
import { LocationSection } from "./LocationSection";
import { AssetSection } from "./AssetSection";
import { NotesSection } from "./NotesSection";
import { AssetDialog } from "./AssetDialog";

// ========== الـ Hook ==========
import { useMaintenanceForm } from "./useMaintenanceForm";

// ========== كرت الخلفية الزجاجي ==========
const glassCard =
  "bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300";

export default function NewMaintenanceSchedulePage() {
  const router = useRouter();
  const locale = useLocale();
  const isRtl = locale === "ar";
  const t = useTranslations("MaintenanceForm");

  // ========== استخدام الـ Hook ==========
  const {
    formData,
    setFormData,
    branchId,
    setBranchId,
    buildingId,
    setBuildingId,
    floorId,
    setFloorId,
    roomId,
    setRoomId,
    locationLevel,
    setLocationLevel,
    buildings,
    floors,
    rooms,
    assetTypes,
    assets,
    selectedAssetIds,
    setSelectedAssetIds,
    tempSelectedAssetIds,
    setTempSelectedAssetIds,
    loadingBuildings,
    loadingFloors,
    loadingRooms,
    loadingAssetTypes,
    loadingAssets,
    dataLoaded,
    isSubmitting,
    handleSubmit,
    getSelectedLocationSummary,
    isLocationSelected,
    // دوال التحكم في حوار الأصول
    openAssetDialog,
    closeAssetDialog,
    confirmAssetSelection,
    assetDialogOpen,
    removeAsset,
  } = useMaintenanceForm();

  // ========== عرض التحميل ==========
  if (!dataLoaded || loadingBuildings) {
    return (
      <div className="relative min-h-[60vh] flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 dark:text-indigo-400" />
      </div>
    );
  }

  // ========== الواجهة الرئيسية ==========
  return (
    <div className="relative space-y-8 p-6">
      {/* خلفية متدرجة خفيفة */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

      {/* رأس الصفحة */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/30 dark:border-indigo-800/30 shadow-lg shadow-indigo-500/5">
            <Calendar className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {t("newTitle")}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("newSubtitle")}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ========== العمود الرئيسي ========== */}
        <div className="lg:col-span-2 space-y-8">
          {/* 1. معلومات أساسية */}
          <div className={glassCard}>
            <BasicInfoSection
              formData={formData}
              setFormData={setFormData}
              isRtl={isRtl}
              t={t}
            />
          </div>

          {/* 2. الموقع */}
          <div className={glassCard}>
            <LocationSection
              branchId={branchId}
              setBranchId={setBranchId}
              buildingId={buildingId}
              setBuildingId={setBuildingId}
              floorId={floorId}
              setFloorId={setFloorId}
              roomId={roomId}
              setRoomId={setRoomId}
              locationLevel={locationLevel}
              setLocationLevel={setLocationLevel}
              buildings={buildings}
              floors={floors}
              rooms={rooms}
              loadingBuildings={loadingBuildings}
              loadingFloors={loadingFloors}
              loadingRooms={loadingRooms}
              isRtl={isRtl}
              t={t}
              getSelectedLocationSummary={getSelectedLocationSummary}
              isLocationSelected={isLocationSelected}
            />
          </div>

          {/* 3. الأصول */}
          <div className={glassCard}>
            <AssetSection
              formData={formData}
              setFormData={setFormData}
              assetTypes={assetTypes}
              assets={assets}
              selectedAssetIds={selectedAssetIds}
              removeAsset={removeAsset}
              loadingAssetTypes={loadingAssetTypes}
              loadingAssets={loadingAssets}
              isLocationSelected={isLocationSelected}
              isRtl={isRtl}
              t={t}
              openAssetDialog={openAssetDialog}
            />
          </div>
        </div>

        {/* ========== العمود الجانبي ========== */}
        <div className="space-y-6">
          {/* 4. ملاحظات */}
          <div className={glassCard}>
            <NotesSection
              formData={formData}
              setFormData={setFormData}
              isRtl={isRtl}
              t={t}
            />
          </div>

          {/* 5. إرشادات */}
          <div className={glassCard}>
            <GuidelinesSection isRtl={isRtl} t={t} />
          </div>

          {/* 6. الأزرار */}
          <div className="flex gap-3">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="flex-1 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400 h-12 font-medium"
            >
              <X className="h-4 w-4 ml-2" />
              {t("cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-12 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5 ml-2" />
              )}
              {t("save")}
            </Button>
          </div>

          {/* 7. مساعدة سريعة */}
          <QuickHelpSection isRtl={isRtl} t={t} />
        </div>
      </div>

      {/* 8. حوار اختيار الأصول */}
      <AssetDialog
        open={assetDialogOpen}
        onClose={closeAssetDialog}
        onConfirm={confirmAssetSelection}
        assets={assets}
        tempSelectedAssetIds={tempSelectedAssetIds}
        setTempSelectedAssetIds={setTempSelectedAssetIds}
        loadingAssets={loadingAssets}
        isRtl={isRtl}
        t={t}
      />
    </div>
  );
}

// ========== مكونات مساعدة ==========
function GuidelinesSection({ isRtl, t }: { isRtl: boolean; t: any }) {
  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950/40 dark:to-purple-950/40">
          <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {isRtl ? "إرشادات" : "Guidelines"}
        </h3>
      </div>
      <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
        <li className="flex items-start gap-2.5">
          <Shield className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
          <span>
            {isRtl
              ? "اختر مستوى الموقع (مبنى/دور/غرفة) لتحديد الأصول المتاحة."
              : "Choose location level to filter available assets."}
          </span>
        </li>
        <li className="flex items-start gap-2.5">
          <Shield className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
          <span>
            {isRtl
              ? "يمكنك اختيار عدة أصول للجدول الواحد."
              : "You can select multiple assets per schedule."}
          </span>
        </li>
        <li className="flex items-start gap-2.5">
          <Shield className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
          <span>
            {isRtl
              ? "سيتم إنشاء أمر عمل واحد يشمل جميع الأصول المختارة."
              : "A single work order will be created for all selected assets."}
          </span>
        </li>
        <li className="flex items-start gap-2.5">
          <Shield className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
          <span>
            {isRtl
              ? "يمكنك تحديد أيام التحضير المسبق لتنبيه الفريق قبل الموعد."
              : "Set lead days to alert the team before the due date."}
          </span>
        </li>
      </ul>
    </>
  );
}

function QuickHelpSection({ isRtl, t }: { isRtl: boolean; t: any }) {
  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200/30 dark:border-indigo-800/30 flex items-start gap-3">
      <Info className="h-5 w-5 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
      <div className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
        {isRtl
          ? "سيتم إنشاء أمر عمل واحد يتضمن جميع الأصول المستهدفة عند كل تنفيذ يدوي أو تلقائي."
          : "A single work order containing all target assets will be created on each execution."}
      </div>
    </div>
  );
}

// استيرادات إضافية (للاستخدام في المكونات المساعدة)
import { Sparkles, Shield, Info } from "lucide-react";