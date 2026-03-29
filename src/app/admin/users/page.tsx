"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchAllProfiles, fetchEvents } from "@/lib/data";
import type { Profile, Event } from "@/lib/types";

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

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [profs, evts] = await Promise.all([
          fetchAllProfiles(),
          fetchEvents(),
        ]);
        setProfiles(profs);
        setEvents(evts);
      } catch (e) {
        console.error("Failed to load users:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function getUserEventCounts(userId: string) {
    const organized = events.filter((e) => e.organizer_id === userId).length;
    const attended = events.filter((e) =>
      e.attendees?.some((a) => a.user_id === userId)
    ).length;
    return { organized, attended };
  }

  const filtered = profiles.filter((p) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      p.display_name.toLowerCase().includes(q) ||
      (p.area ?? "").toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[var(--color-mute)]">読み込み中...</p>
      </div>
    );
  }

  return (
    <div>
      <header className="sticky top-0 bg-[var(--color-card)]/90 backdrop-blur-sm z-40 border-b border-[var(--color-border)] px-6 py-4">
        <h1 className="text-xl font-bold text-[var(--color-ink)]">ユーザー管理</h1>
        <p className="text-xs text-[var(--color-sub)] mt-0.5">
          登録ユーザー {profiles.length} 人
        </p>
      </header>

      <div className="px-6 py-6 space-y-6">
        {/* 検索 */}
        <div>
          <input
            type="text"
            placeholder="名前・エリアで検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-mute)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>

        {/* テーブル */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-sub)]">
                  <th className="px-4 py-3 font-medium">アバター</th>
                  <th className="px-4 py-3 font-medium">名前</th>
                  <th className="px-4 py-3 font-medium">エリア</th>
                  <th className="px-4 py-3 font-medium">認証方法</th>
                  <th className="px-4 py-3 font-medium text-center">主催イベント数</th>
                  <th className="px-4 py-3 font-medium text-center">参加イベント数</th>
                  <th className="px-4 py-3 font-medium">登録日</th>
                  <th className="px-4 py-3 font-medium">アクション</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((profile, idx) => {
                  const counts = getUserEventCounts(profile.id);
                  const color = avatarColor(profile.display_name);
                  const initial = profile.display_name.charAt(0);
                  const dateStr = new Date(profile.created_at).toLocaleDateString("ja-JP");

                  return (
                    <tr
                      key={profile.id}
                      className={`border-b border-[var(--color-border)] hover:bg-[var(--color-mute)]/30 transition-colors ${
                        idx % 2 === 1 ? "bg-[var(--color-mute)]/10" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: color }}
                        >
                          {initial}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-[var(--color-ink)]">
                        {profile.display_name}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-sub)]">
                        {profile.area ?? "—"}
                      </td>
                      <td className="px-4 py-3">
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
                      </td>
                      <td className="px-4 py-3 text-center text-[var(--color-ink)]">
                        {counts.organized}
                      </td>
                      <td className="px-4 py-3 text-center text-[var(--color-ink)]">
                        {counts.attended}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-sub)]">{dateStr}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/users/${profile.id}`}
                          className="inline-block px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity"
                        >
                          詳細
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-12 text-center text-[var(--color-mute)]"
                    >
                      該当するユーザーが見つかりません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
