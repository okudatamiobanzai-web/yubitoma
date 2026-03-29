"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  fetchEvents,
  fetchTane,
  fetchProjects,
  fetchAllProfiles,
  updateEventStatus,
  updateTaneStatus,
  updateProjectStatus,
  deleteEvent,
  deleteTane,
  deleteProject,
} from "@/lib/data";
import { CATEGORIES, type EventType, type EventStatus, type Event, type Tane, type Project, type Profile } from "@/lib/types";

type ContentItem = {
  id: string;
  title: string;
  type: EventType;
  status: string;
  date: string;
  creatorName: string;
  participantCount: number;
  participantLabel: string;
};

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

const statusFilterOptions = [
  { value: "", label: "すべて" },
  { value: "recruiting", label: "募集中" },
  { value: "confirmed", label: "開催確定" },
  { value: "closed", label: "終了" },
  { value: "cancelled", label: "キャンセル" },
];

function getCategoryInfo(type: string) {
  return CATEGORIES.find((c) => c.value === type) ?? CATEGORIES[0];
}

type TabValue = "all" | "nomikai" | "event" | "tane" | "project";

const tabs: { value: TabValue; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "nomikai", label: "🍻飲み会" },
  { value: "event", label: "🎪イベント" },
  { value: "tane", label: "🌱タネ" },
  { value: "project", label: "🚀プロジェクト" },
];

