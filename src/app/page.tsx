"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { EventCard } from "@/components/EventCard";
import { EventCardSkeleton } from "@/components/Skeleton";
import { fetchEvents, fetchTane, fetchProjects } from "@/lib/data";
import { Event, Tane, Project } from "@/lib/types";

type FilterValue = "all" | "nomikai" | "event" | "tane" | "project" | "recruiting" | "confirmed";

const filters: { label: string; value: FilterValue }[] = [
  { label: "すべて", value: "all" },
  { label: "🍻飲み会", value: "nomikai" },
  { label: "🎪イベント", value: "event" },
  { label: "🌱タネ", value: "tane" },
  { label: "🚀プロジェクト", value: "project" },
  { label: "募集中", value: "recruiting" },
  { label: "開催確定", value: "confirmed" },
];

function TaneCard({ tane }: { tane: Tane }) {
  const progress = Math.min(
    ((tane.supporter_count ?? 0) / tane.promotion_threshold) * 100,
    100
  );
  return (
    <Link href={`/tane/${tane.id}`} className="block">
      <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] overflow-hidden hover:shadow-sm transition-shadow">
        {tane.cover_image_url && (
          <div className="w-full h-32 overflow-hidden">
            <img src={tane.cover_image_url} alt={tane.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-4">
        <div className="flex items-start gap-2 mb-2">
          <span className="text-xl">🌱</span>
          <h3 className="text-sm font-bold leading-snug">{tane.title}</h3>
        </div>
        <p className="text-xs text-[var(--color-sub)] line-clamp-2 mb-3">
          {tane.description}
        </p>
        <div className="w-full bg-[var(--color-soft)] rounded-full h-1.5 mb-2">
          <div
            className="h-1.5 rounded-full transition-all"
            style={{
              width: `${progress}%`,
              backgroundColor: "var(--color-tane)",
            }}
          />
        </div>
        <p className="text-xs text-[var(--color-mute)]">
          📣 {tane.supporter_count ?? 0}人が応援
          <span className="text-[var(--color-mute)] ml-1">
            / {tane.promotion_threshold}人で昇格
          </span>
        </p>
        </div>
      </div>
    </Link>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const statusLabels: Record<string, { label: string; color: string }> = {
    planning: { label: "企画中", color: "var(--color-mute)" },
    active: { label: "活動中", color: "var(--color-project)" },
    paused: { label: "休止中", color: "var(--color-warning, #f59e0b)" },
    completed: { label: "完了", color: "var(--color-sub)" },
  };
  const st = statusLabels[project.status] ?? statusLabels.planning;

  return (
    <Link href={`/projects/${project.id}`} className="block">
      <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] overflow-hidden hover:shadow-sm transition-shadow">
        {project.cover_image_url && (
          <div className="w-full h-32 overflow-hidden">
            <img src={project.cover_image_url} alt={project.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-4">
        <div className="flex items-start gap-2 mb-2">
          <span className="text-xl">🚀</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-sm font-bold leading-snug truncate">{project.title}</h3>
              <span
                className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full text-white"
                style={{ backgroundColor: st.color }}
              >
                {st.label}
              </span>
            </div>
          </div>
        </div>
        <p className="text-xs text-[var(--color-sub)] line-clamp-2 mb-3">
          {project.description}
        </p>
        <p className="text-xs text-[var(--color-mute)]">
          👥 コア{project.core_members?.length ?? 0}人 / 📣 応援{project.supporter_count ?? 0}人
        </p>
        </div>
      </div>
    </Link>
  );
}

export default function EventListPage() {
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all");
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [taneList, setTaneList] = useState<Tane[]>([]);
  const [projectList, setProjectList] = useState<Project[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [dbEvents, dbTane, dbProjects] = await Promise.all([
          fetchEvents().catch(() => []),
          fetchTane().catch(() => []),
          fetchProjects().catch(() => []),
        ]);
        setEvents(dbEvents);
        setTaneList(dbTane);
        setProjectList(dbProjects);
      } catch {
        // DB接続エラー時は空のまま
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredEvents =
    activeFilter === "all"
      ? events
      : activeFilter === "nomikai" || activeFilter === "event"
        ? events.filter((e) => e.event_type === activeFilter)
        : activeFilter === "recruiting" || activeFilter === "confirmed"
          ? events.filter((e) => e.status === activeFilter)
          : [];

  const showTane = activeFilter === "all" || activeFilter === "tane";
  const showProjects = activeFilter === "all" || activeFilter === "project";
  const showEvents = activeFilter !== "tane" && activeFilter !== "project";

  const hasContent =
    (showEvents && filteredEvents.length > 0) ||
    (showTane && taneList.length > 0) ||
    (showProjects && projectList.length > 0);

  return (
    <div>
      {/* ヘッダー */}
      <header className="sticky top-0 bg-[var(--color-bg)]/95 backdrop-blur-sm z-40 border-b border-[var(--color-border)]">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight">
            <span className="text-[var(--color-primary)]">指とま</span>
            <span className="text-[var(--color-mute)] text-xs font-normal ml-1.5">この指とまれ！</span>
          </h1>
          <Link
            href="/map"
            className="p-1.5 rounded-lg text-[var(--color-mute)] hover:text-[var(--color-sub)] hover:bg-[var(--color-soft)] transition-colors"
            title="マップ"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
        </div>
        {/* フィルター */}
        <div className="px-4 pb-2.5 flex gap-2 overflow-x-auto hide-scrollbar" style={{ scrollSnapType: "x mandatory" }}>
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              style={{ scrollSnapAlign: "start" }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activeFilter === f.value
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--color-soft)] text-[var(--color-sub)] hover:bg-[var(--color-border)]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

      {/* コンテンツ一覧 */}
      <div className="px-4 py-4 space-y-4">
        {loading ? (
          <>
            <EventCardSkeleton />
            <EventCardSkeleton />
          </>
        ) : !hasContent ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">☝️</div>
            <p className="text-sm text-[var(--color-sub)] font-medium">まだ投稿がありません</p>
            <p className="text-xs text-[var(--color-mute)] mt-1 mb-6">最初の言い出しっぺになろう！</p>
            <Link
              href="/events/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--color-primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <span>＋</span>
              イベントを作成する
            </Link>
          </div>
        ) : (
          <>
            {activeFilter === "all" ? (
              // 全表示時は時系列で統合表示
              (() => {
                type FeedItem =
                  | { type: "event"; data: Event; sortDate: number }
                  | { type: "tane"; data: Tane; sortDate: number }
                  | { type: "project"; data: Project; sortDate: number };
                const items: FeedItem[] = [
                  ...events.map((e) => ({ type: "event" as const, data: e, sortDate: new Date(e.date).getTime() })),
                  ...taneList.map((t) => ({ type: "tane" as const, data: t, sortDate: new Date(t.created_at).getTime() })),
                  ...projectList.map((p) => ({ type: "project" as const, data: p, sortDate: new Date(p.created_at).getTime() })),
                ];
                items.sort((a, b) => b.sortDate - a.sortDate);
                return items.map((item) => {
                  if (item.type === "event") return <EventCard key={`event-${item.data.id}`} event={item.data} />;
                  if (item.type === "tane") return <TaneCard key={`tane-${item.data.id}`} tane={item.data} />;
                  return <ProjectCard key={`project-${item.data.id}`} project={item.data} />;
                });
              })()
            ) : (
              <>
                {/* イベントカード */}
                {showEvents && filteredEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}

                {/* タネカード */}
                {showTane && taneList.map((tane) => (
                  <TaneCard key={tane.id} tane={tane} />
                ))}

                {/* プロジェクトカード */}
                {showProjects && projectList.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
