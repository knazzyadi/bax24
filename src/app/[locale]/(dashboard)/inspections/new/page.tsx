// src/app/[locale]/(dashboard)/inspections/new/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { AdminGuard } from "@/lib/client-guard";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ClipboardCheck,
  Calendar,
  FileText,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Plus,
  X,
  Building,
} from "lucide-react";

// ============================================================
// 1. الأنواع
// ============================================================
interface Section {
  id: string;
  name: string;
  nameAr: string;
}

interface Template {
  id: string;
  name: string;
  nameAr: string;
  sectionId: string;
}

interface Category {
  id: string;
  name: string;
  nameAr: string;
  templateId: string;
  _count?: { items: number };
}

// ✅ تم تعديل Branch ليشمل nameAr و nameEn اختياريين
interface Branch {
  id: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
}

// مجموعة واحدة (صف)
interface RowData {
  id: string;
  sectionId: string;
  templateId: string;
  categoryId: string;
}

// ============================================================
// 2. المكون الرئيسي
// ============================================================
export default function NewInspectionPage() {
  const router = useRouter();
  const locale = useLocale();
  const isRtl = locale === "ar";

  // ============================================================
  // 2.1 State
  // ============================================================
  const [sections, setSections] = useState<Section[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // حقول الفحص الأساسية
  const [inspectionTitle, setInspectionTitle] = useState("");
  const [scheduledDate, setScheduledDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [branchId, setBranchId] = useState("");

  // الصفوف الديناميكية
  const [rows, setRows] = useState<RowData[]>([
    { id: crypto.randomUUID(), sectionId: "", templateId: "", categoryId: "" },
  ]);

  // ============================================================
  // 2.2 جلب جميع البيانات مسبقاً
  // ============================================================
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [sectionsRes, templatesRes, categoriesRes, branchesRes] =
          await Promise.all([
            fetch("/api/inspection-sections?active=true"),
            fetch("/api/inspection-templates?active=true"),
            fetch("/api/inspection-categories?active=true"),
            fetch("/api/branches?active=true"),
          ]);

        if (!sectionsRes.ok || !templatesRes.ok || !categoriesRes.ok || !branchesRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const sectionsData = await sectionsRes.json();
        const templatesData = await templatesRes.json();
        const categoriesData = await categoriesRes.json();
        const branchesData = await branchesRes.json();

        // جلب عدد البنود لكل فئة (اختياري)
        const categoriesWithCount = await Promise.all(
          categoriesData.map(async (cat: Category) => {
            const itemsRes = await fetch(`/api/inspection-items?categoryId=${cat.id}`);
            const items = itemsRes.ok ? await itemsRes.json() : [];
            return { ...cat, _count: { items: items.length } };
          })
        );

        setSections(sectionsData);
        setTemplates(templatesData);
        setCategories(categoriesWithCount);
        setBranches(branchesData);

        // تحديد الفرع الافتراضي إن وجد
        if (branchesData.length > 0) {
          setBranchId(branchesData[0].id);
        }
      } catch {
        toast.error(isRtl ? "فشل في تحميل البيانات" : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [isRtl]);

  // ============================================================
  // 2.3 دوال مساعدة
  // ============================================================
  const getLocalizedName = useCallback(
    (item: { name: string; nameAr?: string }) => {
      if (isRtl && item.nameAr) return item.nameAr;
      return item.name;
    },
    [isRtl]
  );

  // الحصول على النماذج المتاحة لقسم معين
  const getTemplatesForSection = useCallback(
    (sectionId: string) => {
      return templates.filter((t) => t.sectionId === sectionId);
    },
    [templates]
  );

  // الحصول على الفئات المتاحة لنموذج معين
  const getCategoriesForTemplate = useCallback(
    (templateId: string) => {
      return categories.filter((c) => c.templateId === templateId);
    },
    [categories]
  );

  // ============================================================
  // 2.4 دوال إدارة الصفوف
  // ============================================================
  const addRow = () => {
    setRows([
      ...rows,
      { id: crypto.randomUUID(), sectionId: "", templateId: "", categoryId: "" },
    ]);
  };

  const removeRow = (id: string) => {
    if (rows.length === 1) {
      toast.warning(isRtl ? "يجب أن يبقى صف واحد على الأقل" : "At least one row is required");
      return;
    }
    setRows(rows.filter((row) => row.id !== id));
  };

  const updateRow = (id: string, field: keyof RowData, value: string) => {
    setRows(
      rows.map((row) => {
        if (row.id === id) {
          if (field === "sectionId") {
            return { ...row, sectionId: value, templateId: "", categoryId: "" };
          }
          if (field === "templateId") {
            return { ...row, templateId: value, categoryId: "" };
          }
          return { ...row, [field]: value };
        }
        return row;
      })
    );
  };

  // ============================================================
  // 2.5 بناء خيارات القوائم
  // ============================================================
  const getSectionOptions = useMemo(() => {
    return sections.map((s) => ({
      value: s.id,
      label: getLocalizedName(s),
    }));
  }, [sections, getLocalizedName]);

  const getBranchOptions = useMemo(() => {
    return branches.map((b) => ({
      value: b.id,
      label: getLocalizedName(b), // ✅ الآن يعمل لأن Branch يحتوي nameAr اختياري
    }));
  }, [branches, getLocalizedName]);

  // ============================================================
  // 2.6 التحقق من اكتمال البيانات
  // ============================================================
  const isFormValid = useMemo(() => {
    if (!inspectionTitle.trim()) return false;
    if (!branchId) return false;
    return rows.every(
      (row) => row.sectionId && row.templateId && row.categoryId
    );
  }, [inspectionTitle, branchId, rows]);

  // ============================================================
  // 2.7 ملخص الاختيارات
  // ============================================================
  const summary = useMemo(() => {
    const selectedRows = rows.map((row) => {
      const section = sections.find((s) => s.id === row.sectionId);
      const template = templates.find((t) => t.id === row.templateId);
      const category = categories.find((c) => c.id === row.categoryId);
      return {
        sectionName: section ? getLocalizedName(section) : null,
        templateName: template ? getLocalizedName(template) : null,
        categoryName: category ? getLocalizedName(category) : null,
        itemsCount: category?._count?.items || 0,
      };
    });

    const totalItems = selectedRows.reduce((sum, r) => sum + r.itemsCount, 0);

    return { selectedRows, totalItems };
  }, [rows, sections, templates, categories, getLocalizedName]);

  // ============================================================
  // 2.8 الإرسال
  // ============================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      toast.error(
        isRtl
          ? "يرجى ملء جميع الحقول في كل صف واختيار الفرع"
          : "Please fill all fields in each row and select a branch"
      );
      return;
    }

    const payload = {
      title: inspectionTitle.trim(),
      scheduledDate,
      branchId,
      items: rows.map((row) => ({
        sectionId: row.sectionId,
        templateId: row.templateId,
        categoryId: row.categoryId,
      })),
    };

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "فشل في إنشاء الفحص");
      }

      toast.success(isRtl ? "✅ تم إنشاء الفحص بنجاح" : "✅ Inspection created successfully");
      router.push(`/${locale}/inspections`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : isRtl
            ? "حدث خطأ غير معروف"
            : "Unknown error occurred";

      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================
  // 2.9 العرض
  // ============================================================
  if (loading) {
    return (
      <AdminGuard>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <div className="container max-w-4xl py-8 mx-auto">
        <Card className="border-0 shadow-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl overflow-hidden">
          {/* رأس الصفحة */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-500/5 dark:via-purple-500/5 dark:to-pink-500/5" />
            <CardHeader className="relative">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 dark:from-indigo-500/30 dark:to-purple-500/30 border border-indigo-200/30 dark:border-indigo-800/30 shadow-lg shadow-indigo-500/10">
                  <ClipboardCheck className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    {isRtl ? "فحص جديد" : "New Inspection"}
                  </CardTitle>
                  <CardDescription className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                    {isRtl
                      ? "أضف مجموعات من القسم والنموذج والفئة"
                      : "Add groups of section, template, and category"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </div>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-8 pt-6">
              {/* الحقول الأساسية: العنوان والتاريخ والفرع */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-500" />
                    {isRtl ? "عنوان الفحص" : "Inspection Title"} *
                  </Label>
                  <Input
                    id="title"
                    placeholder={isRtl ? "أدخل عنوان الفحص..." : "Enter inspection title..."}
                    value={inspectionTitle}
                    onChange={(e) => setInspectionTitle(e.target.value)}
                    className="bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 h-12 text-base"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date" className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-indigo-500" />
                    {isRtl ? "تاريخ الفحص" : "Inspection Date"}
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 h-12 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branch" className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                    <Building className="h-4 w-4 text-indigo-500" />
                    {isRtl ? "الفرع" : "Branch"} *
                  </Label>
                  <Select value={branchId} onValueChange={setBranchId}>
                    <SelectTrigger className="bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 h-12">
                      <SelectValue placeholder={isRtl ? "اختر الفرع" : "Select branch"} />
                    </SelectTrigger>
                    <SelectContent>
                      {getBranchOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-white/90 dark:bg-slate-900/90 text-sm text-slate-500 dark:text-slate-400">
                    {isRtl ? "المجموعات" : "Groups"}
                  </span>
                </div>
              </div>

              {/* الصفوف الديناميكية */}
              <div className="space-y-6">
                {rows.map((row, index) => {
                  const templateOptions = row.sectionId
                    ? getTemplatesForSection(row.sectionId).map((t) => ({
                        value: t.id,
                        label: getLocalizedName(t),
                      }))
                    : [];

                  const categoryOptions = row.templateId
                    ? getCategoriesForTemplate(row.templateId).map((c) => ({
                        value: c.id,
                        label: `${getLocalizedName(c)} (${c._count?.items || 0})`,
                      }))
                    : [];

                  return (
                    <div
                      key={row.id}
                      className="relative p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs">
                            {index + 1}
                          </span>
                          {isRtl ? `المجموعة ${index + 1}` : `Group ${index + 1}`}
                        </h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRow(row.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                          disabled={rows.length === 1}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            {isRtl ? "القسم" : "Section"}
                          </Label>
                          <Select
                            value={row.sectionId}
                            onValueChange={(value) =>
                              updateRow(row.id, "sectionId", value)
                            }
                          >
                            <SelectTrigger className="bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 h-10">
                              <SelectValue placeholder={isRtl ? "اختر" : "Select"} />
                            </SelectTrigger>
                            <SelectContent>
                              {getSectionOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            {isRtl ? "النموذج" : "Template"}
                          </Label>
                          <Select
                            value={row.templateId}
                            onValueChange={(value) =>
                              updateRow(row.id, "templateId", value)
                            }
                            disabled={!row.sectionId}
                          >
                            <SelectTrigger className="bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 h-10">
                              <SelectValue
                                placeholder={
                                  !row.sectionId
                                    ? isRtl
                                      ? "اختر القسم أولاً"
                                      : "Select section first"
                                    : isRtl
                                    ? "اختر"
                                    : "Select"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {templateOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            {isRtl ? "الفئة" : "Category"}
                          </Label>
                          <Select
                            value={row.categoryId}
                            onValueChange={(value) =>
                              updateRow(row.id, "categoryId", value)
                            }
                            disabled={!row.templateId}
                          >
                            <SelectTrigger className="bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 h-10">
                              <SelectValue
                                placeholder={
                                  !row.templateId
                                    ? isRtl
                                      ? "اختر النموذج أولاً"
                                      : "Select template first"
                                    : isRtl
                                    ? "اختر"
                                    : "Select"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {categoryOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addRow}
                  className="w-full border-dashed border-2 h-12 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  {isRtl ? "إضافة مجموعة أخرى" : "Add another group"}
                </Button>
              </div>

              {/* ملخص الاختيارات */}
              {summary.selectedRows.some(
                (row) => row.sectionName && row.templateName && row.categoryName
              ) && (
                <div className="rounded-2xl bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-200/30 dark:border-indigo-800/30 p-5">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-500" />
                    {isRtl ? "ملخص المجموعات" : "Groups Summary"}
                  </h4>
                  <div className="space-y-2">
                    {summary.selectedRows.map(
                      (row, idx) =>
                        row.sectionName &&
                        row.templateName &&
                        row.categoryName && (
                          <div
                            key={idx}
                            className="flex flex-wrap items-center gap-2 text-sm"
                          >
                            <Badge variant="outline" className="border-indigo-200 dark:border-indigo-800">
                              {row.sectionName}
                            </Badge>
                            <ArrowRight className="h-3 w-3 text-slate-400" />
                            <Badge variant="outline" className="border-indigo-200 dark:border-indigo-800">
                              {row.templateName}
                            </Badge>
                            <ArrowRight className="h-3 w-3 text-slate-400" />
                            <Badge variant="outline" className="border-indigo-200 dark:border-indigo-800">
                              {row.categoryName}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {row.itemsCount} {isRtl ? "بند" : "items"}
                            </Badge>
                          </div>
                        )
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <Badge variant="secondary" className="text-sm">
                      {isRtl
                        ? `إجمالي البنود: ${summary.totalItems}`
                        : `Total items: ${summary.totalItems}`}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex justify-between items-center border-t border-slate-200 dark:border-slate-700 pt-6 pb-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push(`/${locale}/inspections`)}
                className="rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              >
                {isRtl ? "↩️ إلغاء" : "↩️ Cancel"}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !isFormValid}
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium px-8 h-12 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                    {isRtl ? "جاري الإنشاء..." : "Creating..."}
                  </>
                ) : (
                  <>
                    {isRtl ? "إنشاء الفحص" : "Create Inspection"}
                    <ArrowRight className="h-4 w-4 mr-2" />
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AdminGuard>
  );
}