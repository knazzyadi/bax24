// src/app/[locale]/(reporting)/reports/builder/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Save, Eye } from "lucide-react";
import Link from "next/link";

// تعريف أنواع النماذج المتاحة
const MODEL_TYPES = {
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
      { key: "notes", label: "ملاحظات" },
    ],
  },
  workOrders: {
    label: "أوامر العمل",
    columns: [
      { key: "code", label: "الكود" },
      { key: "title", label: "العنوان" },
      { key: "type", label: "النوع" },
      { key: "priority", label: "الأولوية" },
      { key: "status", label: "الحالة" },
      { key: "asset", label: "الأصل" },
      { key: "location", label: "الموقع" },
      { key: "createdAt", label: "تاريخ الإنشاء" },
    ],
  },
  tickets: {
    label: "التذاكر",
    columns: [
      { key: "code", label: "الكود" },
      { key: "title", label: "العنوان" },
      { key: "type", label: "النوع" },
      { key: "status", label: "الحالة" },
      { key: "asset", label: "الأصل" },
      { key: "reporter", label: "المبلغ" },
      { key: "createdAt", label: "تاريخ الإنشاء" },
    ],
  },
  inventory: {
    label: "المخزون",
    columns: [
      { key: "sku", label: "الرمز" },
      { key: "name", label: "الاسم" },
      { key: "quantity", label: "الكمية" },
      { key: "minQuantity", label: "الحد الأدنى" },
      { key: "unit", label: "الوحدة" },
      { key: "location", label: "الموقع" },
      { key: "notes", label: "ملاحظات" },
    ],
  },
  contracts: {
    label: "العقود",
    columns: [
      { key: "code", label: "الكود" },
      { key: "title", label: "العنوان" },
      { key: "supplier", label: "المورد" },
      { key: "value", label: "القيمة" },
      { key: "status", label: "الحالة" },
      { key: "startDate", label: "تاريخ البداية" },
      { key: "endDate", label: "تاريخ النهاية" },
    ],
  },
};

type ModelType = keyof typeof MODEL_TYPES;

