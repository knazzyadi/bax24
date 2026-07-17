// src/hooks/useFileUpload.ts
"use client";

import { useState, useCallback } from "react";

interface UseFileUploadProps {
  maxFiles?: number;
  maxFileSizeMB?: number;
  isRtl?: boolean;
}

export function useFileUpload({ maxFiles = 5, maxFileSizeMB = 5, isRtl = false }: UseFileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const addFiles = useCallback((newFiles: File[]) => {
    const validFiles: File[] = [];
    const validPreviews: string[] = [];

    for (const file of newFiles) {
      if (files.length + validFiles.length >= maxFiles) {
        alert(isRtl ? `لا يمكنك اختيار أكثر من ${maxFiles} صور` : `You can only select up to ${maxFiles} images`);
        break;
      }
      if (file.size > maxFileSizeMB * 1024 * 1024) {
        alert(isRtl ? `حجم الصورة يتجاوز ${maxFileSizeMB} ميجابايت` : `Image size exceeds ${maxFileSizeMB} MB`);
        continue;
      }
      validFiles.push(file);
      validPreviews.push(URL.createObjectURL(file));
    }

    setFiles((prev) => [...prev, ...validFiles]);
    setPreviews((prev) => [...prev, ...validPreviews]);
  }, [files, maxFiles, maxFileSizeMB, isRtl]);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      const newPreviews = prev.filter((_, i) => i !== index);
      // إلغاء تحميل URL القديم لتجنب تسرب الذاكرة
      URL.revokeObjectURL(prev[index]);
      return newPreviews;
    });
  }, []);

  const resetFiles = useCallback(() => {
    setFiles([]);
    setPreviews([]);
  }, []);

  return {
    files,
    previews,
    addFiles,
    removeFile,
    resetFiles,
  };
}