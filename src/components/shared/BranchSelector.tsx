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
  placeholder?: string;
  emptyMessage?: string;
  loadingMessage?: string;
  errorMessage?: string;
  onOpenChange?: (open: boolean) => void;
}

export function BranchSelector({
  value,
  onValueChange,
  disabled = false,
  className = "",
  placeholder,
  emptyMessage,
  loadingMessage,
  errorMessage,
  onOpenChange,
}: BranchSelectorProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  // ----- رسائل افتراضية (مع useMemo لتجنب إعادة الإنشاء) -----
  const defaultText = useMemo(
    () => ({
      placeholder: isRtl ? "اختر الفرع" : "Select Branch",
      empty: isRtl ? "لا توجد فروع متاحة" : "No branches available",
      loading: isRtl ? "جاري التحميل..." : "Loading...",
      error: isRtl ? "حدث خطأ في تحميل الفروع" : "Failed to load branches",
    }),
    [isRtl]
  );

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ----- جلب الفروع مع AbortController (وتفادي تحديث الحالة بعد الإلغاء) -----
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    fetch("/api/branches", { signal })
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
          if (Array.isArray(data)) {
            setBranches(data);
          } else {
            console.warn("Branch API returned non‑array data:", data);
            setBranches([]);
          }
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
  }, [defaultText.error]); // ✅ يعتمد على قيمة ثابتة (string) لا تتغير إلا بتغير اللغة

  // ----- دالة عرض الاسم مع الكود (useCallback لتثبيت المرجع) -----
  const getDisplayName = useCallback(
    (branch: Branch) => {
      const name = isRtl ? branch.name : branch.nameEn || branch.name;
      return branch.code ? `${branch.code} • ${name}` : name;
    },
    [isRtl]
  );

  // ----- الخيارات المعروضة في القائمة (useMemo مع التبعيات الصحيحة) -----
  const branchOptions = useMemo(
    () =>
      branches.map((branch) => ({
        id: branch.id,
        label: getDisplayName(branch),
      })),
    [branches, getDisplayName]
  );

  // ----- العنصر المختار (useMemo للتناسق) -----
  const selectedBranch = useMemo(
    () => branches.find((b) => b.id === value),
    [branches, value]
  );

  const displayValue = selectedBranch ? getDisplayName(selectedBranch) : undefined;

  // ----- نص الـ placeholder حسب الحالة -----
  const getPlaceholderText = () => {
    if (loading) return loadingMessage ?? defaultText.loading;
    if (error) return errorMessage ?? defaultText.error;
    if (branches.length === 0) return emptyMessage ?? defaultText.empty;
    return placeholder ?? defaultText.placeholder;
  };

  // ----- عنصر Select الموحد -----
  return (
    <div className={cn("w-full", className)}>
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={disabled || loading || !!error || branches.length === 0}
        onOpenChange={onOpenChange}
      >
        <SelectTrigger
          className={cn(
            "w-full h-14 rounded-2xl border-primary bg-background font-black text-base px-6",
            "flex items-center gap-2",
            (loading || error || branches.length === 0) && "opacity-70"
          )}
        >
          <SelectValue placeholder={getPlaceholderText()}>
            {displayValue}
          </SelectValue>
          {loading && <Loader2 className="h-4 w-4 animate-spin shrink-0 ml-auto" />}
        </SelectTrigger>

        <SelectContent position="popper" sideOffset={4}>
          {branchOptions.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.label}
            </SelectItem>
          ))}
          {!loading && branches.length === 0 && (
            <div className="px-3 py-2 text-sm text-muted-foreground text-center">
              {emptyMessage ?? defaultText.empty}
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}