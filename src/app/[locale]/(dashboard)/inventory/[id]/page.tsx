// src/app/[locale]/(dashboard)/inventory/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  Box,
  BarChart3,
  AlertCircle,
  MapPin,
  Loader2,
  Calendar,
  Hash,
  Banknote,
  FileText,
  ArrowLeft,
  Info,
  Package,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { InventoryItem } from "../types";

type RoomType = InventoryItem["room"];

function formatRoomLocation(room: RoomType, isRtl: boolean): string {
  if (!room) return isRtl ? "موقع غير محدد" : "Location not set";

  const building = room.floor?.building;
  const floor = room.floor;
  const parts: string[] = [];

  if (building) {
    parts.push(isRtl ? building.name : building.nameEn || building.name);
  }
  if (floor) {
    parts.push(isRtl ? floor.name : floor.nameEn || floor.name);
  }
  parts.push(isRtl ? room.name : room.nameEn || room.name);

  return parts.join(" - ");
}

// =========================
// تنسيقات موحدة (glassCard)
// =========================
const glassCard =
  "bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300";

export default function InventoryItemDetailPage() {
  const router = useRouter();
  const params = useParams();
  const locale = useLocale();
  const t = useTranslations("Inventory");
  const isRtl = locale === "ar";
  const id = params.id as string;

  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();

    const fetchItem = async () => {
      try {
        const res = await fetch(`/api/inventory/${id}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setItem(data);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        toast.error(t("fetchError"));
        router.push(`/${locale}/inventory`);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
    return () => controller.abort();
  }, [id, locale, router, t]);

  const formatDate = (date?: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString(isRtl ? "ar-SA" : "en-US");
  };

  if (loading) {
    return (
      <div className="relative min-h-[60vh] flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 dark:text-indigo-400" />
      </div>
    );
  }

  if (!item) return null;

  const isLowStock = item.quantity <= item.minQuantity;
  const unitPriceValue = (item as any).unitPrice;

  return (
    <div className="relative space-y-8 p-6">
      {/* خلفية متدرجة خفيفة */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

      {/* رأس الصفحة */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/30 dark:border-indigo-800/30 shadow-lg shadow-indigo-500/5">
            <Box className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {`${t("sparePart")} #${item.sku || item.id.slice(-6)}`}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("detailSubtitle")}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400"
        >
          <ArrowLeft className="h-4 w-4 ml-2" />
          {isRtl ? "العودة" : "Back"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* العمود الرئيسي (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          {/* بطاقة الهوية */}
          <div className={glassCard}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40">
                <Package className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {t("identity")}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {t("name")}
                </div>
                <p className="font-semibold text-lg text-slate-800 dark:text-slate-100">
                  {item.name}
                </p>
              </div>
              <div>
                <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  SKU
                </div>
                <p className="font-semibold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Hash className="h-4 w-4 text-slate-400" />
                  {item.sku}
                </p>
              </div>
              <div className="sm:col-span-2">
                <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {t("location")}
                </div>
                <p className="font-semibold text-md text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-500" />
                  {formatRoomLocation(item.room, isRtl)}
                </p>
              </div>
              <div>
                <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {t("unitPrice")}
                </div>
                <p className="font-semibold text-lg text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-emerald-500" />
                  {unitPriceValue != null
                    ? unitPriceValue.toLocaleString()
                    : isRtl
                    ? "غير محدد"
                    : "Not set"}
                </p>
              </div>
            </div>

            {item.notes && (
              <div className="mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {t("notes")}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/30 dark:border-slate-700/30 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {item.notes}
                </div>
              </div>
            )}
          </div>

          {/* بطاقة المخزون */}
          <div className={glassCard}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40">
                <BarChart3 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {t("inventory")}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {t("quantity")}
                </div>
                <p
                  className={cn(
                    "text-3xl font-bold mt-1",
                    isLowStock ? "text-rose-500" : "text-emerald-500"
                  )}
                >
                  {item.quantity} {item.unit || (isRtl ? "قطعة" : "unit")}
                </p>
              </div>
              <div>
                <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {t("minStockAlert")}
                </div>
                <p className="text-2xl font-bold mt-1 text-slate-700 dark:text-slate-300">
                  {item.minQuantity}
                </p>
              </div>
            </div>

            {isLowStock && (
              <Badge className="mt-4 rounded-full font-black px-3 py-1 w-full justify-center gap-1 bg-rose-500/10 text-rose-500 border-none">
                <AlertCircle className="h-3 w-3" /> {t("lowStock")}
              </Badge>
            )}
          </div>
        </div>

        {/* العمود الجانبي (1/3) */}
        <div className="space-y-6">
          {/* بطاقة التواريخ */}
          <div className={glassCard}>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {t("dates")}
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {t("createdAt")}
                </div>
                <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                  {formatDate(item.createdAt)}
                </p>
              </div>
              <div>
                <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {t("updatedAt")}
                </div>
                <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                  {formatDate(item.updatedAt)}
                </p>
              </div>
            </div>
          </div>

          {/* مساعدة سريعة */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200/30 dark:border-indigo-800/30 flex items-start gap-3">
            <Info className="h-5 w-5 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
              {isRtl
                ? "يمكنك تعديل هذا العنصر من خلال صفحة التعديل."
                : "You can edit this item from the edit page."}
            </div>
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => router.push(`/${locale}/inventory/${id}/edit`)}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200"
            >
              {isRtl ? "تعديل" : "Edit"}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="w-full h-12 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400 font-medium"
            >
              <ArrowLeft className="h-4 w-4 ml-2" />
              {isRtl ? "العودة إلى القائمة" : "Back to List"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}