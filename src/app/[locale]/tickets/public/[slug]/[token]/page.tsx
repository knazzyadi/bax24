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

// Types
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
    isRtl,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const ticketTypeMap: Record<string, string> = {
    MAINTENANCE: isRtl ? "صيانة" : "Maintenance",
    INCIDENT: isRtl ? "حادث" : "Incident",
  };

  // Theme & Language
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const stored = localStorage.getItem("theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = stored ?? (prefersDark ? "dark" : "light");
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };
  const switchLanguage = () => {
    const newLocale = locale === "ar" ? "en" : "ar";
    router.push(`/${newLocale}/tickets/public/${slug}/${token}`);
  };

  // Branch validation & fetch asset types
  useEffect(() => {
    if (!slug || !token) return;
    const controller = new AbortController();
    const fetchBranch = async () => {
      setBranchLoading(true);
      setBranchError(null);
      try {
        const res = await fetch(`/api/public/branch?slug=${slug}&token=${token}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        if (!res.ok || !data?.branch) {
          setBranchError(isRtl ? "الرابط غير صالح أو منتهي الصلاحية" : "Invalid or expired link");
          return;
        }
        if (data.branch.allowPublicTickets !== true) {
          setBranchError(isRtl ? "البلاغات العامة لهذا الفرع معطلة" : "Public tickets are disabled for this branch");
          return;
        }
        setBranch(data.branch);
        await assetData.fetchAssetTypes();
      } catch (error: any) {
        if (error?.name !== "AbortError") {
          setBranchError(isRtl ? "حدث خطأ أثناء الاتصال بالخادم" : "Server connection error");
        }
      } finally {
        setBranchLoading(false);
      }
    };
    fetchBranch();
    return () => controller.abort();
  }, [slug, token, isRtl, assetData.fetchAssetTypes]);

  // Reset form
  const resetForm = () => {
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
    location.handleBuildingChange("");
    location.handleFloorChange("");
    location.handleRoomChange("");
    setShowSuccessDialog(false);
  };

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
    files.forEach(file => fd.append("images", file));

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

  // Memoized options for selects
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

  // Loading & error states
  if (branchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground text-lg">{isRtl ? "جاري التحقق..." : "Verifying..."}</div>
      </div>
    );
  }

  if (branchError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-xl p-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <X className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">{branchError}</h2>
          <p className="text-muted-foreground mb-6">
            {isRtl
              ? "يرجى التأكد من صحة الرابط أو التواصل مع الإدارة."
              : "Please verify the link or contact the administrator."}
          </p>
          <Button onClick={() => router.push(`/${locale}`)} className="w-full h-11 rounded-xl text-base">
            {isRtl ? "العودة للرئيسية" : "Back to Home"}
          </Button>
        </div>
      </div>
    );
  }

  if (!branch) return null;

  // Main UI
  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Top controls */}
        <div className="flex justify-end gap-3 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={switchLanguage}
            className="rounded-full w-10 h-10 text-sm font-bold"
            disabled={isSubmitting}
          >
            {locale === "ar" ? "EN" : "AR"}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full w-10 h-10"
            disabled={isSubmitting}
          >
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </Button>
        </div>

        {/* Main card */}
        <div className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden">
          <div className="p-6 md:p-10 space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-border pb-5">
              <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <Send size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {isRtl ? "بلاغ صيانة جديد" : "New Maintenance Ticket"}
                </h1>
                <p className="text-base text-muted-foreground mt-1">
                  {isRtl ? branch.name : branch.nameEn || branch.name}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* LEFT COLUMN */}
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

              {/* RIGHT COLUMN */}
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

            {/* Info note */}
            <div className="bg-primary/5 rounded-xl p-4 text-sm text-muted-foreground flex gap-3">
              <Info size={18} className="shrink-0 mt-0.5" />
              {isRtl
                ? "سيتم إرسال إشعار لفريق الصيانة. يمكنك متابعة الحالة عبر البريد الإلكتروني."
                : "Maintenance team will be notified. You can track the ticket status via email."}
            </div>
          </div>
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold mt-2">
              {isRtl ? "تم إرسال البلاغ بنجاح" : "Ticket Submitted Successfully"}
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              {isRtl
                ? "شكراً لك. سيتم معالجة طلبك في أقرب وقت."
                : "Thank you. Your request will be processed shortly."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button onClick={resetForm} className="w-full gap-2">
              <Send size={18} />
              {isRtl ? "تقديم بلاغ آخر" : "Submit Another Ticket"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}