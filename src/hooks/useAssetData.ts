// src/hooks/useAssetData.ts
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface AssetType {
  id: string;
  name: string;
  nameEn?: string;
  code?: string;
}

interface Asset {
  id: string;
  name: string;
  nameEn?: string;
  code: string;
}

interface UseAssetDataProps {
  slug: string;
  token: string;
  roomId: string;
  assetTypeId: string;
  isRtl: boolean;
}

export function useAssetData({ slug, token, roomId, assetTypeId, isRtl }: UseAssetDataProps) {
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loadingAssetTypes, setLoadingAssetTypes] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(false);

  // جلب أنواع الأصول (مرة واحدة عند تحميل الصفحة)
  const fetchAssetTypes = useCallback(async () => {
    setLoadingAssetTypes(true);
    try {
      const res = await fetch(`/api/public/asset-types?slug=${slug}&token=${token}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAssetTypes(data);
    } catch {
      toast.error(isRtl ? "فشل تحميل أنواع الأصول" : "Failed to load asset types");
    } finally {
      setLoadingAssetTypes(false);
    }
  }, [slug, token, isRtl]);

  // جلب الأصول بناءً على الغرفة ونوع الأصل
  const fetchAssets = useCallback(async () => {
    if (!roomId) {
      setAssets([]);
      return;
    }
    setLoadingAssets(true);
    try {
      let url = `/api/public/assets?slug=${slug}&token=${token}&roomId=${roomId}`;
      if (assetTypeId && assetTypeId !== "none") {
        url += `&typeId=${assetTypeId}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAssets(data);
    } catch {
      setAssets([]);
    } finally {
      setLoadingAssets(false);
    }
  }, [slug, token, roomId, assetTypeId]);

  // تشغيل fetchAssets تلقائياً عند تغيير roomId أو assetTypeId
  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  return {
    assetTypes,
    assets,
    loadingAssetTypes,
    loadingAssets,
    fetchAssetTypes,
  };
}