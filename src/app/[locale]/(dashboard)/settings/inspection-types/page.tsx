// src/app/[locale]/(dashboard)/settings/inspection-types/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import InspectionTypesView from "./InspectionTypesView";
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

export default function InspectionTypesPage() {
  const t = useTranslations("InspectionTypes");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const { status } = useSession();

  // ============================================================
  // State
  // ============================================================
  const [sections, setSections] = useState<InspectionSection[]>([]);
  const [loadingSections, setLoadingSections] = useState(true);

  const [templatesMap, setTemplatesMap] = useState<Record<string, InspectionTemplate[]>>({});
  const [loadingTemplates, setLoadingTemplates] = useState<Record<string, boolean>>({});

  const [categoriesMap, setCategoriesMap] = useState<Record<string, InspectionCategory[]>>({});
  const [loadingCategories, setLoadingCategories] = useState<Record<string, boolean>>({});

  const [itemsMap, setItemsMap] = useState<Record<string, InspectionItem[]>>({});
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({});

  // ============================================================
  // Dialog States
  // ============================================================
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
  // 🌳 دالة للحصول على الاسم حسب اللغة
  // ============================================================
  const getLocalizedName = useCallback((item: any) => {
    if (isRtl && item.nameAr) return item.nameAr;
    return item.name;
  }, [isRtl]);

  // ============================================================
  // Fetch Functions
  // ============================================================
  const fetchSections = useCallback(async () => {
    setLoadingSections(true);
    try {
      const res = await fetch("/api/inspection-sections");
      if (!res.ok) throw new Error("Failed to fetch sections");
      const data = await res.json();
      setSections(data);
    } catch (error) {
      toast.error(t("fetchError"));
    } finally {
      setLoadingSections(false);
    }
  }, [t]);

  const fetchTemplates = useCallback(async (sectionId: string) => {
    if (!sectionId) return;
    setLoadingTemplates((prev) => ({ ...prev, [sectionId]: true }));
    try {
      const res = await fetch(`/api/inspection-templates?sectionId=${sectionId}`);
      if (!res.ok) throw new Error("Failed to fetch templates");
      const data = await res.json();
      setTemplatesMap((prev) => ({ ...prev, [sectionId]: data }));
    } catch (error) {
      toast.error(t("fetchError"));
    } finally {
      setLoadingTemplates((prev) => ({ ...prev, [sectionId]: false }));
    }
  }, [t]);

  const fetchCategories = useCallback(async (templateId: string) => {
    if (!templateId) return;
    setLoadingCategories((prev) => ({ ...prev, [templateId]: true }));
    try {
      const res = await fetch(`/api/inspection-categories?templateId=${templateId}`);
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      setCategoriesMap((prev) => ({ ...prev, [templateId]: data }));
    } catch (error) {
      toast.error(t("fetchError"));
    } finally {
      setLoadingCategories((prev) => ({ ...prev, [templateId]: false }));
    }
  }, [t]);

  const fetchItems = useCallback(async (categoryId: string) => {
    if (!categoryId) return;
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
  }, [t]);

  // ============================================================
  // Refetch Functions
  // ============================================================
  const refetchTemplates = useCallback(async (sectionId: string) => {
    if (sectionId) {
      setTemplatesMap((prev) => ({ ...prev, [sectionId]: [] }));
      await fetchTemplates(sectionId);
    }
  }, [fetchTemplates]);

  const refetchCategories = useCallback(async (templateId: string) => {
    if (templateId) {
      setCategoriesMap((prev) => ({ ...prev, [templateId]: [] }));
      await fetchCategories(templateId);
    }
  }, [fetchCategories]);

  const refetchItems = useCallback(async (categoryId: string) => {
    if (categoryId) {
      setItemsMap((prev) => ({ ...prev, [categoryId]: [] }));
      await fetchItems(categoryId);
    }
  }, [fetchItems]);

  // ============================================================
  // 🌳 بناء الشجرة مع الأسماء المحلية
  // ============================================================
  const treeData = useMemo<TreeNode[]>(() => {
    return sections.map((section) => ({
      id: section.id,
      name: getLocalizedName(section),
      type: "section",
      original: section,
      children: (templatesMap[section.id] || []).map((template) => ({
        id: template.id,
        name: getLocalizedName(template),
        type: "template",
        original: template,
        children: (categoriesMap[template.id] || []).map((category) => ({
          id: category.id,
          name: getLocalizedName(category),
          type: "category",
          original: category,
          children: (itemsMap[category.id] || []).map((item) => ({
            id: item.id,
            name: getLocalizedName(item),
            type: "item",
            original: item,
            children: [],
          })),
        })),
      })),
    }));
  }, [sections, templatesMap, categoriesMap, itemsMap, getLocalizedName]);

  // ============================================================
  // Effects (مع التحقق من المصادقة)
  // ============================================================
  useEffect(() => {
    if (status !== "authenticated") return;
    fetchSections();
  }, [status, fetchSections]);

  // جلب النماذج لكل قسم
  useEffect(() => {
    if (status !== "authenticated" || sections.length === 0) return;
    sections.forEach((section) => {
      fetchTemplates(section.id);
    });
  }, [status, sections, fetchTemplates]);

  // جلب الفئات لكل نموذج
  useEffect(() => {
    if (status !== "authenticated") return;
    const allTemplateIds = Object.values(templatesMap).flat().map(t => t.id);
    allTemplateIds.forEach((templateId) => {
      if (!categoriesMap[templateId]) {
        fetchCategories(templateId);
      }
    });
  }, [templatesMap, status, fetchCategories, categoriesMap]);

  // جلب البنود لكل فئة
  useEffect(() => {
    if (status !== "authenticated") return;
    const allCategoryIds = Object.values(categoriesMap).flat().map(c => c.id);
    allCategoryIds.forEach((categoryId) => {
      if (!itemsMap[categoryId]) {
        fetchItems(categoryId);
      }
    });
  }, [categoriesMap, status, fetchItems, itemsMap]);

  // ============================================================
  // CRUD Handlers
  // ============================================================
  const handleAddSection = () => {
    setEditingSection(null);
    setSectionDialogOpen(true);
  };

  const handleEditSection = (section: InspectionSection) => {
    setEditingSection(section);
    setSectionDialogOpen(true);
  };

  const handleAddTemplate = (sectionId?: string) => {
    if (!sectionId) {
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
    if (!templateId) {
      toast.warning(t("selectTemplateFirst"));
      return;
    }
    setCategoryDialogTemplateId(templateId);
    setEditingCategory(null);
    setCategoryDialogOpen(true);
  };

  const handleEditCategory = (category: InspectionCategory) => {
    setEditingCategory(category);
    setCategoryDialogTemplateId(undefined);
    setCategoryDialogOpen(true);
  };

  const handleAddItem = (categoryId?: string) => {
    if (!categoryId) {
      toast.warning(t("selectCategoryFirst"));
      return;
    }
    setItemDialogCategoryId(categoryId);
    setEditingItem(null);
    setItemDialogOpen(true);
  };

  const handleEditItem = (item: InspectionItem) => {
    setEditingItem(item);
    setItemDialogCategoryId(undefined);
    setItemDialogOpen(true);
  };

  // ============================================================
  // Reorder Handler
  // ============================================================
  const handleItemReorder = useCallback(async (items: InspectionItem[], categoryId: string) => {
    try {
      const res = await fetch("/api/inspection-items/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: items.map((item) => item.id) }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "فشل تحديث ترتيب البنود");
      }
      toast.success(isRtl ? "تم تحديث ترتيب البنود" : "Items reordered successfully");
      await refetchItems(categoryId);
    } catch (error: any) {
      toast.error(error.message || (isRtl ? "فشل تحديث الترتيب" : "Failed to reorder"));
    }
  }, [refetchItems, isRtl]);

  // ============================================================
  // Delete Handler
  // ============================================================
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
      } else if (confirmDialog.type === "template") {
        for (const section of sections) {
          const templates = templatesMap[section.id] || [];
          if (templates.some(t => t.id === confirmDialog.id)) {
            await refetchTemplates(section.id);
            break;
          }
        }
      } else if (confirmDialog.type === "category") {
        for (const section of sections) {
          const templates = templatesMap[section.id] || [];
          for (const template of templates) {
            const categories = categoriesMap[template.id] || [];
            if (categories.some(c => c.id === confirmDialog.id)) {
              await refetchCategories(template.id);
              break;
            }
          }
        }
      } else {
        for (const section of sections) {
          const templates = templatesMap[section.id] || [];
          for (const template of templates) {
            const categories = categoriesMap[template.id] || [];
            for (const category of categories) {
              const items = itemsMap[category.id] || [];
              if (items.some(i => i.id === confirmDialog.id)) {
                await refetchItems(category.id);
                break;
              }
            }
          }
        }
      }

      setConfirmDialog({ open: false });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  // ============================================================
  // Dialog Close Handlers
  // ============================================================
  const handleSectionDialogClose = (refetchData?: boolean) => {
    setSectionDialogOpen(false);
    setEditingSection(null);
    if (refetchData) {
      fetchSections();
    }
  };

  const handleTemplateDialogClose = (refetchData?: boolean, sectionId?: string) => {
    setTemplateDialogOpen(false);
    setEditingTemplate(null);
    if (refetchData && sectionId) {
      refetchTemplates(sectionId);
    }
  };

  const handleCategoryDialogClose = (refetchData?: boolean, templateId?: string) => {
    setCategoryDialogOpen(false);
    setEditingCategory(null);
    setCategoryDialogTemplateId(undefined);
    if (refetchData && templateId) {
      refetchCategories(templateId);
    }
  };

  const handleItemDialogClose = (refetchData?: boolean, categoryId?: string) => {
    setItemDialogOpen(false);
    setEditingItem(null);
    setItemDialogCategoryId(undefined);
    if (refetchData && categoryId) {
      refetchItems(categoryId);
    }
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <InspectionTypesView
      treeData={treeData}
      loadingSections={loadingSections}
      isRtl={isRtl}
      
      sectionDialogOpen={sectionDialogOpen}
      editingSection={editingSection}
      templateDialogOpen={templateDialogOpen}
      editingTemplate={editingTemplate}
      categoryDialogOpen={categoryDialogOpen}
      editingCategory={editingCategory}
      categoryDialogTemplateId={categoryDialogTemplateId}
      itemDialogOpen={itemDialogOpen}
      editingItem={editingItem}
      itemDialogCategoryId={itemDialogCategoryId}
      confirmDialog={confirmDialog}
      setConfirmDialog={setConfirmDialog}
      deleting={deleting}
      
      onAddSection={handleAddSection}
      onEditSection={handleEditSection}
      onAddTemplate={handleAddTemplate}
      onEditTemplate={handleEditTemplate}
      onAddCategory={handleAddCategory}
      onEditCategory={handleEditCategory}
      onAddItem={handleAddItem}
      onEditItem={handleEditItem}
      onDeleteClick={handleDeleteClick}
      onConfirmDelete={handleConfirmDelete}
      onSectionDialogClose={handleSectionDialogClose}
      onTemplateDialogClose={handleTemplateDialogClose}
      onCategoryDialogClose={handleCategoryDialogClose}
      onItemDialogClose={handleItemDialogClose}
      onItemReorder={handleItemReorder}
    />
  );
}