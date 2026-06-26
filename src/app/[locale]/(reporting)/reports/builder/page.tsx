// src/app/[locale]/(reporting)/reports/builder/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowLeft, Save, Eye, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// تعريف النماذج المتاحة والأعمدة الخاصة بكل نموذج
const MODELS: Record<
  string,
  { label: string; columns: { key: string; label: string }[] }
> = {
  assets: {
    label: "الأصول",
    columns: [
      { key: "code", label: "الكود" },
      { key: "name", label: "الاسم" },
      { key: "type", label: "النوع" },
      { key: "status", label: "الحالة" },
      { key: "location", label: "الموقع" },
      { key: "purchaseDate", label: "تاريخ الشراء" },
      { key: "warrantyEnd", label: "نهاية الضمان" },
      { key: "lastMaintenanceDate", label: "تاريخ آخر صيانة" },
    ],
  },
  workOrders: {
    label: "أوامر العمل",
    columns: [
      { key: "code", label: "الكود" },
      { key: "title", label: "العنوان" },
      { key: "priority", label: "الأولوية" },
      { key: "status", label: "الحالة" },
      { key: "assetType", label: "نوع الأصل" },
      { key: "createdAt", label: "تاريخ الإنشاء" },
    ],
  },
  tickets: {
    label: "التذاكر",
    columns: [
      { key: "code", label: "الكود" },
      { key: "title", label: "العنوان" },
      { key: "status", label: "الحالة" },
      { key: "type", label: "النوع" },
      { key: "reporterName", label: "اسم المبلّغ" },
      { key: "createdAt", label: "تاريخ الإنشاء" },
    ],
  },
  inventory: {
    label: "المخزون",
    columns: [
      { key: "sku", label: "الرقم التسلسلي" },
      { key: "name", label: "الاسم" },
      { key: "quantity", label: "الكمية" },
      { key: "unit", label: "الوحدة" },
      { key: "location", label: "الموقع" },
    ],
  },
};

export default function ReportBuilderPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // حالة النموذج
  const [modelType, setModelType] = useState<string>("assets");
  const [reportName, setReportName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  // عند تغيير النموذج، نختار كل الأعمدة افتراضياً
  useEffect(() => {
    const cols = MODELS[modelType]?.columns.map((c) => c.key) || [];
    setSelectedColumns(cols);
  }, [modelType]);

  const toggleColumn = (key: string) => {
    setSelectedColumns((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );
  };

  const handleSave = async () => {
    if (!reportName.trim()) {
      toast.error("يرجى إدخال اسم للتقرير");
      return;
    }
    if (selectedColumns.length === 0) {
      toast.error("يرجى اختيار عمود واحد على الأقل");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/reports/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: reportName,
          description: description || null,
          modelType,
          columns: selectedColumns,
          filters: null,
          sortBy: null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "فشل الحفظ");
      }

      toast.success("✅ تم حفظ التقرير بنجاح");
      router.push("/reports");
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    // معاينة بسيطة: نفتح صفحة التقارير مع بارامترات
    const params = new URLSearchParams({
      model: modelType,
      columns: selectedColumns.join(","),
    });
    router.push(`/reports/preview?${params.toString()}`);
  };

  const model = MODELS[modelType];

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/reports")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">منشئ تقرير مخصص</h1>
            <p className="text-sm text-muted-foreground">
              اختر البيانات والأعمدة التي تريد تضمينها في التقرير
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreview} disabled={loading}>
            <Eye className="h-4 w-4 ml-2" />
            معاينة
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 ml-2" />
                حفظ التقرير
              </>
            )}
          </Button>
        </div>
      </div>

      {/* معلومات التقرير */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">معلومات التقرير</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">اسم التقرير *</Label>
            <Input
              id="name"
              placeholder="مثال: تقرير الأصول النشطة"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="description">وصف (اختياري)</Label>
            <Input
              id="description"
              placeholder="وصف مختصر للتقرير"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* اختيار النموذج */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">مصدر البيانات</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={modelType} onValueChange={setModelType}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="اختر نوع البيانات" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(MODELS).map(([key, val]) => (
                <SelectItem key={key} value={key}>
                  {val.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-2">
            النموذج المختار: <strong>{model?.label}</strong>
          </p>
        </CardContent>
      </Card>

      {/* اختيار الأعمدة */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">اختر الأعمدة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {model?.columns.map((col) => (
              <label
                key={col.key}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all",
                  selectedColumns.includes(col.key)
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                )}
              >
                <Checkbox
                  checked={selectedColumns.includes(col.key)}
                  onCheckedChange={() => toggleColumn(col.key)}
                />
                <span className="text-sm">{col.label}</span>
              </label>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setSelectedColumns(model?.columns.map((c) => c.key) || [])
              }
            >
              تحديد الكل
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedColumns([])}
            >
              إلغاء الكل
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ملخص */}
      <Card className="bg-muted/30">
        <CardContent className="p-4 text-sm text-muted-foreground">
          <p>
            <strong>{selectedColumns.length}</strong> عمود مختار من{" "}
            <strong>{model?.columns.length || 0}</strong>
          </p>
          <p>
            نوع البيانات: <strong>{model?.label}</strong>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}