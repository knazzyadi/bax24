"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

export default function PublicTicketPage() {
  const params = useParams();
  const router = useRouter();

  const slug = params.slug as string;
  const token = params.token as string;

  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);

  const [branchName, setBranchName] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    reporterName: "",
    reporterEmail: "",
    phone: "",
    roomId: "",
    type: "MAINTENANCE",
  });

  const [image, setImage] = useState<File | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);

  // ======================
  // 1. التحقق من الفرع أولاً
  // ======================
  useEffect(() => {
    const validateBranch = async () => {
      setValidating(true);

      try {
        const res = await fetch(
          `/api/public/branch?slug=${slug}&token=${token}`
        );

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "رابط غير صالح");
          router.push("/");
          return;
        }

        setBranchName(data.branch.name);
      } catch {
        toast.error("فشل الاتصال بالخادم");
        router.push("/");
      } finally {
        setValidating(false);
      }
    };

    validateBranch();
  }, [slug, token]);

  // ======================
  // 2. جلب الغرف
  // ======================
  useEffect(() => {
    if (!slug || !token) return;

    const fetchRooms = async () => {
      try {
        const res = await fetch(
          `/api/public/rooms?slug=${slug}&token=${token}`
        );

        const data = await res.json();

        if (res.ok) {
          setRooms(data.rooms || []);
        }
      } catch {}
    };

    fetchRooms();
  }, [slug, token]);

  // ======================
  // 3. إرسال البلاغ
  // ======================
  const handleSubmit = async () => {
    if (!form.title || !form.roomId || !form.reporterName || !form.reporterEmail) {
      toast.error("يرجى تعبئة البيانات المطلوبة");
      return;
    }

    setLoading(true);

    try {
      const fd = new FormData();

      fd.append("slug", slug);
      fd.append("token", token);

      Object.entries(form).forEach(([key, value]) => {
        fd.append(key, value);
      });

      if (image) fd.append("image", image);

      const res = await fetch("/api/public/tickets", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "فشل الإرسال");
        return;
      }

      toast.success("تم إرسال البلاغ بنجاح 🎉");

      router.push(`/${params.locale}/tickets/public/success`);
    } catch {
      toast.error("خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  };

  // ======================
  // Loading
  // ======================
  if (validating) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        جاري التحقق من الرابط...
      </div>
    );
  }

  // ======================
  // UI
  // ======================
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow p-6 space-y-4">

        <h1 className="text-xl font-bold text-center">
          بلاغ إلى: {branchName}
        </h1>

        <input
          className="w-full border p-2 rounded"
          placeholder="عنوان البلاغ"
          value={form.title}
          onChange={(e) =>
            setForm({ ...form, title: e.target.value })
          }
        />

        <textarea
          className="w-full border p-2 rounded"
          placeholder="الوصف"
          rows={4}
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
        />

        <select
          className="w-full border p-2 rounded"
          value={form.roomId}
          onChange={(e) =>
            setForm({ ...form, roomId: e.target.value })
          }
        >
          <option value="">اختر الغرفة</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        <input
          className="w-full border p-2 rounded"
          placeholder="اسم المبلغ"
          value={form.reporterName}
          onChange={(e) =>
            setForm({ ...form, reporterName: e.target.value })
          }
        />

        <input
          className="w-full border p-2 rounded"
          placeholder="البريد الإلكتروني"
          value={form.reporterEmail}
          onChange={(e) =>
            setForm({ ...form, reporterEmail: e.target.value })
          }
        />

        <input
          className="w-full border p-2 rounded"
          placeholder="رقم الجوال"
          value={form.phone}
          onChange={(e) =>
            setForm({ ...form, phone: e.target.value })
          }
        />

        <input
          type="file"
          onChange={(e) =>
            setImage(e.target.files?.[0] || null)
          }
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded"
        >
          {loading ? "جاري الإرسال..." : "إرسال البلاغ"}
        </button>

      </div>
    </div>
  );
}