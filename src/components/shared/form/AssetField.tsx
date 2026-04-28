// src/components/shared/form/AssetField.tsx
//اختيار أصل
"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface Asset {
  id: string;
  name: string;
  code: string;
}

interface AssetFieldProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  assets: Asset[];
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  noAssetsMessage?: string;
}

export function AssetField({
  value,
  onChange,
  assets,
  loading = false,
  disabled = false,
  placeholder = "اختر الأصل",
  noAssetsMessage = "لا توجد أصول",
}: AssetFieldProps) {
  // العثور على الأصل المحدد لعرضه في الـ trigger بشكل مخصص
  const selectedAsset = assets.find(a => a.id === value);
  const displayValue = selectedAsset ? `${selectedAsset.name} (${selectedAsset.code})` : '';

  return (
    <div className="space-y-2">
      <Label className="text-sm font-black text-muted-foreground/70">الأصل</Label>
      <Select
        value={value || ""}
        onValueChange={(val) => onChange(val || null)}
        disabled={disabled || loading}
      >
        <SelectTrigger className="w-full h-12 rounded-2xl border-primary bg-background font-black px-6">
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>جاري التحميل...</span>
            </div>
          ) : (
            displayValue || <SelectValue placeholder={placeholder} />
          )}
        </SelectTrigger>
        <SelectContent>
          {assets.length === 0 && !loading ? (
            <div className="px-3 py-2 text-sm text-muted-foreground text-center">
              {noAssetsMessage}
            </div>
          ) : (
            assets.map((asset) => (
              <SelectItem key={asset.id} value={asset.id}>
                {asset.name} ({asset.code})
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}