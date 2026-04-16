'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function PrivacyPage() {
  const params = useParams();
  const locale = params?.locale as string;
  const isArabic = locale === 'ar';
  const t = useTranslations('Privacy');

  return (
    <div dir={isArabic ? 'rtl' : 'ltr'} className="min-h-screen bg-background text-foreground py-8">
      {/* زر العودة للرئيسية */}
      <div className="max-w-4xl mx-auto px-6 pt-2">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition"
        >
          <Home className="w-5 h-5" />
          <span>{t('home')}</span>
        </Link>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">{t('title')}</h1>
        <p className="text-sm text-muted-foreground mb-8">{t('lastUpdated')}</p>

        <div className="space-y-8">
          {/* مقدمة */}
          <section>
            <p className="text-muted-foreground leading-relaxed">{t('intro')}</p>
          </section>

          {/* جمع البيانات */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('dataCollection.title')}</h2>
            <p className="text-muted-foreground mb-3">{t('dataCollection.text1')}</p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>{t('dataCollection.point1')}</li>
              <li>{t('dataCollection.point2')}</li>
              <li>{t('dataCollection.point3')}</li>
              <li>{t('dataCollection.point4')}</li>
            </ul>
          </section>

          {/* استخدام البيانات */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('dataUsage.title')}</h2>
            <p className="text-muted-foreground mb-3">{t('dataUsage.text1')}</p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>{t('dataUsage.point1')}</li>
              <li>{t('dataUsage.point2')}</li>
              <li>{t('dataUsage.point3')}</li>
              <li>{t('dataUsage.point4')}</li>
            </ul>
          </section>

          {/* مشاركة البيانات */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('dataSharing.title')}</h2>
            <p className="text-muted-foreground mb-3">{t('dataSharing.text1')}</p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>{t('dataSharing.point1')}</li>
              <li>{t('dataSharing.point2')}</li>
              <li>{t('dataSharing.point3')}</li>
            </ul>
          </section>

          {/* أمان البيانات */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('dataSecurity.title')}</h2>
            <p className="text-muted-foreground mb-3">{t('dataSecurity.text1')}</p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>{t('dataSecurity.point1')}</li>
              <li>{t('dataSecurity.point2')}</li>
              <li>{t('dataSecurity.point3')}</li>
            </ul>
          </section>

          {/* حقوق المستخدم */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('userRights.title')}</h2>
            <p className="text-muted-foreground mb-3">{t('userRights.text1')}</p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>{t('userRights.point1')}</li>
              <li>{t('userRights.point2')}</li>
              <li>{t('userRights.point3')}</li>
              <li>{t('userRights.point4')}</li>
              <li>{t('userRights.point5')}</li>
            </ul>
            <p className="text-muted-foreground mt-3">{t('userRights.contactText')}</p>
          </section>

          {/* ملفات تعريف الارتباط */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('cookies.title')}</h2>
            <p className="text-muted-foreground">{t('cookies.text1')}</p>
          </section>

          {/* التغييرات */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('changes.title')}</h2>
            <p className="text-muted-foreground">{t('changes.text1')}</p>
          </section>

          {/* اتصل بنا */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('contact.title')}</h2>
            <p className="text-muted-foreground">{t('contact.text1')}</p>
            <p className="text-muted-foreground mt-2">{t('contact.email')}</p>
            <p className="text-muted-foreground">{t('contact.address')}</p>
          </section>
        </div>
      </div>
    </div>
  );
}