// src/components/reports/ReportsFiltersAdvanced.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export function ReportsFiltersAdvanced() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get("status") || "";
  const currentCategory = searchParams.get("category") || "";
  const currentSearch = searchParams.get("search") || "";
  const currentFrom = searchParams.get("from") || "";
  const currentTo = searchParams.get("to") || "";

  const [date, setDate] = useState<DateRange | undefined>({
    from: currentFrom ? new Date(currentFrom) : undefined,
    to: currentTo ? new Date(currentTo) : undefined,
  });
  const [searchTerm, setSearchTerm] = useState(currentSearch);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value.trim() !== "") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`/reports?${params.toString()}`, { scroll: false });
  };

  const applyDateRange = () => {
    if (date?.from) {
      updateFilter("from", date.from.toISOString().split("T")[0]);
    } else {
      updateFilter("from", "");
    }
    if (date?.to) {
      updateFilter("to", date.to.toISOString().split("T")[0]);
    } else {
      updateFilter("to", "");
    }
  };

  const handleSearch = () => {
    updateFilter("search", searchTerm);
  };

  const resetFilters = () => {
    setDate(undefined);
    setSearchTerm("");
    router.push("/reports", { scroll: false });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-card rounded-lg border shadow-sm">
      {/* بحث */}
      <div className="flex-1 min-w-[180px] flex gap-2">
        <Input
          placeholder="بحث في التقارير..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="w-full"
        />
        <Button variant="outline" size="icon" onClick={handleSearch}>
          <Search className="h-4 w-4" />
        </Button>
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
                !date?.from && !date?.to && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="ml-2 h-4 w-4" />
              {date?.from ? (
                date?.to ? (
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
            <div className="p-2 border-t flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setDate(undefined)}>
                إلغاء
              </Button>
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