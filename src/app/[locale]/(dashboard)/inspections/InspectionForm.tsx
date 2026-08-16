// src/app/[locale]/(dashboard)/inspections/InspectionForm.tsx
"use client";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Calendar, FileText, Building2, FolderTree } from "lucide-react";

// ============================================================
// 1. الأنواع
// ============================================================
interface Category {
  id: string;
  name: string;
  nameAr: string | null;
  templateId: string;
  _count: { items: number };
}

interface Template {
  id: string;
  name: string;
  nameAr: string | null;
  sectionId: string;
}
interface InspectionGroup {
  sectionId: string;
  templateId: string;
  categoryIds: string[];
}

// ============================================================
// 2. المكون
// ============================================================
interface InspectionFormProps {
  mode: "create" | "edit";
  onSubmit: (e: React.FormEvent) => void;
  isRtl: boolean;
  data: {
    inspectionTitle: string;
    scheduledDate: string;
    branchId: string;
    groups: InspectionGroup[];
  };
  actions: {
    setInspectionTitle: (val: string) => void;
    setScheduledDate: (val: string) => void;
    setBranchId: (val: string) => void;
    setSectionId: (index: number, val: string) => void;
    setTemplateId: (index: number, val: string) => void;
    setCategoryIds: (index: number, val: string[]) => void;
    addGroup: () => void;
    removeGroup: (index: number) => void;
  };
  branchOptions: { value: string; label: string }[];
  sectionOptions: { value: string; label: string }[];
  getTemplatesForSection: (sectionId: string) => Template[];
  getCategoriesForTemplate: (templateId: string) => Category[];
  getLocalizedName: (item: { name: string; nameAr?: string | null }) => string;
  summary: {
    sectionName: string | null;
    templateName: string | null;
    categoryNames: string[];
    itemsCount: number;
  }[];
  isSubmitting: boolean;
  isFormValid: boolean;
  locale: string;
  router: AppRouterInstance;
}

