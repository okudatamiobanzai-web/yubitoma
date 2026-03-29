"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchEvents } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import type { Event } from "@/lib/types";

const categoryLabels: Record<string, string> = {
  nomikai: "飲み会",
  event: "イベント",
};

export default function AdminArchiveListPage() {
  const [search, setSearch] = useState("");
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents()
      .then((events) => {
        // 終了・キャンセル、もしくは日付が過去のイベントをアーカイブとして表示
        const now = new Date();
        const archived = events.filter(
          (e) =>
            e.status === "closed" ||
            e.status === "cancelled" ||
            new Date(e.date) < now
        );
        archived.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setPastEvents(archived);
      })
      .catch(() => setPastEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = pastEvents.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-[var(--color-mute)]">読み込み中...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-ink)]">アーカイブ管理</h1>
        <p className="text-sm text-[var(--color-mute)] mt-1">
          終了したイベントの振り返りコンテンツを管理
        </p>
      </div>

      {/* 検索 */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="タイトルで検索..."
          className="w-full max-w-md px-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm bg-[var(--color-card)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-primary)]"
        />
      </div>

      {/* テーブル */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-soft)]">
                <th className="text-left px-4 py-3 font-medium text-[var(--color-sub)]">タイトル</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--color-sub)]">カテゴリ</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--color-sub)]">開催日</th>
                <th className="text-center px-4 py-3 font-medium text-[var(--color-sub)]">参加者数</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--color-sub)]">ステータス</th>
                <th className="text-center px-4 py-3 font-medium text-[var(--color-sub)]">アクション</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((event, i) => (
                <tr
                  key={event.id}
                  className={`border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-soft)]/50 transition-colors ${
                    i % 2 === 1 ? "bg-[var(--color-soft)]/30" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-[var(--color-ink)]">{event.title}</div>
                    {event.venue_name && (
                      <div className="text-xs text-[var(--color-mute)]">{event.venue_name}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${
                      event.event_type === "event"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-orange-100 text-orange-700"
                    }`}>
                      {categoryLabels[event.event_type] ?? event.event_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-sub)] whitespace-nowrap">
                    {formatDate(event.date)}
                  </td>
                  <td className="px-4 py-3 text-center text-[var(--color-sub)]">
                    {event.attendees?.length ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${
                      event.status === "closed" ? "bg-gray-100 text-gray-600" :
                      event.status === "cancelled" ? "bg-red-100 text-red-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {event.status === "closed" ? "終了" : event.status === "cancelled" ? "キャンセル" : "過去"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link
                      href={`/admin/content/${event.id}`}
                      className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity"
                    >
                      詳細
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[var(--color-mute)]">
                    {pastEvents.length === 0
                      ? "まだ終了したイベントがありません"
                      : "該当するアーカイブが見つかりません"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
