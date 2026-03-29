import { AdminAuthProvider } from "@/components/admin/AdminAuthProvider";
import { AdminLayoutShell } from "@/components/admin/AdminLayoutShell";

export const metadata = {
  title: "指とま 管理画面",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthProvider>
      <AdminLayoutShell>{children}</AdminLayoutShell>
    </AdminAuthProvider>
  );
}
