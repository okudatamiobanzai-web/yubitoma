"use client";

import { usePathname } from "next/navigation";

export function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <main className="min-h-screen pb-20 max-w-lg mx-auto">
      {children}
    </main>
  );
}
