"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "ホーム", emoji: "🏠" },
  { href: "/notifications", label: "通知", emoji: "🔔" },
  { href: "/events/new", label: "言い出す", emoji: "☝️", isCenter: true },
  { href: "/archive", label: "アーカイブ", emoji: "📚" },
  { href: "/mypage", label: "マイページ", emoji: "👤" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--color-card)]/95 backdrop-blur-sm border-t border-[var(--color-border)] z-50">
      <div className="max-w-lg mx-auto flex justify-around items-center h-14 relative">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;

          if (item.isCenter) {
            return (
              <Link key={item.href} className="flex flex-col items-center -mt-8" href={item.href}>
                <div className="w-16 h-16 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white shadow-lg shadow-[var(--color-primary)]/30 hover:bg-[var(--color-primary-dark)] transition-all active:scale-95 ring-4 ring-[var(--color-bg)]">
                  <span className="text-2xl">{item.emoji}</span>
                </div>
                <span className="text-[10px] mt-1 text-[var(--color-primary)] font-bold">{item.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              className={`flex flex-col items-center gap-0.5 text-xs transition-colors ${
                isActive ? "text-[var(--color-primary)]" : "text-[var(--color-mute)] hover:text-[var(--color-sub)]"
              }`}
              href={item.href}
            >
              <span className="text-lg">{item.emoji}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
