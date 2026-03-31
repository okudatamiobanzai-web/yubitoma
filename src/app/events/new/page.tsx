"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/components/AuthProvider";
import { useState, useEffect, useRef, Suspense } from "react";
import { createEvent, fetchProjects } from "@/lib/data";
import { uploadMedia } from "@/lib/admin-data";
import type { Project } from "@/lib/types";

function EventTypeSelector() {
  return (
    <main className="min-h-screen pb-20 max-w-lg mx-auto">
      <div className="px-4 pt-4 pb-3 border-b border-[var(--color-border)]">
        <h1 className="text-lg font-bold">&#9757;&#65039; 言い出す</h1>
        <p className="text-xs text-[var(--color-mute)]">何を言い出す？</p>
      </div>
      <div className="px-4 py-6 space-y-3">
        <Link href="/events/new?type=nomikai">
          <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-4">
              <span className="text-3xl">&#127867;</span>
              <div>
                <h2 className="font-bold">飲み会</h2>
                <p className="text-xs text-[var(--color-sub)]">気軽に飲みに行こう！</p>
              </div>
            </div>
          </div>
        </Link>
        <Link href="/events/new?type=event">
          <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-4">
              <span className="text-3xl">&#127914;</span>
              <div>
                <h2 className="font-bold">イベント</h2>
                <p className="text-xs text-[var(--color-sub)]">体験・セミナー・マルシェなど</p>
              </div>
            </div>
          </div>
        </Link>
        <Link href="/tane/new">
          <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-4">
              <span className="text-3xl">&#127793;</span>
              <div>
                <h2 className="font-bold">タネをまく</h2>
                <p className="text-xs text-[var(--color-sub)]">「こんなのどう？」を投げかける</p>
              </div>
            </div>
          </div>
        </Link>
      </div>
      <BottomNav />
    </main>
  );
}

