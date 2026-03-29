"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";

interface AdminSession {
  email: string;
  admin_id: string;
  name: string;
  ts: number;
}

interface AdminAuthContextValue {
  adminUser: AdminSession | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue>({
  adminUser: null,
  loading: true,
  logout: async () => {},
});

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}

const SESSION_KEY = "admin_session";
const SESSION_TTL = 24 * 60 * 60 * 1000; // 24時間

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  const logout = useCallback(async () => {
    localStorage.removeItem(SESSION_KEY);
    setAdminUser(null);
    router.push("/admin/login");
  }, [router]);

  useEffect(() => {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      setLoading(false);
      if (!isLoginPage) {
        router.push("/admin/login");
      }
      return;
    }

    try {
      const session: AdminSession = JSON.parse(raw);
      if (Date.now() - session.ts > SESSION_TTL) {
        localStorage.removeItem(SESSION_KEY);
        setLoading(false);
        if (!isLoginPage) {
          router.push("/admin/login");
        }
        return;
      }

      setAdminUser(session);
      setLoading(false);

      if (isLoginPage) {
        router.push("/admin");
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
      setLoading(false);
      if (!isLoginPage) {
        router.push("/admin/login");
      }
    }
  }, [router, isLoginPage]);

  return (
    <AdminAuthContext.Provider value={{ adminUser, loading, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}
