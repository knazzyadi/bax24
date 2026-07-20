// src/app/[locale]/(dashboard)/settings/inspection-types/page.tsx
"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ClipboardList, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AdminGuard } from "@/lib/client-guard";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useSettingsData } from "@/hooks/useSettingsData";

// استيراد المكونات الفرعية
import { CategoryTable } from "./CategoryTable";
import { CategoryDialog } from "./CategoryDialog";
import { ItemTable } from "./ItemTable";
import { ItemDialog } from "./ItemDialog";

import type { InspectionCategory, InspectionItem } from "./types";

// تنسيق البطاقة الزجاجي الموحد
const glassCard =
  "bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300";

export default function InspectionTypesPage() {
  const t = useTranslations("InspectionTypes"); // سننشئ ملف الترجمة لاحقاً
  const locale = useLocale();
  const isRtl = locale === "ar";

  // ---------- حالة العناوين الرئيسية (Categories) ----------
  const {
    data: categories,
    loading: loadingCategories,
    refetch: refetchCategories,
  } = useSettingsData<InspectionCategory>({
    apiEndpoint: "/api/inspection-categories",
    locale,
  });

  // ---------- حالة البنود الفرعية (Items) ----------
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // جلب البنود عند تغيير الفئة المختارة
  const fetchItems = async (categoryId: string) => {
    if (!categoryId) {
      setItems([]);
      return;
    }
    setLoadingItems(true);
    try {
      const res = await fetch(`/api/inspection-items?categoryId=${categoryId}`);
      if (!res.ok) throw new Error("Failed to fetch items");
      const data = await res.json();
      setItems(data);
    } catch (error) {
      toast.error(t("fetchItemsError"));
    } finally {
      setLoadingItems(false);
    }
  };

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    fetchItems(categoryId);
  };

  // إعادة جلب البنود بعد تعديلها
  const refetchItems = () => {
    if (selectedCategoryId) fetchItems(selectedCategoryId);
  };

  // ---------- حالات الحوارات (مطابقة لنمط asset-statuses) ----------
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<InspectionCategory | null>(null);

  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InspectionItem | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; id?: string; type?: 'category' | 'item' }>({
    open: false,
  });
  const [deleting, setDeleting] = useState(false);

  // ---------- دوال المعالجة ----------
  const handleCreateCategory = () => {
    setEditingCategory(null);
    setCategoryDialogOpen(true);
  };

  const handleEditCategory = (category: InspectionCategory) => {
    setEditingCategory(category);
    setCategoryDialogOpen(true);
  };

  const handleCreateItem = () => {
    if (!selectedCategoryId) {
      toast.warning(t("selectCategoryFirst"));
      return;
    }
    setEditingItem(null);
    setItemDialogOpen(true);
  };

  const handleEditItem = (item: InspectionItem) => {
    setEditingItem(item);
    setItemDialogOpen(true);
  };

  const handleDeleteClick = (id: string, type: 'category' | 'item') => {
    setConfirmDialog({ open: true, id, type });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDialog.id) return;
    setDeleting(true);
    try {
      const endpoint =
        confirmDialog.type === 'category'
          ? `/api/inspection-categories/${confirmDialog.id}`
          : `/api/inspection-items/${confirmDialog.id}`;

      const res = await fetch(endpoint, { method: "DELETE" });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "فشل الحذف");
      }

      toast.success(t("deleteSuccess"));
      
      // تحديث البيانات حسب نوع المحذوف
      if (confirmDialog.type === 'category') {
        await refetchCategories();
        if (selectedCategoryId === confirmDialog.id) {
          setSelectedCategoryId(null);
          setItems([]);
        }
      } else {
        await refetchItems();
      }

      setConfirmDialog({ open: false });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  // إغلاق حوار الفئة
  const handleCategoryDialogClose = (refetchData?: boolean) => {
    setCategoryDialogOpen(false);
    setEditingCategory(null);
    if (refetchData) refetchCategories();
  };

  // إغلاق حوار البند
  const handleItemDialogClose = (refetchData?: boolean) => {
    setItemDialogOpen(false);
    setEditingItem(null);
    if (refetchData) refetchItems();
  };

  // رفض الحذف
  const handleCancelDelete = () => setConfirmDialog({ open: false });

  return (
    <AdminGuard>
      <div
        dir={isRtl ? "rtl" : "ltr"}
        className={cn(
          "relative min-h-screen p-6 space-y-8",
          isRtl ? "text-right" : "text-left"
        )}
      >
        {/* خلفية متدرجة */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

        {/* رأس الصفحة */}
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
          <div className="flex gap-2">
            <Button
              onClick={handleCreateItem}
              variant="outline"
              className="rounded-xl border-slate-300 dark:border-slate-700 h-11 px-5"
            >
              <Plus className="h-4 w-4 ml-2" />
              {t("addItem")}
            </Button>
            <Button
              onClick={handleCreateCategory}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-11 px-5 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200"
            >
              <Plus className="h-4 w-4 ml-2" />
              {t("addCategory")}
            </Button>
          </div>
        </header>

        {/* الشبكة المنقسمة (Split View) */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 relative">
          {/* العمود الأيمن (العناوين الرئيسية) - يأخذ 2/5 */}
          <div className={cn("lg:col-span-2", glassCard)}>
            <div className="p-6">
              <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                {t("categories")}
              </h2>
              {loadingCategories ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                </div>
              ) : (
                <CategoryTable
                  data={categories}
                  selectedId={selectedCategoryId}
                  onSelect={handleSelectCategory}
                  onEdit={handleEditCategory}
                  onDelete={(id) => handleDeleteClick(id, 'category')}
                  isRtl={isRtl}
                />
              )}
            </div>
          </div>

          {/* العمود الأيسر (البنود الفرعية) - يأخذ 3/5 */}
          <div className={cn("lg:col-span-3", glassCard)}>
            <div className="p-6">
              <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                {selectedCategoryId
                  ? t("itemsFor", {
                      name: categories?.find((c) => c.id === selectedCategoryId)?.name || "",
                    })
                  : t("selectCategoryHint")}
              </h2>
              {!selectedCategoryId ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500">
                  <ClipboardList className="h-12 w-12 mb-3 opacity-20" />
                  <p className="text-sm">{t("selectCategoryHint")}</p>
                </div>
              ) : loadingItems ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                </div>
              ) : (
                <ItemTable
                  data={items}
                  onEdit={handleEditItem}
                  onDelete={(id) => handleDeleteClick(id, 'item')}
                  isRtl={isRtl}
                />
              )}
            </div>
          </div>
        </div>

        {/* حوار إضافة/تعديل الفئة (Category) */}
        <CategoryDialog
          open={categoryDialogOpen}
          onOpenChange={handleCategoryDialogClose}
          category={editingCategory}
          isRtl={isRtl}
        />

        {/* حوار إضافة/تعديل البند (Item) */}
        <ItemDialog
          open={itemDialogOpen}
          onOpenChange={handleItemDialogClose}
          item={editingItem}
          categoryId={selectedCategoryId || undefined}
          isRtl={isRtl}
        />

        {/* حوار تأكيد الحذف الموحد */}
        <ConfirmDialog
          open={confirmDialog.open}
          onOpenChange={(open) => {
            if (!open) setConfirmDialog({ open: false });
          }}
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