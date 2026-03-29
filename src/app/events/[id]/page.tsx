"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { fetchEvent, fetchTransportServices, joinEvent, notifyJoinRequest, updateAttendeeStatus } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { StatusBadge } from "@/components/StatusBadge";
import { ProgressBar } from "@/components/ProgressBar";
import { FlyerTemplate } from "@/components/FlyerTemplate";
import { ProfilePopup } from "@/components/ProfilePopup";
import { RichContent } from "@/components/RichContent";
import { Countdown } from "@/components/Countdown";
import { UserAvatarWithFallback } from "@/components/UserAvatar";
import { TransportType, Profile, Event as EventType, TransportService } from "@/lib/types";
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

const transportLabels: Record<TransportType, string> = {
  car: "🚗 車",
  daikou: "🚙 運転代行",
  taxi: "🚕 タクシー",
  walk_bike: "🚶 徒歩/自転車",
  rideshare: "🤝 相乗り希望",
  stay: "🏨 泊まり（宿泊予定）",
};

const transportLabelsShort: Record<TransportType, string> = {
  car: "車",
  daikou: "代行",
  taxi: "タクシー",
  walk_bike: "徒歩",
  rideshare: "相乗り",
  stay: "泊まり",
};

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, dbProfileId } = useAuth();
  const [event, setEvent] = useState<EventType | null>(null);
  const [transportServices, setTransportServices] = useState<TransportService[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  const [showJoinFlow, setShowJoinFlow] = useState(false);
  const [joinStep, setJoinStep] = useState(1);
  const [joinComplete, setJoinComplete] = useState(false);
  const [showTransport, setShowTransport] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [joinForm, setJoinForm] = useState({
    drink_preference: "",
    transport: "" as TransportType | "",
    offer_rideshare: false,
    rideshare_seats: 0,
    insurance_agreed: false,
    stay_needs_info: false,
  });
  const [approvedIds, setApprovedIds] = useState<string[]>([]);
  const [rejectedIds, setRejectedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const id = params.id as string;
        const [ev, ts] = await Promise.all([
          fetchEvent(id),
          fetchTransportServices(),
        ]);
        setEvent(ev);
        setTransportServices(ts);

        // ISSUE 2: If current user is organizer and organizer name is "ゲストユーザー", update it
        if (ev && dbProfileId && user && ev.organizer_id === dbProfileId) {
          const orgName = ev.organizer?.display_name;
          if (orgName === "ゲストユーザー" || orgName === "ユーザー" || !orgName) {
            // Update profile display_name with LINE name
            await supabase
              .from("profiles")
              .update({
                display_name: user.displayName,
                avatar_url: user.pictureUrl ?? null,
                updated_at: new Date().toISOString(),
              })
              .eq("id", dbProfileId);
            // Refresh event data
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
  const rideshareOffers = approvedAttendees.filter((a) => a.offer_rideshare && a.rideshare_seats > 0);
  const stayMembers = approvedAttendees.filter((a) => a.transport === "stay");
  const isClosed = event.status === "closed" || event.status === "cancelled";
  const isOrganizer = currentUserId ? event.organizer_id === currentUserId : false;

  // 自分の参加状態を確認
  const myAttendance = currentUserId ? event.attendees?.find((a) => a.user_id === currentUserId) : null;
  const isApproved = myAttendance?.status === "approved";
  const isPending = myAttendance?.status === "pending";

  const handleApprove = async (attendeeId: string) => {
    try {
      await updateAttendeeStatus(attendeeId, "approved");
      setApprovedIds((prev) => [...prev, attendeeId]);
    } catch (e) {
      console.error("Approve error:", e);
      alert("承認に失敗しました。もう一度お試しください。");
    }
  };
  const handleReject = async (attendeeId: string) => {
    try {
      await updateAttendeeStatus(attendeeId, "rejected");
      setRejectedIds((prev) => [...prev, attendeeId]);
    } catch (e) {
      console.error("Reject error:", e);
      alert("拒否に失敗しました。もう一度お試しください。");
    }
  };

  const handleJoinSubmit = async () => {
    if (!currentUserId || submitting) return;
    setSubmitting(true);
    try {
      await joinEvent(event.id, currentUserId, {
        drink_preference: joinForm.drink_preference || undefined,
        transport: joinForm.transport || undefined,
        terms_agreed: true,
        sns_ng: false,
      });
      // 主催者に通知を送信
      if (event.organizer_id && event.requires_approval) {
        const userName = user?.displayName ?? "ユーザー";
        notifyJoinRequest(event.id, event.title, event.organizer_id, userName, currentUserId).catch(() => {});
      }
      setShowJoinFlow(false);
      setJoinStep(1);
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
      {/* チラシ画像ヒーロー / カラーヒーロー */}
      <div className="relative">
        {event.flyer_url ? (
          <div className="w-full aspect-[16/9] relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={event.flyer_url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        ) : (
          <div className="w-full h-56 relative overflow-hidden">
            <div className="absolute inset-0">
              <FlyerTemplate event={event} />
            </div>
          </div>
        )}

        {/* 戻るボタン（フローティング） */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* シェアボタン */}
        <button
          onClick={() => setShowShare(true)}
          className="absolute top-4 right-4 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </button>

        {/* ステータスバッジ（フローティング） */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2">
          <StatusBadge status={event.status} />
        </div>
      </div>

      {/* コンテンツ */}
      <div className="px-4 -mt-6 relative z-10">
        {/* メインカード */}
        <div className="bg-[var(--color-card)] rounded-2xl shadow-lg p-5 space-y-4">
          {/* タグ行 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold ${
              isExperience ? "bg-[#e8f0f7] text-[var(--color-event)]" : "bg-[var(--color-accent-soft)] text-[var(--color-primary)]"
            }`}>
              {isExperience ? "イベント" : "飲み会"}
            </span>
            {event.is_private && (
              <span className="text-[11px] bg-[var(--color-ink)] text-white px-2 py-1 rounded-full font-medium">🔒 招待限定</span>
            )}
            {event.has_after_party && (
              <span className="text-[11px] bg-[#f3e8ff] text-[#9b51e0] px-2 py-1 rounded-full font-medium">2次会あり</span>
            )}
          </div>

          {/* タイトル */}
          <h1 className="text-xl font-bold leading-tight">{event.title}</h1>

          {/* 日時・場所・料金 */}
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
                  {event.venue_phone && (
                    <a href={`tel:${event.venue_phone}`} className="text-xs text-[var(--color-primary)] font-medium">
                      📞 {event.venue_phone}
                    </a>
                  )}
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
                  <div className="text-xs text-[var(--color-mute)]">目標売上: {event.target_revenue?.toLocaleString()}円</div>
                </div>
              </div>
            )}
          </div>

          {/* プログレスバー */}
          <div className="pt-1">
            <ProgressBar event={event} />
          </div>

          {/* 締め切りカウントダウン */}
          {event.deadline && event.status === "recruiting" && (
            <div className="pt-3">
              <Countdown deadline={event.deadline} />
            </div>
          )}

          {/* 承認制バッジ */}
          {event.requires_approval && (
            <div className="flex items-center gap-2 pt-2 text-xs text-[var(--color-mute)]">
              <span className="bg-[var(--color-soft)] px-2 py-0.5 rounded-full">✋ 承認制</span>
              <span>言い出しっぺの承認が必要です</span>
            </div>
          )}
        </div>

        {/* 説明・リッチコンテンツ */}
        {(event.description || event.rich_content) && (
          <div className="mt-4 bg-[var(--color-card)] rounded-2xl shadow-sm p-5">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              詳細
            </h3>
            {event.description && (
              <p className="text-sm text-[var(--color-sub)] whitespace-pre-line leading-relaxed mb-4">
                {event.description}
              </p>
            )}
            {event.rich_content && (
              <RichContent blocks={event.rich_content} />
            )}
          </div>
        )}

        {/* 言い出しっぺ */}
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

        {/* 参加メンバー */}
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

          {/* アバター行 */}
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
            {/* 残りメンバーがいる場合 */}
            {approvedAttendees.length > 5 && (
              <button
                onClick={() => setShowAllMembers(!showAllMembers)}
                className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] text-xs font-bold ring-2 ring-white -ml-1 hover:bg-[var(--color-primary)]/20 transition-all cursor-pointer"
              >
                +{approvedAttendees.length - 5}
              </button>
            )}
            {/* 残り空席がある場合（定員表示） */}
            {event.max_people && approvedAttendees.length < event.max_people && (
              <div className="ml-2 text-[10px] text-[var(--color-mute)]">
                あと{event.max_people - approvedAttendees.length}人
              </div>
            )}
          </div>

          {/* メンバー詳細 */}
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
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {a.transport && (
                    <span className="text-[10px] bg-[var(--color-soft)] text-[var(--color-sub)] px-1.5 py-0.5 rounded">
                      {transportLabelsShort[a.transport]}
                    </span>
                  )}
                  {a.transport === "stay" && a.stay_needs_info && (
                    <span className="text-[10px] bg-yellow-50 text-[var(--color-warning)] px-1.5 py-0.5 rounded font-medium">
                      宿泊先募集中
                    </span>
                  )}
                  {a.offer_rideshare && (
                    <span className="text-[10px] bg-[#e8f0f7] text-[var(--color-event)] px-1.5 py-0.5 rounded font-medium">
                      🚗 相乗りOK({a.rideshare_seats}席)
                    </span>
                  )}
                  {a.drink_preference && (
                    <span className="text-[10px] bg-[var(--color-soft)] text-[var(--color-mute)] px-1.5 py-0.5 rounded">
                      {a.drink_preference}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* もっと見る / 閉じるボタン */}
          {approvedAttendees.length > 5 && (
            <button
              onClick={() => setShowAllMembers(!showAllMembers)}
              className="w-full mt-2 py-2 text-xs text-[var(--color-primary)] font-medium hover:bg-[var(--color-accent-soft)] rounded-lg transition-colors"
            >
              {showAllMembers ? "▲ 閉じる" : `▼ 全${approvedAttendees.length}人を表示`}
            </button>
          )}

          {/* 承認待ちリクエスト */}
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
                      {a.referred_by && (
                        <div className="text-[10px] text-[var(--color-mute)]">
                          紹介: {event.attendees?.find(at => at.profile?.id === a.referred_by)?.profile?.display_name ?? "不明"}さん
                        </div>
                      )}
                    </div>
                    {approvedIds.includes(a.id) ? (
                      <span className="text-[10px] bg-green-50 text-[var(--color-success)] px-2 py-0.5 rounded-full font-medium">承認済み</span>
                    ) : rejectedIds.includes(a.id) ? (
                      <span className="text-[10px] bg-red-50 text-[var(--color-danger)] px-2 py-0.5 rounded-full font-medium">見送り</span>
                    ) : (
                      <span className="text-[10px] bg-yellow-50 text-[var(--color-warning)] px-2 py-0.5 rounded-full font-medium">
                        承認待ち
                      </span>
                    )}
                  </div>
                  {/* 主催者用の承認/拒否ボタン */}
                  {isOrganizer && !approvedIds.includes(a.id) && !rejectedIds.includes(a.id) && (
                    <div className="flex gap-2 mt-2 ml-11">
                      <button
                        onClick={() => handleApprove(a.id)}
                        className="flex-1 py-1.5 bg-[var(--color-primary)] text-white text-xs font-bold rounded-lg transition-all active:scale-95"
                      >
                        承認する
                      </button>
                      <button
                        onClick={() => handleReject(a.id)}
                        className="flex-1 py-1.5 bg-[var(--color-soft)] text-[var(--color-sub)] text-xs font-medium rounded-lg transition-all active:scale-95"
                      >
                        見送る
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 相乗りオファー */}
        {rideshareOffers.length > 0 && (
          <div className="mt-4 bg-[#e8f0f7] rounded-2xl p-5">
            <h3 className="text-sm font-bold text-[var(--color-event)] mb-2 flex items-center gap-2">
              🚗 相乗りオファー
            </h3>
            <div className="space-y-2">
              {rideshareOffers.map((a) => (
                <div key={a.id} className="flex items-center justify-between bg-[var(--color-card)] rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <UserAvatarWithFallback
                      profile={a.profile}
                      size="w-8 h-8"
                      textSize="text-xs"
                      bgColor="bg-[var(--color-primary-light)]"
                      textColor="text-[var(--color-primary-dark)]"
                    />
                    <span className="text-sm font-medium">{a.profile?.display_name}さん</span>
                  </div>
                  <span className="text-sm text-[var(--color-event)] font-bold">空き{a.rideshare_seats}席</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 宿泊メンバー */}
        {stayMembers.length > 0 && (
          <div className="mt-4 bg-yellow-50 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-[var(--color-warning)] mb-2 flex items-center gap-2">
              🏨 遠方からの参加者
            </h3>
            <div className="space-y-2">
              {stayMembers.map((a) => (
                <div key={a.id} className="flex items-center justify-between bg-[var(--color-card)] rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <UserAvatarWithFallback
                      profile={a.profile}
                      size="w-8 h-8"
                      textSize="text-xs"
                      bgColor="bg-[var(--color-primary-light)]"
                      textColor="text-[var(--color-primary-dark)]"
                    />
                    <div>
                      <span className="text-sm font-medium">{a.profile?.display_name}さん</span>
                      {a.profile?.area && (
                        <span className="text-[10px] text-[var(--color-mute)] ml-1">({a.profile.area}から)</span>
                      )}
                    </div>
                  </div>
                  {a.stay_needs_info && (
                    <span className="text-[10px] bg-[var(--color-warning)]/10 text-[var(--color-warning)] px-2 py-0.5 rounded-full font-medium">
                      宿泊先募集中
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 帰りの移動手段（折りたたみ） */}
        {transportServices.length > 0 && (
        <div className="mt-4 bg-[var(--color-card)] rounded-2xl shadow-sm overflow-hidden">
          <button
            onClick={() => setShowTransport(!showTransport)}
            className="w-full p-5 flex items-center justify-between"
          >
            <h3 className="text-sm font-bold flex items-center gap-2">
              🚕 帰りの移動手段
            </h3>
            <svg
              className={`w-5 h-5 text-[var(--color-mute)] transition-transform ${showTransport ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showTransport && (
            <div className="px-5 pb-5 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-[var(--color-mute)] uppercase tracking-wider mb-2">運転代行</h4>
                {transportServices
                  .filter((s) => s.service_type === "daikou")
                  .map((s) => (
                    <div key={s.id} className="flex justify-between items-center py-2 border-b border-[var(--color-soft)] last:border-0">
                      <div>
                        <div className="text-sm font-medium">{s.name}</div>
                        <div className="text-[10px] text-[var(--color-mute)]">{s.area} / {s.hours}</div>
                      </div>
                      <a
                        href={`tel:${s.phone}`}
                        className="flex items-center gap-1 text-xs text-[var(--color-primary)] bg-[var(--color-accent-soft)] px-3 py-1.5 rounded-full font-medium"
                      >
                        📞 電話
                      </a>
                    </div>
                  ))}
              </div>
              <div>
                <h4 className="text-xs font-bold text-[var(--color-mute)] uppercase tracking-wider mb-2">タクシー</h4>
                {transportServices
                  .filter((s) => s.service_type === "taxi")
                  .map((s) => (
                    <div key={s.id} className="flex justify-between items-center py-2 border-b border-[var(--color-soft)] last:border-0">
                      <div>
                        <div className="text-sm font-medium">{s.name}</div>
                        <div className="text-[10px] text-[var(--color-mute)]">{s.area} / {s.hours}</div>
                      </div>
                      <a
                        href={`tel:${s.phone}`}
                        className="flex items-center gap-1 text-xs text-[var(--color-primary)] bg-[var(--color-accent-soft)] px-3 py-1.5 rounded-full font-medium"
                      >
                        📞 電話
                      </a>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
        )}

        {/* 過去イベント：振り返りリンク */}
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
      {!isClosed && !showJoinFlow && (
        <div className="fixed bottom-16 left-0 right-0 p-4 bg-[var(--color-card)]/95 backdrop-blur-sm border-t border-[var(--color-border)] z-30">
          <div className="max-w-lg mx-auto">
            {/* 参加済み（承認済み） */}
            {isApproved && !joinComplete ? (
              <div className="bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-success)] flex items-center justify-center text-white text-lg">
                  ✓
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-[var(--color-success)]">参加済み</div>
                  <div className="text-[11px] text-[var(--color-mute)]">
                    {formatDate(event.date)} {event.start_time}〜 お待ちしています！
                  </div>
                </div>
                {isOrganizer && (
                  <span className="text-[10px] bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-2 py-1 rounded-full font-bold">
                    主催
                  </span>
                )}
              </div>
            ) : isPending ? (
              /* リクエスト送信済み（承認待ち） */
              <div className="bg-yellow-50 border border-[var(--color-warning)]/20 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-warning)] flex items-center justify-center text-white text-lg">
                  ⏳
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-[var(--color-warning)]">リクエスト送信済み</div>
                  <div className="text-[11px] text-[var(--color-mute)]">言い出しっぺの承認をお待ちください</div>
                </div>
              </div>
            ) : joinComplete ? (
              /* 今回のセッションで申し込み完了 */
              <div className="bg-[var(--color-accent-soft)] rounded-2xl p-4 text-center">
                <div className="text-2xl mb-1">{event.requires_approval ? "☝️" : "🎉"}</div>
                <div className="text-sm font-bold text-[var(--color-primary)]">
                  {event.requires_approval ? "参加リクエストを送信しました" : "参加申し込み完了！"}
                </div>
                <div className="text-xs text-[var(--color-primary-dark)] mt-1">
                  {event.requires_approval
                    ? "言い出しっぺの承認をお待ちください"
                    : "当日お会いできるのを楽しみにしています"}
                </div>
              </div>
            ) : (
              /* 未参加：参加ボタン表示 */
              <button
                onClick={() => setShowJoinFlow(true)}
                className={`w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all active:scale-[0.98] ${
                  isExperience
                    ? "bg-[var(--color-accent)] shadow-lg shadow-[var(--color-event)]/20"
                    : "bg-[var(--color-primary)] shadow-lg shadow-[var(--color-primary)]/20"
                }`}
              >
                {event.requires_approval
                  ? "☝️ 参加リクエストを送る"
                  : isExperience
                    ? `参加する（${event.fee_per_person?.toLocaleString()}円）`
                    : "参加する！"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* プロフィールポップアップ */}
      {selectedProfile && (
        <ProfilePopup
          profile={selectedProfile}
          onClose={() => setSelectedProfile(null)}
        />
      )}

      {/* シェアモーダル */}
      {showShare && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => { setShowShare(false); setCopied(false); }}>
          <div
            className="bg-[var(--color-card)] w-full max-w-lg mx-auto rounded-t-3xl p-6"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "slideUp 0.3s ease-out" }}
          >
            <div className="w-10 h-1 bg-[var(--color-border)] rounded-full mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-4">シェアする</h3>

            {/* イベント要約 */}
            <div className="bg-[var(--color-soft)] rounded-xl p-3 mb-5">
              <div className="text-sm font-bold">{event.title}</div>
              <div className="text-[11px] text-[var(--color-mute)] mt-0.5">
                {formatDate(event.date)} {event.start_time}〜
                {event.venue_name && ` · ${event.venue_name}`}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              {/* LINE共有 - ISSUE 4: use line.me/R/share */}
              <a
                href={`https://line.me/R/share?text=${encodeURIComponent(`「${event.title}」に参加しませんか？\nhttps://yubitoma.shirubelab.jp/events/${event.id}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 p-4 bg-[#06C755]/10 rounded-xl hover:bg-[#06C755]/20 transition-colors"
              >
                <div className="w-12 h-12 bg-[#06C755] rounded-xl flex items-center justify-center text-white text-xl font-bold">L</div>
                <span className="text-[11px] font-medium text-[var(--color-sub)]">LINE</span>
              </a>

              {/* X (Twitter) 共有 */}
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`「${event.title}」に参加しませんか？\n${formatDate(event.date)} ${event.start_time}〜\n#指とま #道東`)}&url=${encodeURIComponent(`https://yubitoma.shirubelab.jp/events/${event.id}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 p-4 bg-[var(--color-soft)] rounded-xl hover:bg-[var(--color-border)] transition-colors"
              >
                <div className="w-12 h-12 bg-[var(--color-ink)] rounded-xl flex items-center justify-center text-white text-xl">𝕏</div>
                <span className="text-[11px] font-medium text-[var(--color-sub)]">X</span>
              </a>

              {/* URLコピー */}
              <button
                onClick={async () => {
                  const ok = await copyToClipboard(`https://yubitoma.shirubelab.jp/events/${event.id}`);
                  if (ok) {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  } else {
                    alert("URLをコピーできませんでした。手動でコピーしてください。");
                  }
                }}
                className="flex flex-col items-center gap-2 p-4 bg-[var(--color-soft)] rounded-xl hover:bg-[var(--color-border)] transition-colors"
              >
                <div className="w-12 h-12 bg-[var(--color-primary)] rounded-xl flex items-center justify-center text-white">
                  {copied ? (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  )}
                </div>
                <span className="text-[11px] font-medium text-[var(--color-sub)]">
                  {copied ? "コピー済み" : "URLコピー"}
                </span>
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

      {/* 参加申し込みフロー（モーダル） */}
      {showJoinFlow && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => { setShowJoinFlow(false); setJoinStep(1); }}>
          <div
            className="bg-[var(--color-card)] w-full max-w-lg mx-auto rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ハンドル */}
            <div className="w-10 h-1 bg-[var(--color-border)] rounded-full mx-auto mb-4" />

            {/* ステッパー */}
            <div className="flex items-center gap-2 mb-5">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex-1 flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    joinStep >= step
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-[var(--color-soft)] text-[var(--color-mute)]"
                  }`}>
                    {joinStep > step ? "✓" : step}
                  </div>
                  {step < 3 && (
                    <div className={`flex-1 h-0.5 rounded ${joinStep > step ? "bg-[var(--color-primary)]" : "bg-[var(--color-soft)]"}`} />
                  )}
                </div>
              ))}
            </div>

            {/* ステップ1 */}
            {joinStep === 1 && (
              <div className="space-y-5">
                <h3 className="font-bold text-lg">
                  {isExperience ? "参加費・保険の確認" : "飲み物の好みは？"}
                </h3>
                {!isExperience ? (
                  <div className="flex flex-wrap gap-2">
                    {["ビール", "ハイボール", "ワイン", "日本酒", "焼酎", "ソフトドリンク"].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setJoinForm({ ...joinForm, drink_preference: d })}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          joinForm.drink_preference === d
                            ? "bg-[var(--color-primary)] text-white shadow-sm"
                            : "bg-[var(--color-soft)] text-[var(--color-sub)] hover:bg-[var(--color-border)]"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-[#e8f0f7] rounded-xl p-4 flex items-center justify-between">
                      <span className="text-sm text-[var(--color-event)]">参加費</span>
                      <span className="text-xl font-bold text-[var(--color-event)]">
                        {event.fee_per_person?.toLocaleString()}円
                      </span>
                    </div>
                    {event.insurance_required && (
                      <label className="flex items-start gap-3 bg-yellow-50 rounded-xl p-4 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={joinForm.insurance_agreed}
                          onChange={(e) => setJoinForm({ ...joinForm, insurance_agreed: e.target.checked })}
                          className="mt-0.5 w-5 h-5 accent-[var(--color-accent)] rounded"
                        />
                        <div>
                          <div className="text-sm font-medium">保険への加入に同意する</div>
                          <div className="text-xs text-[var(--color-mute)] mt-0.5">
                            詳細は主催者にお問い合わせください
                          </div>
                        </div>
                      </label>
                    )}
                  </div>
                )}
                <button
                  onClick={() => {
                    if (isExperience && event.insurance_required && !joinForm.insurance_agreed) {
                      alert("保険への同意が必要です");
                      return;
                    }
                    setJoinStep(2);
                  }}
                  className="w-full py-3 bg-[var(--color-primary)] text-white rounded-xl text-sm font-bold"
                >
                  次へ →
                </button>
              </div>
            )}

            {/* ステップ2: 移動手段 */}
            {joinStep === 2 && (
              <div className="space-y-5">
                <h3 className="font-bold text-lg">移動手段は？</h3>
                <div className="space-y-2">
                  {(Object.entries(transportLabels) as [TransportType, string][]).map(([value, label]) => (
                    <label
                      key={value}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        joinForm.transport === value
                          ? "border-[var(--color-primary)] bg-[var(--color-accent-soft)]"
                          : "border-[var(--color-border)] hover:border-[var(--color-border)]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="transport"
                        value={value}
                        checked={joinForm.transport === value}
                        onChange={() => setJoinForm({ ...joinForm, transport: value })}
                        className="sr-only"
                      />
                      <span className={`text-sm font-medium ${joinForm.transport === value ? "text-[var(--color-primary-dark)]" : "text-[var(--color-sub)]"}`}>
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
                {joinForm.transport === "car" && (
                  <div className="bg-[#e8f0f7] rounded-xl p-4 space-y-3">
                    <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-event)]">
                      <input
                        type="checkbox"
                        checked={joinForm.offer_rideshare}
                        onChange={(e) => setJoinForm({ ...joinForm, offer_rideshare: e.target.checked })}
                        className="w-5 h-5 accent-[var(--color-event)] rounded"
                      />
                      同乗者を乗せてもいい
                    </label>
                    {joinForm.offer_rideshare && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--color-event)]">空き座席数</span>
                        <input
                          type="number"
                          min={1}
                          max={4}
                          value={joinForm.rideshare_seats}
                          onChange={(e) => setJoinForm({ ...joinForm, rideshare_seats: Number(e.target.value) })}
                          className="w-16 px-2 py-1.5 border border-[var(--color-event)]/30 rounded-lg text-sm text-center"
                        />
                        <span className="text-xs text-[var(--color-event)]">席</span>
                      </div>
                    )}
                  </div>
                )}
                {joinForm.transport === "stay" && (
                  <div className="bg-yellow-50 rounded-xl p-4 space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={joinForm.stay_needs_info}
                        onChange={(e) => setJoinForm({ ...joinForm, stay_needs_info: e.target.checked })}
                        className="mt-0.5 w-5 h-5 accent-[var(--color-warning)] rounded"
                      />
                      <div>
                        <div className="text-sm font-medium text-[var(--color-warning)]">宿泊先未定（情報求む）</div>
                        <div className="text-xs text-[var(--color-mute)] mt-0.5">
                          他の参加者からおすすめの宿泊先情報が届くかも
                        </div>
                      </div>
                    </label>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => setJoinStep(1)}
                    className="flex-1 py-3 border-2 border-[var(--color-border)] rounded-xl text-sm font-medium text-[var(--color-sub)]"
                  >
                    ← 戻る
                  </button>
                  <button
                    onClick={() => setJoinStep(3)}
                    disabled={!joinForm.transport}
                    className="flex-1 py-3 bg-[var(--color-primary)] text-white rounded-xl text-sm font-bold disabled:opacity-30"
                  >
                    次へ →
                  </button>
                </div>
              </div>
            )}

            {/* ステップ3: 確認 */}
            {joinStep === 3 && (
              <div className="space-y-5">
                <h3 className="font-bold text-lg">内容を確認</h3>
                <div className="bg-[var(--color-soft)] rounded-xl p-4 space-y-3">
                  <div className="font-bold text-base">{event.title}</div>
                  <div className="text-sm text-[var(--color-sub)]">{formatDate(event.date)} {event.start_time}〜</div>
                  <div className="border-t border-[var(--color-border)] pt-3 space-y-2 text-sm">
                    {joinForm.drink_preference && (
                      <div className="flex justify-between">
                        <span className="text-[var(--color-mute)]">飲み物</span>
                        <span className="font-medium">{joinForm.drink_preference}</span>
                      </div>
                    )}
                    {joinForm.transport && (
                      <div className="flex justify-between">
                        <span className="text-[var(--color-mute)]">移動手段</span>
                        <span className="font-medium">{transportLabels[joinForm.transport]}</span>
                      </div>
                    )}
                    {joinForm.offer_rideshare && (
                      <div className="flex justify-between">
                        <span className="text-[var(--color-mute)]">相乗り</span>
                        <span className="font-medium text-[var(--color-event)]">{joinForm.rideshare_seats}席提供</span>
                      </div>
                    )}
                    {joinForm.transport === "stay" && (
                      <div className="flex justify-between">
                        <span className="text-[var(--color-mute)]">宿泊</span>
                        <span className="font-medium text-[var(--color-warning)]">
                          {joinForm.stay_needs_info ? "宿泊先情報求む" : "手配済み"}
                        </span>
                      </div>
                    )}
                    {isExperience && (
                      <div className="flex justify-between border-t border-[var(--color-border)] pt-2 mt-2">
                        <span className="text-[var(--color-mute)]">参加費</span>
                        <span className="font-bold text-[var(--color-event)]">{event.fee_per_person?.toLocaleString()}円</span>
                      </div>
                    )}
                  </div>
                </div>

                {event.payment_method === "square" && event.square_payment_url && (
                  <a
                    href={event.square_payment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-[#313131] text-white rounded-xl text-sm font-bold"
                  >
                    💳 Squareで事前決済する
                  </a>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setJoinStep(2)}
                    className="flex-1 py-3 border-2 border-[var(--color-border)] rounded-xl text-sm font-medium text-[var(--color-sub)]"
                  >
                    ← 戻る
                  </button>
                  <button
                    onClick={handleJoinSubmit}
                    className={`flex-1 py-3 text-white rounded-xl text-sm font-bold transition-all active:scale-[0.98] ${
                      isExperience
                        ? "bg-[var(--color-accent)] shadow-lg shadow-[var(--color-event)]/20"
                        : "bg-[var(--color-primary)] shadow-lg shadow-[var(--color-primary)]/20"
                    }`}
                  >
                    {event.requires_approval ? "☝️ リクエスト送信" : "🎉 参加する！"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
