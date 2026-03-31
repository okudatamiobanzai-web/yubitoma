"use client";

import { useAuth } from "@/components/AuthProvider";
import { BottomNav } from "@/components/BottomNav";
import Link from "next/link";

export default function MyPage() {
  const { user, loading, login, logout } = useAuth();

  return (
    <main className="min-h-screen pb-20 max-w-lg mx-auto">
      <div className="px-4 pt-4 pb-3 border-b border-[var(--color-border)]">
        <h1 className="text-lg font-bold">👤 マイページ</h1>
      </div>

      <div className="px-4 py-6 space-y-4">
        {loading ? (
          <div className="text-center py-8 text-[var(--color-mute)] text-sm">読み込み中...</div>
        ) : user ? (
          <>
            {/* プロフィール */}
            <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-4">
              <div className="flex items-center gap-3">
                {user.pictureUrl ? (
                  <img src={user.pictureUrl} alt="" className="w-14 h-14 rounded-full" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-xl font-bold">
                    {user.displayName.charAt(0)}
                  </div>
                )}
                <div>
                  <h2 className="font-bold text-lg">{user.displayName}</h2>
                  <p className="text-xs text-[var(--color-mute)]">LINE でログイン中</p>
                </div>
              </div>
            </div>

            {/* メニュー */}
            <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
              <Link href="/mypage/edit" className="flex items-center justify-between px-4 py-3">
                <span className="text-sm">✏️ プロフィール編集</span>
                <span className="text-[var(--color-mute)]">›</span>
              </Link>
              <Link href="/notifications" className="flex items-center justify-between px-4 py-3">
                <span className="text-sm">🔔 通知</span>
                <span className="text-[var(--color-mute)]">›</span>
              </Link>
            </div>

            {/* ログアウト */}
            <button
              onClick={logout}
              className="w-full text-center text-sm text-[var(--color-mute)] py-3"
            >
              ログアウト
            </button>
          </>
        ) : (
          /* 未ログイン */
          <div className="text-center py-12">
            <p className="text-4xl mb-4">☝️</p>
            <h2 className="font-bold text-lg mb-2">ログインしよう！</h2>
            <p className="text-sm text-[var(--color-sub)] mb-6">
              LINEでログインすると、イベントへの参加や<br />タネの応援ができるようになります
            </p>
            <button
              onClick={login}
              className="bg-[#06C755] text-white font-bold px-8 py-3 rounded-full text-sm"
            >
              LINEでログイン
            </button>
          </div>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
