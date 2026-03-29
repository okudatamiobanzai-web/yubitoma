"use client";

import { useAuth } from "./AuthProvider";

interface LoginRequiredProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function LoginRequired({ children, fallback }: LoginRequiredProps) {
  const { user, loading, login } = useAuth();

  if (loading) return null;

  if (!user) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-end z-50">
        <div
          className="w-full rounded-t-2xl p-6 pb-10"
          style={{ background: "var(--color-card)" }}
        >
          <div className="text-center mb-4">
            <div className="text-4xl mb-2">🔐</div>
            <h3
              className="text-lg font-bold mb-2"
              style={{ color: "var(--color-ink)" }}
            >
              ログインが必要です
            </h3>
            <p className="text-sm" style={{ color: "var(--color-sub)" }}>
              参加・応援・コメントするには
              <br />
              LINEでログインしてください
            </p>
          </div>
          <button
            onClick={login}
            className="w-full py-3 rounded-xl font-bold text-white text-center"
            style={{ background: "#06C755" }}
          >
            LINEでログイン
          </button>
          <p
            className="text-xs text-center mt-3"
            style={{ color: "var(--color-mute)" }}
          >
            milk公式LINEの友だち追加が必要です
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
