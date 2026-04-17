'use client';

interface Company {
  id: string;
  name: string;
  nameEn: string | null;
  isActive: boolean;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  adminEmail: string | null;
  adminName: string | null;
}

export default function CompaniesTable({
  companies,
  onEdit,
  onToggleStatus,
}: {
  companies: Company[];
  onEdit: (company: Company) => void;
  onToggleStatus: (id: string, status: boolean) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-card border border-border rounded-lg">
        <thead>
          <tr className="border-b border-border text-right">
            <th className="p-2">#</th>
            <th className="p-2">اسم الشركة</th>
            <th className="p-2">إنجليزي</th>
            <th className="p-2">المدير</th>
            <th className="p-2">الإيميل</th>
            <th className="p-2">الحالة</th>
            <th className="p-2">الإجراءات</th>
          </tr>
        </thead>

        <tbody>
          {companies.map((c, i) => (
            <tr key={c.id} className="border-b hover:bg-muted/40">
              <td className="p-2">{i + 1}</td>
              <td className="p-2">{c.name}</td>
              <td className="p-2">{c.nameEn || '-'}</td>
              <td className="p-2">{c.adminName || '-'}</td>
              <td className="p-2">{c.adminEmail || '-'}</td>

              <td className="p-2">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    c.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {c.isActive ? 'نشط' : 'معطل'}
                </span>
              </td>

              <td className="p-2 flex gap-2">
                <button
                  onClick={() => onEdit(c)}
                  className="text-indigo-600"
                >
                  تعديل
                </button>

                <button
                  onClick={() => onToggleStatus(c.id, c.isActive)}
                  className={`text-xs px-2 py-1 rounded ${
                    c.isActive
                      ? 'bg-red-100 text-red-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {c.isActive ? 'تعطيل' : 'تفعيل'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}