"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import {
  Box, BarChart3, AlertCircle, MapPin, Loader2,
  Calendar, TrendingUp, Hash, Banknote, FileText, ArrowLeft, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { PageContainer } from "@/components/shared/detail/PageContainer";
import { DetailHeader } from "@/components/shared/detail/DetailHeader";
import { InfoCard } from "@/components/shared/detail/InfoCard";
import { SidebarCard } from "@/components/shared/detail/SidebarCard";

function formatRoomLocation(room: any, isRtl: boolean): string {
  if (!room) return isRtl ? "موقع غير محدد" : "Location not set";
  const building = room.floor?.building;
  const floor = room.floor;
  const parts = [];
  if (building) parts.push(isRtl ? building.name : (building.nameEn || building.name));
  if (floor) parts.push(isRtl ? floor.name : (floor.nameEn || floor.name));
  parts.push(isRtl ? room.name : (room.nameEn || room.name));
  return parts.join(" - ");
}

export default function InventoryItemDetailPage() {
  const router = useRouter();
  const params = useParams();
  const locale = useLocale();
  const t = useTranslations("Inventory");
  const isRtl = locale === "ar";
  const id = params.id as string;

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await fetch(`/api/inventory/${id}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setItem(data);
      } catch (error) {
        toast.error(t("fetchError"));
        router.push(`/${locale}/inventory`);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchItem();
  }, [id, router, locale, t]);

  if (loading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }
  if (!item) return null;

  const isLowStock = item.quantity <= item.minQuantity;

  return (
    <PageContainer>
      <DetailHeader
        icon={<Box size={28} />}
        title={`${t("sparePart")} #${item.sku || item.id.slice(-6)}`}
        subtitle={t("detailSubtitle")}
        // لا توجد إجراءات (تم حذف زر التعديل)
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* العمود الرئيسي */}
        <div className="lg:col-span-2 space-y-8">
          <InfoCard title={t("identity")} icon={<Box className="h-5 w-5" />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <div className="text-xs font-black text-muted-foreground uppercase tracking-wider">{t("name")}</div>
                <p className="font-black text-lg">{item.name}</p>
              </div>
              <div>
                <div className="text-xs font-black text-muted-foreground uppercase tracking-wider">SKU</div>
                <p className="font-black text-lg font-mono">{item.sku}</p>
              </div>
              <div>
                <div className="text-xs font-black text-muted-foreground uppercase tracking-wider">{t("location")}</div>
                <p className="font-black text-md">{formatRoomLocation(item.room, isRtl)}</p>
              </div>
              <div>
                <div className="text-xs font-black text-muted-foreground uppercase tracking-wider">{t("unitPrice")}</div>
                <p className="font-black text-lg">
                  {item.unitPrice ? item.unitPrice.toLocaleString() : (isRtl ? "غير محدد" : "Not set")}
                </p>
              </div>
            </div>
            {item.notes && (
              <div className="mt-6 pt-4 border-t border-border">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div className="text-xs font-black text-muted-foreground uppercase tracking-wider">{t("notes")}</div>
                </div>
                <div className="p-3 bg-muted/30 rounded-xl text-sm font-medium whitespace-pre-wrap">
                  {item.notes}
                </div>
              </div>
            )}
          </InfoCard>

          <InfoCard title={t("inventory")} icon={<BarChart3 className="h-5 w-5" />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <div className="text-xs font-black text-muted-foreground uppercase tracking-wider">{t("quantity")}</div>
                <p className={cn("text-3xl font-black mt-1", isLowStock ? "text-destructive" : "text-emerald-500")}>
                  {item.quantity} {item.unit || (isRtl ? "قطعة" : "unit")}
                </p>
              </div>
              <div>
                <div className="text-xs font-black text-muted-foreground uppercase tracking-wider">{t("minStockAlert")}</div>
                <p className="text-2xl font-black mt-1">{item.minQuantity}</p>
              </div>
            </div>
            {isLowStock && (
              <Badge className="mt-4 rounded-full font-black px-3 py-1 w-full justify-center gap-1 bg-destructive/10 text-destructive border-none">
                <AlertCircle className="h-3 w-3" /> {t("lowStock")}
              </Badge>
            )}
          </InfoCard>
        </div>

        {/* العمود الجانبي */}
        <div className="space-y-8">
          <SidebarCard title={t("dates")} icon={<Calendar className="h-5 w-5" />}>
            <div className="space-y-4">
              <div>
                <div className="text-xs font-black text-muted-foreground uppercase tracking-wider">{t("createdAt")}</div>
                <p className="font-black text-sm">
                  {new Date(item.createdAt).toLocaleDateString(isRtl ? "ar-SA" : "en-US")}
                </p>
              </div>
              <div>
                <div className="text-xs font-black text-muted-foreground uppercase tracking-wider">{t("updatedAt")}</div>
                <p className="font-black text-sm">
                  {new Date(item.updatedAt).toLocaleDateString(isRtl ? "ar-SA" : "en-US")}
                </p>
              </div>
            </div>
          </SidebarCard>

          <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 flex items-start gap-3">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-xs font-bold text-muted-foreground">
              {t("editHint")}
            </div>
          </div>

          {/* زر العودة فقط (بدلاً من زرين) */}
          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="w-full rounded-full border-primary text-primary hover:bg-primary/10 font-black h-11"
            >
              <ArrowLeft className="h-4 w-4 ml-2" /> {t("back")}
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}