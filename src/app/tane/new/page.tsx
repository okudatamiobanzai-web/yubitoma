"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { createTane } from "@/lib/data";
import { uploadMedia } from "@/lib/admin-data";
import { PageHeader } from "@/components/PageHeader";

export default function NewTanePage() {
  const router = useRouter();
  const { dbProfileId, login } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [created, setCreated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    promotion_threshold: 20,
  });

  const canSubmit = form.title.trim() !== "" && form.description.trim() !== "";

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !dbProfileId || submitting) return;
    setSubmitting(true);
    try {
      let coverImageUrl: string | null = null;
      if (imageFile) {
        try {
          coverImageUrl = await uploadMedia(imageFile, "tane");
        } catch (uploadErr) {
          console.error("Image upload failed:", uploadErr);
          alert("画像のアップロードに失敗しました。画像なしで続行します。");
        }
      }
      const taneId = await createTane({
        owner_id: dbProfileId,
        title: form.title.trim(),
        description: form.description.trim(),
        promotion_threshold: form.promotion_threshold,
        ...(coverImageUrl ? { cover_image_url: coverImageUrl } : {}),
      });
      setCreated(true);
      setTimeout(() => {
        router.push(`/tane/${taneId}`);
      }, 1500);
    } catch (err) {
      console.error("Tane creation error:", err);
      alert("タネの作成に失敗しました。もう一度お試しください。");
    } finally {
      setSubmitting(false);
    }
  };

  // 未ログイン時はログイン案内を表示
  if (!dbProfileId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[var(--color-bg)]">
        <div className="w-24 h-24 rounded-full bg-[var(--color-accent-soft)] flex items-center justify-center mb-6">
          <span className="text-4xl">🌱</span>
        </div>
        <h1 className="text-xl font-bold mb-2">タネをまくにはログインが必要です</h1>
        <p className="text-sm text-[var(--color-mute)] text-center mb-8 leading-relaxed">
          LINEでログインすると、タネをまいて<br />
          応援を集められるようになります
        </p>
        <button
          onClick={login}
          className="w-full max-w-xs flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl bg-[#06C755] text-white font-bold text-sm hover:bg-[#05b04c] transition-colors"
        >
          LINEでログイン
        </button>
        <Link href="/tane" className="mt-4 text-sm text-[var(--color-primary)] font-medium">
          ← タネ一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-32">
      <PageHeader title="🌱 タネをまく" backHref="/tane" backLabel="タネ一覧" />

      {/* 作成完了モーダル */}
      {created && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-[var(--color-card)] rounded-2xl shadow-2xl p-8 text-center mx-4 animate-[fadeInUp_0.3s_ease-out]">
            <div className="text-5xl mb-3">🌱</div>
            <div className="text-lg font-bold">タネをまきました！</div>
            <div className="text-sm text-[var(--color-sub)] mt-2">応援を集めよう</div>
            <div className="text-xs text-[var(--color-mute)] mt-1">タネ一覧に戻ります...</div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-6">
        {/* タイトル */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 rounded-full bg-[var(--color-tane)]" />
            <h2 className="text-sm font-bold">基本情報</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--color-sub)] mb-1.5">
                タイトル <span className="text-[var(--color-danger)]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="例: 廃校でサウナやりたい"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3.5 py-3 border border-[var(--color-border)] rounded-xl text-sm bg-[var(--color-card)] focus:outline-none focus:ring-2 focus:ring-[var(--color-tane)]/50 focus:border-[var(--color-tane)] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-sub)] mb-1.5">
                どんなタネ？ <span className="text-[var(--color-danger)]">*</span>
              </label>
              <textarea
                required
                placeholder="こんなのあったら面白くない？を書いてみよう"
                rows={5}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3.5 py-3 border border-[var(--color-border)] rounded-xl text-sm bg-[var(--color-card)] focus:outline-none focus:ring-2 focus:ring-[var(--color-tane)]/50 focus:border-[var(--color-tane)] transition-all resize-none"
              />
            </div>
          </div>
        </section>

        {/* カバー画像 */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 rounded-full bg-[var(--color-tane)]" />
            <h2 className="text-sm font-bold">カバー画像（任意）</h2>
          </div>

          {imagePreview ? (
            <div className="relative rounded-xl overflow-hidden border border-[var(--color-border)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="プレビュー" className="w-full h-40 object-cover" />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 w-7 h-7 bg-black/50 text-white rounded-full flex items-center justify-center text-xs hover:bg-black/70"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-32 border-2 border-dashed border-[var(--color-border)] rounded-xl flex flex-col items-center justify-center gap-2 text-[var(--color-mute)] hover:border-[var(--color-tane)] hover:text-[var(--color-tane)] transition-colors"
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <span className="text-xs font-medium">画像をアップロード</span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </section>

        {/* 応援目標 */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 rounded-full bg-[var(--color-tane)]" />
            <h2 className="text-sm font-bold">応援目標</h2>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--color-sub)] mb-1.5">
              応援が何人集まったらプロジェクト化する？
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={5}
                max={100}
                value={form.promotion_threshold}
                onChange={(e) => setForm({ ...form, promotion_threshold: Number(e.target.value) })}
                className="w-24 px-3.5 py-3 border border-[var(--color-border)] rounded-xl text-sm bg-[var(--color-card)] focus:outline-none focus:ring-2 focus:ring-[var(--color-tane)]/50 focus:border-[var(--color-tane)] transition-all text-center font-bold"
              />
              <span className="text-sm text-[var(--color-sub)]">人</span>
            </div>
            <p className="text-[10px] text-[var(--color-mute)] mt-2">
              この人数の応援が集まると「🚀 プロジェクト化」の準備ができます（5〜100人）
            </p>
          </div>

          {/* プレビュー */}
          <div className="mt-3 bg-[var(--color-soft)] rounded-xl p-3">
            <div className="flex justify-between text-[10px] text-[var(--color-mute)] mb-1">
              <span>0人が応援</span>
              <span>目標 {form.promotion_threshold}人</span>
            </div>
            <div className="h-2 bg-[var(--color-card)] rounded-full overflow-hidden">
              <div className="h-full w-0 rounded-full bg-[var(--color-tane)]" />
            </div>
          </div>
        </section>
      </form>

      {/* 送信ボタン */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-[var(--color-card)]/95 backdrop-blur-sm border-t border-[var(--color-border)] z-30">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="w-full py-3.5 rounded-2xl text-white font-bold text-sm bg-[var(--color-tane)] shadow-lg shadow-[var(--color-tane)]/20 transition-all active:scale-[0.98] disabled:opacity-30 disabled:active:scale-100"
          >
            {submitting ? "送信中..." : "🌱 タネをまく"}
          </button>
        </div>
      </div>
    </div>
  );
}
