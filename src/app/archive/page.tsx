"use client";

import BottomNav from "@/components/bottom-nav";
import LoadingState from "@/components/loading-state";

export default function ArchivePage() {
  return (
    <main className="min-h-screen pb-20 max-w-lg mx-auto">
      <div className="px-4 pt-4 pb-3 border-b border-[var(--color-border)]">
        <h1 className="text-lg font-bold">📚 アーカイブ</h1>
        <p className="text-xs text-[var(--color-mute)]">終了したイベント・プロジェクト</p>
      </div>
      <div className="px-4 py-8">
        <LoadingState />
      </div>
      <BottomNav />
    </main>
  );
}
