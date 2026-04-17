import Sidebar from "@/components/dashboard/Sidebar";
export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="mr-64 p-6">{children}</main>
    </div>
  );
}