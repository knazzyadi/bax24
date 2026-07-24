// src/app/[locale]/(dashboard)/inspections/[id]/NonComplianceWorkOrderDialog.tsx
"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// استيراد مكونات الموقع
import { LocationSelector, type LocationValue } from "@/components/shared/LocationSelector";
import { AssetTypeField } from "@/components/shared/form/AssetTypeField";

// ============================================================
// الأنواع
// ============================================================

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

interface NonComplianceWorkOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  itemNameAr?: string;
  currentLocation?: {
    buildingId?: string;
    floorId?: string;
    roomId?: string;
  };
  onSuccess?: () => void;
  locale: string;
}

// ============================================================
// المكون الرئيسي
// ============================================================

export function NonComplianceWorkOrderDialog({
  open,
  onOpenChange,
  itemName,
  itemNameAr,
  currentLocation,
  onSuccess,
  locale,
}: NonComplianceWorkOrderDialogProps) {
  const isRtl = locale === "ar";
  const t = useTranslations("Inspections");

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // حالة البيانات
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  // حالة النموذج
  const [location, setLocation] = useState<LocationValue>({
    buildingId: currentLocation?.buildingId || "",
    floorId: currentLocation?.floorId || "",
    roomId: currentLocation?.roomId || "",
  });
  const [assetTypeId, setAssetTypeId] = useState<string | null>(null);
  const [assetId, setAssetId] = useState<string>("");
  const [reason, setReason] = useState("");

  // ============================================================
  // جلب البيانات الأولية
  // ============================================================

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const typesRes = await fetch("/api/asset-types");
        if (typesRes.ok) {
          const data = await typesRes.json();
          setAssetTypes(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error fetching dialog data:", error);
        toast.error(isRtl ? "فشل تحميل البيانات" : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    if (open) fetchData();
  }, [open, isRtl]);

  // ============================================================
  // جلب الأصول عند اختيار نوع الأصل
  // ============================================================

  useEffect(() => {
    if (!assetTypeId) {
      setAssets([]);
      setAssetId("");
      return;
    }

    const fetchAssets = async () => {
      setLoadingAssets(true);
      try {
        const params = new URLSearchParams();
        params.append("typeId", assetTypeId);

        if (location.buildingId) params.append("buildingId", location.buildingId);
        if (location.floorId) params.append("floorId", location.floorId);
        if (location.roomId) params.append("roomId", location.roomId);

        const res = await fetch(`/api/assets?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          const assetsData = data.assets || data || [];
          setAssets(Array.isArray(assetsData) ? assetsData : []);
        } else {
          setAssets([]);
        }
      } catch (error) {
        console.error("Error fetching assets:", error);
        setAssets([]);
      } finally {
        setLoadingAssets(false);
      }
    };

    fetchAssets();
  }, [assetTypeId, location.buildingId, location.floorId, location.roomId]);

  // ============================================================
  // معالج تغيير نوع الأصل
  // ============================================================

  const handleAssetTypeChange = (value: string | null) => {
    setAssetTypeId(value);
    setAssetId("");
  };

  // ============================================================
  // إنشاء أمر العمل
  // ============================================================

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error(isRtl ? "يرجى إدخال سبب الإنشاء" : "Please enter the reason");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        title: isRtl
          ? `إصلاح: ${itemNameAr || itemName}`
          : `Repair: ${itemName}`,
        description: reason.trim(),
        reason: reason.trim(),
        source: "inspection",
        sourceId: "pending",
        buildingId: location.buildingId || null,
        floorId: location.floorId || null,
        roomId: location.roomId || null,
        assetTypeId: assetTypeId || null,
        assetIds: assetId ? [assetId] : [],
        statusId: "pending",
        branchId: null,
      };

      const res = await fetch("/api/work-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create work order");
      }

      toast.success(isRtl ? "تم إنشاء أمر العمل بنجاح" : "Work order created successfully");

      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || (isRtl ? "فشل إنشاء أمر العمل" : "Failed to create work order"));
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // التصميم
  // ============================================================

  const displayName = isRtl ? itemNameAr || itemName : itemName;

  return (
    <Dialog open={open} onOpenChange={(open) => !submitting && onOpenChange(open)}>
      <DialogContent
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-slate-200/50 dark:border-slate-800/50"
        dir={isRtl ? "rtl" : "ltr"}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-5 w-5" />
            </span>
            {isRtl ? "تحويل لأمر عمل" : "Convert to Work Order"}
          </DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400">
            {isRtl
              ? `سيتم إنشاء أمر صيانة بناءً على البند غير المطابق: "${displayName}"`
              : `A maintenance order will be created based on the failed item: "${displayName}"`}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="space-y-5 py-4">
            {/* 1. الموقع - اختياري */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {isRtl ? "الموقع (اختياري)" : "Location (Optional)"}
              </Label>
              <div className="w-full" dir={isRtl ? "rtl" : "ltr"}>
                <LocationSelector value={location} onChange={setLocation} />
              </div>
            </div>

            {/* 2. نوع الأصل والأصل في صف واحد */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {isRtl ? "نوع الأصل (اختياري)" : "Asset Type (Optional)"}
                </Label>
                {/* ✅ تم حذف dir prop من AssetTypeField */}
                <AssetTypeField
                  value={assetTypeId}
                  onChange={handleAssetTypeChange}
                  assetTypes={assetTypes}
                  placeholder={isRtl ? "اختر نوع الأصل" : "Select asset type"}
                  className="w-full h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {isRtl ? "الأصل (اختياري)" : "Asset (Optional)"}
                </Label>
                <Select
                  value={assetId}
                  onValueChange={setAssetId}
                  disabled={loadingAssets || assets.length === 0 || !assetTypeId}
                  dir={isRtl ? "rtl" : "ltr"}
                >
                  <SelectTrigger className="w-full h-11 rounded-xl border-slate-200 dark:border-slate-700 text-right">
                    <SelectValue
                      placeholder={
                        !assetTypeId
                          ? isRtl
                            ? "اختر نوع الأصل أولاً"
                            : "Select asset type first"
                          : loadingAssets
                          ? isRtl
                            ? "جاري التحميل..."
                            : "Loading..."
                          : assets.length === 0
                          ? isRtl
                            ? "لا توجد أصول في هذا الموقع"
                            : "No assets at this location"
                          : isRtl
                          ? "اختر الأصل (اختياري)"
                          : "Select asset (optional)"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{isRtl ? "بدون أصل" : "No asset"}</SelectItem>
                    {assets.map((asset) => (
                      <SelectItem key={asset.id} value={asset.id}>
                        {isRtl ? asset.name : asset.nameEn || asset.name} ({asset.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 3. سبب الإنشاء (إجباري) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {isRtl ? "سبب الإنشاء" : "Reason"} <span className="text-rose-500">*</span>
              </Label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  isRtl
                    ? "أدخل سبب إنشاء أمر الصيانة..."
                    : "Enter the reason for creating the work order..."
                }
                className="w-full min-h-[80px] rounded-xl border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 focus:ring-2 focus:ring-indigo-500/50 transition-all p-4 text-sm resize-y"
                dir={isRtl ? "rtl" : "ltr"}
                style={{ textAlign: isRtl ? "right" : "left" }}
                required
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-3 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="rounded-xl border-slate-300 dark:border-slate-700 h-11"
          >
            {isRtl ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={submitting || loading}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-11 shadow-lg shadow-indigo-500/20"
          >
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isRtl ? "إنشاء الأمر" : "Create Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}