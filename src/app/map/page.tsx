"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { fetchEvents } from "@/lib/data";
import { Event } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const AREAS = ["すべて", "中標津", "別海", "釧路", "根室", "弟子屈", "帯広"];

// SSR無効でLeafletを読み込む（window依存のため）
const LeafletMap = dynamic(() => import("./_LeafletMap"), { ssr: false });

export default function MapPage() {
  const [activeArea, setActiveArea] = useState("すべて");
  const [mapMode, setMapMode] = useState<"map" | "satellite">("map");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchEvents()
      .then((all) =>
        setEvents(all.filter((e) => e.status === "recruiting" || e.status === "confirmed"))
      )
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredEvents =
    activeArea === "すべて"
      ? events
      : events.filter(
          (e) =>
            e.venue_name?.includes(activeArea) ||
            e.venue_address?.includes(activeArea)
        );

  // マーカークリック → リストの該当カードにスクロール
  function handleMarkerClick(id: string) {
    setSelectedEventId(id);
    const el = document.getElementById(`event-card-${id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  return (
    <main className="min-h-screen pb-20 max-w-lg mx-auto">
      <div className="min-h-screen bg-[var(--color-bg)] pb-20">
        {/* Header */}
        <header className="sticky top-0 bg-[var(--color-bg)]/90 backdrop-blur-sm z-[1000] border-b border-[var(--color-border)] px-4 py-3">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-[var(--color-mute)] hover:text-[var(--color-sub)] cursor-pointer"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-lg font-bold">📍 マップ</h1>
              <p className="text-xs text-[var(--color-mute)]">道東エリアのイベント</p>
            </div>
            <div className="ml-auto flex gap-1">
              {(["map", "satellite"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setMapMode(mode)}
                  className={`text-[10px] px-2 py-1 rounded-full cursor-pointer ${
                    mapMode === mode
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-[var(--color-soft)] text-[var(--color-sub)]"
                  }`}
                >
                  {mode === "map" ? "地図" : "航空写真"}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-2 flex gap-1.5 overflow-x-auto hide-scrollbar">
            {AREAS.map((area) => (
              <button
                key={area}
                onClick={() => setActiveArea(area)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  activeArea === area
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-[var(--color-soft)] text-[var(--color-sub)]"
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </header>

        {/* Map */}
        <div
          className="mx-4 mt-4 rounded-2xl overflow-hidden border border-[var(--color-border)]"
          style={{ height: "50vh" }}
        >
          {loading ? (
            <div className="w-full h-full bg-[var(--color-soft)] flex items-center justify-center">
              <div className="text-center text-[var(--color-mute)]">
                <span className="text-4xl block mb-2">🗺️</span>
                <p className="text-sm">読み込み中...</p>
              </div>
            </div>
          ) : (
            <LeafletMap
              events={filteredEvents}
              selectedEventId={selectedEventId}
              onMarkerClick={handleMarkerClick}
              mode={mapMode}
            />
          )}
        </div>

        {/* Legend */}
        <div className="mx-4 mt-2 flex gap-3 text-[10px] text-[var(--color-mute)]">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-[#5B8EED]" /> 飲み会
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-amber-500" /> イベント
          </span>
          <span className="ml-auto">{filteredEvents.length}件表示</span>
        </div>

        {/* Event List */}
        <div ref={listRef} className="px-4 py-4 space-y-2">
          <h2 className="text-sm font-bold text-[var(--color-foreground)] mb-2">
            道東のイベント
          </h2>
          {loading ? (
            <div className="text-center py-8 text-[var(--color-mute)] text-sm">
              読み込み中...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">🗺️</p>
              <p className="text-sm text-[var(--color-sub)]">該当するイベントはありません</p>
            </div>
          ) : (
            filteredEvents.map((event) => (
              <div
                key={event.id}
                id={`event-card-${event.id}`}
                onClick={() => {
                  setSelectedEventId(event.id);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <Link href={`/events/${event.id}`}>
                  <div
                    className={`bg-[var(--color-card)] rounded-2xl border p-4 hover:shadow-sm transition-all ${
                      selectedEventId === event.id
                        ? "border-[var(--color-primary)] shadow-sm"
                        : "border-[var(--color-border)]"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">
                        {event.event_type === "nomikai" ? "🍻" : "🎪"}
                      </span>
                      <h3 className="text-sm font-bold truncate">{event.title}</h3>
                    </div>
                    <p className="text-xs text-[var(--color-mute)]">
                      📅 {formatDate(event.date)}{" "}
                      {event.start_time && `${event.start_time}〜`}
                      {event.venue_name && ` 📍 ${event.venue_name}`}
                    </p>
                    <p className="text-xs text-[var(--color-sub)] mt-1">
                      {event.attendees?.length ?? 0}人が参加
                    </p>
                  </div>
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
      <BottomNav />
    </main>
  );
}
