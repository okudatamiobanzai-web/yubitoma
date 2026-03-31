"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) return null;

  const isHome = pathname === "/";
  const isArchive = pathname.startsWith("/archive");
  const isMypage = pathname.startsWith("/mypage");

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--color-card)]/95 backdrop-blur-sm border-t border-[var(--color-border)] z-50">
      <div className="max-w-lg mx-auto flex justify-around items-center h-14 relative">
        <Link
          href="/"
          className={`flex flex-col items-center gap-0.5 text-xs transition-colors ${
            isHome ? "text-[var(--color-primary)]" : "text-[var(--color-mute)] hover:text-[var(--color-sub)]"
          }`}
        >
          <span className="text-lg">🏠</span>
          <span>ホーム</span>
        </Link>

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

        <Link
          href="/archive"
          className={`flex flex-col items-center gap-0.5 text-xs transition-colors ${
            isArchive ? "text-[var(--color-primary)]" : "text-[var(--color-mute)] hover:text-[var(--color-sub)]"
          }`}
        >
          <span className="text-lg">📚</span>
          <span>アーカイブ</span>
        </Link>

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
