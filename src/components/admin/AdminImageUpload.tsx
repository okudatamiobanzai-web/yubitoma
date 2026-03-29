"use client";

import { useState, useRef } from "react";
import { uploadMedia, deleteMedia } from "@/lib/admin-data";

interface AdminImageUploadProps {
  label: string;
  currentUrl: string | null;
  onUrlChange: (url: string | null) => void;
  folder: string;
}

export function AdminImageUpload({ label, currentUrl, onUrlChange, folder }: AdminImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const url = await uploadMedia(file, folder);
      onUrlChange(url);
    } catch (e) {
      alert("アップロードに失敗しました: " + (e instanceof Error ? e.message : "不明なエラー"));
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    if (currentUrl) {
      try {
        await deleteMedia(currentUrl);
      } catch {
        // 削除失敗してもURL解除は行う
      }
      onUrlChange(null);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div>
      <label className="block text-sm font-medium text-[var(--color-ink)] mb-2">{label}</label>

      {currentUrl ? (
        <div className="relative inline-block">
          <img
            src={currentUrl}
            alt=""
            className="max-w-md max-h-48 rounded-lg border border-[var(--color-border)] object-cover"
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => inputRef.current?.click()}
              className="text-xs px-3 py-1.5 rounded-lg bg-[var(--color-soft)] text-[var(--color-ink)] hover:bg-[var(--color-border)] transition-colors cursor-pointer"
            >
              変更
            </button>
            <button
              onClick={handleRemove}
              className="text-xs px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              削除
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
            ${dragOver
              ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]"
              : "border-[var(--color-border)] hover:border-[var(--color-primary)]"
            }
          `}
        >
          {uploading ? (
            <p className="text-sm text-[var(--color-sub)]">アップロード中...</p>
          ) : (
            <>
              <p className="text-2xl mb-2">📷</p>
              <p className="text-sm text-[var(--color-sub)]">
                クリックまたはドラッグ&ドロップ
              </p>
              <p className="text-xs text-[var(--color-mute)] mt-1">
                JPG, PNG, WebP（最大50MB）
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
