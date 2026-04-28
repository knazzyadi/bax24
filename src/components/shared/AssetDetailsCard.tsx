// src/components/shared/AssetDetailsCard.tsx
"use client";

import { Package, Calendar, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AssetDetailsCardProps {
  asset: {
    id: string;
    name: string;
    nameEn?: string | null;
    code: string;
    type?: { name: string; nameEn?: string | null } | null;
    status?: { name: string; nameEn?: string | null; color?: string | null } | null;
    purchaseDate?: string | null;
    warrantyEnd?: string | null;
    location?: string;
  };
  isRtl: boolean;
  className?: string;
}

export function AssetDetailsCard({ asset, isRtl, className }: AssetDetailsCardProps) {
  const displayName = isRtl ? asset.name : (asset.nameEn || asset.name);
  const typeName = asset.type
    ? isRtl ? asset.type.name : (asset.type.nameEn || asset.type.name)
    : (isRtl ? "غير مصنف" : "Uncategorized");
  const statusName = asset.status
    ? isRtl ? asset.status.name : (asset.status.nameEn || asset.status.name)
    : (isRtl ? "بدون حالة" : "No status");
  const statusColor = asset.status?.color || "#6b7280";

  return (
    <div className={cn("bg-card border rounded-2xl p-5 space-y-3", className)}>
      <h2 className="text-lg font-black flex items-center gap-2">
        <Package className="h-5 w-5 text-primary" />
        {isRtl ? "تفاصيل الأصل" : "Asset Details"}
      </h2>
      <div className="space-y-2">
        <div><span className="text-sm text-muted-foreground">{isRtl ? "الاسم:" : "Name:"}</span><p className="font-medium">{displayName}</p></div>
        <div><span className="text-sm text-muted-foreground">{isRtl ? "الكود:" : "Code:"}</span><p className="font-mono text-sm">{asset.code}</p></div>
        <div><span className="text-sm text-muted-foreground">{isRtl ? "النوع:" : "Type:"}</span><Badge variant="secondary" className="mt-1">{typeName}</Badge></div>
        <div><span className="text-sm text-muted-foreground">{isRtl ? "الحالة:" : "Status:"}</span><Badge style={{ backgroundColor: `${statusColor}20`, color: statusColor }} className="border-none mt-1">{statusName}</Badge></div>
        {asset.purchaseDate && <div><span className="text-sm text-muted-foreground">{isRtl ? "تاريخ الشراء:" : "Purchase Date:"}</span><p>{new Date(asset.purchaseDate).toLocaleDateString(isRtl ? "ar-SA" : "en-US")}</p></div>}
        {asset.warrantyEnd && <div><span className="text-sm text-muted-foreground">{isRtl ? "انتهاء الضمان:" : "Warranty End:"}</span><p>{new Date(asset.warrantyEnd).toLocaleDateString(isRtl ? "ar-SA" : "en-US")}</p></div>}
        {asset.location && <div><span className="text-sm text-muted-foreground flex items-center gap-1"><MapPin size={14} /> {isRtl ? "الموقع:" : "Location:"}</span><p>{asset.location}</p></div>}
      </div>
    </div>
  );
}