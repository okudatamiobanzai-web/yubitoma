"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchEvents, fetchTane, fetchProjects, fetchAllProfiles } from "@/lib/data";
import { CATEGORIES, type Event, type Tane, type Profile } from "@/lib/types";

const statusLabels: Record<string, string> = {
  recruiting: "募集中",
  confirmed: "開催確定",
  closed: "終了",
  cancelled: "キャンセル",
  open: "募集中",
  reached: "達成",
  promoted: "昇格済",
  planning: "企画中",
  active: "進行中",
  paused: "一時停止",
  completed: "完了",
};

const statusColors: Record<string, string> = {
  recruiting: "bg-blue-100 text-blue-700",
  confirmed: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-700",
  open: "bg-blue-100 text-blue-700",
  reached: "bg-green-100 text-green-700",
  promoted: "bg-purple-100 text-purple-700",
  planning: "bg-yellow-100 text-yellow-700",
  active: "bg-green-100 text-green-700",
  paused: "bg-orange-100 text-orange-700",
  completed: "bg-gray-100 text-gray-600",
};

function getCategoryInfo(type: string) {
  return CATEGORIES.find((c) => c.value === type) ?? CATEGORIES[0];
}

export default function AdminDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [taneList, setTaneList] = useState<Tane[]>([]);
  const [projectCount, setProjectCount] = useState(0);
  const [profileCount, setProfileCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem("admin_session");
    if (!session) {
      window.location.href = "/admin/login";
      return;
    }
    try {
      const parsed = JSON.parse(session);
      // 24時間で期限切れ
      if (Date.now() - parsed.ts > 24 * 60 * 60 * 1000) {
        localStorage.removeItem("admin_session");
        window.location.href = "/admin/login";
        return;
      }
      setAuthed(true);
    } catch {
      window.location.href = "/admin/login";
      return;
    }
  }, []);

  useEffect(() => {
    if (!authed) return;
    async function load() {
      try {
        const [ev, tn, pr, pf] = await Promise.all([
          fetchEvents().catch(() => []),
          fetchTane().catch(() => []),
          fetchProjects().catch(() => []),
          fetchAllProfiles().catch(() => []),
        ]);
        setEvents(ev);
        setTaneList(tn);
        setProjectCount(pr.length);
        setProfileCount(pf.length);
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [authed]);

  if (!authed || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-[var(--color-mute)]">読み込み中...</div>
      </div>
    );
  }

  const stats = [
    { label: "イベント数", value: events.length, bg: "bg-blue-50", color: "text-blue-700" },
    { label: "タネ数", value: taneList.length, bg: "bg-amber-50", color: "text-amber-700" },
    { label: "プロジェクト数", value: projectCount, bg: "bg-purple-50", color: "text-purple-700" },
    { label: "ユーザー数", value: profileCount, bg: "bg-green-50", color: "text-green-700" },
  ];

  const recentEvents = [...events]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const recentTane = [...taneList]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  return (
    <>
      <h1 className="text-2xl font-bold text-[var(--color-ink)] mb-6">ダッシュボード</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`${stat.bg} rounded-xl p-5 border border-[var(--color-border)]`}
          >
            <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-sm text-[var(--color-sub)] mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Events */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[var(--color-ink)]">最近のイベント</h2>
          <Link href="/admin/content" className="text-sm text-[var(--color-primary)] hover:underline">
            すべて見る →
          </Link>
        </div>
        {recentEvents.length === 0 ? (
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-8 text-center text-[var(--color-mute)]">
            まだイベントがありません
          </div>
        ) : (
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-soft)]">
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-sub)]">タイトル</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-sub)]">カテゴリ</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-sub)]">ステータス</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--color-sub)]">日付</th>
                  <th className="text-right px-4 py-3 font-medium text-[var(--color-sub)]">参加者</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.map((event, i) => {
                  const cat = getCategoryInfo(event.event_type);
                  return (
                    <tr
                      key={event.id}
                      className={`border-b border-[var(--color-border)] last:border-b-0 ${
                        i % 2 === 1 ? "bg-[var(--color-soft)]/50" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-[var(--color-ink)] font-medium">
                        <Link href={`/admin/content/${event.id}`} className="hover:text-[var(--color-primary)]">
                          {event.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-[var(--color-sub)]">{cat.emoji} {cat.label}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[event.status]}`}>
                          {statusLabels[event.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--color-sub)]">{event.date}</td>
                      <td className="px-4 py-3 text-right text-[var(--color-sub)]">
                        {event.attendees?.length ?? 0}人
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Recent Tane */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[var(--color-ink)]">最近のタネ</h2>
          <Link href="/admin/content" className="text-sm text-[var(--color-primary)] hover:underline">
            すべて見る →
          </Link>
        </div>
        {recentTane.length === 0 ? (
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-8 text-center text-[var(--color-mute)]">
            まだタネがありません
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentTane.map((tane) => (
              <Link
                key={tane.id}
                href={`/admin/content/${tane.id}`}
                className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-5 hover:border-[var(--color-primary)] transition-colors"
              >
                <div className="text-xs text-[var(--color-mute)] mb-1">🌱 タネ</div>
                <h3 className="font-bold text-[var(--color-ink)] mb-2">{tane.title}</h3>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-sub)]">
                    応援 {tane.supporter_count ?? 0} / {tane.promotion_threshold}
                  </span>
                  <div className="w-24 h-2 bg-[var(--color-soft)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-tane)] rounded-full"
                      style={{
                        width: `${Math.min(100, ((tane.supporter_count ?? 0) / tane.promotion_threshold) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