export function InspectionForm({
  onSubmit,
  isRtl,
  data,
  actions,
  branchOptions,
  sectionOptions,
  getTemplatesForSection,
  getCategoriesForTemplate,
  getLocalizedName,
  summary,
  isSubmitting,
  isFormValid,
  locale,
  router,
}: InspectionFormProps) {
  const {
    inspectionTitle,
    scheduledDate,
    branchId,
    groups,
  } = data;

  const {
    setInspectionTitle,
    setScheduledDate,
    setBranchId,
    setSectionId,
    setTemplateId,
    setCategoryIds,
    addGroup,
    removeGroup,
  } = actions;

  // ============================================================
  // 2.2 معالجة تغيير الفئات (يدوياً)
  // ============================================================
  const toggleCategory = (
    groupIndex: number,
    catId: string
  ) => {
    const group = groups[groupIndex];
    if (!group) return;

    if (group.categoryIds.includes(catId)) {
      setCategoryIds(
        groupIndex,
        group.categoryIds.filter((id) => id !== catId)
      );
    } else {
      setCategoryIds(
        groupIndex,
        [...group.categoryIds, catId]
      );
    }
  };

  // ============================================================
  // 3. دوال تحديد الكل وإلغاء الكل
  // ============================================================
  const selectAllCategories = (groupIndex: number) => {
    const group = groups[groupIndex];
    if (!group?.templateId) return;

    const allIds = getCategoriesForTemplate(
      group.templateId
    ).map((category) => category.id);

    setCategoryIds(groupIndex, allIds);
  };

  const clearAllCategories = (groupIndex: number) => {
    setCategoryIds(groupIndex, []);
  };

  // ============================================================
  // 2.4 العرض
  // ============================================================
  return (
    <form onSubmit={onSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* العنوان */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {isRtl ? "عنوان الفحص" : "Inspection Title"}
        </Label>
        <div className="relative">
          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            id="title"
            value={inspectionTitle}
            onChange={(e) => setInspectionTitle(e.target.value)}
            placeholder={isRtl ? "أدخل عنوان الفحص" : "Enter inspection title"}
            className="pl-10 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:ring-indigo-500"
            required
          />
        </div>
      </div>

      {/* التاريخ */}
      <div className="space-y-2">
        <Label htmlFor="date" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {isRtl ? "تاريخ الفحص" : "Scheduled Date"}
        </Label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            id="date"
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            className="pl-10 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:ring-indigo-500"
            required
          />
        </div>
      </div>

      {/* الفرع */}
      <div className="space-y-2">
        <Label htmlFor="branch" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {isRtl ? "الفرع" : "Branch"}
        </Label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Select value={branchId} onValueChange={setBranchId} required>
            <SelectTrigger className="pl-10 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:ring-indigo-500">
              <SelectValue placeholder={isRtl ? "اختر الفرع" : "Select branch"} />
            </SelectTrigger>
            <SelectContent>
              {branchOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* مجموعات الفحص */}
      <div className="space-y-4 sm:space-y-6">
        {groups.map((group, groupIndex) => {
          const templateOptions = group.sectionId
            ? getTemplatesForSection(group.sectionId).map((template) => ({
                value: template.id,
                label: getLocalizedName(template),
              }))
            : [];

          const categoryOptions = group.templateId
            ? getCategoriesForTemplate(group.templateId).map((category) => ({
                value: category.id,
                label: getLocalizedName(category),
                itemsCount: category._count?.items || 0,
              }))
            : [];

          return (
            <Card
              key={groupIndex}
              className="border-slate-200 dark:border-slate-700"
            >
              <CardContent className="p-4 sm:p-5 space-y-4 sm:space-y-5">
                {/* عنوان المجموعة */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm sm:text-base">
                      {isRtl
                        ? `مجموعة الفحص ${groupIndex + 1}`
                        : `Inspection Group ${groupIndex + 1}`}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {isRtl
                        ? "اختر القسم ثم النموذج ثم الفئات المطلوبة"
                        : "Select section, template, then categories"}
                    </p>
                  </div>
                  {groups.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeGroup(groupIndex)}
                      className="text-red-600 hover:text-red-700"
                    >
                      {isRtl ? "حذف المجموعة" : "Remove Group"}
                    </Button>
                  )}
                </div>

                {/* القسم */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {isRtl ? "القسم" : "Section"}
                  </Label>
                  <div className="relative">
                    <FolderTree className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Select
                      value={group.sectionId}
                      onValueChange={(value) =>
                        setSectionId(groupIndex, value)
                      }
                      required
                    >
                      <SelectTrigger className="pl-10 bg-slate-50 dark:bg-slate-800/50">
                        <SelectValue
                          placeholder={
                            isRtl
                              ? "اختر القسم"
                              : "Select section"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {sectionOptions.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* النموذج */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {isRtl ? "النموذج" : "Template"}
                  </Label>
                  <Select
                    value={group.templateId}
                    onValueChange={(value) =>
                      setTemplateId(groupIndex, value)
                    }
                    required
                    disabled={!group.sectionId}
                  >
                    <SelectTrigger className="bg-slate-50 dark:bg-slate-800/50">
                      <SelectValue
                        placeholder={
                          isRtl
                            ? "اختر النموذج"
                            : "Select template"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {templateOptions.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!group.sectionId && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      {isRtl
                        ? "يرجى اختيار القسم أولاً"
                        : "Please select a section first"}
                    </p>
                  )}
                </div>

                {/* الفئات */}
                {group.templateId && categoryOptions.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {isRtl
                          ? "الفئات"
                          : "Categories"}
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            selectAllCategories(groupIndex)
                          }
                          className="flex-1 sm:flex-none h-7 text-xs"
                        >
                          {isRtl
                            ? "تحديد الكل"
                            : "Select All"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            clearAllCategories(groupIndex)
                          }
                          className="flex-1 sm:flex-none h-7 text-xs"
                        >
                          {isRtl
                            ? "إلغاء الكل"
                            : "Clear All"}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-700">
                      {categoryOptions.map((category) => (
                        <div
                          key={category.value}
                          className="flex items-center space-x-2 rtl:space-x-reverse"
                        >
                          <Checkbox
                            id={`group-${groupIndex}-cat-${category.value}`}
                            checked={group.categoryIds.includes(
                              category.value
                            )}
                            onCheckedChange={() =>
                              toggleCategory(
                                groupIndex,
                                category.value
                              )
                            }
                            className="data-[state=checked]:bg-indigo-600"
                          />
                          <Label
                            htmlFor={`group-${groupIndex}-cat-${category.value}`}
                            className="text-sm cursor-pointer flex-1"
                          >
                            {category.label}
                            <Badge
                              variant="secondary"
                              className="ml-2 text-xs"
                            >
                              {category.itemsCount}{" "}
                              {isRtl ? "بند" : "items"}
                            </Badge>
                          </Label>
                        </div>
                      ))}
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isRtl
                        ? `تم اختيار ${group.categoryIds.length} من ${categoryOptions.length} فئة`
                        : `${group.categoryIds.length} of ${categoryOptions.length} categories selected`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* إضافة مجموعة */}
        <Button
          type="button"
          variant="outline"
          onClick={addGroup}
          className="w-full"
        >
          + {isRtl ? "إضافة مجموعة أخرى" : "Add Another Group"}
        </Button>
      </div>

      {/* الملخص المعدل */}
      {summary.length > 0 && (
        <div className="space-y-3">
          {summary.map((item, index) => (
            item.sectionName &&
            item.templateName && (
              <Card
                key={index}
                className="bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800"
              >
                <CardContent className="p-3 sm:p-4 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 text-sm sm:text-base">
                    <FolderTree className="h-4 w-4" />
                    <span className="font-medium">
                      {item.sectionName}
                    </span>
                    <span className="text-indigo-400">→</span>
                    <span className="font-medium">
                      {item.templateName}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {item.categoryNames.map((name, categoryIndex) => (
                      <Badge
                        key={`${name}-${categoryIndex}`}
                        variant="secondary"
                        className="bg-white dark:bg-slate-800 text-xs"
                      >
                        {name}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-sm text-indigo-600 dark:text-indigo-400">
                    {isRtl
                      ? `إجمالي البنود: ${item.itemsCount}`
                      : `Total items: ${item.itemsCount}`}
                  </div>
                </CardContent>
              </Card>
            )
          ))}
        </div>
      )}

      {/* أزرار الإجراء */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/${locale}/inspections`)}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isRtl ? "إلغاء" : "Cancel"}
        </Button>
        <Button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isRtl ? "جاري الإنشاء..." : "Creating..."}
            </>
          ) : (
            isRtl ? "إنشاء الفحص" : "Create Inspection"
          )}
        </Button>
      </div>
    </form>
  );
}