// src/components/shared/form/AssetTypeField.tsx
"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AssetType {
  id: string;
  name: string;
  code?: string;
}

interface AssetTypeFieldProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  assetTypes: AssetType[];
  disabled?: boolean;
  placeholder?: string;
}

export function AssetTypeField({
  value,
  onChange,
  assetTypes,
  disabled = false,
  placeholder = "اختر النوع",
}: AssetTypeFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-black text-muted-foreground/70">نوع الأصل</Label>
      <Select
        value={value || ""}
        onValueChange={(val) => onChange(val || null)}
        disabled={disabled}
      >
        <SelectTrigger className="w-full h-12 rounded-2xl border-primary bg-background font-black px-6">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {assetTypes.map((type) => (
            <SelectItem key={type.id} value={type.id}>
              {type.name} {type.code ? `(${type.code})` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}