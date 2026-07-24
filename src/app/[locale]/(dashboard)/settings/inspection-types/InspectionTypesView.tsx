// src/app/[locale]/(dashboard)/settings/inspection-types/InspectionTypesView.tsx
"use client";

import { useTranslations } from "next-intl";
import { ClipboardList, Plus, Loader2 } from "lucide-react";
import { AdminGuard } from "@/lib/client-guard";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

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

const glassCard =
  "bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300";

const innerCard =
  "bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/40 dark:border-slate-700/40 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200";

interface InspectionTypesViewProps {
  sections: InspectionSection[];
  loadingSections: boolean;
  selectedSectionId: string | null;
  selectedTemplateId: string | null;
  selectedCategoryId: string | null;
  templatesMap: Record<string, InspectionTemplate[]>;
  categoriesMap: Record<string, InspectionCategory[]>;
  itemsMap: Record<string, InspectionItem[]>;
  loadingTemplates: Record<string, boolean>;
  loadingCategories: Record<string, boolean>;
  loadingItems: Record<string, boolean>;
  getTemplates: (sectionId: string) => InspectionTemplate[];
  getCategories: (templateId: string) => InspectionCategory[];
  getItems: (categoryId: string) => InspectionItem[];
  isRtl: boolean;

  // Dialogs
  sectionDialogOpen: boolean;
  editingSection: InspectionSection | null;
  templateDialogOpen: boolean;
  editingTemplate: InspectionTemplate | null;
  categoryDialogOpen: boolean;
  editingCategory: InspectionCategory | null;
  categoryDialogTemplateId?: string;
  itemDialogOpen: boolean;
  editingItem: InspectionItem | null;
  itemDialogCategoryId?: string;
  confirmDialog: { open: boolean; id?: string; type?: "section" | "template" | "category" | "item" };
  setConfirmDialog: React.Dispatch<React.SetStateAction<{
    open: boolean;
    id?: string;
    type?: "section" | "template" | "category" | "item";
  }>>;
  deleting: boolean;

  // Handlers
  onSelectSection: (id: string) => void;
  onSelectTemplate: (id: string) => void;
  onSelectCategory: (id: string) => void;
  onAddSection: () => void;
  onEditSection: (section: InspectionSection) => void;
  onAddTemplate: () => void;
  onEditTemplate: (template: InspectionTemplate) => void;
  onAddCategory: (templateId?: string) => void;
  onEditCategory: (category: InspectionCategory) => void;
  onAddItem: (categoryId?: string) => void;
  onEditItem: (item: InspectionItem) => void;
  onDeleteClick: (id: string, type: "section" | "template" | "category" | "item") => void;
  onConfirmDelete: () => void;
  onSectionDialogClose: (refetch?: boolean) => void;
  onTemplateDialogClose: (refetch?: boolean) => void;
  onCategoryDialogClose: (refetch?: boolean) => void;
  onItemDialogClose: (refetch?: boolean) => void;
  onItemReorder: (items: InspectionItem[]) => void;
  onFetchTemplates: (sectionId: string) => void;
  onFetchCategories: (templateId: string) => void;
  onFetchItems: (categoryId: string) => void;
}

