"use client";

import { usePathname } from "next/navigation";
import { AuthProvider } from "./AuthProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // 管理画面ではLIFF AuthProviderを無効化（GoTrueClient競合を防止）
  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }

  return <AuthProvider>{children}</AuthProvider>;
}
