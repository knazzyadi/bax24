// src/hooks/useAssetData.ts
"use client";

import { useState, useEffect, useCallback } from "react";

interface UseAssetDataProps {
  slug: string;
  token: string;
  roomId: string;
  assetTypeId: string;
  isRtl: boolean;
}

export function useAssetData({ slug, token, roomId, assetTypeId, isRtl }: UseAssetDataProps) {
  const [assets, setAssets] = useState<any[]>([]);
  const [assetTypes, setAssetTypes] = useState<any[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [loadingAssetTypes, setLoadingAssetTypes] = useState(false);

  // جلب أنواع الأصول
  const fetchAssetTypes = useCallback(async () => {
    if (!slug || !token) {
      console.warn("⚠️ fetchAssetTypes: slug or token missing");
      return;
    }
    setLoadingAssetTypes(true);
    try {
      const url = `/api/public/asset-types?slug=${slug}&token=${token}`;
      console.log("🔍 Fetching asset types from:", url);
      const res = await fetch(url);
      const data = await res.json();
      console.log("📦 Asset types response:", data);
      if (res.ok) {
        // تأكد من أن البيانات هي مصفوفة
        const types = data.assetTypes || data || [];
        setAssetTypes(types);
        console.log("✅ Asset types loaded:", types.length);
      } else {
        console.error("❌ Failed to fetch asset types:", data.error);
        setAssetTypes([]);
      }
    } catch (error) {
      console.error("❌ Error fetching asset types:", error);
      setAssetTypes([]);
    } finally {
      setLoadingAssetTypes(false);
    }
  }, [slug, token]);

  // جلب الأصول (مع تصفية المحذوفة)
  const fetchAssets = useCallback(async () => {
    if (!roomId || !slug || !token) {
      setAssets([]);
      return;
    }
    setLoadingAssets(true);
    try {
      const params = new URLSearchParams({
        slug,
        token,
        roomId,
        ...(assetTypeId && assetTypeId !== "all" && assetTypeId !== "" && { typeId: assetTypeId }),
      });
      const url = `/api/public/assets?${params.toString()}`;
      console.log("🔍 Fetching assets from:", url);
      const res = await fetch(url);
      const data = await res.json();
      console.log("📦 Assets response:", data);
      if (res.ok) {
        const rawAssets = data.assets || data || [];
        // ✅ تصفية الأصول المحذوفة: قبول فقط deletedAt === null أو undefined
        const activeAssets = rawAssets.filter((asset: any) => {
          if (asset.deletedAt === null || asset.deletedAt === undefined) return true;
          if (!asset.deletedAt) return true;
          return false;
        });
        setAssets(activeAssets);
        console.log("✅ Assets loaded:", activeAssets.length);
      } else {
        console.error("❌ Failed to fetch assets:", data.error);
        setAssets([]);
      }
    } catch (error) {
      console.error("❌ Error fetching assets:", error);
      setAssets([]);
    } finally {
      setLoadingAssets(false);
    }
  }, [roomId, slug, token, assetTypeId]);

  // جلب الأصول عند تغيير الغرفة أو نوع الأصل
  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // جلب أنواع الأصول عند تحميل الصفحة (مرة واحدة)
  useEffect(() => {
    fetchAssetTypes();
  }, [fetchAssetTypes]);

  // إعادة تعيين بيانات الأصول
  const resetAssetData = useCallback(() => {
    setAssets([]);
    setAssetTypes([]);
  }, []);

  return {
    assets,
    assetTypes,
    loadingAssets,
    loadingAssetTypes,
    fetchAssetTypes,
    fetchAssets,
    resetAssetData,
  };
}