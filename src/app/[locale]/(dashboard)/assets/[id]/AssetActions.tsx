"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Edit, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AssetActionsProps {
  assetId: string;
  locale: string;
  canEdit: boolean;
  canDelete: boolean;
}

export default function AssetActions({
  assetId,
  locale,
  canEdit,
  canDelete,
}: AssetActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const isRtl = locale === "ar";

  const handleEdit = () => {
    router.push(`/${locale}/assets/${assetId}/edit`);
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      isRtl
        ? "هل أنت متأكد من حذف هذا الأصل؟ لا يمكن التراجع عن هذا الإجراء."
        : "Are you sure you want to delete this asset? This action cannot be undone."
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/assets/${assetId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(isRtl ? "تم حذف الأصل بنجاح" : "Asset deleted successfully");
        router.push(`/${locale}/assets`);
        router.refresh();
      } else {
        const error = await res.json();
        toast.error(error.error || (isRtl ? "فشل حذف الأصل" : "Failed to delete asset"));
      }
    } catch (err) {
      toast.error(isRtl ? "حدث خطأ أثناء الحذف" : "An error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {canEdit && (
        <button
          onClick={handleEdit}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border border-border bg-background hover:bg-accent transition-colors"
        >
          <Edit className="h-4 w-4" />
          {isRtl ? "تعديل" : "Edit"}
        </button>
      )}
      {canDelete && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
        >
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          {isRtl ? "حذف" : "Delete"}
        </button>
      )}
    </div>
  );
}