"use client";

import { Label } from "@/components/ui/label";
import { AdaptiveSelect } from "@/components/shared/AdaptiveSelect";

interface AssetSectionProps {
  roomId: string;
  assetTypeId: string;
  assetId: string;
  assetTypes: { value: string; label: string }[];
  assets: { value: string; label: string }[];
  loadingAssetTypes: boolean;
  loadingAssets: boolean;
  onAssetTypeChange: (val: string) => void;
  onAssetChange: (val: string) => void;
  isRtl: boolean;
  disabled: boolean;
}

export function AssetSection({
  roomId,
  assetTypeId,
  assetId,
  assetTypes,
  assets,
  loadingAssetTypes,
  loadingAssets,
  onAssetTypeChange,
  onAssetChange,
  isRtl,
  disabled,
}: AssetSectionProps) {
  if (!roomId) return null;

  const noAssetsMessage = isRtl
    ? "لا توجد أصول مسجلة في هذه الغرفة"
    : "No assets found in this room";

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold mb-2 block">
          {isRtl ? "نوع الأصل (اختياري)" : "Asset Type (Optional)"}
        </Label>
        <AdaptiveSelect
          value={assetTypeId}
          onChange={onAssetTypeChange}
          options={assetTypes}
          placeholder={isRtl ? "اختر نوع الأصل" : "Select asset type"}
          disabled={loadingAssetTypes || disabled}
        />
      </div>
      <div>
        <Label className="text-base font-semibold mb-2 block">
          {isRtl ? "الأصل (اختياري)" : "Asset (Optional)"}
        </Label>
        {assets.length === 0 && !loadingAssets ? (
          <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
            {noAssetsMessage}
          </p>
        ) : (
          <AdaptiveSelect
            value={assetId}
            onChange={onAssetChange}
            options={assets}
            placeholder={isRtl ? "اختر الأصل" : "Select asset"}
            disabled={loadingAssets || disabled}
          />
        )}
        {loadingAssets && <p className="text-sm text-muted-foreground mt-2">{isRtl ? "جار التحميل..." : "Loading..."}</p>}
      </div>
    </div>
  );
}