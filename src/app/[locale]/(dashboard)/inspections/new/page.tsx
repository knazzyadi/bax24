"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { InspectionForm } from "../InspectionForm";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { AdminGuard } from "@/lib/client-guard";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, ClipboardCheck, Sparkles } from "lucide-react";

// ============================================================
// 1. الأنواع
// ============================================================
interface Section {
  id: string;
  name: string;
  nameAr: string | null;
}

interface Template {
  id: string;
  name: string;
  nameAr: string | null;
  sectionId: string;
}

interface Category {
  id: string;
  name: string;
  nameAr: string | null;
  templateId: string;
  _count: { items: number };
}

interface Branch {
  id: string;
  name: string;
  nameEn: string | null;
}

interface InspectionGroup {
  sectionId: string;
  templateId: string;
  categoryIds: string[];
}

// ============================================================
// 2. المكون الرئيسي
// ============================================================
export default function NewInspectionPage() {
  const router = useRouter();
  const locale = useLocale();
  const isRtl = locale === "ar";

  // ============================================================
  // 2.1 State
  // ============================================================
  const [sections, setSections] = useState<Section[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [inspectionTitle, setInspectionTitle] = useState("");
  const [scheduledDate, setScheduledDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [branchId, setBranchId] = useState("");

  const [groups, setGroups] = useState<InspectionGroup[]>([
    {
      sectionId: "",
      templateId: "",
      categoryIds: [],
    },
  ]);

  // ============================================================
  // 2.2 جلب البيانات
  // ============================================================
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/inspections/new-data");
        if (!response.ok) {
          throw new Error("Failed to fetch new inspection data");
        }
        const data = await response.json();
        const {
          sections: sectionsData,
          templates: templatesData,
          categories: categoriesData,
          branches: branchesData,
        } = data;

        setSections(sectionsData);
        setTemplates(templatesData);
        setCategories(categoriesData);
        setBranches(branchesData);

        if (branchesData.length > 0) {
          setBranchId(branchesData[0].id);
        }

        // تهيئة مجموعة فحص فارغة
        if (sectionsData.length > 0) {
          setGroups([
            {
              sectionId: "",
              templateId: "",
              categoryIds: [],
            },
          ]);
        }
      } catch {
        toast.error(isRtl ? "فشل في تحميل البيانات" : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [isRtl]);

  // ============================================================
  // 2.3 دوال مساعدة
  // ============================================================
  const getLocalizedName = useCallback(
    (item: { name: string; nameAr?: string | null }) => {
      if (isRtl && item.nameAr) return item.nameAr;
      return item.name;
    },
    [isRtl]
  );

  const getTemplatesForSection = useCallback(
    (sectionId: string) => {
      return templates.filter((t) => t.sectionId === sectionId);
    },
    [templates]
  );

  const getCategoriesForTemplate = useCallback(
    (templateId: string) => {
      return categories.filter((c) => c.templateId === templateId);
    },
    [categories]
  );

  // ============================================================
  // 2.4 معالجة تغيير القسم والنموذج
  // ============================================================
  const updateGroup = (
    index: number,
    updates: Partial<InspectionGroup>
  ) => {
    setGroups((prev) =>
      prev.map((group, i) =>
        i === index ? { ...group, ...updates } : group
      )
    );
  };

  const handleSectionChange = (
    index: number,
    newSectionId: string
  ) => {
    updateGroup(index, {
      sectionId: newSectionId,
      templateId: "",
      categoryIds: [],
    });
  };

  const handleTemplateChange = (
    index: number,
    newTemplateId: string
  ) => {
    const templateCategories =
      getCategoriesForTemplate(newTemplateId);

    updateGroup(index, {
      templateId: newTemplateId,
      categoryIds: templateCategories.map(
        (category) => category.id
      ),
    });
  };

  const addGroup = () => {
    setGroups((prev) => [
      ...prev,
      {
        sectionId: "",
        templateId: "",
        categoryIds: [],
      },
    ]);
  };

  const removeGroup = (index: number) => {
    setGroups((prev) =>
      prev.length <= 1
        ? prev
        : prev.filter((_, i) => i !== index)
    );
  };

  // ============================================================
  // 2.5 خيارات القوائم
  // ============================================================
  const getSectionOptions = useMemo(() => {
    return sections.map((s) => ({
      value: s.id,
      label: getLocalizedName(s),
    }));
  }, [sections, getLocalizedName]);

  const getBranchOptions = useMemo(() => {
    return branches.map((b) => ({
      value: b.id,
      label: getLocalizedName(b),
    }));
  }, [branches, getLocalizedName]);

  // ============================================================
  // 2.6 التحقق من صحة النموذج (مع التاريخ)
  // ============================================================
  const isFormValid = useMemo(() => {
    return (
      inspectionTitle.trim() !== "" &&
      scheduledDate.trim() !== "" &&
      branchId !== "" &&
      groups.length > 0 &&
      groups.every(
        (group) =>
          group.sectionId !== "" &&
          group.templateId !== "" &&
          group.categoryIds.length > 0
      )
    );
  }, [inspectionTitle, scheduledDate, branchId, groups]);

  // ============================================================
  // 2.7 الملخص
  // ============================================================
  const summary = useMemo(() => {
    return groups.map((group) => {
      const section = sections.find(
        (s) => s.id === group.sectionId
      );

      const template = templates.find(
        (t) => t.id === group.templateId
      );

      const selectedCategories = categories.filter((c) =>
        group.categoryIds.includes(c.id)
      );

      const itemsCount = selectedCategories.reduce(
        (sum, cat) => sum + (cat._count?.items || 0),
        0
      );

      return {
        sectionName: section
          ? getLocalizedName(section)
          : null,
        templateName: template
          ? getLocalizedName(template)
          : null,
        categoryNames: selectedCategories.map((c) =>
          getLocalizedName(c)
        ),
        itemsCount,
      };
    });
  }, [
    groups,
    sections,
    templates,
    categories,
    getLocalizedName,
  ]);

  // ============================================================
  // 2.8 الإرسال
  // ============================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      toast.error(
        isRtl
          ? "يرجى ملء جميع الحقول واختيار الفرع والقسم والنموذج وفئة واحدة على الأقل"
          : "Please fill all fields and select branch, section, template, and at least one category"
      );
      return;
    }

    const payload = {
      title: inspectionTitle.trim(),
      scheduledDate,
      branchId,
      items: groups,
    };

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "فشل في إنشاء الفحص");
      }

      toast.success(
        isRtl ? "✅ تم إنشاء الفحص بنجاح" : "✅ Inspection created successfully"
      );
      router.push(`/${locale}/inspections`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : isRtl
          ? "حدث خطأ غير معروف"
          : "Unknown error occurred";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================
  // 2.9 العرض
  // ============================================================
  if (loading) {
    return (
      <AdminGuard>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      </AdminGuard>
    );
  }

  const formData = {
    inspectionTitle,
    scheduledDate,
    branchId,
    groups,
  };

  const formActions = {
    setInspectionTitle,
    setScheduledDate,
    setBranchId,

    setSectionId: handleSectionChange,
    setTemplateId: handleTemplateChange,

    setCategoryIds: (index: number, categoryIds: string[]) => {
      updateGroup(index, { categoryIds });
    },

    addGroup,
    removeGroup,
  };

  return (
    <AdminGuard>
      <div className="container max-w-4xl py-4 sm:py-8 mx-auto">
        <Card className="border-0 shadow-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl overflow-hidden">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-500/5 dark:via-purple-500/5 dark:to-pink-500/5" />
            <CardHeader className="relative">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 dark:from-indigo-500/30 dark:to-purple-500/30 border border-indigo-200/30 dark:border-indigo-800/30 shadow-lg shadow-indigo-500/10">
                  <ClipboardCheck className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <CardTitle className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">
                    {isRtl ? "فحص جديد" : "New Inspection"}
                  </CardTitle>
                  <CardDescription className="text-slate-500 dark:text-slate-400 flex items-center gap-2 text-sm sm:text-base">
                    <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-400" />
                    {isRtl
                      ? "اختر القسم والنموذج والفئات المطلوبة"
                      : "Select section, template, and required categories"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </div>

          <InspectionForm
            mode="create"
            onSubmit={handleSubmit}
            isRtl={isRtl}
            data={formData}
            actions={formActions}
            branchOptions={getBranchOptions}
            sectionOptions={getSectionOptions}
            getTemplatesForSection={getTemplatesForSection}
            getCategoriesForTemplate={getCategoriesForTemplate}
            getLocalizedName={getLocalizedName}
            summary={summary}
            isSubmitting={isSubmitting}
            isFormValid={isFormValid}
            locale={locale}
            router={router}
          />
        </Card>
      </div>
    </AdminGuard>
  );
}