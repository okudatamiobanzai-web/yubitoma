"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { fetchEvent, joinEvent } from "@/lib/data";
import { lineNotifyNewParticipant } from "@/lib/notify";
import { supabase } from "@/lib/supabase";
import { StatusBadge } from "@/components/StatusBadge";
import { ProgressBar } from "@/components/ProgressBar";
import { ProfilePopup } from "@/components/ProfilePopup";
import { UserAvatarWithFallback } from "@/components/UserAvatar";
import { Profile, Event as EventType } from "@/lib/types";
import { formatDate } from "@/lib/utils";

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

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, dbProfileId } = useAuth();
  const [event, setEvent] = useState<EventType | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  const [joinComplete, setJoinComplete] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const id = params.id as string;
        const ev = await fetchEvent(id);
        setEvent(ev);

        // If current user is organizer and organizer name is "ゲストユーザー", update it
        if (ev && dbProfileId && user && ev.organizer_id === dbProfileId) {
          const orgName = ev.organizer?.display_name;
          if (orgName === "ゲストユーザー" || orgName === "ユーザー" || !orgName) {
            await supabase
              .from("profiles")
              .update({
                display_name: user.displayName,
                avatar_url: user.pictureUrl ?? null,
                updated_at: new Date().toISOString(),
              })
              .eq("id", dbProfileId);
            const refreshed = await fetchEvent(id);
            if (refreshed) setEvent(refreshed);
          }
        }
      } catch {
        // エラー時はnullのまま
      } finally {
        setPageLoading(false);
      }
    }
    load();
  }, [params.id, dbProfileId, user]);

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-[var(--color-mute)]">読み込み中...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-5xl mb-4">🍻</div>
        <p className="text-[var(--color-sub)] font-medium">イベントが見つかりません</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 text-sm text-[var(--color-primary)] font-medium"
        >
          ← ホームに戻る
        </button>
      </div>
    );
  }

  const currentUserId = dbProfileId;
  const isExperience = event.event_type === "event";
  const approvedAttendees = event.attendees?.filter((a) => a.status === "approved") ?? [];
  const pendingRequests = event.attendees?.filter((a) => a.status === "pending") ?? [];
  const isClosed = event.status === "closed" || event.status === "cancelled";
  const isOrganizer = currentUserId ? event.organizer_id === currentUserId : false;

  const myAttendance = currentUserId ? event.attendees?.find((a) => a.user_id === currentUserId) : null;
  const hasJoined = !!myAttendance;

  const handleJoinSubmit = async () => {
    if (!currentUserId || submitting) return;
    setSubmitting(true);
    try {
      await joinEvent(event.id, currentUserId);
      lineNotifyNewParticipant(event.id, user?.displayName ?? "ユーザー");
      setJoinComplete(true);
    } catch (e) {
      console.error("Join error:", e);
      alert("参加申し込みに失敗しました。もう一度お試しください。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-24">
      {/* ヒーロー画像 */}
      <div className="relative">
        {event.cover_image_url ? (
          <div className="w-full aspect-[16/9] relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={event.cover_image_url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        ) : (
          <div className="w-full h-56 relative overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(160deg, ${isExperience ? "var(--color-event)" : "var(--color-primary)"} 0%, ${isExperience ? "var(--color-event)" : "var(--color-primary)"}dd 40%, ${isExperience ? "var(--color-event)" : "var(--color-primary)"}99 100%)`,
              }}
            />
            <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-4">
              <div className="text-5xl mb-3">{isExperience ? "🎪" : "🍻"}</div>
              <h2 className="text-xl font-bold leading-tight drop-shadow-sm">{event.title}</h2>
            </div>
          </div>
        )}

        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 z-10 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={() => setShowShare(true)}
          className="absolute top-4 right-4 z-10 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </button>

        <div className="absolute top-4 left-1/2 -translate-x-1/2">
          <StatusBadge status={event.status} />
        </div>
      </div>

      {/* コンテンツ */}
      <div className="px-4 -mt-6 relative z-10">
        <div className="bg-[var(--color-card)] rounded-2xl shadow-lg p-5 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold ${
              isExperience ? "bg-[#e8f0f7] text-[var(--color-event)]" : "bg-[var(--color-accent-soft)] text-[var(--color-primary)]"
            }`}>
              {isExperience ? "イベント" : "飲み会"}
            </span>
            {event.related_project_id && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-[#ede8f5] text-[var(--color-project)]">
                🚀 プロジェクト連携
              </span>
            )}
          </div>

          <h1 className="text-xl font-bold leading-tight">{event.title}</h1>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-soft)] flex items-center justify-center">
                <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-bold">{formatDate(event.date)}</div>
                <div className="text-xs text-[var(--color-mute)]">{event.start_time}〜</div>
              </div>
            </div>

            {event.venue_name && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-soft)] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-bold">{event.venue_name}</div>
                  {event.venue_address && <div className="text-xs text-[var(--color-mute)]">{event.venue_address}</div>}
                </div>
              </div>
            )}

            {isExperience && event.fee_per_person && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#e8f0f7] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[var(--color-event)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-bold">{event.fee_per_person.toLocaleString()}円<span className="text-[var(--color-mute)] font-normal">/人</span></div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-1">
            <ProgressBar event={event} />
          </div>
        </div>

        {event.description && (
          <div className="mt-4 bg-[var(--color-card)] rounded-2xl shadow-sm p-5">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              詳細
            </h3>
            <p className="text-sm text-[var(--color-sub)] whitespace-pre-line leading-relaxed">
              {event.description}
            </p>
          </div>
        )}

        <div className="mt-4 bg-[var(--color-card)] rounded-2xl shadow-sm p-5">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            言い出しっぺ
          </h3>
          <div className="flex items-center gap-3">
            <UserAvatarWithFallback
              profile={event.organizer}
              size="w-12 h-12"
              textSize="text-lg"
              bgColor="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)]"
              textColor="text-white"
            />
            <div>
              <div className="font-bold">{event.organizer?.display_name}</div>
              <div className="text-xs text-[var(--color-mute)]">イベントの企画者</div>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-[var(--color-card)] rounded-2xl shadow-sm p-5">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            参加メンバー
            <span className="text-xs text-[var(--color-mute)] font-normal ml-1">
              {approvedAttendees.length}{event.max_people ? `/${event.max_people}` : ""}人
            </span>
          </h3>

          <div className="flex items-center gap-1 mb-3">
            {approvedAttendees.slice(0, 5).map((a) => (
              <button
                key={a.id}
                onClick={() => a.profile && setSelectedProfile(a.profile)}
                className="ring-2 ring-white -ml-1 first:ml-0 hover:ring-[var(--color-primary)] transition-all cursor-pointer rounded-full"
                title={a.profile?.display_name}
              >
                <UserAvatarWithFallback
                  profile={a.profile}
                  size="w-10 h-10"
                  textSize="text-sm"
                  bgColor="bg-[var(--color-primary-light)]"
                  textColor="text-[var(--color-primary-dark)]"
                />
              </button>
            ))}
            {approvedAttendees.length > 5 && (
              <button
                onClick={() => setShowAllMembers(!showAllMembers)}
                className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] text-xs font-bold ring-2 ring-white -ml-1 hover:bg-[var(--color-primary)]/20 transition-all cursor-pointer"
              >
                +{approvedAttendees.length - 5}
              </button>
            )}
            {event.max_people && approvedAttendees.length < event.max_people && (
              <div className="ml-2 text-[10px] text-[var(--color-mute)]">
                あと{event.max_people - approvedAttendees.length}人
              </div>
            )}
          </div>

          <div className="space-y-2">
            {(showAllMembers ? approvedAttendees : approvedAttendees.slice(0, 5)).map((a) => (
              <div key={a.id} className="flex items-center gap-3 py-2 border-b border-[var(--color-soft)] last:border-0">
                <button
                  onClick={() => a.profile && setSelectedProfile(a.profile)}
                  className="hover:ring-2 hover:ring-[var(--color-primary)] transition-all cursor-pointer rounded-full"
                >
                  <UserAvatarWithFallback
                    profile={a.profile}
                    size="w-8 h-8"
                    textSize="text-xs"
                    bgColor="bg-[var(--color-primary-light)]"
                    textColor="text-[var(--color-primary-dark)]"
                  />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{a.profile?.display_name}</div>
                  {a.profile?.area && (
                    <div className="text-[10px] text-[var(--color-mute)]">📍 {a.profile.area}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {approvedAttendees.length > 5 && (
            <button
              onClick={() => setShowAllMembers(!showAllMembers)}
              className="w-full mt-2 py-2 text-xs text-[var(--color-primary)] font-medium hover:bg-[var(--color-accent-soft)] rounded-lg transition-colors"
            >
              {showAllMembers ? "▲ 閉じる" : `▼ 全${approvedAttendees.length}人を表示`}
            </button>
          )}

          {pendingRequests.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
              <div className="text-[10px] text-[var(--color-mute)] font-bold mb-2">✋ 承認待ち（{pendingRequests.length}件）</div>
              {pendingRequests.map((a) => (
                <div key={a.id} className="py-3 border-b border-[var(--color-soft)] last:border-0">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => a.profile && setSelectedProfile(a.profile)}
                      className="cursor-pointer hover:ring-2 hover:ring-[var(--color-primary)] transition-all rounded-full border-2 border-dashed border-[var(--color-border)]"
                    >
                      <UserAvatarWithFallback
                        profile={a.profile}
                        size="w-8 h-8"
                        textSize="text-xs"
                        bgColor="bg-[var(--color-soft)]"
                        textColor="text-[var(--color-mute)]"
                      />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[var(--color-mute)]">{a.profile?.display_name}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {new Date(event.date) < new Date() && (
          <div className="mt-4">
            <Link
              href={`/events/${event.id}/review`}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-[var(--color-accent-soft)] text-[var(--color-primary)] font-bold text-sm hover:opacity-90 transition-opacity"
            >
              📝 振り返りを書く
            </Link>
          </div>
        )}
      </div>

      {/* 固定フッター */}
      {!isClosed && (
        <div className="fixed bottom-14 left-0 right-0 p-3 bg-[var(--color-card)]/95 backdrop-blur-sm border-t border-[var(--color-border)] z-30">
          <div className="max-w-lg mx-auto">
            {hasJoined && !joinComplete ? (
              <div className="bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-success)] flex items-center justify-center text-white text-lg">✓</div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-[var(--color-success)]">参加済み</div>
                  <div className="text-[11px] text-[var(--color-mute)]">
                    {formatDate(event.date)} {event.start_time}〜 お待ちしています！
                  </div>
                </div>
                {isOrganizer && (
                  <span className="text-[10px] bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-2 py-1 rounded-full font-bold">主催</span>
                )}
              </div>
            ) : joinComplete ? (
              <div className="bg-[var(--color-accent-soft)] rounded-2xl p-4 text-center">
                <div className="text-2xl mb-1">🎉</div>
                <div className="text-sm font-bold text-[var(--color-primary)]">参加しました！</div>
              </div>
            ) : (
              <button
                onClick={handleJoinSubmit}
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50 bg-[var(--color-primary)] shadow-lg shadow-[var(--color-primary)]/20"
              >
                {submitting ? "送信中..." : event.fee_per_person
                  ? `参加する（${event.fee_per_person.toLocaleString()}円）`
                  : "☝️ 参加する"}
              </button>
            )}
          </div>
        </div>
      )}

      {selectedProfile && (
        <ProfilePopup
          profile={selectedProfile}
          onClose={() => setSelectedProfile(null)}
        />
      )}

      {showShare && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => { setShowShare(false); setCopied(false); }}>
          <div
            className="bg-[var(--color-card)] w-full max-w-lg mx-auto rounded-t-3xl p-6"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "slideUp 0.3s ease-out" }}
          >
            <div className="w-10 h-1 bg-[var(--color-border)] rounded-full mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-4">シェアする</h3>
            <div className="bg-[var(--color-soft)] rounded-xl p-3 mb-5">
              <div className="text-sm font-bold">{event.title}</div>
              <div className="text-[11px] text-[var(--color-mute)] mt-0.5">
                {formatDate(event.date)} {event.start_time}〜
                {event.venue_name && ` · ${event.venue_name}`}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-5">
              <a
                href={`https://line.me/R/share?text=${encodeURIComponent(`「${event.title}」に参加しませんか？\nhttps://yubitoma.shirubelab.jp/events/${event.id}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 p-4 bg-[#06C755]/10 rounded-xl hover:bg-[#06C755]/20 transition-colors"
              >
                <div className="w-12 h-12 bg-[#06C755] rounded-xl flex items-center justify-center text-white text-xl font-bold">L</div>
                <span className="text-[11px] font-medium text-[var(--color-sub)]">LINE</span>
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`「${event.title}」に参加しませんか？\n${formatDate(event.date)} ${event.start_time}〜\n#指とま #道東`)}&url=${encodeURIComponent(`https://yubitoma.shirubelab.jp/events/${event.id}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 p-4 bg-[var(--color-soft)] rounded-xl hover:bg-[var(--color-border)] transition-colors"
              >
                <div className="w-12 h-12 bg-[var(--color-ink)] rounded-xl flex items-center justify-center text-white text-xl">{"\uD835\uDD4F"}</div>
                <span className="text-[11px] font-medium text-[var(--color-sub)]">X</span>
              </a>
              <button
                onClick={async () => {
                  const ok = await copyToClipboard(`https://yubitoma.shirubelab.jp/events/${event.id}`);
                  if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
                  else { alert("URLをコピーできませんでした。手動でコピーしてください。"); }
                }}
                className="flex flex-col items-center gap-2 p-4 bg-[var(--color-soft)] rounded-xl hover:bg-[var(--color-border)] transition-colors"
              >
                <div className="w-12 h-12 bg-[var(--color-primary)] rounded-xl flex items-center justify-center text-white">
                  {copied ? (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                  )}
                </div>
                <span className="text-[11px] font-medium text-[var(--color-sub)]">{copied ? "コピー済み" : "URLコピー"}</span>
              </button>
            </div>
            <button
              onClick={() => { setShowShare(false); setCopied(false); }}
              className="w-full mt-4 py-3 bg-[var(--color-soft)] rounded-xl text-sm font-medium text-[var(--color-sub)]"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
