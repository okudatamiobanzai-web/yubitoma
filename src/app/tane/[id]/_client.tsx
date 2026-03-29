"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/components/AuthProvider";
import { fetchTaneById, addSupport, notifySupportReceived, fetchSupportComments, createProject, updateTaneStatus, createNotification } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { UserAvatarWithFallback } from "@/components/UserAvatar";
import type { Support } from "@/lib/types";
import { SUPPORT_PRESETS, TaneStatus, Tane } from "@/lib/types";

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

const statusLabels: Record<TaneStatus, { label: string; className: string }> = {
  open: { label: "募集中", className: "bg-[var(--color-tane)]/15 text-[var(--color-tane)]" },
  reached: { label: "目標達成", className: "bg-[var(--color-success)]/15 text-[var(--color-success)]" },
  promoted: { label: "🚀 プロジェクト化", className: "bg-[var(--color-project)]/15 text-[var(--color-project)]" },
  closed: { label: "クローズ", className: "bg-[var(--color-soft)] text-[var(--color-sub)]" },
};


export default function TaneDetailClient() {
  const params = useParams();
  const router = useRouter();
  const { user, dbProfileId } = useAuth();
  const [tane, setTane] = useState<Tane | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [freeText, setFreeText] = useState("");
  const [supportSent, setSupportSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [supportComments, setSupportComments] = useState<Support[]>([]);
  const [promoting, setPromoting] = useState(false);

  useEffect(() => {
    const id = params.id as string;
    fetchTaneById(id)
      .then((data) => {
        setTane(data);
        if (data) {
          fetchSupportComments("tane", id).then(setSupportComments).catch(() => {});
        }
      })
      .catch(() => setTane(null))
      .finally(() => setPageLoading(false));
  }, [params.id]);

  if (pageLoading) {
    return (
      <div className="pb-32">
        <PageHeader title="🌱 タネ" backHref="/tane" backLabel="タネ一覧" />
        <div className="px-4 py-12 text-center text-sm text-[var(--color-mute)]">読み込み中...</div>
      </div>
    );
  }

  if (!tane) {
    return (
      <div className="pb-32">
        <PageHeader title="🌱 タネ" backHref="/tane" backLabel="タネ一覧" />
        <div className="px-4 py-12 text-center">
          <div className="text-4xl mb-3">🌱</div>
          <p className="text-sm text-[var(--color-sub)]">タネが見つかりませんでした</p>
        </div>
      </div>
    );
  }

  const supporterCount = tane.supporter_count ?? 0;
  const threshold = tane.promotion_threshold;
  const progress = Math.min((supporterCount / threshold) * 100, 100);
  const reached = supporterCount >= threshold;
  const percentage = Math.round(progress);
  const status = statusLabels[tane.status];

  const handleSupportSubmit = async () => {
    if (dbProfileId && tane.owner_id) {
      try {
        const comment = selectedPreset || freeText || "応援してる！";
        await addSupport("tane", tane.id, dbProfileId, comment);
        // オーナーに通知
        notifySupportReceived("tane", tane.id, tane.title, tane.owner_id, user?.displayName ?? "ユーザー", dbProfileId).catch(() => {});
      } catch (e) {
        console.error("Support error:", e);
      }
    }
    setSupportSent(true);
    setTimeout(() => {
      setShowSupportModal(false);
      setSupportSent(false);
      setSelectedPreset(null);
      setFreeText("");
    }, 1500);
  };

  const handleCopyUrl = async () => {
    const ok = await copyToClipboard(`https://yubitoma.shirubelab.jp/tane/${tane.id}`);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      alert("URLをコピーできませんでした。");
    }
  };

  const handlePromote = async () => {
    if (!dbProfileId || promoting) return;
    if (!confirm("このタネをプロジェクトに昇格させますか？")) return;
    setPromoting(true);
    try {
      // Create project from tane
      const projectId = await createProject({
        owner_id: dbProfileId,
        title: tane.title,
        description: tane.description,
        cover_image_url: tane.cover_image_url || undefined,
        tane_id: tane.id,
      });

      // Update tane status to promoted
      await updateTaneStatus(tane.id, "promoted");

      // Notify all supporters
      const { data: supporters } = await supabase
        .from("supports")
        .select("user_id")
        .eq("target_type", "tane")
        .eq("target_id", tane.id);
      if (supporters) {
        for (const s of supporters) {
          if (s.user_id !== dbProfileId) {
            createNotification({
              user_id: s.user_id,
              type: "tane_promoted",
              title: "タネがプロジェクトに昇格！",
              body: `あなたが応援した「${tane.title}」がプロジェクトになりました`,
              tane_id: tane.id,
              project_id: projectId,
              from_user_id: dbProfileId,
            }).catch(() => {});
          }
        }
      }

      router.push(`/projects/${projectId}`);
    } catch (e) {
      console.error("Promote error:", e);
      alert("プロジェクト化に失敗しました。もう一度お試しください。");
      setPromoting(false);
    }
  };

  const shareUrl = encodeURIComponent(`https://yubitoma.shirubelab.jp/tane/${tane.id}`);
  const shareText = encodeURIComponent(`🌱 ${tane.title}\n応援よろしくお願いします！`);

  return (
    <div className="pb-32">
      <PageHeader title={tane.title} backHref="/tane" backLabel="タネ一覧" />

      <div className="px-4 py-4 space-y-5">
        {/* カバーセクション */}
        <div className="bg-[var(--color-tane)]/10 rounded-2xl p-6 text-center overflow-hidden">
          {tane.cover_image_url ? (
            <div className="relative w-full h-48 -mt-6 -mx-6 mb-4" style={{ width: "calc(100% + 3rem)" }}>
              <img
                src={tane.cover_image_url}
                alt={tane.title}
                className="w-full h-full object-cover rounded-t-2xl"
              />
            </div>
          ) : (
            <div className="text-5xl mb-3">🌱</div>
          )}
          <h2 className="text-xl font-bold leading-tight mb-2">{tane.title}</h2>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${status.className}`}>
            {status.label}
          </span>
        </div>

        {/* オーナー情報 */}
        <div className="flex items-center gap-3 bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-4">
          <UserAvatarWithFallback
            profile={tane.owner}
            size="w-10 h-10"
            textSize="text-sm"
            bgColor="bg-[var(--color-tane)]/20"
            textColor="text-[var(--color-tane)]"
          />
          <div>
            <div className="text-sm font-bold">{tane.owner?.display_name}</div>
            {tane.owner?.area && (
              <div className="text-xs text-[var(--color-mute)]">📍 {tane.owner.area}</div>
            )}
          </div>
          <div className="ml-auto text-[10px] text-[var(--color-mute)]">言い出しっぺ</div>
        </div>

        {/* 説明 */}
        <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-4">
          <p className="text-sm text-[var(--color-ink)] leading-relaxed whitespace-pre-wrap">
            {tane.description}
          </p>
        </div>

        {/* 注目数 */}
        <div className="flex items-center gap-1 text-xs text-[var(--color-mute)]">
          👀 {tane.watcher_count ?? 0}人が注目
        </div>

        {/* プログレスセクション */}
        <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-4">
          <div className="flex items-end justify-between mb-2">
            <div>
              <span className="text-2xl font-bold text-[var(--color-ink)]">{supporterCount}</span>
              <span className="text-sm text-[var(--color-mute)]"> / {threshold}人</span>
            </div>
            <span className="text-lg font-bold" style={{ color: reached ? "var(--color-success)" : "var(--color-tane)" }}>
              {percentage}%
            </span>
          </div>
          <div className="h-3 bg-[var(--color-soft)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progress}%`,
                backgroundColor: reached ? "var(--color-success)" : "var(--color-tane)",
              }}
            />
          </div>
          {reached && (
            <div className="mt-3 bg-[var(--color-success)]/10 rounded-xl p-3 text-center">
              <p className="text-sm font-bold text-[var(--color-success)]">
                🎉 目標達成！プロジェクト化の準備ができます
              </p>
            </div>
          )}
        </div>

        {/* プロジェクト昇格ボタン（目標人数達成時のみ表示） */}
        {dbProfileId === tane.owner_id && reached && tane.status !== "promoted" && tane.status !== "closed" && (
          <div className="bg-[var(--color-project)]/10 rounded-2xl border border-[var(--color-project)]/20 p-5 text-center">
            <div className="text-3xl mb-2">🚀</div>
            <h3 className="text-sm font-bold mb-1">目標達成！プロジェクトに昇格できます</h3>
            <p className="text-xs text-[var(--color-mute)] mb-3">
              応援が目標の{threshold}人に達しました！プロジェクトに昇格すると、進捗管理やイベント紐付けができるようになります
            </p>
            <button
              onClick={handlePromote}
              disabled={promoting}
              className="w-full py-3 rounded-2xl text-white font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-40"
              style={{ backgroundColor: "var(--color-project)" }}
            >
              {promoting ? "作成中..." : "🚀 プロジェクトに昇格させる"}
            </button>
          </div>
        )}

        {/* 応援コメント */}
        <div>
          <h3 className="text-sm font-bold mb-3 flex items-center gap-1.5">
            📣 応援コメント
            <span className="text-xs text-[var(--color-mute)] font-normal">({supportComments.length}件)</span>
          </h3>
          <div className="space-y-2.5">
            {supportComments.map((s) => (
              <div
                key={s.id}
                className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-3"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <UserAvatarWithFallback
                    profile={s.profile}
                    name={s.profile?.display_name ?? "?"}
                    size="w-6 h-6"
                    textSize="text-[10px]"
                    bgColor="bg-[var(--color-tane)]/15"
                    textColor="text-[var(--color-tane)]"
                  />
                  <span className="text-xs font-bold">{s.profile?.display_name ?? "ユーザー"}</span>
                  <span className="text-[10px] text-[var(--color-mute)]">{s.profile?.area ?? ""}</span>
                  <span className="text-[10px] text-[var(--color-mute)] ml-auto">{new Date(s.created_at).toLocaleDateString("ja-JP")}</span>
                </div>
                <p className="text-xs text-[var(--color-sub)] pl-8">{s.comment ?? ""}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 応援モーダル */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setShowSupportModal(false)}>
          <div
            className="w-full max-w-lg bg-[var(--color-card)] rounded-t-3xl p-6 animate-[slideUp_0.3s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            {supportSent ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-3">📣</div>
                <p className="text-lg font-bold">応援しました！</p>
                <p className="text-xs text-[var(--color-mute)] mt-1">あなたの声が届きました</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold">📣 応援する</h3>
                  <button onClick={() => setShowSupportModal(false)} className="text-[var(--color-mute)] p-1">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* プリセットチップ */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {SUPPORT_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setSelectedPreset(selectedPreset === preset ? null : preset);
                        setFreeText("");
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        selectedPreset === preset
                          ? "bg-[var(--color-tane)] text-white shadow-sm"
                          : "bg-[var(--color-soft)] text-[var(--color-sub)] hover:bg-[var(--color-border)]"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                {/* 自由入力 */}
                <div className="mb-4">
                  <textarea
                    placeholder="自由にメッセージを書く（任意）"
                    rows={3}
                    value={freeText}
                    onChange={(e) => {
                      setFreeText(e.target.value);
                      if (e.target.value) setSelectedPreset(null);
                    }}
                    className="w-full px-3.5 py-3 border border-[var(--color-border)] rounded-xl text-sm bg-[var(--color-card)] focus:outline-none focus:ring-2 focus:ring-[var(--color-tane)]/50 focus:border-[var(--color-tane)] transition-all resize-none"
                  />
                </div>

                <button
                  onClick={handleSupportSubmit}
                  disabled={!selectedPreset && !freeText.trim()}
                  className="w-full py-3.5 rounded-2xl text-white font-bold text-sm bg-[var(--color-tane)] shadow-lg shadow-[var(--color-tane)]/20 transition-all active:scale-[0.98] disabled:opacity-30 disabled:active:scale-100"
                >
                  📣 応援する！
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 共有モーダル */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setShowShareModal(false)}>
          <div
            className="w-full max-w-lg bg-[var(--color-card)] rounded-t-3xl p-6 animate-[slideUp_0.3s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold">🔗 共有する</h3>
              <button onClick={() => setShowShareModal(false)} className="text-[var(--color-mute)] p-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              {/* LINE */}
              <a
                href={`https://line.me/R/share?text=${encodeURIComponent(`🌱 ${tane.title}\n応援よろしくお願いします！\nhttps://yubitoma.shirubelab.jp/tane/${tane.id}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-[#06C755] text-white rounded-xl p-4 font-medium text-sm hover:opacity-90 transition-opacity"
              >
                <span className="text-lg">💬</span>
                LINEで共有
              </a>

              {/* X (Twitter) */}
              <a
                href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-black text-white rounded-xl p-4 font-medium text-sm hover:opacity-90 transition-opacity"
              >
                <span className="text-lg">𝕏</span>
                Xで共有
              </a>

              {/* URLコピー */}
              <button
                onClick={handleCopyUrl}
                className="flex items-center gap-3 w-full bg-[var(--color-soft)] text-[var(--color-ink)] rounded-xl p-4 font-medium text-sm hover:bg-[var(--color-border)] transition-colors"
              >
                <span className="text-lg">🔗</span>
                {copied ? "コピーしました！ ✓" : "URLをコピー"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 固定ボトムバー */}
      <div className="fixed bottom-16 left-0 right-0 z-30 bg-[var(--color-card)]/95 backdrop-blur-sm border-t border-[var(--color-border)] p-3">
        <div className="max-w-lg mx-auto flex gap-3">
          {dbProfileId === tane.owner_id ? (
            <button
              disabled
              className="flex-1 py-3 rounded-2xl text-[var(--color-mute)] font-bold text-sm bg-[var(--color-soft)] border border-[var(--color-border)] cursor-not-allowed"
            >
              自分のタネです
            </button>
          ) : (
            <button
              onClick={() => setShowSupportModal(true)}
              className="flex-1 py-3 rounded-2xl text-white font-bold text-sm bg-[var(--color-tane)] shadow-lg shadow-[var(--color-tane)]/20 transition-all active:scale-[0.98]"
            >
              📣 応援する
            </button>
          )}
          <button
            onClick={() => setShowShareModal(true)}
            className="px-5 py-3 rounded-2xl font-bold text-sm bg-[var(--color-soft)] text-[var(--color-sub)] border border-[var(--color-border)] transition-all active:scale-[0.98]"
          >
            🔗 共有
          </button>
        </div>
      </div>
    </div>
  );
}
