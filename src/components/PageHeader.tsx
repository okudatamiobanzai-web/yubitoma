"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

interface PageHeaderProps {
  title: string;
  backHref?: string; // explicit back link, defaults to "/"
  backLabel?: string; // e.g. "イベント一覧"
  rightAction?: React.ReactNode;
}

export function PageHeader({ title, backHref = "/", backLabel, rightAction }: PageHeaderProps) {
  return (
    <header className="sticky top-0 bg-[var(--color-bg)]/95 backdrop-blur-sm z-40 border-b border-[var(--color-border)]">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href={backHref} className="flex items-center gap-1 text-[var(--color-sub)] hover:text-[var(--color-ink)] transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {backLabel && <span className="text-xs">{backLabel}</span>}
          </Link>
          <h1 className="text-base font-bold">{title}</h1>
        </div>
        {rightAction && <div>{rightAction}</div>}
      </div>
    </header>
  );
}
