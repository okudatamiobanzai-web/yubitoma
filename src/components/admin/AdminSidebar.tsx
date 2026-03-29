"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminAuth } from "./AdminAuthProvider";

const navItems = [
  { href: "/admin", label: "ダッシュボード", icon: "📊" },
  { href: "/admin/content", label: "コンテンツ管理", icon: "📝" },
  { href: "/admin/archive", label: "アーカイブ管理", icon: "📚" },
  { href: "/admin/users", label: "ユーザー管理", icon: "👥" },
  { href: "/admin/settings", label: "設定", icon: "⚙️" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { adminUser, logout } = useAdminAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-[var(--color-border)]">
        <h1 className="text-xl font-bold text-[var(--color-ink)]">指とま</h1>
        <p className="text-xs text-[var(--color-mute)] mt-0.5">管理画面</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive(item.href)
                ? "bg-[var(--color-primary)] text-white"
                : "text-[var(--color-sub)] hover:bg-[var(--color-border)]/50 hover:text-[var(--color-ink)]"
            }`}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* User info + logout */}
      {adminUser && (
        <div className="px-4 py-4 border-t border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-mute)] truncate mb-2">
            {adminUser.email}
          </p>
          <button
            onClick={logout}
            className="w-full text-left text-xs text-[var(--color-danger)] hover:underline cursor-pointer"
          >
            ログアウト
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-[var(--color-card)] shadow-md border border-[var(--color-border)] lg:hidden cursor-pointer"
        aria-label="メニューを開く"
      >
        <svg
          className="w-5 h-5 text-[var(--color-ink)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[var(--color-soft)] z-50 transform transition-transform duration-200 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1 text-[var(--color-mute)] hover:text-[var(--color-ink)] cursor-pointer"
          aria-label="メニューを閉じる"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed top-0 left-0 h-full w-64 bg-[var(--color-soft)] border-r border-[var(--color-border)]">
        {sidebarContent}
      </aside>
    </>
  );
}
