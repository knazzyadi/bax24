// src/components/shared/form/AssetTypeField.tsx
"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface AssetType {
  id: string;
  name: string;
  nameEn?: string | null;
  code?: string | null;
}

interface AssetTypeFieldProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  assetTypes: AssetType[];
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  isRtl?: boolean;
  showLabel?: boolean;
  labelText?: string;
}

export function AssetTypeField({
  value,
  onChange,
  assetTypes,
  disabled = false,
  placeholder = "اختر نوع الأصل",
  className,
  isRtl = true,
  showLabel = false,
  labelText,
}: AssetTypeFieldProps) {
  // ✅ عرض النوع مع الكود (مثل باقي المحددات)
  const getDisplayName = (type: AssetType) => {
    const name = isRtl ? type.name : (type.nameEn || type.name);
    return type.code ? `${type.code}. ${name}` : name;
  };

  // ✅ بناء الخيارات مع خيار افتراضي في البداية
  const defaultOption = {
    id: "",
    label: isRtl ? "— اختر نوع الأصل —" : "— Select asset type —",
  };

  const options = assetTypes.length > 0
    ? [defaultOption, ...assetTypes.map(type => ({ id: type.id, label: getDisplayName(type) }))]
    : [];

  // ✅ القيمة المعروضة في الحقل (عند الاختيار)
  const selectedType = assetTypes.find(t => t.id === value);
  const displayValue = selectedType ? getDisplayName(selectedType) : undefined;

  const isDisabled = disabled || assetTypes.length === 0;

  return (
    <div className={cn("space-y-1.5 w-full", className)}>
      {showLabel && (
        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {labelText || (isRtl ? "نوع الأصل" : "Asset Type")}
        </label>
      )}
      <Select
        value={value ?? ""}
        onValueChange={(val) => onChange(val || null)}
        disabled={isDisabled}
      >
        <SelectTrigger
          className={cn(
            "w-full h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500/50 transition-all px-6",
            className
          )}
        >
          <SelectValue placeholder={placeholder}>
            {displayValue}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.length === 0 ? (
            <div className="p-2 text-center text-sm text-muted-foreground">
              {isRtl ? "لا توجد أنواع" : "No types available"}
            </div>
          ) : (
            options.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}