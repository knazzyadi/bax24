// src/app/[locale]/(dashboard)/assets/[id]/components/AssetExtraInfo.tsx
"use client";

import { useLocale } from "next-intl";
import { Package, Truck } from "lucide-react";
import { InfoField } from "./InfoField";
import { SectionHeader } from "./SectionHeader";
import { glassCard } from "../constants";

interface AssetExtraInfoProps {
  asset: {
    serialNumber?: string;
    manufacturer?: string;
    model?: string;
    supplier?: string;
  };
}

export function AssetExtraInfo({ asset }: AssetExtraInfoProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const { serialNumber, manufacturer, model, supplier } = asset;
  
  if (!serialNumber && !manufacturer && !model && !supplier) {
    return null;
  }

  return (
    <div className={glassCard}>
      <SectionHeader 
        icon={<Package className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />}
        title={isRtl ? "تفاصيل إضافية" : "Additional Details"}
        iconBgClass="bg-cyan-50 dark:bg-cyan-950/40"
      />
      <div className="grid sm:grid-cols-2 gap-5">
        {serialNumber && (
          <InfoField 
            label={isRtl ? "الرقم التسلسلي" : "Serial Number"} 
            value={serialNumber} 
          />
        )}
        {manufacturer && (
          <InfoField 
            label={isRtl ? "الشركة المصنعة" : "Manufacturer"} 
            value={manufacturer} 
          />
        )}
        {model && (
          <InfoField 
            label={isRtl ? "الموديل" : "Model"} 
            value={model} 
          />
        )}
        {supplier && (
          <InfoField 
            label={isRtl ? "المورد" : "Supplier"} 
            value={supplier} 
            icon={<Truck className="h-3 w-3" />}
          />
        )}
      </div>
    </div>
  );
}