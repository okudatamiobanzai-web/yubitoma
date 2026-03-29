"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { fetchProject, createProjectUpdate } from "@/lib/data";
import { uploadMedia } from "@/lib/admin-data";
import { PageHeader } from "@/components/PageHeader";
import type { Project } from "@/lib/types";

export default function ProjectUpdatePage() {
  const params = useParams();
  const router = useRouter();
  const { dbProfileId, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const MAX_IMAGES = 5;

  useEffect(() => {
    async function load() {
      try {
        const proj = await fetchProject(params.id as string);
        setProject(proj);
      } catch (e) {
        console.error("Failed to load project:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  const addImages = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const remaining = MAX_IMAGES - images.length;
    const toAdd = fileArray.slice(0, remaining);

    const newImages = toAdd.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newImages]);
  }, [images.length]);

  const removeImage = (index: number) => {
    setImages((prev) => {
      const removed = prev[index];
      URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addImages(e.target.files);
    }
    // Reset so same file can be selected again
    e.target.value = "";
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      addImages(e.dataTransfer.files);
    }
  }, [addImages]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleSubmit = async () => {
    if (!content.trim() || !dbProfileId || !project) return;
    setSubmitting(true);
    try {
      // 画像をアップロード
      const imageUrls: string[] = [];
      for (const img of images) {
        try {
          const url = await uploadMedia(img.file, "project-updates");
          if (url) imageUrls.push(url);
        } catch (e) {
          console.error("Image upload failed:", e);
        }
      }

      // DB保存
      await createProjectUpdate({
        project_id: project.id,
        author_id: dbProfileId,
        content: content.trim(),
        image_urls: imageUrls,
      });

      setShowSuccess(true);
      setTimeout(() => {
        router.push(`/projects/${params.id}`);
      }, 1500);
    } catch (e) {
      console.error("Update submission failed:", e);
      alert("投稿に失敗しました。もう一度お試しください。");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[var(--color-project)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[var(--color-mute)]">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-5xl mb-4">🚀</div>
        <p className="text-[var(--color-sub)] font-medium">プロジェクトが見つかりません</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 text-sm text-[var(--color-primary)] font-medium"
        >
          ← ホームに戻る
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <PageHeader
        title="進捗を投稿"
        backHref={`/projects/${project.id}`}
        backLabel="プロジェクト"
      />

      <div className="px-4 py-4 space-y-5">
        {/* Project context */}
        <div className="bg-[var(--color-soft)] rounded-xl p-3 flex items-center gap-2.5">
          <span className="text-xl">🚀</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold truncate">{project.title}</div>
            <div className="text-[10px] text-[var(--color-mute)]">進捗をメンバーや応援者に共有しよう</div>
          </div>
        </div>

        {/* Content textarea */}
        <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-4">
          <label className="block text-xs font-bold text-[var(--color-sub)] mb-2">
            内容 <span className="text-red-400">*</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="プロジェクトの進捗を共有しよう"
            rows={6}
            className="w-full bg-transparent text-sm resize-none focus:outline-none placeholder:text-[var(--color-mute)] leading-relaxed"
          />
          <div className="flex justify-end mt-1">
            <span className={`text-[10px] ${content.length > 1000 ? "text-red-400" : "text-[var(--color-mute)]"}`}>
              {content.length}/1000
            </span>
          </div>
        </div>

        {/* Image upload */}
        <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] p-4">
          <label className="block text-xs font-bold text-[var(--color-sub)] mb-2">
            画像（最大{MAX_IMAGES}枚）
          </label>

          {/* Preview grid */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-[var(--color-soft)]">
                  <div
                    className="w-full h-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${img.preview})` }}
                  />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Drop zone / Add button */}
          {images.length < MAX_IMAGES && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                isDragOver
                  ? "border-[var(--color-project)] bg-[var(--color-project)]/5"
                  : "border-[var(--color-border)] hover:border-[var(--color-project)]/50"
              }`}
            >
              <div className="text-2xl mb-1">📷</div>
              <p className="text-xs text-[var(--color-sub)] font-medium">
                タップまたはドラッグ&ドロップで追加
              </p>
              <p className="text-[10px] text-[var(--color-mute)] mt-0.5">
                あと{MAX_IMAGES - images.length}枚追加できます
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || submitting || content.length > 1000}
          className="w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-40"
          style={{ backgroundColor: "var(--color-project)" }}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              投稿中…
            </span>
          ) : (
            "📝 投稿する"
          )}
        </button>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div
            className="bg-[var(--color-card)] rounded-3xl p-8 mx-6 text-center max-w-sm"
            style={{ animation: "slideUp 0.3s ease-out" }}
          >
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-lg font-bold mb-1">投稿しました！</h3>
            <p className="text-xs text-[var(--color-mute)]">
              進捗がメンバーや応援者に共有されます
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
