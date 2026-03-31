"use client";

import { useState, useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/components/AuthProvider";
import { fetchNotifications, markNotificationRead } from "@/lib/data";
import { Notification } from "@/lib/types";
import Link from "next/link";

export default function NotificationsPage() {
  const { user, dbProfileId } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dbProfileId) {
      setLoading(false);
      return;
    }
    fetchNotifications(dbProfileId)
      .then(setNotifications)
      .catch(() => [])
      .finally(() => setLoading(false));
  }, [dbProfileId]);

  const handleRead = async (id: string) => {
    await markNotificationRead(id).catch(() => {});
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const getLink = (n: Notification) => {
    if (n.event_id) return `/events/${n.event_id}`;
    if (n.tane_id) return `/tane/${n.tane_id}`;
    if (n.project_id) return `/projects/${n.project_id}`;
    return "#";
  };

  const getIcon = (type: string) => {
    if (type.includes("join")) return "✋";
    if (type.includes("support")) return "📣";
    if (type.includes("event")) return "📅";
    if (type.includes("tane")) return "🌱";
    if (type.includes("project")) return "🚀";
    return "🔔";
  };

  return (
    <main className="min-h-screen pb-20 max-w-lg mx-auto">
      <div className="px-4 pt-4 pb-3 border-b border-[var(--color-border)]">
        <h1 className="text-lg font-bold">🔔 通知</h1>
      </div>

      <div className="px-4 py-4 space-y-2">
        {loading ? (
          <div className="text-center py-8 text-[var(--color-mute)] text-sm">読み込み中...</div>
        ) : !user ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🔔</p>
            <p className="text-sm text-[var(--color-sub)]">ログインすると通知が届きます</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🔔</p>
            <p className="text-sm text-[var(--color-sub)]">まだ通知はありません</p>
          </div>
        ) : (
          notifications.map((n) => (
            <Link
              key={n.id}
              href={getLink(n)}
              onClick={() => !n.is_read && handleRead(n.id)}
            >
              <div
                className={`rounded-xl border p-3 flex items-start gap-3 transition-colors ${
                  n.is_read
                    ? "bg-[var(--color-card)] border-[var(--color-border)]"
                    : "bg-[var(--color-accent-soft)] border-[var(--color-primary)]/20"
                }`}
              >
                <span className="text-lg mt-0.5">{getIcon(n.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-[var(--color-sub)] mt-0.5">{n.body}</p>
                  <p className="text-[10px] text-[var(--color-mute)] mt-1">
                    {new Date(n.created_at).toLocaleDateString("ja-JP")}
                  </p>
                </div>
                {!n.is_read && (
                  <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] mt-2 shrink-0" />
                )}
              </div>
            </Link>
          ))
        )}
      </div>
      <BottomNav />
    </main>
  );
}