export default function ReportBuilderPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const t = useTranslations("Reports");
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // حالة النموذج
  const [modelType, setModelType] = useState<ModelType>("assets");
  const [reportName, setReportName] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  // حالة الفلاتر
  const [filters, setFilters] = useState<{ field: string; operator: string; value: string }[]>([]);

  // تحميل الأعمدة الافتراضية عند تغيير النموذج
  useEffect(() => {
    const defaultColumns = MODEL_TYPES[modelType]?.columns.map((col) => col.key) || [];
    setSelectedColumns(defaultColumns.slice(0, 4)); // اختيار 4 أعمدة افتراضية
  }, [modelType]);

  // تبديل اختيار العمود
  const toggleColumn = (columnKey: string) => {
    setSelectedColumns((prev) =>
      prev.includes(columnKey)
        ? prev.filter((col) => col !== columnKey)
        : [...prev, columnKey]
    );
  };

  // إضافة فلتر جديد
  const addFilter = () => {
    const columns = MODEL_TYPES[modelType]?.columns || [];
    if (columns.length === 0) return;
    setFilters([
      ...filters,
      { field: columns[0].key, operator: "eq", value: "" },
    ]);
  };

  // تحديث قيمة فلتر
  const updateFilter = (index: number, key: string, value: string) => {
    const updated = [...filters];
    updated[index] = { ...updated[index], [key]: value };
    setFilters(updated);
  };

  // حذف فلتر
  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  // معاينة التقرير
  const handlePreview = async () => {
    if (selectedColumns.length === 0) {
      toast.error("يرجى اختيار عمود واحد على الأقل");
      return;
    }

    setPreviewLoading(true);
    try {
      const res = await fetch(
        `/api/reports/preview?modelType=${modelType}&columns=${selectedColumns.join(
          ","
        )}&filters=${JSON.stringify(filters)}`
      );
      const data = await res.json();
      if (res.ok) {
        setPreviewData(data.data || []);
        setShowPreview(true);
        toast.success(`تم العثور على ${data.data?.length || 0} سجل`);
      } else {
        toast.error(data.error || "حدث خطأ");
      }
    } catch (error) {
      toast.error("فشل تحميل المعاينة");
    } finally {
      setPreviewLoading(false);
    }
  };

  // حفظ التقرير
  const handleSave = async () => {
    if (!reportName.trim()) {
      toast.error("يرجى إدخال اسم للتقرير");
      return;
    }
    if (selectedColumns.length === 0) {
      toast.error("يرجى اختيار عمود واحد على الأقل");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/reports/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: reportName,
          description: reportDescription,
          modelType,
          columns: selectedColumns,
          filters: filters.length > 0 ? filters : null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("تم حفظ التقرير بنجاح");
        router.push(`/${session?.user?.companyId}/reports`);
      } else {
        toast.error(data.error || "فشل الحفظ");
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء الحفظ");
    } finally {
      setLoading(false);
    }
  };

  const modelColumns = MODEL_TYPES[modelType]?.columns || [];
  const availableColumns = modelColumns;

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-6">
      {/* رأس الصفحة */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/reports"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            العودة إلى التقارير
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">منشئ التقارير المخصصة</h1>
          <p className="text-muted-foreground mt-1">
            اختر البيانات التي تريدها، وحدد الأعمدة، وأضف الفلاتر لعرض تقريرك المخصص
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* الجانب الأيسر: الإعدادات */}
        <div className="lg:col-span-2 space-y-6">
          {/* معلومات التقرير */}
          <Card>
            <CardHeader>
              <CardTitle>معلومات التقرير</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="reportName">اسم التقرير *</Label>
                <Input
                  id="reportName"
                  placeholder="أدخل اسم التقرير"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="reportDescription">الوصف (اختياري)</Label>
                <Textarea
                  id="reportDescription"
                  placeholder="وصف مختصر للتقرير"
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* اختيار النموذج */}
          <Card>
            <CardHeader>
              <CardTitle>نوع البيانات</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={modelType}
                onValueChange={(val) => setModelType(val as ModelType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع البيانات" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MODEL_TYPES).map(([key, model]) => (
                    <SelectItem key={key} value={key}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* اختيار الأعمدة */}
          <Card>
            <CardHeader>
              <CardTitle>الأعمدة المطلوبة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableColumns.map((col) => (
                  <label
                    key={col.key}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted p-2 rounded-lg transition-colors"
                  >
                    <Checkbox
                      checked={selectedColumns.includes(col.key)}
                      onCheckedChange={() => toggleColumn(col.key)}
                    />
                    {col.label}
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                تم اختيار {selectedColumns.length} من {availableColumns.length} عمود
              </p>
            </CardContent>
          </Card>

          {/* الفلاتر */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>الفلاتر</CardTitle>
                <Button variant="outline" size="sm" onClick={addFilter}>
                  + إضافة فلتر
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {filters.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  لا توجد فلاتر. أضف فلتراً لتضييق النتائج.
                </p>
              )}
              {filters.map((filter, index) => (
                <div key={index} className="flex items-center gap-2 flex-wrap">
                  <Select
                    value={filter.field}
                    onValueChange={(val) => updateFilter(index, "field", val)}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="الحقل" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableColumns.map((col) => (
                        <SelectItem key={col.key} value={col.key}>
                          {col.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filter.operator}
                    onValueChange={(val) => updateFilter(index, "operator", val)}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="العامل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eq">يساوي</SelectItem>
                      <SelectItem value="contains">يحتوي</SelectItem>
                      <SelectItem value="gt">أكبر من</SelectItem>
                      <SelectItem value="lt">أقل من</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="القيمة"
                    value={filter.value}
                    onChange={(e) => updateFilter(index, "value", e.target.value)}
                    className="w-[120px]"
                  />

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFilter(index)}
                    className="text-destructive"
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* الجانب الأيمن: الإجراءات */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>الإجراءات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full gap-2"
                onClick={handlePreview}
                disabled={previewLoading || selectedColumns.length === 0}
              >
                {previewLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                معاينة التقرير
              </Button>

              <Button
                className="w-full gap-2"
                variant="default"
                onClick={handleSave}
                disabled={loading || !reportName.trim() || selectedColumns.length === 0}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                حفظ التقرير
              </Button>

              <Button
                className="w-full"
                variant="outline"
                onClick={() => router.push("/reports")}
              >
                إلغاء
              </Button>
            </CardContent>
          </Card>

          {/* ملخص سريع */}
          <Card>
            <CardHeader>
              <CardTitle>ملخص</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>
                <span className="font-medium">نوع البيانات:</span>{" "}
                {MODEL_TYPES[modelType]?.label}
              </p>
              <p>
                <span className="font-medium">الأعمدة:</span>{" "}
                {selectedColumns.length} عمود
              </p>
              <p>
                <span className="font-medium">الفلاتر:</span> {filters.length}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* معاينة النتائج */}
      {showPreview && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>معاينة التقرير</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(false)}
              >
                إخفاء
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {previewData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                لا توجد بيانات مطابقة للفلاتر المحددة
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      {selectedColumns.map((colKey) => {
                        const col = availableColumns.find((c) => c.key === colKey);
                        return (
                          <th
                            key={colKey}
                            className="text-right p-2 font-medium whitespace-nowrap"
                          >
                            {col?.label || colKey}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/20">
                        {selectedColumns.map((colKey) => (
                          <td key={colKey} className="p-2 whitespace-nowrap">
                            {row[colKey] ?? "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewData.length > 10 && (
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    عرض 10 من {previewData.length} سجل
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}