"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
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

export function ReportsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  // حالات محلية
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  useEffect(() => {
    setMounted(true);
    // تحديث الحالات من searchParams بعد التصيير
    setStatus(searchParams.get("status") || "");
    setCategory(searchParams.get("category") || "");
    setSearch(searchParams.get("search") || "");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    setDateRange({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }, [searchParams]);

  // تحديث الفلتر في الرابط
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
    if (dateRange?.from) {
      updateFilter("from", dateRange.from.toISOString().split("T")[0]);
    } else {
      updateFilter("from", "");
    }
    if (dateRange?.to) {
      updateFilter("to", dateRange.to.toISOString().split("T")[0]);
    } else {
      updateFilter("to", "");
    }
  };

  const resetFilters = () => {
    setDateRange(undefined);
    setStatus("");
    setCategory("");
    setSearch("");
    router.push("/reports", { scroll: false });
  };

  // أثناء التصيير الخادمي (أو قبل التحميل) نعرض نسخة خفيفة
  if (!mounted) {
    return (
      <div className="flex flex-wrap items-center gap-3 p-4 bg-card rounded-lg border shadow-sm">
        <div className="flex-1 min-w-[180px]">
          <Input placeholder="بحث في التقارير..." className="w-full" />
        </div>
        <div className="w-[150px]">
          <Select>
            <SelectTrigger><SelectValue placeholder="الحالة" /></SelectTrigger>
          </Select>
        </div>
        <div className="w-[150px]">
          <Select>
            <SelectTrigger><SelectValue placeholder="التصنيف" /></SelectTrigger>
          </Select>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-card rounded-lg border shadow-sm">
      {/* بحث */}
      <div className="flex-1 min-w-[180px]">
        <Input
          placeholder="بحث في التقارير..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            updateFilter("search", e.target.value);
          }}
          className="w-full"
        />
      </div>

      {/* فلتر الحالة */}
      <div className="w-[150px]">
        <Select
          value={status}
          onValueChange={(val) => {
            setStatus(val);
            updateFilter("status", val);
          }}
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
          value={category}
          onValueChange={(val) => {
            setCategory(val);
            updateFilter("category", val);
          }}
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
                !dateRange?.from && !dateRange?.to && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="ml-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange?.to ? (
                  <>
                    {format(dateRange.from, "dd/MM/yyyy", { locale: ar })} -{" "}
                    {format(dateRange.to, "dd/MM/yyyy", { locale: ar })}
                  </>
                ) : (
                  format(dateRange.from, "dd/MM/yyyy", { locale: ar })
                )
              ) : (
                "اختر النطاق"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
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