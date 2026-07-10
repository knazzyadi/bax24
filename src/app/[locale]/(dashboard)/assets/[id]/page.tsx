// src/app/[locale]/(dashboard)/assets/[id]/page.tsx
"use client";

import { useParams } from "next/navigation";
import {
  AssetHeader,
  AssetBasicInfo,
  AssetExtraInfo,
  AssetLocationCard,
  AssetLifecycleCard,
  AssetWorkOrders,
  AssetMaintenanceHistory,
  AssetSkeleton,
  AssetNotes,
  AssetError,
  AssetAuditLog, // ✅ إضافة مكون سجل التدقيق
} from "./components";
import { useAssetDetail } from "./hooks/useAssetDetail";

export default function AssetDetailPage() {
  // ✅ الحصول على assetId من params
  const params = useParams<{ id: string }>();
  const assetId = params.id;

  // ✅ استخدام الـ Hook المخصص
  const { asset, workOrders, maintenanceHistory, loading, error } =
    useAssetDetail(assetId);

  // ✅ حالة التحميل
  if (loading) {
    return <AssetSkeleton />;
  }

  // ✅ حالة الخطأ
  if (error || !asset) {
    return <AssetError error={error || undefined} />;
  }

  return (
    <div className="relative space-y-8 p-6">
      {/* خلفية متدرجة خفيفة */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

      {/* ✅ رأس الصفحة - يستقبل asset كاملاً */}
      <AssetHeader asset={asset} canEdit={true} canDelete={true} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* العمود الرئيسي (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          <AssetBasicInfo asset={asset} />
          <AssetExtraInfo asset={asset} />
          <AssetLocationCard room={asset.room} />
          <AssetWorkOrders workOrders={workOrders} />
          <AssetMaintenanceHistory history={maintenanceHistory} />

          {/* ✅ سجل التدقيق */}
          <AssetAuditLog assetId={asset.id} />
        </div>

        {/* العمود الجانبي (1/3) */}
        <div className="space-y-6">
          <AssetNotes notes={asset.notes} />

          {/* ✅ AssetLifecycleCard - يستقبل asset كاملاً */}
          <AssetLifecycleCard asset={asset} />
        </div>
      </div>
    </div>
  );
}