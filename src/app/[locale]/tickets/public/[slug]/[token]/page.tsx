// src/app/[locale]/tickets/public/[slug]/[token]/page.tsx

"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Moon, Sun, X, Send, Loader2, Info, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useLocationHierarchy } from "@/hooks/useLocationHierarchy";
import { useAssetData } from "@/hooks/useAssetData";
import { TicketDetailsSection } from "@/components/public-ticket/TicketDetailsSection";
import { LocationSection } from "@/components/public-ticket/LocationSection";
import { AssetSection } from "@/components/public-ticket/AssetSection";
import { ReporterSection } from "@/components/public-ticket/ReporterSection";
import { ImageUploadSection } from "@/components/public-ticket/ImageUploadSection";
import { ActionButtons } from "@/components/public-ticket/ActionButtons";
import { cn } from "@/lib/utils";

const glassCard =
  "bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl shadow-lg";

interface Branch {
  id: string;
  name: string;
  nameEn?: string;
  allowPublicTickets: boolean;
}

export default function PublicTicketPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const isRtl = locale === "ar";
  const slug = params.slug as string;
  const token = params.token as string;

  // Branch
  const [branch, setBranch] = useState<Branch | null>(null);
  const [branchError, setBranchError] = useState<string | null>(null);
  const [branchLoading, setBranchLoading] = useState(true);

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    reporterName: "",
    reporterEmail: "",
    phone: "",
    type: "MAINTENANCE",
    assetTypeId: "",
    assetId: "none",
  });

  // Hooks
  const { files, previews, addFiles, removeFile, resetFiles } = useFileUpload({
    maxFiles: 5,
    maxFileSizeMB: 5,
    isRtl,
  });

  const location = useLocationHierarchy({
    slug,
    token,
    branchId: branch?.id,
    isRtl,
  });

  const assetData = useAssetData({
    slug,
    token,
    roomId: location.roomId,
    assetTypeId: form.assetTypeId,
  });

  // ✅ استخراج fetchAssetTypes كمتغير مستقل لتجنب مشكلة التبعية
  const { fetchAssetTypes } = assetData;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  // ✅ useMemo لتجنب إعادة الإنشاء
  const ticketTypeMap = useMemo(
    () => ({
      MAINTENANCE: isRtl ? "صيانة" : "Maintenance",
      INCIDENT: isRtl ? "حادث" : "Incident",
    }),
    [isRtl]
  );

  // ✅ Theme - استخدام lazy initialization لتجنب setState في useEffect
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";

    const stored = localStorage.getItem("theme") as "light" | "dark" | null;

    if (stored) return stored;

    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  // ✅ تأثير جانبي فقط لتطبيق الكلاس على العنصر <html>
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const switchLanguage = () => {
    const newLocale = locale === "ar" ? "en" : "ar";
    router.push(`/${newLocale}/tickets/public/${slug}/${token}`);
  };

  const resetForm = useCallback(() => {
    resetFiles();
    setForm({
      title: "",
      description: "",
      reporterName: "",
      reporterEmail: "",
      phone: "",
      type: "MAINTENANCE",
      assetTypeId: "",
      assetId: "none",
    });
    if (location.resetLocation) {
      location.resetLocation();
    } else {
      location.handleBuildingChange("");
      location.handleFloorChange("");
      location.handleRoomChange("");
    }
    if (assetData.resetAssetData) {
      assetData.resetAssetData();
    }
    setShowSuccessDialog(false);
  }, [resetFiles, location, assetData]);

  // ✅ Branch validation & fetch asset types باستخدام fetchAssetTypes المستخرجة
  useEffect(() => {
    if (!slug || !token) return;

    const controller = new AbortController();

    const fetchBranch = async () => {
      setBranchLoading(true);
      setBranchError(null);

      try {
        const res = await fetch(
          `/api/public/branch?slug=${slug}&token=${token}`,
          {
            signal: controller.signal,
          }
        );

        const data = await res.json();

        if (!res.ok || !data?.branch) {
          setBranchError(
            isRtl
              ? "الرابط غير صالح أو منتهي الصلاحية"
              : "Invalid or expired link"
          );
          return;
        }

        if (data.branch.allowPublicTickets !== true) {
          setBranchError(
            isRtl
              ? "البلاغات العامة لهذا الفرع معطلة"
              : "Public tickets are disabled for this branch"
          );
          return;
        }

        setBranch(data.branch);

        await fetchAssetTypes();
      } catch (error: unknown) {
        if (error instanceof Error && error.name !== "AbortError") {
          setBranchError(
            isRtl
              ? "حدث خطأ أثناء الاتصال بالخادم"
              : "Server connection error"
          );
        }
      } finally {
        setBranchLoading(false);
      }
    };

    fetchBranch();

    return () => controller.abort();
  }, [slug, token, isRtl, fetchAssetTypes]); // ✅ استخدام fetchAssetTypes كتبعية

  // Submit
  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error(isRtl ? "يرجى كتابة عنوان البلاغ" : "Please enter ticket title");
      return;
    }
    if (!location.roomId) {
      toast.error(isRtl ? "يرجى اختيار موقع البلاغ" : "Please select ticket location");
      return;
    }
    if (!form.reporterName.trim()) {
      toast.error(isRtl ? "يرجى إدخال اسمك" : "Please enter your name");
      return;
    }
    if (!form.reporterEmail.trim()) {
      toast.error(isRtl ? "يرجى إدخال بريدك الإلكتروني" : "Please enter your email");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.reporterEmail)) {
      toast.error(isRtl ? "البريد الإلكتروني غير صالح" : "Invalid email address");
      return;
    }

    setIsSubmitting(true);
    const fd = new FormData();
    fd.append("slug", slug);
    fd.append("token", token);
    fd.append("roomId", location.roomId);
    fd.append("title", form.title);
    fd.append("description", form.description);
    fd.append("reporterName", form.reporterName);
    fd.append("reporterEmail", form.reporterEmail);
    fd.append("phone", form.phone);
    fd.append("type", form.type);
    if (form.assetId && form.assetId !== "none") fd.append("assetId", form.assetId);
    files.forEach((file) => fd.append("images", file));

    try {
      const res = await fetch("/api/public/tickets", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        setShowSuccessDialog(true);
      } else {
        toast.error(data.error || (isRtl ? "فشل الإرسال" : "Submission failed"));
      }
    } catch {
      toast.error(isRtl ? "خطأ في الاتصال" : "Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const ticketTypeOptions = useMemo(
    () => [
      { value: "MAINTENANCE", label: ticketTypeMap.MAINTENANCE },
      { value: "INCIDENT", label: ticketTypeMap.INCIDENT },
    ],
    [ticketTypeMap]
  );

  const buildingOptions = useMemo(
    () =>
      location.buildings.map((b) => ({
        value: b.id,
        label: isRtl ? b.name : b.nameEn || b.name,
      })),
    [location.buildings, isRtl]
  );

  const floorOptions = useMemo(
    () =>
      location.floors.map((f) => ({
        value: f.id,
        label: isRtl ? f.name : f.nameEn || f.name,
      })),
    [location.floors, isRtl]
  );

  const roomOptions = useMemo(
    () =>
      location.rooms.map((r) => ({
        value: r.id,
        label: isRtl ? r.name : r.nameEn || r.name,
      })),
    [location.rooms, isRtl]
  );

  const assetTypeOptions = useMemo(
    () => [
      { value: "", label: isRtl ? "جميع الأنواع" : "All types" },
      ...assetData.assetTypes.map((type) => ({
        value: type.id,
        label: `${isRtl ? type.name : type.nameEn || type.name} ${type.code ? `(${type.code})` : ""}`,
      })),
    ],
    [assetData.assetTypes, isRtl]
  );

  const assetOptions = useMemo(
    () => [
      { value: "none", label: isRtl ? "بدون أصل" : "No asset" },
      ...assetData.assets.map((asset) => ({
        value: asset.id,
        label: `${isRtl ? asset.name : asset.nameEn || asset.name} ${asset.code ? `(${asset.code})` : ""}`,
      })),
    ],
    [assetData.assets, isRtl]
  );

  if (branchLoading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 -z-10" />
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500 dark:text-indigo-400" />
      </div>
    );
  }

  if (branchError) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 -z-10" />
        <div className={cn(glassCard, "p-8 max-w-md w-full text-center relative overflow-hidden")}>
          <div className="relative z-10">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/30 dark:border-rose-800/30">
              <X className="h-8 w-8 text-rose-500 dark:text-rose-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3">
              {branchError}
            </h2>
            <Button
              onClick={() => router.push(`/${locale}`)}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/20"
            >
              {isRtl ? "العودة للرئيسية" : "Back to Home"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!branch) return null;

  return (
    <div className="relative min-h-screen py-8 px-4 sm:px-6">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20 dark:from-indigo-950/10 dark:via-transparent dark:to-purple-950/10 -z-10" />

      <div className="max-w-5xl mx-auto">
        <div className="flex justify-end gap-3 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={switchLanguage}
            className="rounded-full w-10 h-10 text-sm font-bold border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400"
            disabled={isSubmitting}
          >
            {locale === "ar" ? "EN" : "AR"}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full w-10 h-10 border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-600 dark:text-slate-400"
            disabled={isSubmitting}
          >
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </Button>
        </div>

        <div className={cn(glassCard, "overflow-hidden")}>
          <div className="p-6 md:p-10 space-y-8">
            <div className="flex items-center gap-4 border-b border-slate-200/50 dark:border-slate-800/50 pb-5">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border border-indigo-200/30 dark:border-indigo-800/30 shadow-lg shadow-indigo-500/5">
                <Send className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {isRtl ? "بلاغ صيانة جديد" : "New Maintenance Ticket"}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {isRtl ? branch.name : branch.nameEn || branch.name}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-8">
                <TicketDetailsSection
                  type={form.type}
                  onTypeChange={(val) => setForm((prev) => ({ ...prev, type: val }))}
                  title={form.title}
                  onTitleChange={(val) => setForm((prev) => ({ ...prev, title: val }))}
                  description={form.description}
                  onDescriptionChange={(val) => setForm((prev) => ({ ...prev, description: val }))}
                  ticketTypeOptions={ticketTypeOptions}
                  isRtl={isRtl}
                  disabled={isSubmitting}
                />

                <LocationSection
                  buildingId={location.buildingId}
                  floorId={location.floorId}
                  roomId={location.roomId}
                  buildings={buildingOptions}
                  floors={floorOptions}
                  rooms={roomOptions}
                  loadingBuildings={location.loadingBuildings}
                  loadingFloors={location.loadingFloors}
                  loadingRooms={location.loadingRooms}
                  onBuildingChange={location.handleBuildingChange}
                  onFloorChange={location.handleFloorChange}
                  onRoomChange={location.handleRoomChange}
                  isRtl={isRtl}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-8">
                <ReporterSection
                  name={form.reporterName}
                  email={form.reporterEmail}
                  phone={form.phone}
                  onNameChange={(val) => setForm((prev) => ({ ...prev, reporterName: val }))}
                  onEmailChange={(val) => setForm((prev) => ({ ...prev, reporterEmail: val }))}
                  onPhoneChange={(val) => setForm((prev) => ({ ...prev, phone: val }))}
                  isRtl={isRtl}
                  disabled={isSubmitting}
                />

                <AssetSection
                  roomId={location.roomId}
                  assetTypeId={form.assetTypeId}
                  assetId={form.assetId}
                  assetTypes={assetTypeOptions}
                  assets={assetOptions}
                  loadingAssetTypes={assetData.loadingAssetTypes}
                  loadingAssets={assetData.loadingAssets}
                  onAssetTypeChange={(val) =>
                    setForm((prev) => ({ ...prev, assetTypeId: val, assetId: "none" }))
                  }
                  onAssetChange={(val) => setForm((prev) => ({ ...prev, assetId: val }))}
                  isRtl={isRtl}
                  disabled={isSubmitting}
                />

                <ImageUploadSection
                  files={files}
                  previews={previews}
                  onAddFiles={addFiles}
                  onRemoveFile={removeFile}
                  isRtl={isRtl}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <ActionButtons
              onSubmit={handleSubmit}
              onCancel={() => router.back()}
              isSubmitting={isSubmitting}
              isRtl={isRtl}
            />

            <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-800/30 flex items-start gap-3 text-sm">
              <Info size={18} className="text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
              <span className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {isRtl
                  ? "سيتم إرسال إشعار لفريق الصيانة. يمكنك متابعة الحالة عبر البريد الإلكتروني."
                  : "Maintenance team will be notified. You can track the ticket status via email."}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md text-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-3xl shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 dark:from-emerald-500/20 dark:to-green-500/20 border border-emerald-200/30 dark:border-emerald-800/30 shadow-lg shadow-emerald-500/5">
            <CheckCircle className="h-8 w-8 text-emerald-500 dark:text-emerald-400" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-2">
              {isRtl ? "تم إرسال البلاغ بنجاح" : "Ticket Submitted Successfully"}
            </DialogTitle>
            <DialogDescription className="text-base text-slate-500 dark:text-slate-400 pt-2">
              {isRtl
                ? "شكراً لك. سيتم معالجة طلبك في أقرب وقت."
                : "Thank you. Your request will be processed shortly."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button
              onClick={resetForm}
              className="w-full gap-2 h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/20"
            >
              <Send size={18} />
              {isRtl ? "تقديم بلاغ آخر" : "Submit Another Ticket"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}