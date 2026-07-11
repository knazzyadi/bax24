"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { LookupItem, LookupPageProps, LookupFormData } from "./types";
import { LookupToolbar } from "./LookupToolbar";
import { LookupTable } from "./LookupTable";
import { LookupDialog } from "./LookupDialog";
import { DeleteLookupDialog } from "./DeleteLookupDialog";
import { searchLookupItems, getNextOrder } from "./utils";

export function LookupPage({
  title,
  description,
  apiEndpoint,
  icon,
  features,
  permissions = {
    create: true,
    update: true,
    delete: true,
  },
  confirmDelete = true,
}: LookupPageProps) {
  const t = useTranslations("LookupPage");

  // ─── State ──────────────────────────────────────────────
  const [items, setItems] = useState<LookupItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // حوار الإضافة / التعديل
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LookupItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // حوار الحذف
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<LookupItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ─── تحميل البيانات ──────────────────────────────────────
  const loadItems = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await fetch(apiEndpoint);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      setItems(Array.isArray(data) ? data : data.items ?? []);
    } catch (error: unknown) {
      console.error("Fetch error:", error);
      toast.error(t("fetchError"));
    } finally {
      setIsLoading(false);
    }
  }, [apiEndpoint, t]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // ─── البحث ──────────────────────────────────────────────
  const filteredItems = searchLookupItems(items, searchQuery);

  // ─── حفظ (إضافة / تعديل) ──────────────────────────────
  const handleSave = async (data: LookupFormData) => {
    const isEditing = Boolean(data.id);

    try {
      setIsSaving(true);

      const url = isEditing
        ? `${apiEndpoint}/${data.id}`
        : apiEndpoint;

      const method = isEditing ? "PUT" : "POST";

      const payload: LookupFormData = {
        ...data,
        order: isEditing ? data.order : getNextOrder(items),
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            (isEditing ? "Update failed" : "Create failed")
        );
      }

      toast.success(isEditing ? t("updateSuccess") : t("createSuccess"));
      setIsDialogOpen(false);
      await loadItems();
    } catch (error: unknown) {
      console.error("Save error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : isEditing
          ? t("updateError")
          : t("createError")
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ─── حذف العنصر ──────────────────────────────────────────
  const handleDelete = async (item?: LookupItem) => {
    const target = item ?? deletingItem;
    if (!target) return;

    try {
      setIsDeleting(true);

      const response = await fetch(`${apiEndpoint}/${target.id}`, {
        method: "DELETE",
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(responseData.message || t("deleteError"));
      }

      toast.success(t("deleteSuccess"));
      setIsDeleteDialogOpen(false);
      setDeletingItem(null);
      await loadItems();
    } catch (error: unknown) {
      console.error("Delete error:", error);
      toast.error(
        error instanceof Error ? error.message : t("deleteError")
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── إعادة الترتيب (محلياً حالياً) ──────────────────────
  const handleReorder = (newItems: LookupItem[]) => {
    setItems(newItems);
  };

  // ─── دوال فتح الحوارات ──────────────────────────────────
  const handleAdd = () => {
    if (!permissions.create) {
      toast.warning(t("noCreatePermission"));
      return;
    }
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (item: LookupItem) => {
    if (!permissions.update) {
      toast.warning(t("noUpdatePermission"));
      return;
    }
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (item: LookupItem) => {
    if (!permissions.delete) {
      toast.warning(t("noDeletePermission"));
      return;
    }

    setDeletingItem(item);

    if (!confirmDelete) {
      handleDelete(item);
      return;
    }

    setIsDeleteDialogOpen(true);
  };

// ─── Render ──────────────────────────────────────────────
return (
  <div className="relative space-y-8 p-6">

    {/* خلفية متدرجة خفيفة */}
    <div
      className="
        absolute inset-0
        bg-gradient-to-br
        from-indigo-100/20
        via-transparent
        to-purple-100/20
        dark:from-indigo-950/10
        dark:via-transparent
        dark:to-purple-950/10
        rounded-3xl
        -z-10
      "
    />

    {/* شريط الأدوات */}
    <div className="relative z-10">
      <LookupToolbar
        title={title}
        description={description}
        icon={icon}
        search={searchQuery}
        onSearchChange={setSearchQuery}
        onAdd={handleAdd}
        addLabel={t("addButton")}
        searchPlaceholder={t("searchPlaceholder")}
        total={filteredItems.length}
      />
    </div>


    {/* الجدول */}
    <div className="relative z-10">
      <LookupTable
        items={filteredItems}
        features={features}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onReorder={
          features.enableSorting && !searchQuery
            ? handleReorder
            : undefined
        }
        isLoading={isLoading}
      />
    </div>


    {/* حوار الإضافة / التعديل */}
    <LookupDialog
    open={isDialogOpen}
    onOpenChange={setIsDialogOpen}
    item={editingItem}
    features={features}
    onSubmit={handleSave}
    loading={isSaving}
    />


    {/* حوار تأكيد الحذف */}
    {confirmDelete && (
      <DeleteLookupDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);

          if (!open) {
            setDeletingItem(null);
          }
        }}
        itemName={deletingItem?.name || ""}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    )}

  </div>
);
}