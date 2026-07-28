// src/app/[locale]/(dashboard)/settings/inspection-types/InspectionTypesView.tsx
"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  ClipboardList,
  Plus,
  Loader2,
} from "lucide-react";
import { AdminGuard } from "@/lib/client-guard";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

import { TreeNode } from "./TreeNode";
import { SectionDialog } from "./SectionDialog";
import { TemplateDialog } from "./TemplateDialog";
import { CategoryDialog } from "./CategoryDialog";
import { ItemDialog } from "./ItemDialog";

import type {
  InspectionSection,
  InspectionTemplate,
  InspectionCategory,
  InspectionItem,
  TreeNode as TreeNodeType,
} from "./types";

interface InspectionTypesViewProps {
  treeData: TreeNodeType[];
  loadingSections: boolean;
  isRtl: boolean;

  // ✅ الخرائط الثلاث
  expandedSections: Record<string, boolean>;
  expandedTemplates: Record<string, boolean>;
  expandedCategories: Record<string, boolean>;
  
  onToggleSection: (sectionId: string) => void;
  onToggleTemplate: (templateId: string) => void;
  onToggleCategory: (categoryId: string) => void;

  // ... باقي البروبس (دون تغيير)
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

  onAddSection: () => void;
  onEditSection: (section: InspectionSection) => void;
  onAddTemplate: (sectionId: string) => void;
  onEditTemplate: (template: InspectionTemplate) => void;
  onAddCategory: (templateId: string) => void;
  onEditCategory: (category: InspectionCategory) => void;
  onAddItem: (categoryId: string) => void;
  onEditItem: (item: InspectionItem) => void;
  onDeleteClick: (id: string, type: "section" | "template" | "category" | "item") => void;
  onConfirmDelete: () => void;
  onSectionDialogClose: (refetch?: boolean) => void;
  onTemplateDialogClose: (refetch?: boolean, sectionId?: string) => void;
  onCategoryDialogClose: (refetch?: boolean, templateId?: string) => void;
  onItemDialogClose: (refetch?: boolean, categoryId?: string) => void;
  onItemReorder: (items: InspectionItem[], categoryId: string) => void;

  sections: InspectionSection[];
  templatesMap: Record<string, InspectionTemplate[]>;
  categoriesMap: Record<string, InspectionCategory[]>;
}

export default function InspectionTypesView({
  treeData,
  loadingSections,
  isRtl,
  expandedSections,
  expandedTemplates,
  expandedCategories,
  onToggleSection,
  onToggleTemplate,
  onToggleCategory,
  // ... باقي البروبس
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
  sections,
  templatesMap,
  categoriesMap,
}: InspectionTypesViewProps) {
  const t = useTranslations("InspectionTypes");

  const handleAddChild = (node: TreeNodeType) => {
    switch (node.type) {
      case "section": onAddTemplate(node.id); break;
      case "template": onAddCategory(node.id); break;
      case "category": onAddItem(node.id); break;
      default: break;
    }
  };

  const handleEdit = (node: TreeNodeType) => {
    switch (node.type) {
      case "section": onEditSection(node.original as InspectionSection); break;
      case "template": onEditTemplate(node.original as InspectionTemplate); break;
      case "category": onEditCategory(node.original as InspectionCategory); break;
      case "item": onEditItem(node.original as InspectionItem); break;
    }
  };

  const handleDelete = (node: TreeNodeType) => {
    onDeleteClick(node.id, node.type);
  };

  const handleToggle = (nodeId: string, type: string) => {
    console.log("🔵 handleToggle called with:", nodeId, type);
    if (type === "section") onToggleSection(nodeId);
    else if (type === "template") onToggleTemplate(nodeId);
    else if (type === "category") onToggleCategory(nodeId);
  };

  const allTemplates = useMemo(() => {
    return Object.values(templatesMap).flat();
  }, [templatesMap]);

  return (
    <AdminGuard>
      <div
        dir={isRtl ? "rtl" : "ltr"}
        className={cn(
          "relative min-h-screen p-6 space-y-6",
          isRtl ? "text-right" : "text-left"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 -z-10" />

        <header className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/30 dark:border-indigo-800/30">
              <ClipboardList className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {t("title")}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("subtitle")}
              </p>
            </div>
          </div>
          <Button
            onClick={onAddSection}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium h-10 px-5 shadow-lg shadow-indigo-500/20"
          >
            <Plus className="h-4 w-4 ml-2" />
            {t("addSection")}
          </Button>
        </header>

        <div className="relative">
          {loadingSections ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            </div>
          ) : treeData.length === 0 ? (
            <div className="text-center py-20 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl">
              <ClipboardList className="h-16 w-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
              <p className="text-lg font-medium text-slate-500 dark:text-slate-400">
                {t("noSections")}
              </p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                {t("addSectionFirst")}
              </p>
              <Button
                onClick={onAddSection}
                className="mt-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium"
              >
                <Plus className="h-4 w-4 ml-2" />
                {t("addSection")}
              </Button>
            </div>
          ) : (
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-4 shadow-sm">
              <div className="space-y-0.5">
                {treeData.map((node, index) => (
                  <TreeNode
                    key={node.id}
                    node={node}
                    level={0}
                    isLast={index === treeData.length - 1}
                    isRtl={isRtl}
                    expandedSections={expandedSections}
                    expandedTemplates={expandedTemplates}
                    expandedCategories={expandedCategories}
                    onToggle={handleToggle}
                    onAdd={handleAddChild}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isLoading={node.isLoading}
                    // ✅ يتم تمرير description تلقائياً عبر node
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* حوارات */}
        <SectionDialog
          open={sectionDialogOpen}
          onOpenChange={onSectionDialogClose}
          section={editingSection}
          isRtl={isRtl}
        />

        <TemplateDialog
          open={templateDialogOpen}
          onOpenChange={(open) => {
            if (!open) onTemplateDialogClose(false);
          }}
          template={editingTemplate}
          sectionId={editingTemplate?.sectionId || ""}
          sections={sections}
          isRtl={isRtl}
        />

        <CategoryDialog
          open={categoryDialogOpen}
          onOpenChange={(open) => {
            if (!open) onCategoryDialogClose(false);
          }}
          category={editingCategory}
          templateId={categoryDialogTemplateId}
          templates={allTemplates}
          isRtl={isRtl}
        />

        <ItemDialog
          open={itemDialogOpen}
          onOpenChange={(open) => {
            if (!open) onItemDialogClose(false);
          }}
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