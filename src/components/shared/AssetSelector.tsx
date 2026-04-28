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

export default function AssetSelector({
  value,
  locationId,
  assetTypeId,
  onChange,
  disabled = false,
  className = "",
  placeholder,
}: AssetSelectorProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!locationId) {
      setAssets([]);
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
        if (!res.ok) throw new Error("Failed to fetch assets");
        const data = await res.json();

        let assetsArray: Asset[] = [];
        if (Array.isArray(data)) {
          assetsArray = data;
        } else if (data.assets && Array.isArray(data.assets)) {
          assetsArray = data.assets;
        } else if (data.items && Array.isArray(data.items)) {
          assetsArray = data.items;
        } else if (data.data && Array.isArray(data.data)) {
          assetsArray = data.data;
        } else {
          console.warn("[AssetSelector] Unexpected API response", data);
          assetsArray = [];
        }

        setAssets(assetsArray);
      } catch (err) {
        console.error(err);
        setError(isRtl ? "فشل تحميل الأصول" : "Failed to load assets");
        setAssets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [locationId, assetTypeId, isRtl]);

  const defaultPlaceholder = isRtl ? "اختر الأصل..." : "Select asset...";

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || !locationId || loading}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder || defaultPlaceholder} />
      </SelectTrigger>
      <SelectContent>
        {loading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
        {error && (
          <div className="text-red-500 text-sm py-2 px-2">{error}</div>
        )}
        {!loading && !error && assets.length === 0 && (
          <div className="text-muted-foreground text-sm py-2 px-2 text-center">
            {isRtl ? "لا توجد أصول في هذا الموقع" : "No assets at this location"}
          </div>
        )}
        {assets.map((asset) => (
          <SelectItem key={asset.id} value={asset.id}>
            {isRtl ? asset.name : (asset.nameEn || asset.name)}
            {asset.code && ` (${asset.code})`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}