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
} from 'lucide-react';

export default function HomePage() {
  const params = useParams();
  const locale = params?.locale as string;
  const isArabic = locale === 'ar';
  const t = useTranslations('Landing');

  const features = [
    { icon: Building2, text: t('feature1') },
    { icon: Wrench, text: t('feature2') },
    { icon: BarChart3, text: t('feature3') },
    { icon: Clock, text: t('feature4') },
  ];

  const stats = [
    { value: '500+', label: t('stats_facilities') },
    { value: '2k+', label: t('stats_maintenance') },
    { value: '150+', label: t('stats_users') },
  ];

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      className="min-h-screen bg-background text-foreground"
    >
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/40 to-purple-100/40 dark:from-indigo-900/20 dark:to-purple-900/20" />

        <div className="relative max-w-7xl mx-auto px-6 py-24 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {t('title')}
            </span>
          </h1>

          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href={`/${locale}/register`}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all hover:scale-105"
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
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl border border-border bg-card hover:bg-muted transition"
            >
              {t('login')}
            </Link>
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="py-24">
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
                className="group p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className="w-12 h-12 mb-4 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>

                <p className="text-sm text-muted-foreground">
                  {feature.text}
                </p>
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
              <div key={idx}>
                <p className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">
                  {stat.value}
                </p>
                <p className="mt-2 text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-12 shadow-xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('cta_title')}
          </h2>

          <p className="text-indigo-100 mb-8">
            {t('cta_subtitle')}
          </p>

          <Link
            href={`/${locale}/register`}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-white text-indigo-600 font-semibold hover:scale-105 transition"
          >
            {t('register')}
            <ArrowRight
              className={`w-4 h-4 ${isArabic ? 'rotate-180' : ''}`}
            />
          </Link>
        </div>
      </section>
    </div>
  );
}