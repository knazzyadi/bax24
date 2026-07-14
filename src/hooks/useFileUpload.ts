// src/hooks/useFileUpload.ts
"use client";

import { useState } from "react";

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = async (file: File) => {
    // تنفيذ منطق الرفع
    setUploading(true);
    try {
      // منطق رفع الملف...
      setProgress(100);
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  return { uploadFile, uploading, progress };
}