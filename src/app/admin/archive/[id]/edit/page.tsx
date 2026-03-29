"use client";

import { use, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchEvent } from "@/lib/data";
import { uploadMedia } from "@/lib/admin-data";
import { formatDate } from "@/lib/utils";
import type { Event } from "@/lib/types";

type Review = {
  name: string;
  comment: string;
  rating: number;
};

function StarRating({ rating, onChange }: { rating: number; onChange?: (r: number) => void }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={onChange ? "cursor-pointer" : ""}
          onClick={() => onChange?.(star)}
        >
          {star <= rating ? "⭐" : "☆"}
        </span>
      ))}
    </span>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ArchiveEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [archive, setArchive] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  const [highlight, setHighlight] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [videoCount, setVideoCount] = useState(0);
  const [videoFiles, setVideoFiles] = useState<{ name: string; size: number }[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [shareText, setShareText] = useState("");

  useEffect(() => {
    fetchEvent(id)
      .then((ev) => {
        setArchive(ev);
        if (ev) {
          setShareText(`道東で開催された『${ev.title}』に${ev.attendees?.length ?? 0}人が参加！ #指とま #道東`);
        }
      })
      .catch(() => setArchive(null))
      .finally(() => setLoading(false));
  }, [id]);

  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoUploadProgress, setPhotoUploadProgress] = useState(0);
  const [videoDragOver, setVideoDragOver] = useState(false);
  const [photoDragOver, setPhotoDragOver] = useState(false);
  const [editingReviewIndex, setEditingReviewIndex] = useState<number | null>(null);
  const [editReviewComment, setEditReviewComment] = useState("");
  const [editReviewRating, setEditReviewRating] = useState(5);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  if (loading) {
    return <div className="text-center py-20 text-sm text-[var(--color-mute)]">読み込み中...</div>;
  }

  if (!archive) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--color-mute)] mb-4">アーカイブが見つかりません</p>
        <Link
          href="/admin/archive"
          className="text-[var(--color-primary)] hover:underline text-sm"
        >
          アーカイブ一覧に戻る
        </Link>
      </div>
    );
  }

  async function handlePhotoUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setPhotoUploading(true);
    setPhotoUploadProgress(0);
    const newPhotos: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;
      try {
        const url = await uploadMedia(file, "archive-photos");
        newPhotos.push(url);
      } catch (err) {
        console.error("Photo upload failed:", err);
        alert(`写真のアップロードに失敗しました: ${file.name}`);
      }
      setPhotoUploadProgress(Math.round(((i + 1) / files.length) * 100));
    }
    setPhotos((prev) => [...prev, ...newPhotos]);
    setPhotoUploading(false);
    setPhotoUploadProgress(0);
  }

  function handleDeletePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function handlePhotoDrop(e: React.DragEvent) {
    e.preventDefault();
    setPhotoDragOver(false);
    handlePhotoUpload(e.dataTransfer.files);
  }

  function handleVideoUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    const newVideos: { name: string; size: number }[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("video/")) continue;
      newVideos.push({ name: file.name, size: file.size });
    }
    setVideoFiles((prev) => [...prev, ...newVideos]);
    setVideoCount((prev) => prev + newVideos.length);
  }

  function handleVideoDrop(e: React.DragEvent) {
    e.preventDefault();
    setVideoDragOver(false);
    handleVideoUpload(e.dataTransfer.files);
  }

  function handleEditReview(index: number) {
    setEditingReviewIndex(index);
    setEditReviewComment(reviews[index].comment);
    setEditReviewRating(reviews[index].rating);
  }

  function handleSaveReview() {
    if (editingReviewIndex === null) return;
    setReviews((prev) =>
      prev.map((r, i) =>
        i === editingReviewIndex ? { ...r, comment: editReviewComment, rating: editReviewRating } : r
      )
    );
    setEditingReviewIndex(null);
  }

  function handleDeleteReview(index: number) {
    setReviews((prev) => prev.filter((_, i) => i !== index));
    setDeleteConfirmIndex(null);
  }

  function handleSave() {
    if (!archive) return;
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <Link
          href="/admin/archive"
          className="text-sm text-[var(--color-mute)] hover:text-[var(--color-sub)] mb-2 inline-block"
        >
          &larr; アーカイブ一覧に戻る
        </Link>
        <h1 className="text-2xl font-bold text-[var(--color-ink)]">アーカイブ編集</h1>
        <p className="text-sm text-[var(--color-mute)] mt-1">{archive.title}</p>
      </div>

      <div className="space-y-6">
        {/* Section 1: 基本情報 */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-6">
          <h2 className="text-lg font-bold text-[var(--color-ink)] mb-4">基本情報</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-mute)] mb-1">イベント名</label>
              <p className="text-sm text-[var(--color-ink)]">{archive.title}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-mute)] mb-1">開催日</label>
              <p className="text-sm text-[var(--color-ink)]">{formatDate(archive.date)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-mute)] mb-1">会場</label>
              <p className="text-sm text-[var(--color-ink)]">{archive.venue_name ?? "未設定"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-mute)] mb-1">参加者数</label>
              <p className="text-sm text-[var(--color-ink)]">{archive.attendees?.length ?? 0}人</p>
            </div>
          </div>
        </div>

        {/* Section 2: ハイライト */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-6">
          <h2 className="text-lg font-bold text-[var(--color-ink)] mb-4">ハイライト</h2>
          <textarea
            value={highlight}
            onChange={(e) => setHighlight(e.target.value)}
            rows={3}
            placeholder="イベントのハイライトを入力..."
            className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm bg-[var(--color-card)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-primary)] resize-y"
          />
        </div>

        {/* Section 3: 写真管理 */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-6">
          <h2 className="text-lg font-bold text-[var(--color-ink)] mb-4">
            写真管理
            <span className="text-sm font-normal text-[var(--color-mute)] ml-2">{photos.length}枚</span>
          </h2>

          {/* Photo grid */}
          {photos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {photos.map((photo, i) => (
                <div key={i} className="relative group rounded-lg overflow-hidden border border-[var(--color-border)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo}
                    alt={`写真 ${i + 1}`}
                    className="w-full h-32 object-cover"
                  />
                  <button
                    onClick={() => handleDeletePhoto(i)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-600"
                    title="削除"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload area */}
          <div
            onDragOver={(e) => { e.preventDefault(); setPhotoDragOver(true); }}
            onDragLeave={() => setPhotoDragOver(false)}
            onDrop={handlePhotoDrop}
            onClick={() => photoInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              photoDragOver
                ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                : "border-[var(--color-border)] hover:border-[var(--color-primary)]"
            }`}
          >
            {photoUploading ? (
              <div>
                <p className="text-sm text-[var(--color-sub)] mb-2">アップロード中... {photoUploadProgress}%</p>
                <div className="w-full max-w-xs mx-auto h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-primary)] rounded-full transition-all"
                    style={{ width: `${photoUploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <>
                <p className="text-2xl mb-2">📷</p>
                <p className="text-sm text-[var(--color-sub)]">写真を追加</p>
                <p className="text-xs text-[var(--color-mute)] mt-1">
                  クリックまたはドラッグ&ドロップ（複数選択可）
                </p>
              </>
            )}
          </div>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              handlePhotoUpload(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {/* Section 4: 動画管理 */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-6">
          <h2 className="text-lg font-bold text-[var(--color-ink)] mb-4">
            動画管理
            <span className="text-sm font-normal text-[var(--color-mute)] ml-2">{videoCount}本</span>
          </h2>

          {/* Existing video files */}
          {videoFiles.length > 0 && (
            <div className="space-y-2 mb-4">
              {videoFiles.map((v, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-[var(--color-soft)] rounded-lg px-4 py-3"
                >
                  <span className="text-lg">🎬</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--color-ink)] truncate">{v.name}</p>
                    <p className="text-xs text-[var(--color-mute)]">{formatFileSize(v.size)}</p>
                  </div>
                  <button
                    onClick={() => {
                      setVideoFiles((prev) => prev.filter((_, j) => j !== i));
                      setVideoCount((prev) => Math.max(0, prev - 1));
                    }}
                    className="text-xs text-red-500 hover:text-red-700 cursor-pointer"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload area */}
          <div
            onDragOver={(e) => { e.preventDefault(); setVideoDragOver(true); }}
            onDragLeave={() => setVideoDragOver(false)}
            onDrop={handleVideoDrop}
            onClick={() => videoInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              videoDragOver
                ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                : "border-[var(--color-border)] hover:border-[var(--color-primary)]"
            }`}
          >
            <p className="text-2xl mb-2">🎬</p>
            <p className="text-sm text-[var(--color-sub)]">動画を追加</p>
            <p className="text-xs text-[var(--color-mute)] mt-1">
              クリックまたはドラッグ&ドロップ（MP4, MOV, WebM）
            </p>
          </div>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            multiple
            className="hidden"
            onChange={(e) => {
              handleVideoUpload(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {/* Section 5: レビュー管理 */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-6">
          <h2 className="text-lg font-bold text-[var(--color-ink)] mb-4">
            レビュー管理
            <span className="text-sm font-normal text-[var(--color-mute)] ml-2">{reviews.length}件</span>
          </h2>

          {reviews.length === 0 ? (
            <p className="text-sm text-[var(--color-mute)] text-center py-8">
              レビューはまだありません
            </p>
          ) : (
            <div className="space-y-3">
              {reviews.map((review, i) => (
                <div
                  key={i}
                  className="bg-[var(--color-soft)] rounded-xl p-4"
                >
                  {editingReviewIndex === i ? (
                    /* Inline edit form */
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-[var(--color-mute)] mb-1">評価</label>
                        <StarRating rating={editReviewRating} onChange={setEditReviewRating} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--color-mute)] mb-1">コメント</label>
                        <textarea
                          value={editReviewComment}
                          onChange={(e) => setEditReviewComment(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm bg-[var(--color-card)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-primary)] resize-y"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveReview}
                          className="text-xs px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity cursor-pointer"
                        >
                          保存
                        </button>
                        <button
                          onClick={() => setEditingReviewIndex(null)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-[var(--color-border)] text-[var(--color-sub)] hover:bg-[var(--color-mute)]/20 transition-colors cursor-pointer"
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Display mode */
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-[var(--color-ink)]">{review.name}</p>
                          <StarRating rating={review.rating} />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditReview(i)}
                            className="text-xs px-2.5 py-1 rounded-lg bg-[var(--color-card)] text-[var(--color-sub)] hover:bg-[var(--color-border)] transition-colors cursor-pointer"
                          >
                            編集
                          </button>
                          {deleteConfirmIndex === i ? (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleDeleteReview(i)}
                                className="text-xs px-2.5 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer"
                              >
                                確認
                              </button>
                              <button
                                onClick={() => setDeleteConfirmIndex(null)}
                                className="text-xs px-2.5 py-1 rounded-lg bg-[var(--color-card)] text-[var(--color-sub)] hover:bg-[var(--color-border)] transition-colors cursor-pointer"
                              >
                                取消
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmIndex(i)}
                              className="text-xs px-2.5 py-1 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              削除
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-[var(--color-sub)] leading-relaxed">{review.comment}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 6: SNS共有テキスト */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-6">
          <h2 className="text-lg font-bold text-[var(--color-ink)] mb-4">SNS共有テキスト</h2>

          <div className="mb-3">
            <label className="block text-sm font-medium text-[var(--color-mute)] mb-1">プレビュー</label>
            <div className="bg-[var(--color-soft)] rounded-lg p-3 text-sm text-[var(--color-sub)]">
              {shareText}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-mute)] mb-1">テンプレート編集</label>
            <textarea
              value={shareText}
              onChange={(e) => setShareText(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm bg-[var(--color-card)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-primary)] resize-y"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 pb-8">
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
          >
            保存
          </button>
          <button
            onClick={() => router.push("/admin/archive")}
            className="px-6 py-2.5 rounded-lg bg-[var(--color-border)] text-[var(--color-sub)] text-sm font-medium hover:bg-[var(--color-mute)]/20 transition-colors cursor-pointer"
          >
            キャンセル
          </button>
          {saved && (
            <span className="text-sm text-green-600 font-medium">保存しました</span>
          )}
        </div>
      </div>
    </div>
  );
}
