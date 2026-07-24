// src/app/[locale]/(dashboard)/settings/inspection-types/InspectionTypesView.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  ClipboardList,
  Plus,
  Loader2,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  Folder,
  FolderOpen,
  FileText,
  Dot,
} from "lucide-react";
import { AdminGuard } from "@/lib/client-guard";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

import { SectionDialog } from "./SectionDialog";
import { TemplateDialog } from "./TemplateDialog";
import { CategoryDialog } from "./CategoryDialog";
import { ItemDialog } from "./ItemDialog";

import type {
  InspectionSection,
  InspectionTemplate,
  InspectionCategory,
  InspectionItem,
} from "./types";

// 🌳 نوع العقدة في الشجرة
interface TreeNode {
  id: string;
  name: string;
  type: "section" | "template" | "category" | "item";
  children: TreeNode[];
  original: InspectionSection | InspectionTemplate | InspectionCategory | InspectionItem;
}

interface InspectionTypesViewProps {
  treeData: TreeNode[];
  loadingSections: boolean;
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
}

// 🌳 دالة للحصول على الأيقونة حسب النوع
function getIcon(type: string, isExpanded: boolean) {
  switch (type) {
    case "section":
      return isExpanded ? <FolderOpen className="h-4 w-4 text-indigo-600" /> : <Folder className="h-4 w-4 text-indigo-500" />;
    case "template":
      return <Folder className="h-4 w-4 text-blue-500" />;
    case "category":
      return <FileText className="h-4 w-4 text-emerald-500" />;
    case "item":
      return <Dot className="h-4 w-4 text-amber-500" />;
    default:
      return null;
  }
}

// 🌳 مكون العقدة المتداخلة
function TreeNode({
  node,
  level,
  onAdd,
  onEdit,
  onDelete,
  isRtl,
  isLast = true,
}: {
  node: TreeNode;
  level: number;
  onAdd: (node: TreeNode) => void;
  onEdit: (node: TreeNode) => void;
  onDelete: (node: TreeNode) => void;
  isRtl: boolean;
  isLast?: boolean;
}) {
  const [expanded, setExpanded] = useState(level < 1);
  const hasChildren = node.children && node.children.length > 0;

  const lineColor = [
    "border-indigo-300 dark:border-indigo-700",
    "border-blue-300 dark:border-blue-700",
    "border-emerald-300 dark:border-emerald-700",
    "border-amber-300 dark:border-amber-700",
  ][level % 4];

  return (
    <div className="relative">
      {/* الخط العمودي */}
      {level > 0 && (
        <div
          className={cn(
            "absolute -left-4 top-0 bottom-0 w-px",
            lineColor,
            "opacity-60"
          )}
        />
      )}

      {/* الخط الأفقي */}
      {level > 0 && !isLast && (
        <div
          className={cn(
            "absolute -left-4 top-1/2 h-px w-4",
            lineColor,
            "opacity-60"
          )}
        />
      )}

      <div className="relative flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group">
        {/* المسافة البادئة */}
        <div style={{ width: level * 16 }} className="flex-shrink-0" />

        {/* زر الطي/التوسع */}
        {hasChildren && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors flex-shrink-0"
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-4 flex-shrink-0" />}

        {/* الأيقونة */}
        <span className="flex-shrink-0">{getIcon(node.type, expanded)}</span>

        {/* الاسم */}
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {node.name}
        </span>

        {/* عدد الأبناء */}
        {hasChildren && (
          <Badge variant="secondary" className="text-xs font-normal px-1.5 h-4">
            {node.children.length}
          </Badge>
        )}

        {/* الأزرار */}
        <div className="flex items-center gap-0.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
          {node.type !== "item" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/30"
              onClick={() => onAdd(node)}
              title={node.type === "section" ? "إضافة نموذج" : node.type === "template" ? "إضافة فئة" : "إضافة بند"}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
            onClick={() => onEdit(node)}
            title="تعديل"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
            onClick={() => onDelete(node)}
            title="حذف"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* الأبناء */}
      {expanded && hasChildren && (
        <div className="relative ml-4 space-y-0.5 mt-0.5">
          {node.children.map((child, index) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onAdd={onAdd}
              onEdit={onEdit}
              onDelete={onDelete}
              isRtl={isRtl}
              isLast={index === node.children.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function InspectionTypesView({
  treeData,
  loadingSections,
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
}: InspectionTypesViewProps) {
  const t = useTranslations("InspectionTypes");

  const handleAddChild = (node: TreeNode) => {
    switch (node.type) {
      case "section":
        onAddTemplate(node.id);
        break;
      case "template":
        onAddCategory(node.id);
        break;
      case "category":
        onAddItem(node.id);
        break;
      default:
        break;
    }
  };

  const handleEdit = (node: TreeNode) => {
    switch (node.type) {
      case "section":
        onEditSection(node.original as InspectionSection);
        break;
      case "template":
        onEditTemplate(node.original as InspectionTemplate);
        break;
      case "category":
        onEditCategory(node.original as InspectionCategory);
        break;
      case "item":
        onEditItem(node.original as InspectionItem);
        break;
    }
  };

  const handleDelete = (node: TreeNode) => {
    onDeleteClick(node.id, node.type);
  };

  return (
    <AdminGuard>
      <div
        dir={isRtl ? "rtl" : "ltr"}
        className={cn(
          "relative min-h-screen p-6 space-y-6",
          isRtl ? "text-right" : "text-left"
        )}
      >
        {/* خلفية متدرجة */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 -z-10" />

        {/* رأس الصفحة */}
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

        {/* المحتوى الرئيسي */}
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
                    onAdd={handleAddChild}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isRtl={isRtl}
                    isLast={index === treeData.length - 1}
                  />
                ))}
              </div>
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
          onOpenChange={(open) => {
            if (!open) onTemplateDialogClose(false);
          }}
          template={editingTemplate}
          sectionId={editingTemplate?.sectionId || ""}
          sections={[]}
          isRtl={isRtl}
        />

        <CategoryDialog
          open={categoryDialogOpen}
          onOpenChange={(open) => {
            if (!open) onCategoryDialogClose(false);
          }}
          category={editingCategory}
          templateId={categoryDialogTemplateId}
          templates={[]}
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