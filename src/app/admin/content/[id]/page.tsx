"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  fetchEvent,
  fetchTaneById,
  fetchProject,
  fetchAllProfiles,
  fetchProjects,
  updateEventStatus,
  updateTaneStatus,
  updateProjectStatus,
} from "@/lib/data";
import { CATEGORIES } from "@/lib/types";
import type { Event, Tane, Project } from "@/lib/types";

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

type ContentData =
  | { kind: "event"; data: Event }
  | { kind: "tane"; data: Tane }
  | { kind: "project"; data: Project }
  | null;

export default function ContentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [content, setContent] = useState<ContentData>(null);
  const [profileMap, setProfileMap] = useState<Map<string, string>>(new Map());
  const [projectMap, setProjectMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [event, tane, project, profiles, allProjects] = await Promise.all([
          fetchEvent(id),
          fetchTaneById(id),
          fetchProject(id),
          fetchAllProfiles(),
          fetchProjects(),
        ]);

        const map = new Map<string, string>();
        for (const p of profiles) {
          map.set(p.id, p.display_name);
        }
        setProfileMap(map);

        const pMap = new Map<string, string>();
        for (const proj of allProjects) {
          pMap.set(proj.id, proj.title);
        }
        setProjectMap(pMap);

        if (event) {
          setContent({ kind: "event", data: event });
        } else if (tane) {
          setContent({ kind: "tane", data: tane });
        } else if (project) {
          setContent({ kind: "project", data: project });
        } else {
          setContent(null);
        }
      } catch (e) {
        console.error("Failed to load content:", e);
        setContent(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function getProfileName(userId: string) {
    return profileMap.get(userId) ?? "不明";
  }

  async function handleStatusChange(contentId: string, kind: "event" | "tane" | "project", newStatus: string) {
    try {
      if (kind === "event") await updateEventStatus(contentId, newStatus);
      else if (kind === "tane") await updateTaneStatus(contentId, newStatus);
      else await updateProjectStatus(contentId, newStatus);

      // Update local state
      setContent((prev) => {
        if (!prev) return prev;
        return { ...prev, data: { ...prev.data, status: newStatus } } as ContentData;
      });
      alert(`ステータスを「${statusLabels[newStatus] ?? newStatus}」に変更しました`);
    } catch (e) {
      alert("ステータス変更に失敗しました");
    }
  }

  function handleApprove(attendeeId: string) {
    alert("参加者を承認しました");
  }

  function handleReject(attendeeId: string) {
    alert("参加者を拒否しました");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[var(--color-mute)]">読み込み中...</p>
      </div>
    );
  }

  if (!content) {
    return (
      <>
        <Link
          href="/admin/content"
          className="text-sm text-[var(--color-primary)] hover:underline mb-4 inline-block"
        >
          ← コンテンツ一覧に戻る
        </Link>
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-12 text-center">
          <p className="text-[var(--color-mute)]">コンテンツが見つかりません</p>
        </div>
      </>
    );
  }

  const { kind, data } = content;
  const type =
    kind === "event" ? data.event_type : kind === "tane" ? "tane" : "project";
  const cat = getCategoryInfo(type);
  const status = data.status;
  const ownerId =
    kind === "event" ? data.organizer_id : data.owner_id;
  const createdAt = data.created_at.split("T")[0];

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/content"
          className="text-sm text-[var(--color-primary)] hover:underline"
        >
          ← 一覧
        </Link>
        <span className="text-[var(--color-border)]">/</span>
        <span className="text-sm text-[var(--color-sub)]">{data.title}</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-[var(--color-mute)]">
              {cat.emoji} {cat.label}
            </span>
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}
            >
              {statusLabels[status] ?? status}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-ink)]">{data.title}</h1>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/content/${id}/edit`}
            className="px-4 py-2 text-sm rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] transition-colors"
          >
            編集
          </Link>
        </div>
      </div>

      {/* Status change controls */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-5 mb-6">
        <h2 className="text-sm font-bold text-[var(--color-ink)] mb-3">ステータス変更</h2>
        <div className="flex flex-wrap gap-2">
          {(kind === "event"
            ? ["recruiting", "confirmed", "closed", "cancelled"]
            : kind === "tane"
            ? ["open", "reached", "promoted", "closed"]
            : ["planning", "active", "paused", "completed"]
          ).map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(id, kind, s)}
              disabled={status === s}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer disabled:cursor-default ${
                status === s
                  ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                  : "bg-[var(--color-card)] text-[var(--color-sub)] border-[var(--color-border)] hover:bg-[var(--color-soft)]"
              }`}
            >
              {statusLabels[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-5">
            <h2 className="text-sm font-bold text-[var(--color-ink)] mb-3">詳細情報</h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-[var(--color-mute)]">作成者:</span>{" "}
                <span className="text-[var(--color-ink)]">{getProfileName(ownerId)}</span>
              </div>
              <div>
                <span className="text-[var(--color-mute)]">作成日:</span>{" "}
                <span className="text-[var(--color-ink)]">{createdAt}</span>
              </div>
              {kind === "event" && (
                <>
                  <div>
                    <span className="text-[var(--color-mute)]">日時:</span>{" "}
                    <span className="text-[var(--color-ink)]">
                      {data.date} {data.start_time}
                    </span>
                  </div>
                  {data.venue_name && (
                    <div>
                      <span className="text-[var(--color-mute)]">会場:</span>{" "}
                      <span className="text-[var(--color-ink)]">
                        {data.venue_name}
                        {data.venue_address ? ` (${data.venue_address})` : ""}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-[var(--color-mute)]">人数:</span>{" "}
                    <span className="text-[var(--color-ink)]">
                      {data.min_people}〜{data.max_people ?? "上限なし"}人
                    </span>
                  </div>
                  {data.fee_per_person != null && (
                    <div>
                      <span className="text-[var(--color-mute)]">参加費:</span>{" "}
                      <span className="text-[var(--color-ink)]">
                        {data.fee_per_person.toLocaleString()}円
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-[var(--color-mute)]">関連プロジェクト:</span>{" "}
                    <span className="text-[var(--color-ink)]">
                      {data.related_project_id
                        ? `🚀 ${projectMap.get(data.related_project_id) ?? data.related_project_id}`
                        : "なし"}
                    </span>
                  </div>
                </>
              )}
              {kind === "tane" && (
                <div>
                  <span className="text-[var(--color-mute)]">昇格閾値:</span>{" "}
                  <span className="text-[var(--color-ink)]">
                    {data.supporter_count ?? 0} / {data.promotion_threshold}人
                  </span>
                </div>
              )}
              {kind === "project" && data.external_links.length > 0 && (
                <div>
                  <span className="text-[var(--color-mute)]">外部リンク:</span>
                  <ul className="mt-1 space-y-1">
                    {data.external_links.map((link, i) => (
                      <li key={i}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--color-primary)] hover:underline"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
              <h3 className="text-sm font-bold text-[var(--color-ink)] mb-2">説明</h3>
              <p className="text-sm text-[var(--color-sub)] whitespace-pre-wrap">
                {data.description}
              </p>
            </div>
          </div>
        </div>

        {/* Side info */}
        <div className="space-y-4">
          {kind === "event" && (
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-5">
              <h2 className="text-sm font-bold text-[var(--color-ink)] mb-2">設定</h2>
              <div className="space-y-2 text-xs text-[var(--color-sub)]">
                <div className="flex justify-between">
                  <span>公開設定</span>
                  <span className="text-[var(--color-ink)]">
                    {data.is_private ? "非公開" : "公開"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>承認制</span>
                  <span className="text-[var(--color-ink)]">
                    {data.requires_approval ? "あり" : "なし"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>決済方法</span>
                  <span className="text-[var(--color-ink)]">{data.payment_method}</span>
                </div>
                {data.deadline && (
                  <div className="flex justify-between">
                    <span>締切</span>
                    <span className="text-[var(--color-ink)]">
                      {data.deadline.split("T")[0]}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          {kind === "tane" && (
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-5">
              <h2 className="text-sm font-bold text-[var(--color-ink)] mb-2">応援状況</h2>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 bg-[var(--color-soft)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-tane)] rounded-full"
                    style={{
                      width: `${Math.min(100, ((data.supporter_count ?? 0) / data.promotion_threshold) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-bold text-[var(--color-ink)]">
                  {data.supporter_count ?? 0}/{data.promotion_threshold}
                </span>
              </div>
              <div className="mt-2 text-xs text-[var(--color-mute)]">
                ウォッチャー: {data.watcher_count ?? 0}人
              </div>
            </div>
          )}
          {kind === "project" && (
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-5">
              <h2 className="text-sm font-bold text-[var(--color-ink)] mb-2">プロジェクト情報</h2>
              <div className="space-y-2 text-xs text-[var(--color-sub)]">
                <div className="flex justify-between">
                  <span>応援者</span>
                  <span className="text-[var(--color-ink)]">{data.supporter_count ?? 0}人</span>
                </div>
                <div className="flex justify-between">
                  <span>ウォッチャー</span>
                  <span className="text-[var(--color-ink)]">{data.watcher_count ?? 0}人</span>
                </div>
                {data.core_members && (
                  <div className="flex justify-between">
                    <span>コアメンバー</span>
                    <span className="text-[var(--color-ink)]">{data.core_members.length}人</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Attendee list for events */}
      {kind === "event" && data.attendees && data.attendees.length > 0 && (
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--color-border)]">
            <h2 className="text-sm font-bold text-[var(--color-ink)]">
              参加者一覧 ({data.attendees.length}人)
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-soft)]">
                <th className="text-left px-4 py-3 font-medium text-[var(--color-sub)]">名前</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--color-sub)]">ステータス</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--color-sub)]">交通手段</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--color-sub)]">ドリンク</th>
                <th className="text-right px-4 py-3 font-medium text-[var(--color-sub)]">アクション</th>
              </tr>
            </thead>
            <tbody>
              {data.attendees.map((attendee, i) => (
                <tr
                  key={attendee.id}
                  className={`border-b border-[var(--color-border)] last:border-b-0 ${
                    i % 2 === 1 ? "bg-[var(--color-soft)]/50" : ""
                  }`}
                >
                  <td className="px-4 py-3 text-[var(--color-ink)] font-medium">
                    {attendee.profile?.display_name ?? getProfileName(attendee.user_id)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        attendee.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : attendee.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {attendee.status === "approved"
                        ? "承認済"
                        : attendee.status === "pending"
                        ? "保留中"
                        : "拒否"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-sub)]">
                    {attendee.transport ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-sub)]">
                    {attendee.drink_preference ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {attendee.status === "pending" && (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleApprove(attendee.id)}
                          className="px-2 py-1 text-xs rounded bg-green-50 text-green-700 hover:bg-green-100 transition-colors cursor-pointer"
                        >
                          承認
                        </button>
                        <button
                          onClick={() => handleReject(attendee.id)}
                          className="px-2 py-1 text-xs rounded bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                        >
                          拒否
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Project updates */}
      {kind === "project" && data.updates && data.updates.length > 0 && (
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-5 mt-6">
          <h2 className="text-sm font-bold text-[var(--color-ink)] mb-4">進捗投稿</h2>
          <div className="space-y-4">
            {data.updates.map((update) => (
              <div
                key={update.id}
                className="border-b border-[var(--color-border)] last:border-b-0 pb-4 last:pb-0"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-[var(--color-ink)]">
                    {update.author?.display_name ?? getProfileName(update.author_id)}
                  </span>
                  <span className="text-xs text-[var(--color-mute)]">
                    {update.created_at.split("T")[0]}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-sub)]">{update.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
