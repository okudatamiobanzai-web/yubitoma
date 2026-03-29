"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { fetchProfile } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { INTEREST_TAGS, InterestTag, Profile } from "@/lib/types";

export default function ProfileEditPage() {
  const router = useRouter();
  const { dbProfileId, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    display_name: "",
    bio: "",
    area: "",
    interest_tags: [] as InterestTag[],
    instagram: "",
    x: "",
    note: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      if (!dbProfileId) {
        setLoading(false);
        return;
      }
      try {
        const p = await fetchProfile(dbProfileId);
        if (p) {
          setProfile(p);
          setForm({
            display_name: p.display_name,
            bio: p.bio ?? "",
            area: p.area ?? "",
            interest_tags: [...(p.interest_tags ?? [])] as InterestTag[],
            instagram: p.social_links?.instagram ?? "",
            x: p.social_links?.x ?? "",
            note: p.social_links?.note ?? "",
          });
        }
      } catch (e) {
        console.error("Failed to load profile:", e);
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading) load();
  }, [dbProfileId, authLoading]);

  const toggleTag = (tag: InterestTag) => {
    setForm((prev) => ({
      ...prev,
      interest_tags: prev.interest_tags.includes(tag)
        ? prev.interest_tags.filter((t) => t !== tag)
        : [...prev.interest_tags, tag],
    }));
  };

  const handleSave = async () => {
    if (!dbProfileId) return;

    if (!form.display_name.trim()) {
      alert("表示名を入力してください");
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: form.display_name,
          bio: form.bio || null,
          area: form.area || null,
          interest_tags: form.interest_tags,
          social_links: {
            instagram: form.instagram || undefined,
            x: form.x || undefined,
            note: form.note || undefined,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", dbProfileId);

      if (error) {
        console.error("Failed to save profile:", error);
        alert("保存に失敗しました。もう一度お試しください。");
        return;
      }

      setSaved(true);
      setTimeout(() => {
        router.push("/mypage");
      }, 1500);
    } catch (e) {
      console.error("Failed to save profile:", e);
      alert("保存に失敗しました。もう一度お試しください。");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[var(--color-mute)]">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-sm text-[var(--color-mute)]">プロフィールが見つかりません</p>
          <button onClick={() => router.push("/mypage")} className="mt-4 text-sm text-[var(--color-primary)]">
            マイページに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* ヘッダー */}
      <header className="sticky top-0 z-40 bg-[var(--color-card)]/95 backdrop-blur-sm border-b border-[var(--color-border)]">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-sm text-[var(--color-sub)] flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            戻る
          </button>
          <h1 className="text-base font-bold">プロフィール編集</h1>
          <div className="w-10" />
        </div>
      </header>

      {/* 保存完了メッセージ */}
      {saved && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-[var(--color-card)] rounded-2xl shadow-2xl p-8 text-center animate-[fadeInUp_0.3s_ease-out]">
            <div className="text-4xl mb-3">✅</div>
            <div className="text-lg font-bold">保存しました！</div>
            <div className="text-xs text-[var(--color-mute)] mt-1">マイページに戻ります...</div>
          </div>
        </div>
      )}

      <div className="px-4 py-5 space-y-6">
        {/* アバター */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center text-white text-3xl font-bold">
            {form.display_name[0]}
          </div>
          <p className="text-[10px] text-[var(--color-mute)]">※ LINEのプロフィール画像が使用されます</p>
        </div>

        {/* 表示名 */}
        <div>
          <label className="text-xs font-bold text-[var(--color-sub)] mb-1.5 block">表示名</label>
          <input
            type="text"
            value={form.display_name}
            onChange={(e) => setForm({ ...form, display_name: e.target.value })}
            className="w-full px-4 py-3 bg-[var(--color-soft)] rounded-xl text-sm border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
            placeholder="名前を入力"
          />
        </div>

        {/* エリア */}
        <div>
          <label className="text-xs font-bold text-[var(--color-sub)] mb-1.5 block">📍 エリア</label>
          <input
            type="text"
            value={form.area}
            onChange={(e) => setForm({ ...form, area: e.target.value })}
            className="w-full px-4 py-3 bg-[var(--color-soft)] rounded-xl text-sm border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
            placeholder="例：中標津、釧路、帯広..."
          />
        </div>

        {/* 自己紹介 */}
        <div>
          <label className="text-xs font-bold text-[var(--color-sub)] mb-1.5 block">自己紹介</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 bg-[var(--color-soft)] rounded-xl text-sm border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none transition-colors resize-none"
            placeholder="どんな人か簡単に教えてください"
            maxLength={120}
          />
          <div className="text-right text-[10px] text-[var(--color-mute)] mt-1">
            {form.bio.length}/120
          </div>
        </div>

        {/* 興味タグ */}
        <div>
          <label className="text-xs font-bold text-[var(--color-sub)] mb-1.5 block">
            興味のあること（複数選択OK）
          </label>
          <div className="flex flex-wrap gap-2">
            {INTEREST_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  form.interest_tags.includes(tag)
                    ? "bg-[var(--color-primary)] text-white shadow-sm"
                    : "bg-[var(--color-soft)] text-[var(--color-sub)] hover:bg-[var(--color-border)]"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {/* SNSリンク */}
        <div>
          <label className="text-xs font-bold text-[var(--color-sub)] mb-3 block">SNSリンク（任意）</label>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-lg w-8 text-center">📸</span>
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--color-mute)]">@</span>
                <input
                  type="text"
                  value={form.instagram}
                  onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                  className="w-full pl-7 pr-4 py-2.5 bg-[var(--color-soft)] rounded-xl text-sm border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
                  placeholder="Instagram ユーザー名"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg w-8 text-center">{"\uD835\uDD4F"}</span>
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[var(--color-mute)]">@</span>
                <input
                  type="text"
                  value={form.x}
                  onChange={(e) => setForm({ ...form, x: e.target.value })}
                  className="w-full pl-7 pr-4 py-2.5 bg-[var(--color-soft)] rounded-xl text-sm border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
                  placeholder="X ユーザー名"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg w-8 text-center">📝</span>
              <div className="flex-1">
                <input
                  type="text"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[var(--color-soft)] rounded-xl text-sm border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none"
                  placeholder="note アカウント名"
                />
              </div>
            </div>
          </div>
        </div>

        {/* プレビュー */}
        <div>
          <label className="text-xs font-bold text-[var(--color-sub)] mb-2 block">プレビュー</label>
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center text-white text-lg font-bold">
                {form.display_name[0]}
              </div>
              <div>
                <div className="font-bold">{form.display_name}</div>
                {form.area && (
                  <div className="text-[10px] text-[var(--color-mute)]">📍 {form.area}</div>
                )}
              </div>
            </div>
            {form.bio && (
              <p className="text-xs text-[var(--color-sub)] bg-[var(--color-soft)] rounded-lg p-2 mb-2 leading-relaxed">
                {form.bio}
              </p>
            )}
            {form.interest_tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {form.interest_tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[9px] bg-[var(--color-accent-soft)] text-[var(--color-primary)] px-1.5 py-0.5 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 保存ボタン */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-[var(--color-card)]/95 backdrop-blur-sm border-t border-[var(--color-border)] z-30">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleSave}
            className="w-full py-3.5 rounded-2xl bg-[var(--color-primary)] text-white font-bold text-sm shadow-lg shadow-[var(--color-primary)]/20 transition-all active:scale-[0.98]"
          >
            保存する
          </button>
        </div>
      </div>
    </div>
  );
}
