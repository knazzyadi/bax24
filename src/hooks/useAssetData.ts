// src/hooks/useAssetData.ts

"use client";

import { useState, useEffect, useCallback } from "react";

interface Asset {
  id: string;
  name: string;
  deletedAt?: string | null;
  [key: string]: unknown;
}

interface AssetType {
  id: string;
  name: string;
  [key: string]: unknown;
}

interface UseAssetDataProps {
  slug: string;
  token: string;
  roomId: string;
  assetTypeId: string;
}

export function useAssetData({
  slug,
  token,
  roomId,
  assetTypeId,
}: UseAssetDataProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);

  const [loadingAssets, setLoadingAssets] = useState(false);
  const [loadingAssetTypes, setLoadingAssetTypes] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAssets() {
      if (!roomId || !slug || !token) {
        setAssets([]);
        return;
      }

      try {
        setLoadingAssets(true);

        const params = new URLSearchParams({
          slug,
          token,
          roomId,
        });

        if (assetTypeId && assetTypeId !== "all") {
          params.set("typeId", assetTypeId);
        }

        const response = await fetch(
          `/api/public/assets?${params.toString()}`,
          {
            signal: controller.signal,
          }
        );

        const data: {
          assets?: Asset[];
          error?: string;
        } = await response.json();

        if (!response.ok) {
          console.error(data.error);
          setAssets([]);
          return;
        }

        const activeAssets = (data.assets ?? []).filter(
          (asset) => asset.deletedAt == null
        );

        setAssets(activeAssets);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Error fetching assets:", error);
          setAssets([]);
        }
      } finally {
        setLoadingAssets(false);
      }
    }

    queueMicrotask(() => {
      void loadAssets();
    });

    return () => {
      controller.abort();
    };
  }, [slug, token, roomId, assetTypeId]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAssetTypes() {
      if (!slug || !token) {
        setAssetTypes([]);
        return;
      }

      try {
        setLoadingAssetTypes(true);

        const response = await fetch(
          `/api/public/asset-types?slug=${slug}&token=${token}`,
          {
            signal: controller.signal,
          }
        );

        const data: {
          assetTypes?: AssetType[];
          error?: string;
        } = await response.json();

        if (!response.ok) {
          console.error(data.error);
          setAssetTypes([]);
          return;
        }

        setAssetTypes(data.assetTypes ?? []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Error fetching asset types:", error);
          setAssetTypes([]);
        }
      } finally {
        setLoadingAssetTypes(false);
      }
    }

    queueMicrotask(() => {
      void loadAssetTypes();
    });

    return () => {
      controller.abort();
    };
  }, [slug, token]);

  const fetchAssets = useCallback(async () => {
    // تم الاحتفاظ بها للتوافق مع المكونات الأخرى
  }, []);

  const fetchAssetTypes = useCallback(async () => {
    // تم الاحتفاظ بها للتوافق مع المكونات الأخرى
  }, []);

  const resetAssetData = useCallback(() => {
    setAssets([]);
    setAssetTypes([]);
  }, []);

  return {
    assets,
    assetTypes,
    loadingAssets,
    loadingAssetTypes,
    fetchAssets,
    fetchAssetTypes,
    resetAssetData,
  };
}