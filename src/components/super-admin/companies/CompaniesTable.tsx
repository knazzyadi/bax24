'use client';

interface Company {
  id: string;
  name: string;
  nameEn: string | null;
  isActive: boolean;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  adminEmail?: string | null;
  adminName?: string | null;
}

interface CompaniesTableProps {
  companies: Company[];
  onEdit: (company: Company) => void;
  onToggleStatus: (id: string, current: boolean) => void;
}

export default function CompaniesTable({
  companies = [],
  onEdit,
  onToggleStatus,
}: CompaniesTableProps) {
  // التأكد من أن companies مصفوفة قبل استخدام map
  if (!Array.isArray(companies) || companies.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        لا توجد شركات مسجلة حالياً
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-card border border-border rounded-lg">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-2 text-right">#</th>
            <th className="px-4 py-2 text-right">اسم الشركة (عربي)</th>
            <th className="px-4 py-2 text-right">اسم الشركة (إنجليزي)</th>
            <th className="px-4 py-2 text-right">البريد الإلكتروني للمدير</th>
            <th className="px-4 py-2 text-right">الحالة</th>
            <th className="px-4 py-2 text-right">تاريخ الاشتراك</th>
            <th className="px-4 py-2 text-right">تاريخ الانتهاء</th>
            <th className="px-4 py-2 text-right">الإجراءات</th>
           </tr>
        </thead>
        <tbody>
          {companies.map((company, idx) => (
            <tr key={company.id} className="border-b border-border hover:bg-muted/30 transition">
              <td className="px-4 py-2">{idx + 1}</td>
              <td className="px-4 py-2">{company.name}</td>
              <td className="px-4 py-2">{company.nameEn || '—'}</td>
              <td className="px-4 py-2">{company.adminEmail || '—'}</td>
              <td className="px-4 py-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    company.isActive
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  }`}
                >
                  {company.isActive ? 'نشط' : 'معطل'}
                </span>
              </td>
              <td className="px-4 py-2">
                {company.subscriptionStartDate
                  ? new Date(company.subscriptionStartDate).toLocaleDateString()
                  : '—'}
              </td>
              <td className="px-4 py-2">
                {company.subscriptionEndDate
                  ? new Date(company.subscriptionEndDate).toLocaleDateString()
                  : '—'}
              </td>
              <td className="px-4 py-2">
                <button
                  onClick={() => onEdit(company)}
                  className="text-indigo-600 hover:underline ml-2"
                >
                  تعديل
                </button>
                <button
                  onClick={() => onToggleStatus(company.id, company.isActive)}
                  className={`px-3 py-1 rounded text-xs font-medium transition ${
                    company.isActive
                      ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300'
                      : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300'
                  }`}
                >
                  {company.isActive ? 'تعطيل' : 'تفعيل'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}