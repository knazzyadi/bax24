"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
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

  useEffect(() => {
    fetch("/api/branches")
      .then((res) => res.json())
      .then((data) => setBranches(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getSelectedBranchName = () => {
    if (!value) return isRtl ? "اختر الفرع" : "Select branch";
    const branch = branches.find(b => b.id === value);
    if (!branch) return isRtl ? "اختر الفرع" : "Select branch";
    return isRtl ? branch.name : (branch.nameEn || branch.name);
  };

  if (loading) {
    return (
      <Select value={value} onValueChange={onValueChange} disabled>
        <SelectTrigger className="h-14 rounded-2xl border-primary bg-background font-black text-base px-6">
          <span>{isRtl ? "جاري التحميل..." : "Loading..."}</span>
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="h-14 rounded-2xl border-primary bg-background font-black text-base px-6">
        <span className="truncate">{getSelectedBranchName()}</span>
      </SelectTrigger>
      <SelectContent>
        {branches.map((branch) => (
          <SelectItem key={branch.id} value={branch.id}>
            {isRtl ? branch.name : (branch.nameEn || branch.name)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}