export function InspectionTypesView({
  sections,
  loadingSections,
  selectedSectionId,
  selectedTemplateId,
  selectedCategoryId,
  templatesMap,
  categoriesMap,
  itemsMap,
  loadingTemplates,
  loadingCategories,
  loadingItems,
  getTemplates,
  getCategories,
  getItems,
  isRtl,
  sectionDialogOpen,
  editingSection,
  templateDialogOpen,
  editingTemplate,
  categoryDialogOpen,
  editingCategory,
  categoryDialogTemplateId,
  itemDialogOpen,
  editingItem,
  itemDialogCategoryId,
  confirmDialog,
  setConfirmDialog,
  deleting,
  onSelectSection,
  onSelectTemplate,
  onSelectCategory,
  onAddSection,
  onEditSection,
  onAddTemplate,
  onEditTemplate,
  onAddCategory,
  onEditCategory,
  onAddItem,
  onEditItem,
  onDeleteClick,
  onConfirmDelete,
  onSectionDialogClose,
  onTemplateDialogClose,
  onCategoryDialogClose,
  onItemDialogClose,
  onItemReorder,
  onFetchTemplates,
  onFetchCategories,
  onFetchItems,
}: InspectionTypesViewProps) {
  const t = useTranslations("InspectionTypes");

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
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={onAddSection}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-11 px-5 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200"
            >
              <Plus className="h-4 w-4 ml-2" />
              {t("addSection")}
            </Button>
            <Button
              onClick={onAddTemplate}
              variant="outline"
              disabled={!selectedSectionId}
              className="rounded-xl border-slate-300 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 h-11 px-5 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4 ml-2" />
              {t("addTemplate")}
            </Button>
            <Button
              onClick={() => onAddCategory()}
              variant="outline"
              disabled={!selectedTemplateId}
              className="rounded-xl border-slate-300 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 h-11 px-5 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4 ml-2" />
              {t("addCategory")}
            </Button>
            <Button
              onClick={() => onAddItem()}
              variant="outline"
              disabled={!selectedCategoryId}
              className="rounded-xl border-slate-300 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 h-11 px-5 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4 ml-2" />
              {t("addItem")}
            </Button>
          </div>
        </header>

        {/* المحتوى الرئيسي */}
        <div className="relative space-y-6">
          {loadingSections ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            </div>
          ) : sections.length === 0 ? (
            <div className={cn(glassCard, "text-center py-20")}>
              <ClipboardList className="h-16 w-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
              <p className="text-lg font-medium text-slate-500 dark:text-slate-400">
                {t("noSections")}
              </p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                {t("addSectionFirst")}
              </p>
              <Button
                onClick={onAddSection}
                className="mt-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-11 px-6 shadow-lg shadow-indigo-500/20"
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
                      glassCard,
                      "overflow-hidden transition-all duration-300",
                      selectedSectionId === section.id
                        ? "ring-2 ring-indigo-400/50 dark:ring-indigo-500/30"
                        : "hover:shadow-md"
                    )}
                  >
                    {/* رأس القسم */}
                    <div
                      className="p-5 cursor-pointer hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors"
                      onClick={() => {
                        onSelectSection(section.id);
                        if (!templatesMap[section.id]) {
                          onFetchTemplates(section.id);
                        }
                      }}
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
                            onClick={() => onEditSection(section)}
                            className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all"
                            title={isRtl ? "تعديل" : "Edit"}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => onDeleteClick(section.id, "section")}
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
                              onClick={onAddTemplate}
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
                                  innerCard,
                                  "overflow-hidden transition-all duration-200",
                                  selectedTemplateId === template.id
                                    ? "ring-1 ring-indigo-400/40 dark:ring-indigo-500/30"
                                    : ""
                                )}
                              >
                                {/* رأس النموذج */}
                                <div
                                  className="p-3 cursor-pointer hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10 transition-colors"
                                  onClick={() => {
                                    onSelectTemplate(template.id);
                                    if (!categoriesMap[template.id]) {
                                      onFetchCategories(template.id);
                                    }
                                  }}
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
                                        onClick={() => onEditTemplate(template)}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => onDeleteClick(template.id, "template")}
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
                                          onClick={() => onAddCategory(template.id)}
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
                                              "border border-slate-200/40 dark:border-slate-700/40 rounded-xl overflow-hidden transition-all duration-200 bg-white/60 dark:bg-slate-900/40",
                                              selectedCategoryId === category.id
                                                ? "ring-1 ring-indigo-400/30 dark:ring-indigo-500/20"
                                                : "hover:bg-white/80 dark:hover:bg-slate-900/60"
                                            )}
                                          >
                                            <div
                                              className="p-2.5 cursor-pointer hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10 transition-colors flex items-center justify-between"
                                              onClick={() => {
                                                onSelectCategory(category.id);
                                                if (!itemsMap[category.id]) {
                                                  onFetchItems(category.id);
                                                }
                                              }}
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
                                                  onClick={() => onEditCategory(category)}
                                                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all"
                                                >
                                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                  </svg>
                                                </button>
                                                <button
                                                  onClick={() => onDeleteClick(category.id, "category")}
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
                                                      onClick={() => onAddItem(category.id)}
                                                      className="ml-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                                                    >
                                                      <Plus className="h-3 w-3 inline ml-1" />
                                                      {isRtl ? "إضافة بند" : "Add item"}
                                                    </button>
                                                  </div>
                                                ) : (
                                                  <ItemTable
                                                    data={items}
                                                    onEdit={onEditItem}
                                                    onDelete={(id) => onDeleteClick(id, "item")}
                                                    onReorder={onItemReorder}
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

        {/* حوارات الإضافة والتعديل */}
        <SectionDialog
          open={sectionDialogOpen}
          onOpenChange={onSectionDialogClose}
          section={editingSection}
          isRtl={isRtl}
        />

        <TemplateDialog
          open={templateDialogOpen}
          onOpenChange={onTemplateDialogClose}
          template={editingTemplate}
          sectionId={selectedSectionId!}
          sections={sections}
          isRtl={isRtl}
        />

        <CategoryDialog
          open={categoryDialogOpen}
          onOpenChange={onCategoryDialogClose}
          category={editingCategory}
          templateId={categoryDialogTemplateId}
          templates={selectedSectionId ? getTemplates(selectedSectionId) || [] : []}
          isRtl={isRtl}
        />

        <ItemDialog
          open={itemDialogOpen}
          onOpenChange={onItemDialogClose}
          item={editingItem}
          categoryId={itemDialogCategoryId}
          isRtl={isRtl}
        />

        <ConfirmDialog
          open={confirmDialog.open}
          onOpenChange={(open) => {
            if (!open) setConfirmDialog({ open: false });
          }}
          onConfirm={onConfirmDelete}
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