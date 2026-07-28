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
  TreeNode,
} from "./types";

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

  // ✅ حالات التوسيع (كائنات وليس قيماً مفردة)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [expandedTemplates, setExpandedTemplates] = useState<Record<string, boolean>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

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
  // دالة الحصول على الاسم حسب اللغة
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
  // ✅ دوال التوسيع مع سجلات التتبع
  // ============================================================
  const toggleSection = useCallback((sectionId: string) => {
    console.log("🔵 toggleSection called with:", sectionId);
    setExpandedSections((prev) => {
      const newState = !prev[sectionId];
      console.log("🔵 setExpandedSections: prev[sectionId] =", prev[sectionId], "newState =", newState);
      
      // إذا تم التوسيع ولم تكن البيانات محملة، قم بجلبها
      if (newState && !templatesMap[sectionId]) {
        console.log("🟡 Fetching templates for section:", sectionId);
        fetchTemplates(sectionId);
      }
      
      const newStateObj = { ...prev, [sectionId]: newState };
      console.log("🔵 new expandedSections:", newStateObj);
      return newStateObj;
    });
  }, [templatesMap, fetchTemplates]);

  const toggleTemplate = useCallback((templateId: string) => {
    console.log("🔵 toggleTemplate called with:", templateId);
    setExpandedTemplates((prev) => {
      const newState = !prev[templateId];
      console.log("🔵 setExpandedTemplates: prev[templateId] =", prev[templateId], "newState =", newState);
      
      if (newState && !categoriesMap[templateId]) {
        console.log("🟡 Fetching categories for template:", templateId);
        fetchCategories(templateId);
      }
      
      const newStateObj = { ...prev, [templateId]: newState };
      console.log("🔵 new expandedTemplates:", newStateObj);
      return newStateObj;
    });
  }, [categoriesMap, fetchCategories]);

  const toggleCategory = useCallback((categoryId: string) => {
    console.log("🔵 toggleCategory called with:", categoryId);
    setExpandedCategories((prev) => {
      const newState = !prev[categoryId];
      console.log("🔵 setExpandedCategories: prev[categoryId] =", prev[categoryId], "newState =", newState);
      
      if (newState && !itemsMap[categoryId]) {
        console.log("🟡 Fetching items for category:", categoryId);
        fetchItems(categoryId);
      }
      
      const newStateObj = { ...prev, [categoryId]: newState };
      console.log("🔵 new expandedCategories:", newStateObj);
      return newStateObj;
    });
  }, [itemsMap, fetchItems]);

  // ============================================================
  // 🌳 بناء الشجرة (مع إضافة description و descriptionEn)
  // ============================================================
  const treeData = useMemo<TreeNode[]>(() => {
    return sections.map((section) => ({
      id: section.id,
      name: getLocalizedName(section),
      nameEn: section.name || undefined,
      description: section.description || undefined,
      descriptionEn: section.descriptionEn || undefined,
      type: "section",
      original: section,
      hasLoaded: !!templatesMap[section.id],
      isLoading: loadingTemplates[section.id] || false,
      children: (templatesMap[section.id] || []).map((template) => ({
        id: template.id,
        name: getLocalizedName(template),
        nameEn: template.name || undefined,
        description: template.description || undefined,
        descriptionEn: template.descriptionEn || undefined,
        type: "template",
        original: template,
        hasLoaded: !!categoriesMap[template.id],
        isLoading: loadingCategories[template.id] || false,
        children: (categoriesMap[template.id] || []).map((category) => ({
          id: category.id,
          name: getLocalizedName(category),
          nameEn: category.name || undefined,
          description: category.description || undefined,
          descriptionEn: category.descriptionEn || undefined,
          type: "category",
          original: category,
          hasLoaded: !!itemsMap[category.id],
          isLoading: loadingItems[category.id] || false,
          children: (itemsMap[category.id] || []).map((item) => ({
            id: item.id,
            name: getLocalizedName(item),
            nameEn: item.name || undefined,
            description: item.description || undefined,
            descriptionEn: item.descriptionEn || undefined,
            type: "item",
            original: item,
            hasLoaded: true,
            isLoading: false,
            children: [],
          })),
        })),
      })),
    }));
  }, [sections, templatesMap, categoriesMap, itemsMap, getLocalizedName, loadingTemplates, loadingCategories, loadingItems]);

  // ============================================================
  // Effects
  // ============================================================
  useEffect(() => {
    if (status !== "authenticated") return;
    fetchSections();
  }, [status, fetchSections]);

  // ============================================================
  // CRUD Handlers (مختصرة)
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
      // إعادة جلب البنود للفئة
      setItemsMap((prev) => ({ ...prev, [categoryId]: [] }));
      await fetchItems(categoryId);
    } catch (error: any) {
      toast.error(error.message || (isRtl ? "فشل تحديث الترتيب" : "Failed to reorder"));
    }
  }, [fetchItems, isRtl]);

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
        // إزالة الحالة التوسعية للقسم
        setExpandedSections((prev) => {
          const newState = { ...prev };
          delete newState[confirmDialog.id!];
          return newState;
        });
      } else if (confirmDialog.type === "template") {
        // إعادة جلب النماذج للقسم
        for (const section of sections) {
          const templates = templatesMap[section.id] || [];
          if (templates.some(t => t.id === confirmDialog.id)) {
            setTemplatesMap((prev) => ({ ...prev, [section.id]: [] }));
            await fetchTemplates(section.id);
            // إزالة الحالة التوسعية للنموذج
            setExpandedTemplates((prev) => {
              const newState = { ...prev };
              delete newState[confirmDialog.id!];
              return newState;
            });
            break;
          }
        }
      } else if (confirmDialog.type === "category") {
        // إعادة جلب الفئات للنموذج
        for (const section of sections) {
          const templates = templatesMap[section.id] || [];
          for (const template of templates) {
            const categories = categoriesMap[template.id] || [];
            if (categories.some(c => c.id === confirmDialog.id)) {
              setCategoriesMap((prev) => ({ ...prev, [template.id]: [] }));
              await fetchCategories(template.id);
              // إزالة الحالة التوسعية للفئة
              setExpandedCategories((prev) => {
                const newState = { ...prev };
                delete newState[confirmDialog.id!];
                return newState;
              });
              break;
            }
          }
        }
      } else {
        // item
        for (const section of sections) {
          const templates = templatesMap[section.id] || [];
          for (const template of templates) {
            const categories = categoriesMap[template.id] || [];
            for (const category of categories) {
              const items = itemsMap[category.id] || [];
              if (items.some(i => i.id === confirmDialog.id)) {
                setItemsMap((prev) => ({ ...prev, [category.id]: [] }));
                await fetchItems(category.id);
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
      setTemplatesMap((prev) => ({ ...prev, [sectionId]: [] }));
      fetchTemplates(sectionId);
    }
  };

  const handleCategoryDialogClose = (refetchData?: boolean, templateId?: string) => {
    setCategoryDialogOpen(false);
    setEditingCategory(null);
    setCategoryDialogTemplateId(undefined);
    if (refetchData && templateId) {
      setCategoriesMap((prev) => ({ ...prev, [templateId]: [] }));
      fetchCategories(templateId);
    }
  };

  const handleItemDialogClose = (refetchData?: boolean, categoryId?: string) => {
    setItemDialogOpen(false);
    setEditingItem(null);
    setItemDialogCategoryId(undefined);
    if (refetchData && categoryId) {
      setItemsMap((prev) => ({ ...prev, [categoryId]: [] }));
      fetchItems(categoryId);
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
      
      expandedSections={expandedSections}
      expandedTemplates={expandedTemplates}
      expandedCategories={expandedCategories}
      
      onToggleSection={toggleSection}
      onToggleTemplate={toggleTemplate}
      onToggleCategory={toggleCategory}
      
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
      
      sections={sections}
      templatesMap={templatesMap}
      categoriesMap={categoriesMap}
    />
  );
}