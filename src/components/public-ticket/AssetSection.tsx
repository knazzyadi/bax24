// src/components/public-ticket/AssetSection.tsx
"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  return (
    <div className="space-y-6">
      {/* نوع الأصل */}
      <div>
        <Label className="text-base font-semibold mb-2 block">
          {isRtl ? "نوع الأصل" : "Asset Type"}
        </Label>
        <Select
          value={assetTypeId}
          onValueChange={onAssetTypeChange}
          disabled={disabled || loadingAssetTypes}
        >
          <SelectTrigger className="h-12 text-base rounded-xl">
            <SelectValue placeholder={isRtl ? "اختر نوع الأصل" : "Select asset type"} />
          </SelectTrigger>
          <SelectContent>
            {assetTypes.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground text-center">
                {isRtl ? "لا توجد أنواع" : "No types available"}
              </div>
            ) : (
              assetTypes.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {loadingAssetTypes && (
          <p className="text-xs text-muted-foreground mt-1">
            {isRtl ? "جاري التحميل..." : "Loading..."}
          </p>
        )}
      </div>

      {/* الأصل */}
      <div>
        <Label className="text-base font-semibold mb-2 block">
          {isRtl ? "الأصل" : "Asset"}
        </Label>
        <Select
          value={assetId}
          onValueChange={onAssetChange}
          disabled={disabled || loadingAssets || !roomId}
        >
          <SelectTrigger className="h-12 text-base rounded-xl">
            <SelectValue placeholder={isRtl ? "اختر الأصل" : "Select asset"} />
          </SelectTrigger>
          <SelectContent>
            {assets.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground text-center">
                {isRtl ? "لا توجد أصول" : "No assets available"}
              </div>
            ) : (
              assets.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {!roomId && (
          <p className="text-xs text-amber-500 mt-1">
            {isRtl ? "يرجى اختيار الموقع أولاً" : "Please select location first"}
          </p>
        )}
        {loadingAssets && (
          <p className="text-xs text-muted-foreground mt-1">
            {isRtl ? "جاري التحميل..." : "Loading..."}
          </p>
        )}
      </div>
    </div>
  );
}