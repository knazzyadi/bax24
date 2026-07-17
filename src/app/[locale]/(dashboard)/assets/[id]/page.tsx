// src/app/[locale]/(dashboard)/assets/[id]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useAssetDetail } from "./useAssetDetail";
import { AssetHeader } from "./AssetHeader";
import { AssetBasicInfo } from "./AssetBasicInfo";
import { AssetExtraInfo } from "./AssetExtraInfo";
import { AssetLocationCard } from "./AssetLocationCard";
import { AssetLifecycleCard } from "./AssetLifecycleCard";
import { AssetWorkOrders } from "./AssetWorkOrders";
import { AssetMaintenanceHistory } from "./AssetMaintenanceHistory";
import { AssetSkeleton } from "./AssetSkeleton";
import { AssetNotes } from "./AssetNotes";
import { AssetError } from "./AssetError";
import { AssetAuditLog } from "./AssetAuditLog";

export default function AssetDetailPage() {
  const params = useParams<{ id: string }>();
  const assetId = params.id;

  const { asset, workOrders, maintenanceHistory, loading, error } =
    useAssetDetail(assetId);

  if (loading) {
    return <AssetSkeleton />;
  }

  if (error || !asset) {
    return <AssetError error={error || undefined} />;
  }

  return (
    <div className="relative space-y-8 p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

      <AssetHeader asset={asset} canEdit={true} canDelete={true} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <AssetBasicInfo asset={asset} />
          <AssetExtraInfo asset={asset} />
          <AssetLocationCard room={asset.room} />
          <AssetWorkOrders workOrders={workOrders} />
          <AssetMaintenanceHistory history={maintenanceHistory} />
          <AssetAuditLog assetId={asset.id} />
        </div>

        <div className="space-y-6">
          <AssetNotes notes={asset.notes} />
          <AssetLifecycleCard asset={asset} />
        </div>
      </div>
    </div>
  );
}