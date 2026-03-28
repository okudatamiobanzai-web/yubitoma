"use client";

import BottomNav from "@/components/bottom-nav";
import LoadingState from "@/components/loading-state";

export default function LoginPage() {
  return (
    <main className="min-h-screen pb-20 max-w-lg mx-auto">
      <div className="px-4 py-16">
        <LoadingState message="読み込み中..." />
      </div>
      <BottomNav />
    </main>
  );
}
