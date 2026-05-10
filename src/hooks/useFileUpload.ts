// src/hooks/useFileUpload.ts
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface UseFileUploadProps {
  maxFiles?: number;
  maxFileSizeMB?: number;
  isRtl?: boolean;
}

export function useFileUpload({ maxFiles = 5, maxFileSizeMB = 5, isRtl = false }: UseFileUploadProps = {}) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // تنظيف المعاينات عند إلغاء تحميل المكون
  useEffect(() => {
    return () => {
      previews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previews]);

  const addFiles = useCallback((newFiles: File[]) => {
    const imageFiles = newFiles.filter(
      file => file.type.startsWith("image/") && file.size <= maxFileSizeMB * 1024 * 1024
    );
    if (imageFiles.length !== newFiles.length) {
      toast.error(isRtl ? "بعض الملفات غير مدعومة أو كبيرة الحجم" : "Some files are not supported or too large");
    }
    if (files.length + imageFiles.length > maxFiles) {
      toast.error(isRtl ? `الحد الأقصى ${maxFiles} صور` : `Maximum ${maxFiles} images`);
      return;
    }
    setFiles(prev => [...prev, ...imageFiles]);
    const newPreviews = imageFiles.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  }, [files.length, maxFiles, maxFileSizeMB, isRtl]);

  const removeFile = useCallback((index: number) => {
    URL.revokeObjectURL(previews[index]);
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  }, [previews]);

  const resetFiles = useCallback(() => {
    previews.forEach(url => URL.revokeObjectURL(url));
    setFiles([]);
    setPreviews([]);
  }, [previews]);

  return { files, previews, addFiles, removeFile, resetFiles };
}