export default function ContentManagement() {
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [statusDropdownId, setStatusDropdownId] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [taneList, setTaneList] = useState<Tane[]>([]);
  const [projects, setProjectList] = useState<Project[]>([]);
  const [profileMap, setProfileMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [evts, tane, projs, profiles] = await Promise.all([
          fetchEvents(),
          fetchTane(),
          fetchProjects(),
          fetchAllProfiles(),
        ]);
        setEvents(evts);
        setTaneList(tane);
        setProjectList(projs);
        const map = new Map<string, string>();
        for (const p of profiles) {
          map.set(p.id, p.display_name);
        }
        setProfileMap(map);
      } catch (e) {
        console.error("Failed to load content:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function getProfileName(id: string) {
    return profileMap.get(id) ?? "不明";
  }

  // Build unified content list
  const allContent: ContentItem[] = useMemo(() => {
    const items: ContentItem[] = [];

    for (const event of events) {
      items.push({
        id: event.id,
        title: event.title,
        type: event.event_type as EventType,
        status: event.status,
        date: event.date,
        creatorName: getProfileName(event.organizer_id),
        participantCount: event.attendees?.length ?? 0,
        participantLabel: "参加者",
      });
    }

    for (const tane of taneList) {
      items.push({
        id: tane.id,
        title: tane.title,
        type: "tane" as EventType,
        status: tane.status,
        date: tane.created_at.split("T")[0],
        creatorName: getProfileName(tane.owner_id),
        participantCount: tane.supporter_count ?? 0,
        participantLabel: "応援者",
      });
    }

    for (const proj of projects) {
      items.push({
        id: proj.id,
        title: proj.title,
        type: "project" as EventType,
        status: proj.status,
        date: proj.created_at.split("T")[0],
        creatorName: getProfileName(proj.owner_id),
        participantCount: proj.supporter_count ?? 0,
        participantLabel: "応援者",
      });
    }

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [events, taneList, projects, profileMap]);

  const filtered = useMemo(() => {
    return allContent.filter((item) => {
      if (activeTab !== "all" && item.type !== activeTab) return false;
      if (search && !item.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter && item.status !== statusFilter) return false;
      return true;
    });
  }, [allContent, activeTab, search, statusFilter]);

  function getItemKind(item: ContentItem): "event" | "tane" | "project" {
    if (item.type === "tane") return "tane";
    if (item.type === "project") return "project";
    return "event";
  }

  async function handleStatusChange(id: string, type: EventType, newStatus: string) {
    try {
      const kind = type === "tane" ? "tane" : type === "project" ? "project" : "event";
      if (kind === "event") await updateEventStatus(id, newStatus);
      else if (kind === "tane") await updateTaneStatus(id, newStatus);
      else await updateProjectStatus(id, newStatus);

      // Update local state
      if (kind === "event") {
        setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status: newStatus as EventStatus } : e)));
      } else if (kind === "tane") {
        setTaneList((prev) => prev.map((t) => (t.id === id ? { ...t, status: newStatus as Tane["status"] } : t)));
      } else {
        setProjectList((prev) => prev.map((p) => (p.id === id ? { ...p, status: newStatus as Project["status"] } : p)));
      }
      alert(`ステータスを「${statusLabels[newStatus] ?? newStatus}」に変更しました`);
    } catch (e) {
      alert("ステータス変更に失敗しました");
    }
    setStatusDropdownId(null);
  }

  async function handleDelete(id: string, title: string, type: EventType) {
    if (!window.confirm(`「${title}」を削除しますか？この操作は取り消せません。`)) return;
    try {
      const kind = type === "tane" ? "tane" : type === "project" ? "project" : "event";
      if (kind === "event") {
        await deleteEvent(id);
        setEvents((prev) => prev.filter((e) => e.id !== id));
      } else if (kind === "tane") {
        await deleteTane(id);
        setTaneList((prev) => prev.filter((t) => t.id !== id));
      } else {
        await deleteProject(id);
        setProjectList((prev) => prev.filter((p) => p.id !== id));
      }
      alert(`「${title}」を削除しました`);
    } catch (e) {
      alert("削除に失敗しました");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[var(--color-mute)]">読み込み中...</p>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-[var(--color-ink)] mb-6">コンテンツ管理</h1>

      {/* Tab bar */}
      <div className="flex gap-1 mb-4 border-b border-[var(--color-border)]">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.value
                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-transparent text-[var(--color-sub)] hover:text-[var(--color-ink)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="タイトルで検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm bg-[var(--color-card)] text-[var(--color-ink)] w-64 focus:outline-none focus:border-[var(--color-primary)]"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm bg-[var(--color-card)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-primary)]"
        >
          {statusFilterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="flex items-center text-sm text-[var(--color-mute)]">
          {filtered.length}件
        </span>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-soft)]">
              <th className="text-left px-4 py-3 font-medium text-[var(--color-sub)]">タイトル</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-sub)]">カテゴリ</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-sub)]">作成者</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-sub)]">ステータス</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-sub)]">日付</th>
              <th className="text-right px-4 py-3 font-medium text-[var(--color-sub)]">参加者/応援者</th>
              <th className="text-right px-4 py-3 font-medium text-[var(--color-sub)]">アクション</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, i) => {
              const cat = getCategoryInfo(item.type);
              return (
                <tr
                  key={item.id}
                  className={`border-b border-[var(--color-border)] last:border-b-0 ${
                    i % 2 === 1 ? "bg-[var(--color-soft)]/50" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/content/${item.id}`}
                      className="text-[var(--color-ink)] font-medium hover:text-[var(--color-primary)]"
                    >
                      {item.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-sub)]">
                    {cat.emoji} {cat.label}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-sub)]">{item.creatorName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[item.status]}`}
                    >
                      {statusLabels[item.status] ?? item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-sub)]">{item.date}</td>
                  <td className="px-4 py-3 text-right text-[var(--color-sub)]">
                    {item.participantCount}{item.participantLabel === "応援者" ? "人応援" : "人"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 relative">
                      <Link
                        href={`/admin/content/${item.id}/edit`}
                        className="px-2 py-1 text-xs rounded bg-[var(--color-soft)] text-[var(--color-sub)] hover:bg-[var(--color-border)] transition-colors"
                      >
                        編集
                      </Link>
                      <div className="relative">
                        <button
                          onClick={() =>
                            setStatusDropdownId(statusDropdownId === item.id ? null : item.id)
                          }
                          className="px-2 py-1 text-xs rounded bg-[var(--color-soft)] text-[var(--color-sub)] hover:bg-[var(--color-border)] transition-colors"
                        >
                          ステータス
                        </button>
                        {statusDropdownId === item.id && (
                          <div className="absolute right-0 top-full mt-1 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg shadow-lg z-10 min-w-[120px]">
                            {["recruiting", "confirmed", "closed", "cancelled"].map((s) => (
                              <button
                                key={s}
                                onClick={() => handleStatusChange(item.id, item.type, s)}
                                className="block w-full text-left px-3 py-2 text-xs text-[var(--color-ink)] hover:bg-[var(--color-soft)] first:rounded-t-lg last:rounded-b-lg"
                              >
                                {statusLabels[s]}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(item.id, item.title, item.type)}
                        className="px-2 py-1 text-xs rounded bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      >
                        削除
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="px-4 py-12 text-center text-[var(--color-mute)]">
            該当するコンテンツがありません
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden flex flex-col gap-3">
        {filtered.map((item) => {
          const cat = getCategoryInfo(item.type);
          return (
            <div
              key={item.id}
              className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-[var(--color-mute)] mb-1">
                    {cat.emoji} {cat.label}
                  </div>
                  <Link
                    href={`/admin/content/${item.id}`}
                    className="font-medium text-[var(--color-ink)] hover:text-[var(--color-primary)]"
                  >
                    {item.title}
                  </Link>
                </div>
                <span
                  className={`shrink-0 ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[item.status]}`}
                >
                  {statusLabels[item.status] ?? item.status}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-[var(--color-sub)] mb-3">
                <span>{item.creatorName}</span>
                <span>{item.date}</span>
                <span>
                  {item.participantCount}
                  {item.participantLabel === "応援者" ? "人応援" : "人参加"}
                </span>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/admin/content/${item.id}/edit`}
                  className="px-3 py-1.5 text-xs rounded-lg bg-[var(--color-soft)] text-[var(--color-sub)] hover:bg-[var(--color-border)]"
                >
                  編集
                </Link>
                <button
                  onClick={() => handleDelete(item.id, item.title, item.type)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                >
                  削除
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-[var(--color-mute)]">
            該当するコンテンツがありません
          </div>
        )}
      </div>
    </>
  );
}
