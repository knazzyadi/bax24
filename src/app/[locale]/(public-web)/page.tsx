'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Wrench,
  BarChart3,
  Clock,
  ArrowRight,
  ShieldCheck,
  Award,
  Users,
  CheckCircle,
  Star,
} from 'lucide-react';

export default function HomePage() {
  const params = useParams();
  const locale = params?.locale as string;
  const isArabic = locale === 'ar';
  const t = useTranslations('Landing');

  // الميزات الحالية (مأخوذة من الترجمة)
  const features = [
    { icon: Building2, text: t('feature1') },
    { icon: Wrench, text: t('feature2') },
    { icon: BarChart3, text: t('feature3') },
    { icon: Clock, text: t('feature4') },
  ];

  // الإحصائيات الحالية
  const stats = [
    { value: '500+', label: t('stats_facilities') },
    { value: '2k+', label: t('stats_maintenance') },
    { value: '150+', label: t('stats_users') },
  ];

  // نقاط القوة المضافة (يمكن إضافتها للترجمة لاحقاً)
  const uniquePoints = [
    {
      icon: ShieldCheck,
      title: isArabic ? 'متوافق مع سيباهي' : 'SEPAH-compliant',
      desc: isArabic
        ? 'نلتزم بأعلى معايير الجودة والسلامة في إدارة المرافق الصحية'
        : 'We adhere to the highest quality and safety standards in healthcare facility management',
    },
    {
      icon: Award,
      title: isArabic ? 'الوحيدون المختصصين في الشرق الأوسط' : 'The Only One in the Middle East',
      desc: isArabic
        ? 'خبرة حصرية في إدارة مرافق المستشفيات وفق أفضل الممارسات العالمية'
        : 'Exclusive expertise in hospital facility management using global best practices',
    },
    {
      icon: Users,
      title: isArabic ? 'فريق متخصص' : 'Specialized Team',
      desc: isArabic
        ? 'كادر من المهندسين والفنيين المدربين على أعلى المستويات'
        : 'A team of engineers and technicians trained to the highest levels',
    },
  ];

  // شركاء (للتوضيح فقط)
  const partners = [
    { name: 'Siemens', logo: '🔷' },
    { name: 'Schneider Electric', logo: '⚡' },
    { name: 'Honeywell', logo: '🌀' },
    { name: 'Johnson Controls', logo: '📊' },
  ];

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      className="min-h-screen bg-background text-foreground overflow-x-hidden"
    >
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden py-20 md:py-28">
        {/* الخلفية المتدرجة مع نقش */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/90 via-indigo-900/80 to-purple-900/90 dark:from-indigo-950/95 dark:via-indigo-900/95 dark:to-purple-950/95" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48cGF0aCBkPSJNMzAgMTBhMjAgMjAgMCAwIDEtMjAgMjAgMjAgMjAgMCAwIDEgMjAtMjB6IiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-20" />

        {/* عناصر عائمة */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 text-center">
          {/* شارة مميزة */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-6 text-sm text-white/90 shadow-lg">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span>{isArabic ? 'الوحيدون في الشرق الأوسط' : 'The Only One in the Middle East'}</span>
            <span className="w-1 h-1 bg-white/30 rounded-full" />
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              {isArabic ? 'متوافق مع سيباهي' : 'SEPAH-compliant'}
            </span>
          </div>

          <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight leading-tight text-white drop-shadow-lg">
            <span className="bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-300 bg-clip-text text-transparent">
              {t('title')}
            </span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href={`/${locale}/register`}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-900 font-semibold hover:scale-105 transition-all shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50"
            >
              {t('register')}
              <ArrowRight
                className={`w-4 h-4 transition-transform ${
                  isArabic ? 'rotate-180' : ''
                }`}
              />
            </Link>

            <Link
              href={`/${locale}/login`}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all shadow-lg"
            >
              {t('login')}
            </Link>
          </div>

          {/* مؤشرات الثقة */}
          <div className="mt-12 flex flex-wrap justify-center gap-6 text-white/60 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              {isArabic ? 'متوافق مع متطلبات سباهي' : 'CBAHI compliant'}
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              {isArabic ? 'خبرة ممتدة في المجال الطبي' : 'Extensive experience in the medical'}
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              {isArabic ? 'إدارة متكاملة للمرافق والسلامة' : 'Integrated facilities and safety management'}
            </div>
          </div>
        </div>
      </section>

      {/* ================= لماذا نحن (القيمة الفريدة) ================= */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              {isArabic ? 'لماذا نحن؟' : 'Why Us?'}
            </h2>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              {isArabic
                ? 'خبرة استثنائية في إدارة مرافق المستشفيات مع التزام كامل بالجودة'
                : 'Exceptional expertise in hospital facility management with full commitment to quality'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {uniquePoints.map((point, idx) => (
              <div
                key={idx}
                className="group p-6 rounded-2xl bg-card border border-border shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 hover:border-indigo-400/50"
              >
                <div className="w-14 h-14 mb-4 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 flex items-center justify-center">
                  <point.icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{point.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{point.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              {t('features_title')}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="group p-6 rounded-2xl bg-card border border-border shadow-md hover:shadow-2xl transition-all hover:-translate-y-1 hover:border-indigo-300/50"
              >
                <div className="w-12 h-12 mb-4 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= STATS ================= */}
      <section className="py-20 bg-muted/40">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-12">
            {t('stats_title')}
          </h2>

          <div className="grid md:grid-cols-3 gap-10">
            {stats.map((stat, idx) => (
              <div key={idx} className="group">
                <p className="text-5xl font-extrabold text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition">
                  {stat.value}
                </p>
                <p className="mt-2 text-muted-foreground text-lg">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= الشركاء (إضافة) ================= */}
      <section className="py-16 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-semibold text-muted-foreground/70">
              {isArabic ? 'شركاء النجاح' : 'Partners'}
            </h3>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-60 grayscale hover:grayscale-0 transition duration-500">
            {partners.map((p, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xl font-medium text-muted-foreground/80">
                <span className="text-3xl">{p.logo}</span>
                <span>{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center rounded-3xl bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-700 text-white p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48cGF0aCBkPSJNMzAgMTBhMjAgMjAgMCAwIDEtMjAgMjAgMjAgMjAgMCAwIDEgMjAtMjB6IiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-10" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 drop-shadow">
              {t('cta_title')}
            </h2>
            <p className="text-indigo-100 mb-8 text-lg">
              {t('cta_subtitle')}
            </p>
            <Link
              href={`/${locale}/register`}
              className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-white text-indigo-700 font-semibold hover:scale-105 transition shadow-xl hover:shadow-2xl"
            >
              {t('register')}
              <ArrowRight
                className={`w-4 h-4 ${isArabic ? 'rotate-180' : ''}`}
              />
            </Link>
          </div>
        </div>
      </section>

      {/* ================= Footer خفيف ================= */}
    </div>
  );
}