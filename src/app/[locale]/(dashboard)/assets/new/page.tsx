// src/app/[locale]/(dashboard)/assets/new/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Upload, X } from "lucide-react";
import Link from "next/link";
import { useNewAsset } from "./useNewAsset";
import { BasicInfoCard } from "./BasicInfoCard";
import { LocationCard } from "./LocationCard";
import { LifecycleCard } from "./LifecycleCard";
import { AdditionalInfoCard } from "./AdditionalInfoCard";
import { NotesCard } from "./NotesCard";

const glassCard =
  "bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300";

export default function NewAssetPage() {
  const router = useRouter();
  const t = useTranslations("AssetsForm");
  const locale = useLocale();

  const {
    formData,
    statuses,
    types,
    suppliers,
    branches,
    buildings,
    floors,
    rooms,
    branchId,
    buildingId,
    floorId,
    roomId,
    selectedRoomFullCode,
    loadingFloors,
    loadingRooms,
    loading,
    handleChange,
    handleSelectChange,
    handleBranchChange,
    handleBuildingChange,
    handleFloorChange,
    handleRoomChange,
    handleSubmit,
  } = useNewAsset();

  // =========================
  // واجهة التحميل
  // =========================
  if (loading) {
    return (
      <div className="relative min-h-[60vh] flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 dark:text-indigo-400" />
      </div>
    );
  }

  // =========================
  // الواجهة الرئيسية
  // =========================
  return (
    <div className="relative space-y-8 p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

      {/* رأس الصفحة */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/30 dark:border-indigo-800/30 shadow-lg shadow-indigo-500/5">
            <Plus className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {t("pageTitle")}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("pageSubtitle")}
            </p>
          </div>
        </div>
        <Link href={`/${locale}/assets/bulk-import`}>
          <Button
            variant="outline"
            className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400 gap-2"
          >
            <Upload className="h-4 w-4" />
            {t("bulkImportBtn")}
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="relative space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Info */}
            <div className={glassCard}>
              <BasicInfoCard
                formData={formData}
                handleChange={handleChange}
                t={t}
              />
            </div>

            {/* Location & Type */}
            <div className={glassCard}>
              <LocationCard
                branchId={branchId}
                onBranchChange={handleBranchChange}
                buildingId={buildingId}
                onBuildingChange={handleBuildingChange}
                floorId={floorId}
                onFloorChange={handleFloorChange}
                roomId={roomId}
                onRoomChange={handleRoomChange}
                branches={branches}
                buildings={buildings}
                floors={floors}
                rooms={rooms}
                selectedRoomFullCode={selectedRoomFullCode}
                loadingFloors={loadingFloors}
                loadingRooms={loadingRooms}
                formData={formData}
                types={types}
                statuses={statuses}
                handleChange={handleChange}
                handleSelectChange={handleSelectChange}
                t={t}
              />
            </div>

            {/* Additional Details */}
            <div className={glassCard}>
              <AdditionalInfoCard
                formData={formData}
                handleChange={handleChange}
                handleSelectChange={handleSelectChange}  // ✅ أضف هذا
                suppliers={suppliers}
                t={t}
              />
            </div>

            {/* Lifecycle */}
            <div className={glassCard}>
              <LifecycleCard
                formData={formData}
                handleChange={handleChange}
                t={t}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Notes */}
            <div className={glassCard}>
              <NotesCard
                formData={formData}
                handleChange={handleChange}
                t={t}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => router.back()}
                variant="outline"
                className="flex-1 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400 h-12 font-medium"
              >
                <X className="h-4 w-4 ml-2" />
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-12 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                {t("submit")}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}