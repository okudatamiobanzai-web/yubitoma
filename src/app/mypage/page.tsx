"use client";

import BottomNav from "@/components/bottom-nav";
import LoadingState from "@/components/loading-state";

export default function MyPage() {
  return (
    <main className="min-h-screen pb-20 max-w-lg mx-auto">
      <div className="px-4 pt-4 pb-3 border-b border-[var(--color-border)]">
        <h1 className="text-lg font-bold">👤 マイページ</h1>
      </div>
      <div className="px-4 py-8">
        <LoadingState />
      </div>
      <BottomNav />
    </main>
  );
}
