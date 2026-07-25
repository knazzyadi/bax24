// src/app/[locale]/(dashboard)/settings/inspection-types/TreeNode.tsx
"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TreeIcons } from "@/components/ui/TreeIcons";
import type { TreeNode as TreeNodeType } from "./types";

interface TreeNodeProps {
  node: TreeNodeType;
  level: number;
  isLast: boolean;
  isRtl: boolean;
  // ✅ الخرائط الثلاث مباشرة
  expandedSections: Record<string, boolean>;
  expandedTemplates: Record<string, boolean>;
  expandedCategories: Record<string, boolean>;
  onToggle: (nodeId: string, type: string) => void;
  onAdd: (node: TreeNodeType) => void;
  onEdit: (node: TreeNodeType) => void;
  onDelete: (node: TreeNodeType) => void;
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
  isLoading = false,
}: TreeNodeProps) {
  // ✅ اختيار الخريطة المناسبة حسب نوع العقدة
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

  // سجل للتتبع (يمكنك إزالته بعد التأكد)
  console.log(`🔍 TreeNode render: ${node.id} (${node.type}) isExpanded=${isExpanded}, hasChildren=${hasChildren}, expandedMap keys:`, Object.keys(expandedMap));

  const lineColor = [
    "border-indigo-300 dark:border-indigo-700",
    "border-blue-300 dark:border-blue-700",
    "border-emerald-300 dark:border-emerald-700",
    "border-amber-300 dark:border-amber-700",
  ][level % 4];

  return (
    <div className="relative">
      {/* الخطوط الرابطة */}
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

      {/* العقدة */}
      <div className="relative flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group">
        <div style={{ width: level * 16 }} className="flex-shrink-0" />

        {/* زر التوسيع */}
        {canHaveChildren && (
          <button
            onClick={() => {
              console.log("🔵 TreeNode onClick:", node.id, node.type);
              onToggle(node.id, node.type);
            }}
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

        {/* الأيقونة */}
        <span className="flex-shrink-0">
          {isItem 
            ? TreeIcons.item 
            : TreeIcons.section(isExpanded)}
        </span>

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

      {/* الأبناء */}
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
              isLoading={child.isLoading || isLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
}