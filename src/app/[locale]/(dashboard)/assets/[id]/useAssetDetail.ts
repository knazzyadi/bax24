// src/app/[locale]/(dashboard)/assets/[id]/useAssetDetail.ts

"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { AssetDetail, WorkOrder, MaintenanceRecord } from "./types";

export function useAssetDetail(assetId: string) {
  const t = useTranslations("Assets");

  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceRecord[]>([]);

  const [loading, setLoading] = useState(Boolean(assetId));

  const [error, setError] = useState<string | null>(
    assetId ? null : t("assetNotFound")
  );

  useEffect(() => {
    if (!assetId) {
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

        if (!assetRes.ok) {
          let errorMessage = t("fetchError");

          try {
            const errorData: { error?: string } = await assetRes.json();

            if (errorData.error) {
              errorMessage = errorData.error;
            }
          } catch {
            // ignore
          }

          throw new Error(errorMessage);
        }

        const assetData = await assetRes.json();

        const transformedAsset: AssetDetail = {
          id: assetData.id,
          code: assetData.code,
          name: assetData.name,
          nameEn: assetData.nameEn,
          description: assetData.description,
          purchaseDate: assetData.purchaseDate,
          operationDate: assetData.operationDate,
          warrantyEnd: assetData.warrantyEnd,
          lastMaintenanceDate: assetData.lastMaintenanceDate,
          serialNumber: assetData.serialNumber,
          manufacturer: assetData.manufacturer,
          model: assetData.model,
          notes: assetData.notes,
          supplierId: assetData.supplierId,
          supplierName: assetData.supplierName,
          supplierNameEn: assetData.supplierNameEn,

          type: assetData.typeName
            ? {
                id: assetData.typeId || "",
                name: assetData.typeName,
                nameEn: assetData.typeNameEn || undefined,
              }
            : undefined,

          status: assetData.statusName
            ? {
                id: assetData.statusId || "",
                name: assetData.statusName,
                nameEn: assetData.statusNameEn || undefined,
                color: assetData.statusColor || undefined,
              }
            : undefined,

          room: assetData.roomName
            ? {
                id: assetData.roomId || "",
                name: assetData.roomName,
                nameEn: assetData.roomNameEn || undefined,
                code: assetData.roomCode || undefined,

                floor: {
                  id: assetData.floorId || "",
                  name: assetData.floorName || "",
                  nameEn: assetData.floorNameEn || undefined,
                  code: assetData.floorCode || undefined,

                  building: {
                    id: assetData.buildingId || "",
                    name: assetData.buildingName || "",
                    nameEn: assetData.buildingNameEn || undefined,
                    code: assetData.buildingCode || undefined,

                    branch: {
                      id: assetData.branchId || "",
                      name: assetData.branchName || "",
                      nameEn: assetData.branchNameEn || undefined,
                    },
                  },
                },
              }
            : undefined,
        };

        setAsset(transformedAsset);

        if (workOrdersRes.ok) {
          const data = await workOrdersRes.json();

          setWorkOrders(
            Array.isArray(data) ? data : (data.workOrders ?? [])
          );
        }

        if (maintenanceRes.ok) {
          const historyData: MaintenanceRecord[] =
            await maintenanceRes.json();

          setMaintenanceHistory(historyData);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
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

    void fetchData();

    return () => {
      controller.abort();
    };
  }, [assetId, t]);

  return {
    asset,
    workOrders,
    maintenanceHistory,
    loading,
    error,
  };
}