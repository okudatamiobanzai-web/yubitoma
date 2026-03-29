"use client";

import { usePathname } from "next/navigation";
import { useAdminAuth } from "./AdminAuthProvider";
import { AdminSidebar } from "./AdminSidebar";

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { loading, adminUser } = useAdminAuth();
  const isLoginPage = pathname === "/admin/login";

  // Login page: no sidebar, no shell
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="text-[var(--color-mute)] text-sm">読み込み中...</div>
      </div>
    );
  }

  // Not authenticated (redirect will happen via provider)
  if (!adminUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <AdminSidebar />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-6 pt-16 lg:pt-6">{children}</div>
      </main>
    </div>
  );
}
