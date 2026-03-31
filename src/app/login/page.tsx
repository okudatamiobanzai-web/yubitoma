"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { BottomNav } from "@/components/BottomNav";
import Link from "next/link";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <main className="min-h-screen pb-20 max-w-lg mx-auto">
        <div className="text-center py-16 text-[var(--color-mute)] text-sm">読み込み中...</div>
        <BottomNav />
      </main>
    );
  }

  if (user) {
    return (
      <main className="min-h-screen pb-20 max-w-lg mx-auto">
        <div className="text-center py-16 text-[var(--color-mute)] text-sm">リダイレクト中...</div>
        <BottomNav />
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-20 max-w-lg mx-auto">
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[var(--color-bg)]">
        <div className="w-24 h-24 rounded-full bg-[var(--color-accent-soft)] flex items-center justify-center mb-6">
          <span className="text-4xl">&#9757;&#65039;</span>
        </div>
        <h1 className="text-xl font-bold mb-2">ログイン</h1>
        <p className="text-sm text-[var(--color-mute)] text-center mb-8 leading-relaxed">
          LINEでログインすると、飲み会やイベントの<br />企画・参加ができるようになります
        </p>
        <button
          onClick={login}
          className="w-full max-w-xs flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl bg-[#06C755] text-white font-bold text-sm hover:bg-[#05b04c] transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
          </svg>
          LINEでログイン
        </button>
        <Link href="/" className="mt-4 text-sm text-[var(--color-mute)] hover:text-[var(--color-sub)]">
          ← ホームに戻る
        </Link>
      </div>
      <BottomNav />
    </main>
  );
}
