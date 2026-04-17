import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function SuperAdminDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session || session.user?.role !== 'SUPER_ADMIN') {
    redirect(`/${locale}/login`);
  }

  const companiesCount = await prisma.company.count();
  const usersCount = await prisma.user.count();
  const adminsCount = await prisma.user.count({
    where: { role: { name: 'ADMIN' } },
  });
  const supervisorsCount = await prisma.user.count({
    where: { role: { name: 'SUPERVISOR' } },
  });

  const stats = [
    { label: 'الشركات', value: companiesCount, color: 'from-blue-500 to-cyan-500' },
    { label: 'المستخدمين', value: usersCount, color: 'from-indigo-500 to-purple-500' },
    { label: 'المدراء (ADMIN)', value: adminsCount, color: 'from-emerald-500 to-teal-500' },
    { label: 'المشرفين', value: supervisorsCount, color: 'from-orange-500 to-red-500' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-foreground">لوحة التحكم - المؤشرات</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className={`bg-gradient-to-br ${stat.color} p-6 rounded-2xl shadow-lg text-white`}
          >
            <h3 className="text-lg font-semibold opacity-90">{stat.label}</h3>
            <p className="text-4xl font-bold mt-2">{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 text-muted-foreground text-sm">
        * هذه الأرقام محدثة مباشرة من قاعدة البيانات.
      </div>
    </div>
  );
}