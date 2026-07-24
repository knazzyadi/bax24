// src/app/[locale]/(dashboard)/settings/inspection-types/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { ClipboardList, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AdminGuard } from "@/lib/client-guard";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

// استيراد المكونات
import { SectionDialog } from "./SectionDialog";
import { TemplateDialog } from "./TemplateDialog";
import { CategoryDialog } from "./CategoryDialog";
import { ItemDialog } from "./ItemDialog";
import { ItemTable } from "./ItemTable";

import type {
  InspectionSection,
  InspectionTemplate,
  InspectionCategory,
  InspectionItem,
} from "./types";

// ✅ تنسيق البطاقة الزجاجي الموحد مع باقي المشروع
const glassCard =
  "bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300";

export default function InspectionTypesPage() {
  const router = useRouter();
  const t = useTranslations("InspectionTypes");
  const locale = useLocale();
  const isRtl = locale === "ar";

  // === المستوى 1: الأقسام ===
  const [sections, setSections] = useState<InspectionSection[]>([]);
  const [loadingSections, setLoadingSections] = useState(true);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  // === المستوى 2: النماذج ===
  const [templatesMap, setTemplatesMap] = useState<Record<string, InspectionTemplate[]>>({});
  const [loadingTemplates, setLoadingTemplates] = useState<Record<string, boolean>>({});

  // === المستوى 3: الفئات ===
  const [categoriesMap, setCategoriesMap] = useState<Record<string, InspectionCategory[]>>({});
  const [loadingCategories, setLoadingCategories] = useState<Record<string, boolean>>({});

  // === المستوى 4: البنود ===
  const [itemsMap, setItemsMap] = useState<Record<string, InspectionItem[]>>({});
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({});

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // === حوارات ===
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<InspectionSection | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<InspectionTemplate | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<InspectionCategory | null>(null);
  const [categoryDialogTemplateId, setCategoryDialogTemplateId] = useState<string | undefined>(undefined);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InspectionItem | null>(null);
  const [itemDialogCategoryId, setItemDialogCategoryId] = useState<string | undefined>(undefined);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    id?: string;
    type?: "section" | "template" | "category" | "item";
  }>({ open: false });
  const [deleting, setDeleting] = useState(false);

  // ============================================================
  // دوال جلب البيانات
  // ============================================================

  const fetchSections = async () => {
    setLoadingSections(true);
    try {
      const res = await fetch("/api/inspection-sections");
      if (!res.ok) throw new Error("Failed to fetch sections");
      const data = await res.json();
      setSections(data);
      for (const section of data) {
        await fetchTemplates(section.id);
      }
      if (data.length > 0 && !selectedSectionId) {
        setSelectedSectionId(data[0].id);
      }
    } catch (error) {
      toast.error(t("fetchError"));
    } finally {
      setLoadingSections(false);
    }
  };

  const fetchTemplates = async (sectionId: string) => {
    setLoadingTemplates((prev) => ({ ...prev, [sectionId]: true }));
    try {
      const res = await fetch(`/api/inspection-templates?sectionId=${sectionId}`);
      if (!res.ok) throw new Error("Failed to fetch templates");
      const data = await res.json();
      setTemplatesMap((prev) => ({ ...prev, [sectionId]: data }));
      for (const template of data) {
        await fetchCategories(template.id);
      }
    } catch (error) {
      toast.error(t("fetchError"));
    } finally {
      setLoadingTemplates((prev) => ({ ...prev, [sectionId]: false }));
    }
  };

  const fetchCategories = async (templateId: string) => {
    setLoadingCategories((prev) => ({ ...prev, [templateId]: true }));
    try {
      const res = await fetch(`/api/inspection-categories?templateId=${templateId}`);
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      setCategoriesMap((prev) => ({ ...prev, [templateId]: data }));
      for (const category of data) {
        await fetchItems(category.id);
      }
    } catch (error) {
      toast.error(t("fetchError"));
    } finally {
      setLoadingCategories((prev) => ({ ...prev, [templateId]: false }));
    }
  };

  const fetchItems = async (categoryId: string) => {
    setLoadingItems((prev) => ({ ...prev, [categoryId]: true }));
    try {
      const res = await fetch(`/api/inspection-items?categoryId=${categoryId}`);
      if (!res.ok) throw new Error("Failed to fetch items");
      const data = await res.json();
      setItemsMap((prev) => ({ ...prev, [categoryId]: data }));
    } catch (error) {
      toast.error(t("fetchError"));
    } finally {
      setLoadingItems((prev) => ({ ...prev, [categoryId]: false }));
    }
  };

  // ============================================================
  // التأثيرات
  // ============================================================

  useEffect(() => {
    fetchSections();
  }, []);

  useEffect(() => {
    if (selectedSectionId) {
      const templates = templatesMap[selectedSectionId] || [];
      setSelectedTemplateId(templates.length > 0 ? templates[0].id : null);
    }
  }, [selectedSectionId, templatesMap]);

  useEffect(() => {
    if (selectedTemplateId) {
      const categories = categoriesMap[selectedTemplateId] || [];
      setSelectedCategoryId(categories.length > 0 ? categories[0].id : null);
    }
  }, [selectedTemplateId, categoriesMap]);

  // ============================================================
  // دوال إغلاق الحوارات مع إعادة التحميل
  // ============================================================

  const handleSectionDialogClose = (refetchData?: boolean) => {
    setSectionDialogOpen(false);
    setEditingSection(null);
    if (refetchData) {
      fetchSections();
      router.refresh();
    }
  };

  const handleTemplateDialogClose = (refetchData?: boolean) => {
    setTemplateDialogOpen(false);
    setEditingTemplate(null);
    if (refetchData && selectedSectionId) {
      fetchTemplates(selectedSectionId);
      router.refresh();
    }
  };

  const handleCategoryDialogClose = (refetchData?: boolean) => {
    setCategoryDialogOpen(false);
    setEditingCategory(null);
    setCategoryDialogTemplateId(undefined);
    if (refetchData && selectedTemplateId) {
      fetchCategories(selectedTemplateId);
      router.refresh();
    }
  };

  const handleItemDialogClose = (refetchData?: boolean) => {
    setItemDialogOpen(false);
    setEditingItem(null);
    setItemDialogCategoryId(undefined);
    if (refetchData && selectedCategoryId) {
      fetchItems(selectedCategoryId);
      router.refresh();
    }
  };

  // ============================================================
  // دوال الإضافة والتعديل والحذف
  // ============================================================

  const handleAddSection = () => {
    setEditingSection(null);
    setSectionDialogOpen(true);
  };

  const handleEditSection = (section: InspectionSection) => {
    setEditingSection(section);
    setSectionDialogOpen(true);
  };

  const handleAddTemplate = () => {
    if (!selectedSectionId) {
      toast.warning(t("selectSectionFirst"));
      return;
    }
    setEditingTemplate(null);
    setTemplateDialogOpen(true);
  };

  const handleEditTemplate = (template: InspectionTemplate) => {
    setEditingTemplate(template);
    setTemplateDialogOpen(true);
  };

  const handleAddCategory = (templateId?: string) => {
    const targetTemplateId = templateId || selectedTemplateId;
    if (!targetTemplateId) {
      toast.warning(t("selectTemplateFirst"));
      return;
    }
    setCategoryDialogTemplateId(targetTemplateId);
    setEditingCategory(null);
    setCategoryDialogOpen(true);
  };

  const handleEditCategory = (category: InspectionCategory) => {
    setEditingCategory(category);
    setCategoryDialogTemplateId(undefined);
    setCategoryDialogOpen(true);
  };

  const handleAddItem = (categoryId?: string) => {
    const targetCategoryId = categoryId || selectedCategoryId;
    if (!targetCategoryId) {
      toast.warning(t("selectCategoryFirst"));
      return;
    }
    setItemDialogCategoryId(targetCategoryId);
    setEditingItem(null);
    setItemDialogOpen(true);
  };

  const handleEditItem = (item: InspectionItem) => {
    setEditingItem(item);
    setItemDialogCategoryId(undefined);
    setItemDialogOpen(true);
  };

  const handleItemReorder = async (newItems: InspectionItem[]) => {
    try {
      const res = await fetch("/api/inspection-items/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: newItems.map((item) => item.id) }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "فشل تحديث ترتيب البنود");
      }
      toast.success(isRtl ? "تم تحديث ترتيب البنود" : "Items reordered successfully");
      if (selectedCategoryId) {
        await fetchItems(selectedCategoryId);
        router.refresh();
      }
    } catch (error: any) {
      toast.error(error.message || (isRtl ? "فشل تحديث الترتيب" : "Failed to reorder"));
    }
  };

  const handleDeleteClick = (id: string, type: "section" | "template" | "category" | "item") => {
    setConfirmDialog({ open: true, id, type });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDialog.id) return;
    setDeleting(true);
    try {
      const endpoints = {
        section: "/api/inspection-sections",
        template: "/api/inspection-templates",
        category: "/api/inspection-categories",
        item: "/api/inspection-items",
      };
      const res = await fetch(`${endpoints[confirmDialog.type!]}/${confirmDialog.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "فشل الحذف");
      }
      toast.success(t("deleteSuccess"));

      if (confirmDialog.type === "section") {
        await fetchSections();
        setSelectedTemplateId(null);
        setSelectedCategoryId(null);
      } else if (confirmDialog.type === "template") {
        if (selectedSectionId) await fetchTemplates(selectedSectionId);
        setSelectedCategoryId(null);
      } else if (confirmDialog.type === "category") {
        if (selectedTemplateId) await fetchCategories(selectedTemplateId);
      } else {
        if (selectedCategoryId) await fetchItems(selectedCategoryId);
      }
      router.refresh();
      setConfirmDialog({ open: false });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  // ============================================================
  // أحداث مخصصة
  // ============================================================

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ templateId: string }>;
      handleAddCategory(customEvent.detail.templateId);
    };
    window.addEventListener("openCategoryDialog", handler);
    return () => window.removeEventListener("openCategoryDialog", handler);
  }, [selectedTemplateId]);

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ categoryId: string }>;
      handleAddItem(customEvent.detail.categoryId);
    };
    window.addEventListener("openItemDialog", handler);
    return () => window.removeEventListener("openItemDialog", handler);
  }, [selectedCategoryId]);

  // ============================================================
  // دوال مساعدة
  // ============================================================

  const getTemplates = (sectionId: string) => templatesMap[sectionId] || [];
  const getCategories = (templateId: string) => categoriesMap[templateId] || [];
  const getItems = (categoryId: string) => itemsMap[categoryId] || [];

  // ============================================================
  // التصميم - موحد مع باقي صفحات الإعدادات
  // ============================================================

  return (
    <AdminGuard>
      <div
        dir={isRtl ? "rtl" : "ltr"}
        className={cn(
          "relative min-h-screen p-6 space-y-8",
          isRtl ? "text-right" : "text-left"
        )}
      >
        {/* خلفية متدرجة موحدة */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

        {/* رأس الصفحة - مثل asset-statuses */}
        <header className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/30 dark:border-indigo-800/30 shadow-lg shadow-indigo-500/5">
              <ClipboardList className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {t("title")}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                {t("subtitle")}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleAddSection}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-11 px-5 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200"
            >
              <Plus className="h-4 w-4 ml-2" />
              {t("addSection")}
            </Button>
            <Button
              onClick={handleAddTemplate}
              variant="outline"
              disabled={!selectedSectionId}
              className="rounded-xl border-slate-300 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 h-11 px-5 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4 ml-2" />
              {t("addTemplate")}
            </Button>
            <Button
              onClick={() => handleAddCategory()}
              variant="outline"
              disabled={!selectedTemplateId}
              className="rounded-xl border-slate-300 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 h-11 px-5 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4 ml-2" />
              {t("addCategory")}
            </Button>
            <Button
              onClick={() => handleAddItem()}
              variant="outline"
              disabled={!selectedCategoryId}
              className="rounded-xl border-slate-300 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 h-11 px-5 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4 ml-2" />
              {t("addItem")}
            </Button>
          </div>
        </header>

        {/* المحتوى الرئيسي - بطاقة زجاجية موحدة */}
        <div className={glassCard}>
          <div className="p-6">
            {loadingSections ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              </div>
            ) : sections.length === 0 ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                <ClipboardList className="h-12 w-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                <p>{t("noSections")}</p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">{t("addSectionFirst")}</p>
                <Button
                  onClick={handleAddSection}
                  className="mt-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-11 px-5 shadow-lg shadow-indigo-500/20"
                >
                  <Plus className="h-4 w-4 ml-2" />
                  {t("addSection")}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {sections.map((section) => {
                  const templates = getTemplates(section.id);
                  const isLoadingTemplates = loadingTemplates[section.id] || false;

                  return (
                    <div
                      key={section.id}
                      className={cn(
                        "border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden transition-all duration-300",
                        selectedSectionId === section.id
                          ? "ring-2 ring-indigo-400/50 dark:ring-indigo-500/30 bg-white/90 dark:bg-slate-900/70"
                          : "bg-white/70 dark:bg-slate-900/50 hover:bg-white/90 dark:hover:bg-slate-900/70 hover:shadow-md"
                      )}
                    >
                      {/* رأس القسم */}
                      <div
                        className="p-5 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                        onClick={() => setSelectedSectionId(section.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-100/60 to-purple-100/60 dark:from-indigo-950/40 dark:to-purple-950/40">
                              <ClipboardList className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
                                  {isRtl ? section.nameAr || section.name : section.name}
                                </span>
                                {section.code && (
                                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                                    {section.code}
                                  </span>
                                )}
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 bg-indigo-100/60 dark:bg-indigo-950/30 px-2.5 py-0.5 rounded-full">
                                  {templates.length} {isRtl ? "نموذج" : "templates"}
                                </span>
                                {section.isActive === false && (
                                  <span className="text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-100/60 dark:bg-rose-950/30 px-2.5 py-0.5 rounded-full">
                                    {isRtl ? "غير نشط" : "Inactive"}
                                  </span>
                                )}
                              </div>
                              {section.description && (
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                  {section.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div
                            className="flex items-center gap-1 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => handleEditSection(section)}
                              className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all"
                              title={isRtl ? "تعديل" : "Edit"}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteClick(section.id, "section")}
                              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                              title={isRtl ? "حذف" : "Delete"}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* محتوى القسم: النماذج */}
                      {selectedSectionId === section.id && (
                        <div className="px-5 pb-5 pt-2 space-y-4 border-t border-slate-200/50 dark:border-slate-800/50">
                          {isLoadingTemplates ? (
                            <div className="flex justify-center py-8">
                              <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                            </div>
                          ) : templates.length === 0 ? (
                            <div className="text-center py-6 text-sm text-slate-400 dark:text-slate-500">
                              {isRtl ? "لا توجد نماذج فحص في هذا القسم" : "No templates in this section"}
                              <button
                                onClick={handleAddTemplate}
                                className="ml-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                              >
                                <Plus className="h-3 w-3 inline ml-1" />
                                {isRtl ? "إضافة نموذج" : "Add template"}
                              </button>
                            </div>
                          ) : (
                            templates.map((template) => {
                              const categories = getCategories(template.id);
                              const isLoadingCategories = loadingCategories[template.id] || false;

                              return (
                                <div
                                  key={template.id}
                                  className={cn(
                                    "border border-slate-200/50 dark:border-slate-800/50 rounded-2xl overflow-hidden transition-all duration-200",
                                    selectedTemplateId === template.id
                                      ? "ring-1 ring-indigo-400/40 dark:ring-indigo-500/30 bg-white/80 dark:bg-slate-900/60"
                                      : "bg-white/60 dark:bg-slate-900/40 hover:bg-white/80 dark:hover:bg-slate-900/60"
                                  )}
                                >
                                  {/* رأس النموذج */}
                                  <div
                                    className="p-3 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                                    onClick={() => setSelectedTemplateId(template.id)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                                          {isRtl ? template.nameAr || template.name : template.name}
                                        </span>
                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                          {categories.length} {isRtl ? "فئة" : "categories"}
                                        </span>
                                        {template.isActive === false && (
                                          <span className="text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-100/60 dark:bg-rose-950/30 px-2 py-0.5 rounded-full">
                                            {isRtl ? "غير نشط" : "Inactive"}
                                          </span>
                                        )}
                                      </div>
                                      <div
                                        className="flex items-center gap-1 shrink-0"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <button
                                          onClick={() => handleEditTemplate(template)}
                                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all"
                                        >
                                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                          </svg>
                                        </button>
                                        <button
                                          onClick={() => handleDeleteClick(template.id, "template")}
                                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                                        >
                                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* محتوى النموذج: الفئات */}
                                  {selectedTemplateId === template.id && (
                                    <div className="px-3 pb-3 pt-1 space-y-2">
                                      {isLoadingCategories ? (
                                        <div className="flex justify-center py-4">
                                          <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                                        </div>
                                      ) : categories.length === 0 ? (
                                        <div className="text-center py-4 text-sm text-slate-400 dark:text-slate-500">
                                          {isRtl ? "لا توجد فئات في هذا النموذج" : "No categories in this template"}
                                          <button
                                            onClick={() => handleAddCategory(template.id)}
                                            className="ml-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                                          >
                                            <Plus className="h-3 w-3 inline ml-1" />
                                            {isRtl ? "إضافة فئة" : "Add category"}
                                          </button>
                                        </div>
                                      ) : (
                                        categories.map((category) => {
                                          const items = getItems(category.id);
                                          const isLoadingItems = loadingItems[category.id] || false;

                                          return (
                                            <div
                                              key={category.id}
                                              className={cn(
                                                "border border-slate-200/50 dark:border-slate-800/50 rounded-xl overflow-hidden transition-all duration-200",
                                                selectedCategoryId === category.id
                                                  ? "ring-1 ring-indigo-400/30 dark:ring-indigo-500/20 bg-white/70 dark:bg-slate-900/50"
                                                  : "bg-white/50 dark:bg-slate-900/30 hover:bg-white/70 dark:hover:bg-slate-900/50"
                                              )}
                                            >
                                              <div
                                                className="p-2.5 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors flex items-center justify-between"
                                                onClick={() => setSelectedCategoryId(category.id)}
                                              >
                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                                                    {isRtl ? category.nameAr || category.name : category.name}
                                                  </span>
                                                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                                    {items.length} {isRtl ? "بند" : "items"}
                                                  </span>
                                                  {category.isActive === false && (
                                                    <span className="text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-100/60 dark:bg-rose-950/30 px-2 py-0.5 rounded-full">
                                                      {isRtl ? "غير نشط" : "Inactive"}
                                                    </span>
                                                  )}
                                                </div>
                                                <div
                                                  className="flex items-center gap-1 shrink-0"
                                                  onClick={(e) => e.stopPropagation()}
                                                >
                                                  <button
                                                    onClick={() => handleEditCategory(category)}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all"
                                                  >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                  </button>
                                                  <button
                                                    onClick={() => handleDeleteClick(category.id, "category")}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                                                  >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                  </button>
                                                </div>
                                              </div>

                                              {/* البنود */}
                                              {selectedCategoryId === category.id && (
                                                <div className="px-3 pb-3 pt-1">
                                                  {isLoadingItems ? (
                                                    <div className="flex justify-center py-3">
                                                      <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                                                    </div>
                                                  ) : items.length === 0 ? (
                                                    <div className="text-center py-3 text-sm text-slate-400 dark:text-slate-500">
                                                      {isRtl ? "لا توجد بنود في هذه الفئة" : "No items in this category"}
                                                      <button
                                                        onClick={() => handleAddItem(category.id)}
                                                        className="ml-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                                                      >
                                                        <Plus className="h-3 w-3 inline ml-1" />
                                                        {isRtl ? "إضافة بند" : "Add item"}
                                                      </button>
                                                    </div>
                                                  ) : (
                                                    <ItemTable
                                                      data={items}
                                                      onEdit={handleEditItem}
                                                      onDelete={(id) => handleDeleteClick(id, "item")}
                                                      onReorder={handleItemReorder}
                                                      isRtl={isRtl}
                                                    />
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* حوارات الإضافة والتعديل */}
        <SectionDialog
          open={sectionDialogOpen}
          onOpenChange={handleSectionDialogClose}
          section={editingSection}
          isRtl={isRtl}
        />

        <TemplateDialog
          open={templateDialogOpen}
          onOpenChange={handleTemplateDialogClose}
          template={editingTemplate}
          sectionId={selectedSectionId!}
          sections={sections}
          isRtl={isRtl}
        />

        <CategoryDialog
          open={categoryDialogOpen}
          onOpenChange={handleCategoryDialogClose}
          category={editingCategory}
          templateId={categoryDialogTemplateId}
          templates={selectedSectionId ? templatesMap[selectedSectionId] || [] : []}
          isRtl={isRtl}
        />

        <ItemDialog
          open={itemDialogOpen}
          onOpenChange={handleItemDialogClose}
          item={editingItem}
          categoryId={itemDialogCategoryId}
          isRtl={isRtl}
        />

        <ConfirmDialog
          open={confirmDialog.open}
          onOpenChange={(open) => !open && setConfirmDialog({ open: false })}
          onConfirm={handleConfirmDelete}
          title={t("confirmDeleteTitle")}
          description={t("confirmDeleteDescription")}
          confirmText={t("delete")}
          cancelText={t("cancel")}
          isLoading={deleting}
        />
      </div>
    </AdminGuard>
  );
}