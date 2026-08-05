// src/components/shared/BranchSelector.tsx
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface Branch {
  id: string;
  name: string;
  nameEn?: string;
  code?: string;
}

interface BranchSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  // ✅ تم حذف placeholder
  emptyMessage?: string;
  loadingMessage?: string;
  errorMessage?: string;
  onOpenChange?: (open: boolean) => void;
}

// ✅ نقل الثابت خارج المكون
const NONE_VALUE = "__none__";

export function BranchSelector({
  value,
  onValueChange,
  disabled = false,
  className = "",
  // ✅ تم حذف placeholder
  emptyMessage,
  loadingMessage,
  errorMessage,
  onOpenChange,
}: BranchSelectorProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  // ----- رسائل افتراضية -----
  const defaultText = useMemo(
    () => ({
      placeholder: isRtl ? "اختر الفرع" : "Select Branch",
      selectLabel: isRtl ? "— اختر الفرع —" : "— Select branch —",
      empty: isRtl ? "لا توجد فروع متاحة" : "No branches available",
      loading: isRtl ? "جاري التحميل..." : "Loading...",
      error: isRtl ? "حدث خطأ في تحميل الفروع" : "Failed to load branches",
    }),
    [isRtl]
  );

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ----- جلب الفروع مع AbortController -----
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    fetch("/api/locations/branches", { signal })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            return [];
          }
          throw new Error(defaultText.error);
        }
        return res.json();
      })
      .then((data) => {
        if (!signal.aborted) {
          setBranches(Array.isArray(data) ? data : []);
        }
      })
      .catch((err) => {
        if (!signal.aborted && err.name !== "AbortError") {
          console.error("Error fetching branches:", err);
          setError(err.message || defaultText.error);
          setBranches([]);
        }
      })
      .finally(() => {
        if (!signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [defaultText.error]);

  // ----- دالة عرض الاسم مع الكود -----
  const getDisplayName = useCallback(
    (branch: Branch) => {
      const name = isRtl ? branch.name : branch.nameEn || branch.name;
      return branch.code ? `${branch.code}. ${name}` : name;
    },
    [isRtl]
  );

  // ✅ حماية البيانات من null/undefined
  const safeBranches = (branches || []).filter(Boolean);

  // ✅ بناء قائمة الخيارات مع الخيار الافتراضي (يُعرّف داخل useMemo)
  const branchOptions = useMemo(() => {
    // خيار افتراضي
    const defaultOption = {
      id: NONE_VALUE,
      label: defaultText.selectLabel,
    };

    const options = safeBranches.map((branch) => ({
      id: branch.id,
      label: getDisplayName(branch),
    }));

    return safeBranches.length > 0 ? [defaultOption, ...options] : options;
  }, [safeBranches, getDisplayName, defaultText.selectLabel]);

  // ✅ تحويل القيمة الفارغة إلى القيمة المميزة للعرض
  const selectValue = value || NONE_VALUE;

  const handleValueChange = (val: string) => {
    if (val === NONE_VALUE) {
      onValueChange("");
    } else {
      onValueChange(val);
    }
  };

  // ----- العنصر المختار للعرض في الـ Trigger -----
  const selectedBranch = useMemo(
    () => safeBranches.find((b) => b.id === value),
    [safeBranches, value]
  );

  const displayValue = selectedBranch ? getDisplayName(selectedBranch) : undefined;

  // ----- تحديد ما إذا كان Select معطلاً -----
  const isDisabled = disabled || loading || !!error || safeBranches.length === 0;

  return (
    <div className={cn("w-full", className)}>
      <Select
        value={selectValue}
        onValueChange={handleValueChange}
        disabled={isDisabled}
        onOpenChange={onOpenChange}
      >
        <SelectTrigger
          className={cn(
            "w-full h-14 rounded-2xl border-primary bg-background font-black text-base px-6",
            "flex items-center gap-2",
            (loading || error || safeBranches.length === 0) && "opacity-70"
          )}
        >
          <SelectValue>{displayValue}</SelectValue>
          {loading && <Loader2 className="h-4 w-4 animate-spin shrink-0 ml-auto" />}
        </SelectTrigger>

        <SelectContent position="popper" sideOffset={4}>
          {loading ? (
            <div className="px-3 py-2 text-sm text-muted-foreground text-center">
              {loadingMessage ?? defaultText.loading}
            </div>
          ) : error ? (
            <div className="px-3 py-2 text-sm text-rose-500 text-center">
              {errorMessage ?? defaultText.error}
            </div>
          ) : safeBranches.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground text-center">
              {emptyMessage ?? defaultText.empty}
            </div>
          ) : (
            branchOptions.map((option) => (
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