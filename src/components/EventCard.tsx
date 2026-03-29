import Link from "next/link";
import { Event } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { ProgressBar } from "./ProgressBar";
import { FlyerTemplate } from "./FlyerTemplate";
import { Countdown } from "./Countdown";
import { UserAvatarWithFallback } from "./UserAvatar";
import { formatDate } from "@/lib/utils";

export function EventCard({ event }: { event: Event }) {
  const isExperience = event.event_type === "event";

  return (
    <Link href={`/events/${event.id}`} className="block">
      <div className="bg-[var(--color-card)] rounded-2xl shadow-sm border border-[var(--color-border)] overflow-hidden hover:shadow-md transition-shadow">
        {/* チラシ画像エリア */}
        {event.flyer_url || event.cover_image_url ? (
          <div className="h-40 bg-[var(--color-soft)] relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={event.cover_image_url || event.flyer_url || ""} alt="" className="w-full h-full object-cover" />
            <div className="absolute top-2 left-2">
              <StatusBadge status={event.status} />
            </div>
            {isExperience && event.fee_per_person && (
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-sm font-bold px-2 py-1 rounded">
                {event.fee_per_person.toLocaleString()}円/人
              </div>
            )}
          </div>
        ) : (
          <div className="h-40 relative overflow-hidden">
            <div className="absolute inset-0">
              <FlyerTemplate event={event} />
            </div>
            <div className="absolute top-2 left-2 z-10">
              <StatusBadge status={event.status} />
            </div>
          </div>
        )}

        <div className="p-4">
          {/* ヘッダー */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                  isExperience
                    ? "bg-[#e8f0f7] text-[var(--color-event)]"
                    : "bg-[var(--color-accent-soft)] text-[var(--color-nomikai)]"
                }`}>
                  {isExperience ? "🎪イベント" : "🍻飲み会"}
                </span>
                {event.related_project_id && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-[#ede8f5] text-[var(--color-project)]">
                    🚀 プロジェクト連携
                  </span>
                )}
                {event.is_private && (
                  <span className="text-[11px] bg-[var(--color-ink)] text-white px-1.5 py-0.5 rounded">限定</span>
                )}
              </div>
              <h3 className="font-bold text-base leading-tight">{event.title}</h3>
            </div>
          </div>

          {/* 詳細（2行省略） */}
          {event.description && (
            <p className="text-xs text-[var(--color-sub)] mt-2 line-clamp-2">{event.description}</p>
          )}

          {/* 日時・場所 */}
          <div className="mt-3 flex items-center gap-3 text-xs text-[var(--color-sub)]">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDate(event.date)} {event.start_time}
            </span>
            {event.venue_name && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {event.venue_name}
              </span>
            )}
          </div>

          {/* 2次会バッジ */}
          {event.has_after_party && (
            <div className="mt-2">
              <span className="text-[11px] bg-[#f3e8ff] text-[#9b51e0] px-2 py-0.5 rounded-full font-medium">
                2次会あり
              </span>
            </div>
          )}

          {/* プログレスバー */}
          <div className="mt-3">
            <ProgressBar event={event} />
          </div>

          {/* 締め切り + 言い出しっぺ */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-[var(--color-mute)]">
              <UserAvatarWithFallback
                profile={event.organizer}
                size="w-5 h-5"
                textSize="text-[10px]"
                bgColor="bg-[var(--color-primary-light)]"
                textColor="text-[var(--color-primary-dark)]"
              />
              <span>{event.organizer?.display_name} が言い出しっぺ</span>
            </div>
            {event.deadline && event.status === "recruiting" && (
              <Countdown deadline={event.deadline} compact />
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
