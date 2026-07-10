// src/app/[locale]/(dashboard)/assets/[id]/components/AssetSkeleton.tsx
"use client";

import { Loader2 } from "lucide-react";

export function AssetSkeleton() {
  return (
    <div className="relative min-h-[60vh] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />
      <Loader2 className="h-10 w-10 animate-spin text-indigo-500 dark:text-indigo-400" />
    </div>
  );
}