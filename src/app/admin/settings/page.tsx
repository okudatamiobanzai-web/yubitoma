"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { AdminRole } from "@/lib/admin-types";

interface AdminUser {
  id: string;
  email: string;
  display_name: string;
  role: AdminRole;
}

const roleBadge: Record<AdminRole, { label: string; className: string }> = {
  super_admin: {
    label: "スーパー管理者",
    className: "bg-red-100 text-red-700",
  },
  admin: {
    label: "管理者",
    className: "bg-blue-100 text-blue-700",
  },
  moderator: {
    label: "モデレーター",
    className: "bg-gray-100 text-gray-600",
  },
};

const roleDescriptions: { role: AdminRole; label: string; description: string }[] = [
  {
    role: "super_admin",
    label: "スーパー管理者",
    description: "全権限（管理者の追加・削除、コンテンツ管理、ユーザー管理）",
  },
  {
    role: "admin",
    label: "管理者",
    description: "コンテンツ管理、ユーザー管理",
  },
  {
    role: "moderator",
    label: "モデレーター",
    description: "コンテンツの確認・編集のみ",
  },
];

export default function AdminSettingsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "moderator">("admin");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("admin_users")
      .select("*")
      .order("created_at")
      .then(({ data, error }) => {
        if (!error && data) {
          setAdmins(data as AdminUser[]);
        }
        setLoading(false);
      });
  }, []);

  async function handleAdd() {
    if (!newEmail.trim() || !newName.trim()) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("admin_users")
        .insert({
          email: newEmail.trim(),
          display_name: newName.trim(),
          role: newRole,
        })
        .select("*")
        .single();
      if (error) throw error;
      setAdmins((prev) => [...prev, data as AdminUser]);
      setNewEmail("");
      setNewName("");
      setNewRole("admin");
      setShowForm(false);
    } catch (e) {
      console.error("Admin add error:", e);
      alert("管理者の追加に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("この管理者を削除しますか？")) return;
    try {
      const { error } = await supabase
        .from("admin_users")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setAdmins((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      console.error("Admin delete error:", e);
      alert("削除に失敗しました");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-[var(--color-mute)]">読み込み中...</div>
      </div>
    );
  }

  return (
    <div>
      <header className="sticky top-0 bg-[var(--color-card)]/90 backdrop-blur-sm z-40 border-b border-[var(--color-border)] px-6 py-4">
        <h1 className="text-xl font-bold text-[var(--color-ink)]">設定</h1>
      </header>

      <div className="px-6 py-6 space-y-8">
        {/* 管理者ユーザー */}
        <section className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[var(--color-ink)]">
              管理者ユーザー
            </h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 rounded-lg text-xs font-medium bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity"
            >
              {showForm ? "キャンセル" : "管理者を追加"}
            </button>
          </div>

          {/* 追加フォーム */}
          {showForm && (
            <div className="mb-6 p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-mute)]/10 space-y-3">
              <div>
                <label className="block text-xs font-medium text-[var(--color-sub)] mb-1">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="example@shirubelab.jp"
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-mute)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-sub)] mb-1">
                  表示名
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="名前"
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-mute)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-sub)] mb-1">
                  権限
                </label>
                <select
                  value={newRole}
                  onChange={(e) =>
                    setNewRole(e.target.value as "admin" | "moderator")
                  }
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-3 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option value="admin">管理者</option>
                  <option value="moderator">モデレーター</option>
                </select>
              </div>
              <button
                onClick={handleAdd}
                disabled={saving}
                className="px-6 py-2.5 rounded-lg text-sm font-medium bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? "追加中..." : "追加"}
              </button>
            </div>
          )}

          {/* 管理者テーブル */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-sub)]">
                  <th className="px-4 py-3 font-medium">メール</th>
                  <th className="px-4 py-3 font-medium">名前</th>
                  <th className="px-4 py-3 font-medium">権限</th>
                  <th className="px-4 py-3 font-medium">アクション</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin, idx) => {
                  const badge = roleBadge[admin.role];
                  return (
                    <tr
                      key={admin.id}
                      className={`border-b border-[var(--color-border)] ${
                        idx % 2 === 1 ? "bg-[var(--color-mute)]/10" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-[var(--color-ink)]">
                        {admin.email}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-ink)] font-medium">
                        {admin.display_name}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {admin.role !== "super_admin" && (
                          <button
                            onClick={() => handleDelete(admin.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                          >
                            削除
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {admins.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-[var(--color-mute)]">
                      管理者が登録されていません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 権限について */}
        <section className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-6">
          <h2 className="text-base font-bold text-[var(--color-ink)] mb-4">
            権限について
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-sub)]">
                  <th className="px-4 py-3 font-medium">ロール</th>
                  <th className="px-4 py-3 font-medium">権限内容</th>
                </tr>
              </thead>
              <tbody>
                {roleDescriptions.map((rd, idx) => {
                  const badge = roleBadge[rd.role];
                  return (
                    <tr
                      key={rd.role}
                      className={`border-b border-[var(--color-border)] ${
                        idx % 2 === 1 ? "bg-[var(--color-mute)]/10" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}
                        >
                          {rd.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--color-ink)]">
                        {rd.description}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
