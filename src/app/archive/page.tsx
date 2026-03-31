"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { fetchEvents } from "@/lib/data";
import { Event } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function ArchivePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents()
      .then((all) => setEvents(all.filter((e) => e.status === "closed" || e.status === "cancelled")))
      .catch(() => [])
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen pb-20 max-w-lg mx-auto">
      <div className="px-4 pt-4 pb-3 border-b border-[var(--color-border)]">
        <h1 className="text-lg font-bold">📚 アーカイブ</h1>
        <p className="text-xs text-[var(--color-mute)]">終了したイベント・プロジェクト</p>
      </div>

      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <div className="text-center py-8 text-[var(--color-mute)] text-sm">読み込み中...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">📚</p>
            <p className="text-sm text-[var(--color-sub)]">まだ終了したイベントはありません</p>
            <p className="text-xs text-[var(--color-mute)] mt-1">イベントが終了するとここに表示されます</p>
          </div>
        ) : (
          events.map((event) => (
            <Link key={event.id} href={`/events/${event.id}`}>
              <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{event.event_type === "nomikai" ? "🍻" : "🎪"}</span>
                  <h3 className="text-sm font-bold truncate">{event.title}</h3>
                </div>
                <p className="text-xs text-[var(--color-mute)]">
                  📅 {formatDate(event.date)} {event.start_time && `${event.start_time}〜`}
                  {event.venue_name && ` 📍 ${event.venue_name}`}
                </p>
                <p className="text-xs text-[var(--color-sub)] mt-1">
                  {event.attendees?.length ?? 0}人が参加
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
      <BottomNav />
    </main>
  );
}
