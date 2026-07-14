// src/components/audit/AuditLogCard.tsx
"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
  Tag,
  Hash,
  Package,
  Building2,
  MapPin,
  Info,
  Wrench,
  Truck,
  Factory,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

// واجهة البيانات التي تأتي من الـ Audit Log
interface AuditLogEntry {
  id: string;
  action: string;
  userEmail: string;
  createdAt: string;
  oldData: Record<string, any>;
  newData: Record<string, any>;
  changes: Record<string, { old: any; new: any }>;
}

interface AuditLogCardProps {
  entry: AuditLogEntry;
  isExpanded?: boolean;
}

// دالة مساعدة لعرض القيمة بشكل منسق
const formatValue = (value: any): string => {
  if (value === undefined || value === null || value === "") return "—";
  return String(value);
};

// دالة لتحديد لون أيقونة العملية
const getActionColor = (action: string) => {
  const colors: Record<string, string> = {
    CREATE: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800",
    UPDATE: "text-blue-500 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
    DELETE: "text-rose-500 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800",
    STATUS_CHANGE: "text-amber-500 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
    LOCATION_CHANGE: "text-purple-500 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800",
    SERIAL_CHANGE: "text-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800",
  };
  return colors[action] || "text-slate-500 bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700";
};

// دالة لترجمة نوع العملية
const translateAction = (action: string): string => {
  const translations: Record<string, string> = {
    CREATE: "إنشاء",
    UPDATE: "تحديث",
    DELETE: "حذف",
    STATUS_CHANGE: "تغيير الحالة",
    LOCATION_CHANGE: "تغيير الموقع",
    SERIAL_CHANGE: "تغيير الرقم التسلسلي",
  };
  return translations[action] || action;
};

// مجموعة الحقول مع أيقوناتها وتصنيفاتها
const fieldConfig: Record<
  string,
  { icon: React.ReactNode; label: string; group: string }
> = {
  name: { icon: <Tag className="h-4 w-4" />, label: "الاسم", group: "basic" },
  nameEn: { icon: <Tag className="h-4 w-4" />, label: "الاسم بالإنجليزية", group: "basic" },
  code: { icon: <Hash className="h-4 w-4" />, label: "الكود", group: "basic" },
  description: { icon: <FileText className="h-4 w-4" />, label: "الوصف", group: "basic" },
  typeName: { icon: <Package className="h-4 w-4" />, label: "النوع", group: "classification" },
  typeNameEn: { icon: <Package className="h-4 w-4" />, label: "النوع (إنجليزي)", group: "classification" },
  statusName: { icon: <Wrench className="h-4 w-4" />, label: "الحالة", group: "classification" },
  statusNameEn: { icon: <Wrench className="h-4 w-4" />, label: "الحالة (إنجليزي)", group: "classification" },
  statusColor: { icon: <Wrench className="h-4 w-4" />, label: "لون الحالة", group: "classification" },
  roomName: { icon: <MapPin className="h-4 w-4" />, label: "الغرفة", group: "location" },
  roomNameEn: { icon: <MapPin className="h-4 w-4" />, label: "الغرفة (إنجليزي)", group: "location" },
  roomCode: { icon: <MapPin className="h-4 w-4" />, label: "كود الغرفة", group: "location" },
  serialNumber: { icon: <Hash className="h-4 w-4" />, label: "الرقم التسلسلي", group: "details" },
  manufacturer: { icon: <Factory className="h-4 w-4" />, label: "الشركة المصنعة", group: "details" },
  model: { icon: <Package className="h-4 w-4" />, label: "الموديل", group: "details" },
  supplier: { icon: <Truck className="h-4 w-4" />, label: "المورد", group: "details" },
  notes: { icon: <Info className="h-4 w-4" />, label: "ملاحظات", group: "details" },
  purchaseDate: { icon: <Calendar className="h-4 w-4" />, label: "تاريخ الشراء", group: "dates" },
  operationDate: { icon: <Calendar className="h-4 w-4" />, label: "تاريخ التشغيل", group: "dates" },
  warrantyEnd: { icon: <Calendar className="h-4 w-4" />, label: "انتهاء الضمان", group: "dates" },
  lastMaintenanceDate: { icon: <Calendar className="h-4 w-4" />, label: "آخر صيانة", group: "dates" },
};

// ترتيب المجموعات للعرض
const groupOrder = ["basic", "classification", "location", "details", "dates"];
const groupLabels: Record<string, string> = {
  basic: "المعلومات الأساسية",
  classification: "التصنيف",
  location: "الموقع",
  details: "التفاصيل الإضافية",
  dates: "التواريخ",
};

export function AuditLogCard({ entry, isExpanded = false }: AuditLogCardProps) {
  const [expanded, setExpanded] = useState(isExpanded);

  const { action, userEmail, createdAt, changes } = entry;

  // تصفية الحقول التي لها تغييرات فعلية
  const changedFields = Object.keys(changes).filter((key) => {
    const change = changes[key];
    const oldVal = formatValue(change.old);
    const newVal = formatValue(change.new);
    return oldVal !== newVal && !(oldVal === "—" && newVal === "—");
  });

  // تجميع الحقول حسب المجموعة
  const groupedFields: Record<string, string[]> = {};
  for (const field of changedFields) {
    const config = fieldConfig[field];
    if (config) {
      const group = config.group;
      if (!groupedFields[group]) groupedFields[group] = [];
      groupedFields[group].push(field);
    }
  }

  return (
    <div
      className={cn(
        "rounded-xl border transition-all duration-200",
        getActionColor(action),
        "hover:shadow-md"
      )}
    >
      {/* رأس البطاقة */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">
              {translateAction(action)}
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <User className="h-3 w-3" />
              {userEmail}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(createdAt).toLocaleDateString("ar-SA", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {changedFields.length} تغيير
            {changedFields.length !== 1 ? "ات" : ""}
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </div>

      {/* المحتوى الموسع */}
      {expanded && (
        <div className="border-t border-border/50 p-4 space-y-4">
          {groupOrder.map((group) => {
            const fields = groupedFields[group] || [];
            if (fields.length === 0) return null;

            return (
              <div key={group}>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {groupLabels[group]}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {fields.map((field) => {
                    const config = fieldConfig[field];
                    const change = changes[field];
                    const oldVal = formatValue(change.old);
                    const newVal = formatValue(change.new);

                    return (
                      <div
                        key={field}
                        className="flex items-center justify-between p-2 rounded-lg bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50"
                      >
                        <div className="flex items-center gap-2 text-sm">
                          {config?.icon}
                          <span className="text-muted-foreground">
                            {config?.label || field}:
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-medium">
                          {oldVal !== "—" ? (
                            <span className="text-rose-500 line-through">
                              {oldVal}
                            </span>
                          ) : (
                            <span className="text-rose-500">—</span>
                          )}
                          <span className="text-muted-foreground">→</span>
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {newVal}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {changedFields.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-4">
              لا توجد تغييرات ملحوظة في هذا السجل
            </div>
          )}
        </div>
      )}
    </div>
  );
}