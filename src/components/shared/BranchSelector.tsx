// src/components/shared/BranchSelector.tsx
"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Branch {
  id: string;
  name: string;
  nameEn?: string;
}

interface BranchSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export function BranchSelector({ value, onValueChange, disabled = false }: BranchSelectorProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/branches")
      .then((res) => {
        if (!res.ok) {
          // إذا كان الخطأ 401 أو 403، نعتبر أنه لا توجد فروع متاحة
          if (res.status === 401 || res.status === 403) {
            return [];
          }
          throw new Error("فشل تحميل الفروع");
        }
        return res.json();
      })
      .then((data) => {
        // ✅ التأكد من أن البيانات هي مصفوفة
        if (Array.isArray(data)) {
          setBranches(data);
        } else {
          console.warn("API returned non-array data:", data);
          setBranches([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching branches:", err);
        setError(isRtl ? "حدث خطأ في تحميل الفروع" : "Failed to load branches");
        setBranches([]);
      })
      .finally(() => setLoading(false));
  }, [isRtl]);

  // حالة التحميل
  if (loading) {
    return (
      <Select value={value} onValueChange={onValueChange} disabled>
        <SelectTrigger className="h-14 rounded-2xl border-primary bg-background font-black text-base px-6">
          <SelectValue placeholder={isRtl ? "جاري التحميل..." : "Loading..."} />
        </SelectTrigger>
      </Select>
    );
  }

  // إذا كان هناك خطأ أو لا توجد فروع
  if (error || branches.length === 0) {
    return (
      <Select value={value} onValueChange={onValueChange} disabled>
        <SelectTrigger className="h-14 rounded-2xl border-primary bg-background font-black text-base px-6">
          <SelectValue
            placeholder={
              error
                ? isRtl
                  ? "حدث خطأ"
                  : "Error"
                : isRtl
                ? "لا توجد فروع متاحة"
                : "No branches available"
            }
          />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="h-14 rounded-2xl border-primary bg-background font-black text-base px-6">
        <SelectValue placeholder={isRtl ? "اختر الفرع" : "Select branch"} />
      </SelectTrigger>
      <SelectContent>
        {branches.map((branch) => (
          <SelectItem key={branch.id} value={branch.id}>
            {isRtl ? branch.name : branch.nameEn || branch.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}