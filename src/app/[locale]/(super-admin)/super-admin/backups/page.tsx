// src/app/[locale]/(dashboard)/super-admin/backups/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { AdminGuard } from "@/lib/client-guard";
import { cn } from "@/lib/utils";
import { BackupForm } from "./BackupForm";
import { BackupHistoryTable } from "./BackupHistoryTable";
import type { Company } from "./types";

export default function BackupsPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const t = useTranslations("SuperAdmin.Backups");

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  // ✅ جلب قائمة الشركات
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await fetch("/api/admin/companies");
        if (!res.ok) throw new Error("Failed to fetch companies");
        const data = await res.json();
        setCompanies(data);
      } catch (error) {
        console.error("Error fetching companies:", error);
      } finally {
        setLoadingCompanies(false);
      }
    };
    fetchCompanies();
  }, []);

  const handleBackupCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <AdminGuard>
      <div
        dir={isRtl ? "rtl" : "ltr"}
        className={cn(
          "relative min-h-screen p-6 space-y-8",
          isRtl ? "text-right" : "text-left"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 rounded-3xl -z-10" />

        <div className="relative">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {t("pageTitle")}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("pageDescription")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <BackupForm
              companies={companies}
              onBackupCreated={handleBackupCreated}
              isRtl={isRtl}
            />
          </div>
          <div className="lg:col-span-3">
            <BackupHistoryTable
              refreshTrigger={refreshTrigger}
              isRtl={isRtl}
            />
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}