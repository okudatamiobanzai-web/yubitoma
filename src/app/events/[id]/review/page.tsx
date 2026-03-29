"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { fetchEvent, createReview } from "@/lib/data";
import { uploadMedia } from "@/lib/admin-data";
import { formatDate } from "@/lib/utils";
import type { Event } from "@/lib/types";

// メディアアイテムの型
interface MediaItem {
  id: string;
  file: File;
  preview: string;
  type: "image" | "video";
}

export default function EventReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { user, dbProfileId, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(0);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const evt = await fetchEvent(params.id as string);
        setEvent(evt);
      } catch (e) {
        console.error("Failed to load event:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[var(--color-mute)]">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-5xl mb-4">📝</div>
        <p className="text-[var(--color-sub)] font-medium">イベントが見つかりません</p>
        <button onClick={() => router.push("/")} className="mt-4 text-sm text-[var(--color-primary)] font-medium">
          ← ホームに戻る
        </button>
      </div>
    );
  }

  const handleMediaSelect = (files: FileList | null) => {
    if (!files) return;
    const newMedia: MediaItem[] = [];
    Array.from(files).forEach((file) => {
      if (media.length + newMedia.length >= 20) return; // 最大20個
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      if (!isVideo && !isImage) return;

      newMedia.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        preview: URL.createObjectURL(file),
        type: isVideo ? "video" : "image",
      });
    });
    setMedia((prev) => [...prev, ...newMedia]);
  };

  const removeMedia = (id: string) => {
    setMedia((prev) => {
      const item = prev.find((m) => m.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((m) => m.id !== id);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleMediaSelect(e.dataTransfer.files);
  };

  const handleSubmit = async () => {
    if (!dbProfileId) {
      alert("ログインが必要です");
      return;
    }
    setUploading(true);
    try {
      // メディアファイルをアップロード
      const mediaUrls: string[] = [];
      for (const item of media) {
        const url = await uploadMedia(item.file, `reviews/${event.id}`);
        mediaUrls.push(url);
      }

      // レビューをDBに保存
      await createReview({
        event_id: event.id,
        user_id: dbProfileId,
        rating,
        comment: comment.trim() || undefined,
        media_urls: mediaUrls.length > 0 ? mediaUrls : undefined,
        is_public: isPublic,
      });

      setUploading(false);
      setSubmitted(true);
      setTimeout(() => router.push(`/events/${event.id}`), 1500);
    } catch (e) {
      console.error("Review submit error:", e);
      setUploading(false);
      alert("投稿に失敗しました。もう一度お試しください。");
    }
  };

  const ratingLabels = ["", "まあまあ", "楽しかった", "すごく良かった", "最高！", "人生変わった！"];

  return (
    <div className="min-h-screen bg-[var(--color-bg)] pb-24">
      {/* ヘッダー */}
      <header className="sticky top-0 bg-[var(--color-bg)]/90 backdrop-blur-sm z-40 border-b border-[var(--color-border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="text-[var(--color-mute)] hover:text-[var(--color-sub)]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-bold">📝 振り返りを書く</h1>
            <p className="text-xs text-[var(--color-mute)]">写真・動画もアップロードできます</p>
          </div>
        </div>
      </header>

      {/* 投稿完了モーダル */}
      {submitted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-[var(--color-card)] rounded-2xl shadow-2xl p-8 text-center mx-4 animate-[fadeInUp_0.3s_ease-out]">
            <div className="text-5xl mb-3">🎉</div>
            <div className="text-lg font-bold">投稿しました！</div>
            <div className="text-sm text-[var(--color-sub)] mt-2">振り返りありがとうございます</div>
            <div className="text-xs text-[var(--color-mute)] mt-1">イベントページに戻ります...</div>
          </div>
        </div>
      )}

      {/* アップロード中モーダル */}
      {uploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-[var(--color-card)] rounded-2xl shadow-2xl p-8 text-center mx-4">
            <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <div className="text-sm font-bold">アップロード中...</div>
            <div className="text-xs text-[var(--color-mute)] mt-1">
              {media.length > 0 ? `${media.length}件のメディアを送信中` : "送信中"}
            </div>
          </div>
        </div>
      )}

      <div className="px-4 py-4 space-y-5">
        {/* イベント情報カード */}
        <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-4 flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
            event.event_type === "event" ? "bg-[#e8f0f7]" : "bg-[var(--color-accent-soft)]"
          }`}>
            {event.event_type === "event" ? "🏔️" : "🍻"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold truncate">{event.title}</div>
            <div className="text-[11px] text-[var(--color-mute)]">
              {formatDate(event.date)} {event.start_time}〜
              {event.venue_name && ` · ${event.venue_name}`}
            </div>
          </div>
        </div>

        {/* 満足度 */}
        <section>
          <label className="block text-xs font-bold text-[var(--color-sub)] mb-2">
            満足度
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="transition-all active:scale-110"
              >
                <span className={`text-3xl ${star <= rating ? "" : "grayscale opacity-30"}`}>
                  ⭐
                </span>
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-sm text-[var(--color-primary)] font-bold animate-[fadeInUp_0.2s_ease-out]">
                {ratingLabels[rating]}
              </span>
            )}
          </div>
        </section>

        {/* コメント */}
        <section>
          <label className="block text-xs font-bold text-[var(--color-sub)] mb-2">
            感想・コメント
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={5}
            maxLength={500}
            placeholder="どんな体験だった？何が良かった？次回への期待は？&#10;&#10;あなたの感想が、次の参加者の背中を押します！"
            className="w-full px-4 py-3 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:border-[var(--color-primary)] resize-none transition-all leading-relaxed"
          />
          <div className="flex items-center justify-between mt-1">
            <div className="flex gap-2">
              {["楽しかった！", "また参加したい", "新しい出会いがあった"].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setComment((prev) => prev ? `${prev}\n${chip}` : chip)}
                  className="text-[10px] bg-[var(--color-soft)] text-[var(--color-sub)] px-2 py-1 rounded-full hover:bg-[var(--color-border)] transition-colors"
                >
                  + {chip}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-[var(--color-mute)]">{comment.length}/500</span>
          </div>
        </section>

        {/* メディアアップロード */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-[var(--color-sub)]">
              写真・動画
            </label>
            <span className="text-[10px] text-[var(--color-mute)]">{media.length}/20</span>
          </div>

          {/* ドラッグ&ドロップエリア */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
              dragActive
                ? "border-[var(--color-primary)] bg-[var(--color-accent-soft)]"
                : "border-[var(--color-border)] bg-[var(--color-soft)]"
            }`}
          >
            <div className="text-3xl mb-2">📸</div>
            <p className="text-sm font-medium text-[var(--color-sub)]">
              写真・動画をアップロード
            </p>
            <p className="text-[10px] text-[var(--color-mute)] mt-1">
              タップして選択 / ドラッグ&ドロップ
            </p>
            <p className="text-[10px] text-[var(--color-mute)] mt-0.5">
              最大20ファイル（JPG, PNG, MP4, MOV対応）
            </p>

            <div className="flex gap-2 justify-center mt-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-[var(--color-primary)] text-white text-xs font-bold rounded-xl shadow-sm active:scale-95 transition-all"
              >
                📷 写真を選択
              </button>
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="px-4 py-2 bg-[var(--color-event)] text-white text-xs font-bold rounded-xl shadow-sm active:scale-95 transition-all"
              >
                🎬 動画を選択
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleMediaSelect(e.target.files)}
              className="hidden"
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              multiple
              onChange={(e) => handleMediaSelect(e.target.files)}
              className="hidden"
            />
          </div>

          {/* メディアプレビューグリッド */}
          {media.length > 0 && (
            <div className="mt-3">
              <div className="grid grid-cols-3 gap-2">
                {media.map((item) => (
                  <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden group">
                    {item.type === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.preview}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[var(--color-ink)] flex items-center justify-center relative">
                        <video
                          src={item.preview}
                          className="w-full h-full object-cover opacity-80"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-10 h-10 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                            <span className="text-lg">▶️</span>
                          </div>
                        </div>
                        <div className="absolute top-1 left-1 bg-[var(--color-event)] text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                          動画
                        </div>
                      </div>
                    )}
                    {/* 削除ボタン */}
                    <button
                      type="button"
                      onClick={() => removeMedia(item.id)}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center text-xs opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity active:opacity-100"
                    >
                      ✕
                    </button>
                    {/* ファイルサイズ表示 */}
                    <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[8px] px-1.5 py-0.5 rounded">
                      {(item.file.size / 1024 / 1024).toFixed(1)}MB
                    </div>
                  </div>
                ))}

                {/* 追加ボタン */}
                {media.length < 20 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center text-[var(--color-mute)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
                  >
                    <span className="text-2xl">+</span>
                    <span className="text-[9px] mt-0.5">追加</span>
                  </button>
                )}
              </div>

              {/* メディアサマリー */}
              <div className="mt-2 flex items-center gap-3 text-[10px] text-[var(--color-mute)]">
                <span>📷 {media.filter((m) => m.type === "image").length}枚</span>
                {media.some((m) => m.type === "video") && (
                  <span>🎬 {media.filter((m) => m.type === "video").length}本</span>
                )}
                <span>合計 {(media.reduce((s, m) => s + m.file.size, 0) / 1024 / 1024).toFixed(1)}MB</span>
              </div>
            </div>
          )}
        </section>

        {/* 公開設定 */}
        <section className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-4">
          <div className="text-xs font-bold text-[var(--color-sub)] mb-2">公開設定</div>
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="radio" name="visibility" checked={isPublic} onChange={() => setIsPublic(true)} className="accent-[var(--color-primary)]" />
              <div>
                <div className="text-sm font-medium">参加者に公開</div>
                <div className="text-[10px] text-[var(--color-mute)]">このイベントの参加メンバーのみ閲覧可能</div>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="radio" name="visibility" checked={!isPublic} onChange={() => setIsPublic(false)} className="accent-[var(--color-primary)]" />
              <div>
                <div className="text-sm font-medium">全体に公開</div>
                <div className="text-[10px] text-[var(--color-mute)]">アーカイブページで誰でも閲覧可能</div>
              </div>
            </label>
          </div>
        </section>

        {/* 注意事項 */}
        <div className="bg-[var(--color-soft)] rounded-xl p-3 text-[10px] text-[var(--color-mute)] leading-relaxed">
          <span className="font-bold">📋 投稿について：</span>
          写真・動画に写っている方の許可を得てから投稿してください。
          不適切なコンテンツは主催者または運営が削除する場合があります。
        </div>
      </div>

      {/* 固定フッター：投稿ボタン */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-[var(--color-card)]/95 backdrop-blur-sm border-t border-[var(--color-border)] z-30">
        <div className="max-w-lg mx-auto flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3.5 border-2 border-[var(--color-border)] rounded-2xl text-sm font-medium text-[var(--color-sub)]"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!comment.trim() && media.length === 0}
            className="flex-1 py-3.5 rounded-2xl bg-[var(--color-primary)] text-white font-bold text-sm shadow-lg shadow-[var(--color-primary)]/20 transition-all active:scale-[0.98] disabled:opacity-30 disabled:active:scale-100"
          >
            {media.length > 0
              ? `📸 ${media.length}件のメディア付きで投稿`
              : "投稿する"}
          </button>
        </div>
      </div>
    </div>
  );
}
