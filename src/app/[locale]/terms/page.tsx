'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function TermsPage() {
  const params = useParams();
  const locale = params?.locale as string;
  const isArabic = locale === 'ar';
  const t = useTranslations('Terms');

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

          {/* قبول الشروط */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('acceptance.title')}</h2>
            <p className="text-muted-foreground">{t('acceptance.text')}</p>
          </section>

          {/* وصف الخدمة */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('description.title')}</h2>
            <p className="text-muted-foreground">{t('description.text1')}</p>
          </section>

          {/* حساب المستخدم */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('account.title')}</h2>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>{t('account.point1')}</li>
              <li>{t('account.point2')}</li>
              <li>{t('account.point3')}</li>
            </ul>
          </section>

          {/* التزامات المستخدم */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('userObligations.title')}</h2>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>{t('userObligations.point1')}</li>
              <li>{t('userObligations.point2')}</li>
              <li>{t('userObligations.point3')}</li>
              <li>{t('userObligations.point4')}</li>
            </ul>
          </section>

          {/* الدفع والاشتراكات */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('payments.title')}</h2>
            <p className="text-muted-foreground">{t('payments.text')}</p>
          </section>

          {/* الملكية الفكرية */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('intellectualProperty.title')}</h2>
            <p className="text-muted-foreground">{t('intellectualProperty.text')}</p>
          </section>

          {/* حدود المسؤولية */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('limitation.title')}</h2>
            <p className="text-muted-foreground">{t('limitation.text')}</p>
          </section>

          {/* إنهاء الخدمة */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('termination.title')}</h2>
            <p className="text-muted-foreground">{t('termination.text')}</p>
          </section>

          {/* تعديل الشروط */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('changes.title')}</h2>
            <p className="text-muted-foreground">{t('changes.text')}</p>
          </section>

          {/* القانون الحاكم */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('governingLaw.title')}</h2>
            <p className="text-muted-foreground">{t('governingLaw.text')}</p>
          </section>

          {/* الاتصال بنا */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">{t('contact.title')}</h2>
            <p className="text-muted-foreground">{t('contact.text')}</p>
            <p className="text-muted-foreground mt-2">{t('contact.email')}</p>
            <p className="text-muted-foreground">{t('contact.address')}</p>
          </section>
        </div>
      </div>
    </div>
  );
}