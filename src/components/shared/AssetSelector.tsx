// src/components/shared/AssetSelector.tsx
"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface Asset {
  id: string;
  name: string;
  nameEn?: string;
  code?: string;
}

interface AssetSelectorProps {
  value?: string;
  locationId?: string;
  assetTypeId?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

const NONE_VALUE = "__none__";

export default function AssetSelector({
  value,
  locationId,
  assetTypeId,
  onChange,
  disabled = false,
  className = "",
}: AssetSelectorProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!locationId) {
      return;
    }

    const fetchAssets = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();

        params.append("locationId", locationId);

        if (assetTypeId && assetTypeId !== "all") {
          params.append("typeId", assetTypeId);
        }

        params.append("limit", "1000");

        const res = await fetch(`/api/assets?${params.toString()}`);

        if (!res.ok) {
          throw new Error("Failed to fetch assets");
        }

        const data = await res.json();

        let assetsArray: Asset[] = [];

        if (Array.isArray(data)) {
          assetsArray = data;
        } else if (Array.isArray(data.assets)) {
          assetsArray = data.assets;
        } else if (Array.isArray(data.items)) {
          assetsArray = data.items;
        } else if (Array.isArray(data.data)) {
          assetsArray = data.data;
        } else {
          console.warn("[AssetSelector] Unexpected API response", data);
        }

        setAssets(assetsArray);
      } catch (err) {
        console.error(err);
        setError(
          isRtl ? "فشل تحميل الأصول" : "Failed to load assets"
        );
        setAssets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [locationId, assetTypeId, isRtl]);

  const safeAssets = locationId ? assets.filter(Boolean) : [];

  const defaultOption = {
    id: NONE_VALUE,
    label: isRtl ? "— اختر الأصل —" : "— Select asset —",
  };

  const getDisplayName = (asset: Asset) => {
    const name = isRtl
      ? asset.name
      : asset.nameEn || asset.name;

    return asset.code
      ? `${asset.code}. ${name}`
      : name;
  };

  const assetOptions = locationId
    ? [
        defaultOption,
        ...safeAssets.map((asset) => ({
          id: asset.id,
          label: getDisplayName(asset),
        })),
      ]
    : [];

  const selectValue = value || NONE_VALUE;

  const handleValueChange = (val: string) => {
    onChange(val === NONE_VALUE ? "" : val);
  };

  const selectedAsset = safeAssets.find(
    (asset) => asset.id === value
  );

  const displayValue = selectedAsset
    ? getDisplayName(selectedAsset)
    : undefined;

  const isDisabled =
    disabled || !locationId || loading;

  const noLocationMessage = isRtl
    ? "اختر الموقع أولاً"
    : "Select location first";

  const noAssetsMessage = isRtl
    ? "لا توجد أصول في هذا الموقع"
    : "No assets at this location";

  return (
    <Select
      value={selectValue}
      onValueChange={handleValueChange}
      disabled={isDisabled}
    >
      <SelectTrigger
        className={
          className ||
          "h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-4"
        }
      >
        <SelectValue>
          {displayValue}
        </SelectValue>
      </SelectTrigger>

      <SelectContent>
        {!locationId ? (
          <div className="px-2 py-2 text-sm text-amber-500">
            {noLocationMessage}
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-4 gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">
              {isRtl ? "جاري التحميل..." : "Loading..."}
            </span>
          </div>
        ) : error ? (
          <div className="px-2 py-2 text-sm text-rose-500">
            {error}
          </div>
        ) : safeAssets.length === 0 ? (
          <div className="px-2 py-2 text-sm text-muted-foreground">
            {noAssetsMessage}
          </div>
        ) : (
          assetOptions.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}