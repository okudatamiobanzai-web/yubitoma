"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { fetchProfile } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { Profile } from "@/lib/types";

export default function ProfileEditPage() {
  const router = useRouter();
  const { dbProfileId, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    display_name: "",
    bio: "",
    area: "",
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
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center text-white text-3xl font-bold">
            {form.display_name[0]}
          </div>
          <p className="text-[10px] text-[var(--color-mute)]">※ LINEのプロフィール画像が使用されます</p>
        </div>

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
              <p className="text-xs text-[var(--color-sub)] bg-[var(--color-soft)] rounded-lg p-2 leading-relaxed">
                {form.bio}
              </p>
            )}
          </div>
        </div>
      </div>

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
