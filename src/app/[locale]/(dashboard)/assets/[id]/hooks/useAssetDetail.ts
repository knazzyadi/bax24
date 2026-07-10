// src/app/[locale]/(dashboard)/assets/[id]/hooks/useAssetDetail.ts
"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { AssetDetail, WorkOrder, MaintenanceRecord } from "../types";

export function useAssetDetail(assetId: string) {
  const t = useTranslations("Assets");
  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ✅ إذا لم يوجد assetId، لا نجلب البيانات
    if (!assetId) {
      setLoading(false);
      setError(t("assetNotFound"));
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    async function fetchData() {
      try {
        const [assetRes, workOrdersRes, maintenanceRes] = await Promise.all([
          fetch(`/api/assets/${assetId}`, { signal }),
          fetch(`/api/work-orders?assetId=${assetId}`, { signal }),
          fetch(`/api/assets/${assetId}/maintenance-history`, { signal }),
        ]);

        // ✅ معالجة الأخطاء بشكل أكثر تفصيلاً
        if (!assetRes.ok) {
          let errorMessage = t("fetchError");
          try {
            const errorData = await assetRes.json();
            if (errorData.error) {
              errorMessage = errorData.error;
            }
          } catch (e) {
            // تجاهل إذا لم يكن الرد JSON
          }
          throw new Error(errorMessage);
        }

        const assetData = await assetRes.json();
        setAsset(assetData);

        if (workOrdersRes.ok) {
          const data = await workOrdersRes.json();
          setWorkOrders(Array.isArray(data) ? data : data.workOrders || []);
        }

        if (maintenanceRes.ok) {
          const historyData = await maintenanceRes.json();
          setMaintenanceHistory(historyData);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Error fetching asset details:", err);
          const message = err.message || t("fetchError");
          setError(message);
          toast.error(message);
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => controller.abort();
  }, [assetId, t]);

  return { asset, workOrders, maintenanceHistory, loading, error };
}