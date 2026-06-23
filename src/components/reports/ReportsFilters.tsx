// components/reports/ReportsFilters.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export function ReportsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // قراءة القيم الحالية من الرابط
  const currentStatus = searchParams.get("status") || "";
  const currentCategory = searchParams.get("category") || "";
  const currentSearch = searchParams.get("search") || "";
  const currentFrom = searchParams.get("from") || "";
  const currentTo = searchParams.get("to") || "";

  const [date, setDate] = useState<{ from?: Date; to?: Date }>({
    from: currentFrom ? new Date(currentFrom) : undefined,
    to: currentTo ? new Date(currentTo) : undefined,
  });

  // دالة لتحديث الفلتر في الرابط
  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value.trim() !== "") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // إعادة تعيين الصفحة إلى 1 عند تغيير الفلاتر
    params.set("page", "1");
    router.push(`/reports?${params.toString()}`, { scroll: false });
  };

  // تطبيق تاريخ
  const applyDateRange = () => {
    if (date.from) {
      updateFilter("from", date.from.toISOString().split("T")[0]);
    } else {
      updateFilter("from", "");
    }
    if (date.to) {
      updateFilter("to", date.to.toISOString().split("T")[0]);
    } else {
      updateFilter("to", "");
    }
  };

  // إعادة ضبط جميع الفلاتر
  const resetFilters = () => {
    setDate({ from: undefined, to: undefined });
    router.push("/reports", { scroll: false });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-card rounded-lg border shadow-sm">
      {/* بحث */}
      <div className="flex-1 min-w-[180px]">
        <Input
          placeholder="بحث في التقارير..."
          value={currentSearch}
          onChange={(e) => updateFilter("search", e.target.value)}
          className="w-full"
        />
      </div>

      {/* فلتر الحالة */}
      <div className="w-[150px]">
        <Select
          value={currentStatus}
          onValueChange={(val) => updateFilter("status", val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">الكل</SelectItem>
            <SelectItem value="completed">مكتمل</SelectItem>
            <SelectItem value="pending">معلق</SelectItem>
            <SelectItem value="in-progress">قيد التنفيذ</SelectItem>
            <SelectItem value="cancelled">ملغي</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* فلتر التصنيف */}
      <div className="w-[150px]">
        <Select
          value={currentCategory}
          onValueChange={(val) => updateFilter("category", val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="التصنيف" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">الكل</SelectItem>
            <SelectItem value="maintenance">صيانة</SelectItem>
            <SelectItem value="inventory">مخزون</SelectItem>
            <SelectItem value="vehicles">مركبات</SelectItem>
            <SelectItem value="incidents">حوادث</SelectItem>
            <SelectItem value="sales">مبيعات</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* اختيار نطاق التاريخ */}
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal w-[220px]",
                !date.from && !date.to && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="ml-2 h-4 w-4" />
              {date.from ? (
                date.to ? (
                  <>
                    {format(date.from, "dd/MM/yyyy", { locale: ar })} -{" "}
                    {format(date.to, "dd/MM/yyyy", { locale: ar })}
                  </>
                ) : (
                  format(date.from, "dd/MM/yyyy", { locale: ar })
                )
              ) : (
                "اختر النطاق"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={date}
              onSelect={setDate}
              initialFocus
            />
            <div className="p-2 border-t flex justify-end">
              <Button size="sm" onClick={applyDateRange}>
                تطبيق
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* إعادة ضبط */}
      <Button variant="ghost" size="icon" onClick={resetFilters} className="shrink-0">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}