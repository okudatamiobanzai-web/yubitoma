"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { fetchProfile, fetchEvents, fetchTane, fetchProjects } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import type { Profile, Event, Tane, Project } from "@/lib/types";

// アバターの色を名前から生成
function avatarColor(name: string): string {
  const colors = [
    "#f97316", "#8b5cf6", "#06b6d4", "#10b981", "#ec4899",
    "#f59e0b", "#6366f1", "#14b8a6",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [allTane, setAllTane] = useState<Tane[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [prof, evts, tane, projs] = await Promise.all([
          fetchProfile(id),
          fetchEvents(),
          fetchTane(),
          fetchProjects(),
        ]);
        setProfile(prof);
        setAllEvents(evts);
        setAllTane(tane);
        setAllProjects(projs);
      } catch (e) {
        console.error("Failed to load user:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[var(--color-mute)]">読み込み中...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="px-6 py-20 text-center">
        <p className="text-[var(--color-mute)] mb-4">ユーザーが見つかりません</p>
        <Link
          href="/admin/users"
          className="text-sm text-[var(--color-primary)] hover:underline"
        >
          ユーザー一覧に戻る
        </Link>
      </div>
    );
  }

  const organizedEvents = allEvents.filter((e) => e.organizer_id === profile.id);
  const attendedEvents = allEvents.filter((e) =>
    e.attendees?.some((a) => a.user_id === profile.id)
  );
  const userTane = allTane.filter((t) => t.owner_id === profile.id);
  const userProjects = allProjects.filter((p) => p.owner_id === profile.id);

  const color = avatarColor(profile.display_name);
  const initial = profile.display_name.charAt(0);

  return (
    <div>
      <header className="sticky top-0 bg-[var(--color-card)]/90 backdrop-blur-sm z-40 border-b border-[var(--color-border)] px-6 py-4">
        <Link
          href="/admin/users"
          className="text-sm text-[var(--color-primary)] hover:underline"
        >
          &larr; ユーザー一覧に戻る
        </Link>
      </header>

      <div className="px-6 py-6 space-y-6">
        {/* ヘッダー */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-6 flex items-start gap-5">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name}
              className="w-16 h-16 rounded-full object-cover shrink-0"
            />
          ) : (
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl shrink-0"
              style={{ backgroundColor: color }}
            >
              {initial}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-[var(--color-ink)]">
              {profile.display_name}
            </h1>
            {profile.area && (
              <p className="text-sm text-[var(--color-sub)] mt-0.5">
                {profile.area}
              </p>
            )}
            {profile.bio && (
              <p className="text-sm text-[var(--color-sub)] mt-2 leading-relaxed">
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        {/* 情報カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 認証・登録日 */}
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-6">
            <h3 className="text-xs font-medium text-[var(--color-sub)] mb-3 uppercase tracking-wider">
              アカウント情報
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-xs text-[var(--color-mute)]">認証方法</span>
                <div className="mt-0.5">
                  {profile.provider === "line" ? (
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      LINE
                    </span>
                  ) : profile.provider === "google" ? (
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      Google
                    </span>
                  ) : (
                    <span className="text-[var(--color-mute)]">—</span>
                  )}
                </div>
              </div>
              {profile.line_user_id && (
                <div>
                  <span className="text-xs text-[var(--color-mute)]">LINE User ID</span>
                  <p className="text-sm text-[var(--color-ink)] font-mono break-all">
                    {profile.line_user_id}
                  </p>
                </div>
              )}
              <div>
                <span className="text-xs text-[var(--color-mute)]">登録日</span>
                <p className="text-sm text-[var(--color-ink)]">
                  {formatDate(profile.created_at)}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* 主催イベント */}
        <section className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-6">
          <h2 className="text-base font-bold text-[var(--color-ink)] mb-4">
            主催イベント
            <span className="ml-2 text-sm font-normal text-[var(--color-sub)]">
              ({organizedEvents.length})
            </span>
          </h2>
          {organizedEvents.length > 0 ? (
            <div className="space-y-2">
              {organizedEvents.map((evt) => (
                <Link
                  key={evt.id}
                  href={`/admin/content/${evt.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--color-mute)]/20 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-lg">
                      {evt.event_type === "nomikai" ? "🍻" : "🎪"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--color-ink)] truncate group-hover:text-[var(--color-primary)]">
                        {evt.title}
                      </p>
                      <p className="text-xs text-[var(--color-mute)]">
                        {evt.date} / {evt.status}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-[var(--color-mute)] shrink-0">
                    {evt.attendees?.length ?? 0}人参加
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-mute)]">なし</p>
          )}
        </section>

        {/* 参加イベント */}
        <section className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-6">
          <h2 className="text-base font-bold text-[var(--color-ink)] mb-4">
            参加イベント
            <span className="ml-2 text-sm font-normal text-[var(--color-sub)]">
              ({attendedEvents.length})
            </span>
          </h2>
          {attendedEvents.length > 0 ? (
            <div className="space-y-2">
              {attendedEvents.map((evt) => (
                <Link
                  key={evt.id}
                  href={`/admin/content/${evt.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--color-mute)]/20 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-lg">
                      {evt.event_type === "nomikai" ? "🍻" : "🎪"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--color-ink)] truncate group-hover:text-[var(--color-primary)]">
                        {evt.title}
                      </p>
                      <p className="text-xs text-[var(--color-mute)]">
                        {evt.date} / {evt.venue_name ?? "会場未定"}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-mute)]">なし</p>
          )}
        </section>

        {/* タネ */}
        <section className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-6">
          <h2 className="text-base font-bold text-[var(--color-ink)] mb-4">
            タネ
            <span className="ml-2 text-sm font-normal text-[var(--color-sub)]">
              ({userTane.length})
            </span>
          </h2>
          {userTane.length > 0 ? (
            <div className="space-y-2">
              {userTane.map((t) => (
                <Link
                  key={t.id}
                  href={`/admin/content/${t.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--color-mute)]/20 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-lg">🌱</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--color-ink)] truncate group-hover:text-[var(--color-primary)]">
                        {t.title}
                      </p>
                      <p className="text-xs text-[var(--color-mute)]">
                        {t.status} / 応援 {t.supporter_count ?? 0}人
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-mute)]">なし</p>
          )}
        </section>

        {/* プロジェクト */}
        <section className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-6">
          <h2 className="text-base font-bold text-[var(--color-ink)] mb-4">
            プロジェクト
            <span className="ml-2 text-sm font-normal text-[var(--color-sub)]">
              ({userProjects.length})
            </span>
          </h2>
          {userProjects.length > 0 ? (
            <div className="space-y-2">
              {userProjects.map((proj) => (
                <Link
                  key={proj.id}
                  href={`/admin/content/${proj.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--color-mute)]/20 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-lg">🚀</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--color-ink)] truncate group-hover:text-[var(--color-primary)]">
                        {proj.title}
                      </p>
                      <p className="text-xs text-[var(--color-mute)]">
                        {proj.status} / 応援 {proj.supporter_count ?? 0}人
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-mute)]">なし</p>
          )}
        </section>
      </div>
    </div>
  );
}