function EventCreationForm({ eventType }: { eventType: "nomikai" | "event" }) {
  const router = useRouter();
  const { dbProfileId } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isNomikai = eventType === "nomikai";
  const label = isNomikai ? "飲み会" : "イベント";
  const emoji = isNomikai ? "🍻" : "🎪";

  useEffect(() => {
    fetchProjects()
      .then(setProjects)
      .catch(() => []);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!dbProfileId) {
      setError("ログインが必要です");
      return;
    }

    setSubmitting(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const title = form.get("title") as string;
    const description = (form.get("description") as string) || null;
    const date = form.get("date") as string;
    const startTime = (form.get("start_time") as string) || "";
    const venueName = (form.get("venue_name") as string) || null;
    const venueAddress = (form.get("venue_address") as string) || null;
    const minPeople = parseInt((form.get("min_people") as string) || "2", 10);
    const maxPeople = (form.get("max_people") as string)
      ? parseInt(form.get("max_people") as string, 10)
      : null;
    const feePerPerson = (form.get("fee_per_person") as string)
      ? parseInt(form.get("fee_per_person") as string, 10)
      : null;
    const relatedProjectId = (form.get("related_project_id") as string) || null;

    try {
      let coverImageUrl: string | null = null;
      if (imageFile) {
        coverImageUrl = await uploadMedia(imageFile, "events");
      }

      await createEvent({
        organizer_id: dbProfileId,
        event_type: eventType,
        title,
        description,
        date,
        start_time: startTime,
        venue_name: venueName,
        venue_address: venueAddress,
        cover_image_url: coverImageUrl,
        min_people: minPeople,
        max_people: maxPeople,
        fee_per_person: feePerPerson,
        related_project_id: relatedProjectId,
        status: "recruiting",
      });
      setSuccess(true);
      setTimeout(() => router.push("/"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "作成に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen pb-20 max-w-lg mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
          <span className="text-5xl mb-4">&#127881;</span>
          <h2 className="text-lg font-bold mb-2">{label}を作成しました！</h2>
          <p className="text-sm text-[var(--color-mute)]">ホームに戻ります...</p>
        </div>
        <BottomNav />
      </main>
    );
  }

  const inputClass =
    "w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30";

  return (
    <main className="min-h-screen pb-20 max-w-lg mx-auto">
      <div className="px-4 pt-4 pb-3 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <Link href="/events/new" className="text-[var(--color-mute)] hover:text-[var(--color-sub)]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-lg font-bold">{emoji} {label}を作成</h1>
            <p className="text-xs text-[var(--color-mute)]">詳細を入力してください</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* タイトル */}
        <div>
          <label className="block text-xs font-bold text-[var(--color-sub)] mb-1">
            タイトル <span className="text-red-500">*</span>
          </label>
          <input name="title" type="text" required placeholder={`${label}のタイトル`} className={inputClass} />
        </div>

        {/* 説明 */}
        <div>
          <label className="block text-xs font-bold text-[var(--color-sub)] mb-1">説明</label>
          <textarea name="description" rows={3} placeholder="詳細を書いてください" className={inputClass} />
        </div>

        {/* 日付 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-[var(--color-sub)] mb-1">
              日付 <span className="text-red-500">*</span>
            </label>
            <input name="date" type="date" required className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--color-sub)] mb-1">開始時間</label>
            <input name="start_time" type="time" className={inputClass} />
          </div>
        </div>

        {/* 会場 */}
        <div>
          <label className="block text-xs font-bold text-[var(--color-sub)] mb-1">会場名</label>
          <input name="venue_name" type="text" placeholder="例: 居酒屋○○" className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-bold text-[var(--color-sub)] mb-1">会場住所</label>
          <input name="venue_address" type="text" placeholder="例: 中標津町○○1-2-3" className={inputClass} />
        </div>

        {/* カバー画像 */}
        <div>
          <label className="block text-xs font-bold text-[var(--color-sub)] mb-1">カバー画像</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          {imagePreview ? (
            <div className="relative rounded-xl overflow-hidden border border-[var(--color-border)]">
              <img src={imagePreview} alt="プレビュー" className="w-full h-40 object-cover" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center text-sm"
              >
                ×
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-32 rounded-xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-soft)] flex flex-col items-center justify-center gap-2 text-[var(--color-mute)] hover:border-[var(--color-primary)]/40 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
              <span className="text-xs">タップして画像を選択</span>
            </button>
          )}
        </div>

        {/* 人数 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-[var(--color-sub)] mb-1">最少人数</label>
            <input name="min_people" type="number" min={1} defaultValue={2} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--color-sub)] mb-1">最大人数</label>
            <input name="max_people" type="number" min={1} placeholder="制限なし" className={inputClass} />
          </div>
        </div>

        {/* 参加費 */}
        <div>
          <label className="block text-xs font-bold text-[var(--color-sub)] mb-1">参加費 (円)</label>
          <input name="fee_per_person" type="number" min={0} placeholder="未定" className={inputClass} />
        </div>

        {/* 関連プロジェクト */}
        {projects.length > 0 && (
          <div>
            <label className="block text-xs font-bold text-[var(--color-sub)] mb-1">関連プロジェクト</label>
            <select name="related_project_id" className={inputClass}>
              <option value="">なし</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
        )}

        {/* 送信 */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-[var(--color-primary)] text-white font-bold text-sm hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50"
        >
          {submitting ? "作成中..." : `${label}を作成する`}
        </button>
      </form>
      <BottomNav />
    </main>
  );
}

function EventsNewContent() {
  const searchParams = useSearchParams();
  const { user, loading, login } = useAuth();
  const type = searchParams.get("type");

  if (loading) {
    return (
      <main className="min-h-screen pb-20 max-w-lg mx-auto">
        <div className="text-center py-16 text-[var(--color-mute)] text-sm">読み込み中...</div>
        <BottomNav />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen pb-20 max-w-lg mx-auto">
        <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[var(--color-bg)]">
          <div className="w-24 h-24 rounded-full bg-[var(--color-accent-soft)] flex items-center justify-center mb-6">
            <span className="text-4xl">&#9757;&#65039;</span>
          </div>
          <h1 className="text-xl font-bold mb-2">言い出すにはログインが必要です</h1>
          <p className="text-sm text-[var(--color-mute)] text-center mb-8 leading-relaxed">
            LINEでログインすると、飲み会やイベントの<br />企画・参加ができるようになります
          </p>
          <button
            onClick={login}
            className="w-full max-w-xs flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl bg-[#06C755] text-white font-bold text-sm hover:bg-[#05b04c] transition-colors"
          >
            LINEでログイン
          </button>
          <Link href="/" className="mt-4 text-sm text-[var(--color-mute)] hover:text-[var(--color-sub)]">
            ← ホームに戻る
          </Link>
        </div>
        <BottomNav />
      </main>
    );
  }

  if (type === "nomikai" || type === "event") {
    return <EventCreationForm eventType={type} />;
  }

  return <EventTypeSelector />;
}

export default function EventsNewPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen pb-20 max-w-lg mx-auto">
          <div className="text-center py-16 text-[var(--color-mute)] text-sm">読み込み中...</div>
          <BottomNav />
        </main>
      }
    >
      <EventsNewContent />
    </Suspense>
  );
}
