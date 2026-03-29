"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { UserAvatarWithFallback } from "@/components/UserAvatar";
import { fetchTane } from "@/lib/data";
import { Tane } from "@/lib/types";

function TaneCard({ tane }: { tane: Tane }) {
  const supporterCount = tane.supporter_count ?? 0;
  const threshold = tane.promotion_threshold;
  const progress = Math.min((supporterCount / threshold) * 100, 100);
  const reached = supporterCount >= threshold;

  return (
    <Link href={`/tane/${tane.id}`} className="block">
      <div className="bg-[var(--color-card)] rounded-2xl shadow-sm border border-[var(--color-border)] overflow-hidden hover:shadow-md transition-shadow">
        {tane.cover_image_url && (
          <div className="w-full h-36 overflow-hidden">
            <img
              src={tane.cover_image_url}
              alt={tane.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-4">
          {/* ステータスバッジ */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-[var(--color-tane)]/15 text-[var(--color-tane)]">
              🌱 タネ
            </span>
            {reached && (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-[var(--color-success)]/15 text-[var(--color-success)]">
                🎉 目標達成
              </span>
            )}
          </div>

          {/* タイトル */}
          <h3 className="font-bold text-base leading-tight mb-1">{tane.title}</h3>

          {/* 説明（2行省略） */}
          <p className="text-xs text-[var(--color-sub)] line-clamp-2 mb-3">
            {tane.description}
          </p>

          {/* プログレスバー */}
          <div className="mb-2">
            <div className="h-2 bg-[var(--color-soft)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  backgroundColor: reached ? "var(--color-success)" : "var(--color-tane)",
                }}
              />
            </div>
          </div>

          {/* 応援数 + 注目数 */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--color-sub)] font-medium">
              📣 {supporterCount}人が応援 / 目標{threshold}人
            </span>
            <span className="text-[var(--color-mute)] flex items-center gap-0.5">
              👀 {tane.watcher_count ?? 0}
            </span>
          </div>

          {/* 言い出しっぺ */}
          <div className="mt-3 flex items-center gap-2 text-xs text-[var(--color-mute)]">
            <UserAvatarWithFallback
              profile={tane.owner}
              size="w-5 h-5"
              textSize="text-[10px]"
              bgColor="bg-[var(--color-tane)]/20"
              textColor="text-[var(--color-tane)]"
            />
            <span>{tane.owner?.display_name} がタネをまいた</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function TaneListPage() {
  const [showExplainer, setShowExplainer] = useState(true);
  const [taneList, setTaneList] = useState<Tane[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const seen = localStorage.getItem("tane-explainer-seen");
    if (seen) setShowExplainer(false);

    fetchTane()
      .then((data) => setTaneList(data))
      .catch(() => setTaneList([]))
      .finally(() => setLoading(false));
  }, []);

  const handleCloseExplainer = () => {
    setShowExplainer(false);
    localStorage.setItem("tane-explainer-seen", "1");
  };

  return (
    <div className="pb-24">
      <PageHeader title="🌱 タネ" backHref="/" backLabel="ホーム" />

      <div className="px-4 py-4 space-y-4">
        {/* タネってなに？ 説明カード */}
        {showExplainer && (
          <div className="bg-[var(--color-tane)]/10 rounded-2xl border border-[var(--color-tane)]/20 p-4">
            <div className="flex items-start justify-between mb-2">
              <h2 className="text-sm font-bold text-[var(--color-tane)]">タネってなに？</h2>
              <button
                onClick={handleCloseExplainer}
                className="text-[var(--color-mute)] hover:text-[var(--color-sub)] p-0.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-[var(--color-sub)] leading-relaxed mb-2">
              「こんなのあったら面白くない？」を気軽に投げかける場所です。
              <br />
              応援が集まったら 🚀プロジェクトに育てよう！
            </p>
            <div className="bg-[var(--color-card)] rounded-xl p-3 space-y-1.5">
              <p className="text-[11px] text-[var(--color-mute)] font-medium">例：</p>
              <p className="text-xs text-[var(--color-sub)]">・「格子状防風林を熱気球で見れる体験、需要ある？」</p>
              <p className="text-xs text-[var(--color-sub)]">・「廃校でサウナやりたい」</p>
              <p className="text-xs text-[var(--color-sub)]">・「鹿肉ジビエの食べ比べ会」</p>
            </div>
          </div>
        )}

        {/* タネ一覧 */}
        {loading ? (
          <div className="text-center py-8 text-sm text-[var(--color-mute)]">読み込み中...</div>
        ) : (
          <div className="space-y-3">
            {taneList.map((tane) => (
              <TaneCard key={tane.id} tane={tane} />
            ))}
          </div>
        )}

        {/* タネが0件のとき */}
        {!loading && taneList.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🌱</div>
            <p className="text-sm text-[var(--color-sub)]">まだタネがありません</p>
            <p className="text-xs text-[var(--color-mute)] mt-1">最初のタネをまいてみよう！</p>
          </div>
        )}
      </div>

      {/* フローティングボタン */}
      <Link
        href="/tane/new"
        className="fixed bottom-20 right-4 z-30 bg-[var(--color-tane)] text-white px-5 py-3.5 rounded-2xl shadow-lg shadow-[var(--color-tane)]/30 font-bold text-sm flex items-center gap-1.5 active:scale-95 transition-transform hover:shadow-xl"
      >
        🌱 タネをまく
      </Link>
    </div>
  );
}
