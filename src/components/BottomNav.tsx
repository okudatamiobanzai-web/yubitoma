"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { fetchNotifications } from "@/lib/data";

export function BottomNav() {
  const pathname = usePathname();
  const { dbProfileId } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    if (!dbProfileId || isAdmin) return;
    fetchNotifications(dbProfileId)
      .then((notifs) => {
        setUnreadCount(notifs.filter((n) => !n.is_read).length);
      })
      .catch(() => setUnreadCount(0));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbProfileId]);

  // 管理画面ではBottomNavを非表示
  if (isAdmin) return null;

  const isHome = pathname === "/";
  const isNotifications = pathname === "/notifications";
  const isArchive = pathname.startsWith("/archive");
  const isMypage = pathname.startsWith("/mypage");

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--color-card)]/95 backdrop-blur-sm border-t border-[var(--color-border)] z-50">
      <div className="max-w-lg mx-auto flex justify-around items-center h-14 relative">
        {/* ホーム */}
        <Link
          href="/"
          className={`flex flex-col items-center gap-0.5 text-xs transition-colors ${
            isHome ? "text-[var(--color-primary)]" : "text-[var(--color-mute)] hover:text-[var(--color-sub)]"
          }`}
        >
          <span className="text-lg">🏠</span>
          <span>ホーム</span>
        </Link>

        {/* 通知 */}
        <Link
          href="/notifications"
          className={`flex flex-col items-center gap-0.5 text-xs transition-colors relative ${
            isNotifications ? "text-[var(--color-primary)]" : "text-[var(--color-mute)] hover:text-[var(--color-sub)]"
          }`}
        >
          <div className="relative">
            <span className="text-lg">🔔</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 w-4 h-4 bg-[var(--color-danger)] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <span>通知</span>
        </Link>

        {/* 言い出す（フローティング） */}
        <Link
          href="/events/new"
          className="flex flex-col items-center -mt-8"
        >
          <div className="w-16 h-16 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white shadow-lg shadow-[var(--color-primary)]/30 hover:bg-[var(--color-primary-dark)] transition-all active:scale-95 ring-4 ring-[var(--color-bg)]">
            <span className="text-2xl">☝️</span>
          </div>
          <span className="text-[10px] mt-1 text-[var(--color-primary)] font-bold">
            言い出す
          </span>
        </Link>

        {/* アーカイブ */}
        <Link
          href="/archive"
          className={`flex flex-col items-center gap-0.5 text-xs transition-colors ${
            isArchive ? "text-[var(--color-primary)]" : "text-[var(--color-mute)] hover:text-[var(--color-sub)]"
          }`}
        >
          <span className="text-lg">📚</span>
          <span>アーカイブ</span>
        </Link>

        {/* マイページ */}
        <Link
          href="/mypage"
          className={`flex flex-col items-center gap-0.5 text-xs transition-colors ${
            isMypage ? "text-[var(--color-primary)]" : "text-[var(--color-mute)] hover:text-[var(--color-sub)]"
          }`}
        >
          <span className="text-lg">👤</span>
          <span>マイページ</span>
        </Link>
      </div>
    </nav>
  );
}
