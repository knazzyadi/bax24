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

  // جلب أنواع الأصول (API عام)
  const fetchAssetTypes = useCallback(async () => {
    if (!slug || !token) return;
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

  // جلب الأصول بناءً على الغرفة ونوع الأصل (مع إضافة slug و token)
  const fetchAssets = useCallback(async () => {
    if (!roomId) {
      setAssets([]);
      return;
    }
    setLoadingAssets(true);
    try {
      const params = new URLSearchParams();
      params.append('slug', slug);
      params.append('token', token);
      params.append('roomId', roomId);
      if (assetTypeId && assetTypeId !== "none" && assetTypeId !== "") {
        params.append('typeId', assetTypeId);
      }
      // ✅ استخدام API العام للأصول مع تمرير slug و token
      const res = await fetch(`/api/public/assets?${params.toString()}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAssets(data.assets || []);
    } catch {
      setAssets([]);
    } finally {
      setLoadingAssets(false);
    }
  }, [slug, token, roomId, assetTypeId]);

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