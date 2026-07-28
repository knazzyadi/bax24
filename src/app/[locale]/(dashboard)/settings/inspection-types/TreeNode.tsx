// src/app/[locale]/(dashboard)/settings/inspection-types/TreeNode.tsx
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TreeIcons } from "@/components/ui/TreeIcons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FileText } from "lucide-react";
import type { TreeNode as TreeNodeType } from "./types";

interface TreeNodeProps {
  node: TreeNodeType;
  level: number;
  isLast: boolean;
  isRtl: boolean;
  expandedSections: Record<string, boolean>;
  expandedTemplates: Record<string, boolean>;
  expandedCategories: Record<string, boolean>;
  onToggle: (nodeId: string, type: string) => void;
  onAdd: (node: TreeNodeType) => void;
  onEdit: (node: TreeNodeType) => void;
  onDelete: (node: TreeNodeType) => void;
  onViewGuide?: (node: TreeNodeType) => void;
  isLoading?: boolean;
}

export function TreeNode({
  node,
  level,
  isLast,
  isRtl,
  expandedSections,
  expandedTemplates,
  expandedCategories,
  onToggle,
  onAdd,
  onEdit,
  onDelete,
  onViewGuide,
  isLoading = false,
}: TreeNodeProps) {
  const [guideDialogOpen, setGuideDialogOpen] = useState(false);

  const getExpandedMap = (type: string): Record<string, boolean> => {
    if (type === "section") return expandedSections;
    if (type === "template") return expandedTemplates;
    if (type === "category") return expandedCategories;
    return {};
  };

  const expandedMap = getExpandedMap(node.type);
  const isExpanded = expandedMap[node.id] || false;
  
  const canHaveChildren = node.type !== "item";
  const hasChildren = node.children && node.children.length > 0;
  const isItem = node.type === "item";

  const lineColor = [
    "border-indigo-300 dark:border-indigo-700",
    "border-blue-300 dark:border-blue-700",
    "border-emerald-300 dark:border-emerald-700",
    "border-amber-300 dark:border-amber-700",
  ][level % 4];

  const handleOpenGuide = () => {
    if (onViewGuide) {
      onViewGuide(node);
    } else {
      setGuideDialogOpen(true);
    }
  };

  // ✅ استخراج النص من العقدة أو من original
  const getGuideText = () => {
    // 1. نفضل استخدام الحقول المباشرة في العقدة
    const desc = isRtl ? node.description : node.descriptionEn;
    if (desc) return desc;

    // 2. الاحتياطي: نقرأ من original حسب النوع
    const orig = node.original;
    if (orig) {
      if (isRtl) {
        return (orig as any).description || (orig as any).descriptionEn || (isRtl ? "لا توجد تعليمات" : "No guide available");
      } else {
        return (orig as any).descriptionEn || (orig as any).description || "No guide available";
      }
    }

    return isRtl ? "لا توجد تعليمات" : "No guide available";
  };

  const guideText = getGuideText();

  // ✅ تحديد إذا كان هناك وصف للعرض (للتحكم في ظهور الزر)
  const hasDescription = !!(node.description || node.descriptionEn || 
    (node.original && ((node.original as any).description || (node.original as any).descriptionEn)));

  return (
    <>
      <div className="relative">
        {level > 0 && (
          <div
            className={cn(
              "absolute -left-4 top-0 bottom-0 w-px",
              lineColor,
              "opacity-60"
            )}
          />
        )}
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
          <div style={{ width: level * 16 }} className="flex-shrink-0" />

          {canHaveChildren && (
            <button
              onClick={() => onToggle(node.id, node.type)}
              className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors flex-shrink-0"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
              ) : isExpanded ? (
                TreeIcons.expand
              ) : (
                TreeIcons.collapse
              )}
            </button>
          )}
          {!canHaveChildren && <div className="w-4 flex-shrink-0" />}

          <span className="flex-shrink-0">
            {isItem 
              ? TreeIcons.item 
              : TreeIcons.section(isExpanded)}
          </span>

          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {node.name}
          </span>

          {hasChildren && (
            <Badge variant="secondary" className="text-xs font-normal px-1.5 h-4">
              {node.children.length}
            </Badge>
          )}

          <div className="flex items-center gap-0.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
            {!isItem && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/30"
                onClick={() => onAdd(node)}
                title={node.type === "section" ? "إضافة نموذج" : node.type === "template" ? "إضافة فئة" : "إضافة بند"}
              >
                {TreeIcons.add}
              </Button>
            )}

            {/* ✅ زر تعليمات الفحص - يظهر فقط إذا كان هناك وصف */}
            {hasDescription && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30"
                onClick={handleOpenGuide}
                title={isRtl ? "تعليمات الفحص" : "Inspection Guide"}
              >
                <FileText className="h-4 w-4" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
              onClick={() => onEdit(node)}
              title="تعديل"
            >
              {TreeIcons.edit}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
              onClick={() => onDelete(node)}
              title="حذف"
            >
              {TreeIcons.delete}
            </Button>
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div className="relative ml-4 space-y-0.5 mt-0.5">
            {node.children.map((child, index) => (
              <TreeNode
                key={child.id}
                node={child}
                level={level + 1}
                isLast={index === node.children.length - 1}
                isRtl={isRtl}
                expandedSections={expandedSections}
                expandedTemplates={expandedTemplates}
                expandedCategories={expandedCategories}
                onToggle={onToggle}
                onAdd={onAdd}
                onEdit={onEdit}
                onDelete={onDelete}
                onViewGuide={onViewGuide}
                isLoading={child.isLoading || isLoading}
              />
            ))}
          </div>
        )}
      </div>

      {/* نافذة تعليمات الفحص */}
      <Dialog open={guideDialogOpen} onOpenChange={setGuideDialogOpen}>
        <DialogContent className="max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              {isRtl ? "تعليمات الفحص" : "Inspection Guide"}
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              {isRtl ? `تعليمات فحص "${node.name}"` : `Inspection guide for "${node.name}"`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {isRtl ? "تعليمات الفحص" : "Inspection Guide"}
              </label>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 min-h-[80px] whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                {guideText}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => setGuideDialogOpen(false)}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
            >
              {isRtl ? "إغلاق" : "Close"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}