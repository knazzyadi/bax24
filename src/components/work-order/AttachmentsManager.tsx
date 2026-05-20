"use client";

import { useState, useCallback, useEffect } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Paperclip,
  Trash2,
  Download,
  FileText,
  Loader2,
  Plus,
  X,
} from "lucide-react";

interface Attachment {
  id: string;
  url: string;
  fileName: string;
  originalName: string;
  size: number;
  mimeType: string;
  createdAt: string;
  uploadedBy?: string;
}

interface AttachmentsManagerProps {
  workOrderId: string;
  canUpload?: boolean;
  canDelete?: boolean;
  maxFiles?: number;
}

export function AttachmentsManager({
  workOrderId,
  canUpload = true,
  canDelete = true,
  maxFiles = 5,
}: AttachmentsManagerProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAttachments = useCallback(async () => {
    try {
      const res = await fetch(`/api/work-orders/${workOrderId}/attachments`);
      if (res.ok) {
        const data = await res.json();
        setAttachments(data);
      }
    } catch (error) {
      console.error("Error fetching attachments:", error);
    } finally {
      setLoading(false);
    }
  }, [workOrderId]);

  useEffect(() => {
    if (workOrderId) {
      fetchAttachments();
    }
  }, [workOrderId, fetchAttachments]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error(isRtl ? "PDF فقط مسموح" : "Only PDF files are allowed");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(isRtl ? "حجم الملف يتجاوز 10 ميجابايت" : "File size exceeds 10MB");
        return;
      }
      setSelectedFile(file);
      setFileName(file.name.replace(/\.pdf$/i, ""));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !fileName.trim()) {
      toast.error(isRtl ? "الملف والاسم مطلوبان" : "File and name are required");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("fileName", fileName.trim());

    try {
      const res = await fetch(`/api/work-orders/${workOrderId}/attachments`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        toast.success(isRtl ? "تم رفع الملف بنجاح" : "File uploaded successfully");
        setOpenDialog(false);
        setSelectedFile(null);
        setFileName("");
        fetchAttachments();
      } else {
        const error = await res.json();
        toast.error(error.error || (isRtl ? "فشل الرفع" : "Upload failed"));
      }
    } catch (error) {
      toast.error(isRtl ? "خطأ في الاتصال" : "Network error");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!confirm(isRtl ? "هل أنت متأكد من حذف هذا الملف؟" : "Are you sure you want to delete this file?")) {
      return;
    }

    setDeletingId(attachmentId);
    try {
      const res = await fetch(
        `/api/work-orders/${workOrderId}/attachments?attachmentId=${attachmentId}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        toast.success(isRtl ? "تم حذف الملف" : "File deleted");
        fetchAttachments();
      } else {
        toast.error(isRtl ? "فشل الحذف" : "Delete failed");
      }
    } catch (error) {
      toast.error(isRtl ? "خطأ في الاتصال" : "Network error");
    } finally {
      setDeletingId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(isRtl ? "ar-SA" : "en-US");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* رأس القسم */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-black text-muted-foreground flex items-center gap-2">
          <Paperclip size={14} />
          {isRtl ? "المرفقات" : "Attachments"}
          <span className="text-xs text-muted-foreground">
            ({attachments.length}/{maxFiles})
          </span>
        </Label>

        {canUpload && attachments.length < maxFiles && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => setOpenDialog(true)}
          >
            <Plus size={14} />
            {isRtl ? "إضافة ملف" : "Add File"}
          </Button>
        )}
      </div>

      {/* قائمة المرفقات */}
      {attachments.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">
            {isRtl ? "لا توجد مرفقات" : "No attachments"}
          </p>
          <p className="text-xs mt-1">
            {isRtl ? "يمكنك إضافة ملفات PDF بحجم يصل إلى 10 ميجابايت" : "You can add PDF files up to 10MB"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border group hover:bg-muted/70 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate text-sm">{att.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {att.originalName} • {formatFileSize(att.size)} • {formatDate(att.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                <a
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full hover:bg-primary/10 transition-colors"
                  title={isRtl ? "فتح" : "Open"}
                >
                  <Download size={16} className="text-primary" />
                </a>
                {canDelete && (
                  <button
                    onClick={() => handleDelete(att.id)}
                    disabled={deletingId === att.id}
                    className="p-2 rounded-full hover:bg-destructive/10 transition-colors disabled:opacity-50"
                  >
                    {deletingId === att.id ? (
                      <Loader2 size={16} className="animate-spin text-destructive" />
                    ) : (
                      <Trash2 size={16} className="text-destructive" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog لإضافة ملف جديد */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isRtl ? "رفع ملف جديد" : "Upload New File"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fileName">{isRtl ? "اسم الملف" : "File Name"}</Label>
              <Input
                id="fileName"
                placeholder={isRtl ? "مثال: فاتورة الصيانة" : "e.g., Maintenance Invoice"}
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="file">{isRtl ? "اختر ملف PDF" : "Select PDF File"}</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
              />
              <p className="text-xs text-muted-foreground">
                {isRtl ? "الحد الأقصى 10 ميجابايت، PDF فقط" : "Maximum size: 10MB, PDF only"}
              </p>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setOpenDialog(false)}
                className="flex-1"
              >
                {isRtl ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                onClick={handleUpload}
                disabled={uploading || !selectedFile || !fileName.trim()}
                className="flex-1 gap-2"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Paperclip size={16} />
                )}
                {uploading ? (isRtl ? "جاري الرفع..." : "Uploading...") : (isRtl ? "رفع" : "Upload")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}