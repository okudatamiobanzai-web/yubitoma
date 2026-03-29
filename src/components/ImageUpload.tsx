"use client";

import { useState, useRef } from "react";

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
}

interface ImageUploadProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  maxFiles?: number;
  label?: string;
  accept?: string;
}

function generateId() {
  return `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function ImageUpload({
  images,
  onChange,
  maxFiles = 5,
  label = "画像をアップロード",
  accept = "image/*",
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const remaining = maxFiles - images.length;
    if (remaining <= 0) return;

    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(files).slice(0, remaining).forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: 対応していない形式です（JPEG/PNG/GIF/WebPのみ）`);
      } else if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: ファイルサイズが大きすぎます（${formatFileSize(file.size)}、上限10MB）`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      alert(errors.join("\n"));
    }

    if (validFiles.length > 0) {
      const newImages: UploadedImage[] = validFiles.map((file) => ({
        id: generateId(),
        file,
        preview: URL.createObjectURL(file),
      }));
      onChange([...images, ...newImages]);
    }
  };

  const handleDelete = (id: string) => {
    const target = images.find((img) => img.id === id);
    if (target) {
      URL.revokeObjectURL(target.preview);
    }
    onChange(images.filter((img) => img.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* プレビューグリッド */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {images.map((img) => (
            <div key={img.id} className="relative group">
              <div className="aspect-square rounded-xl overflow-hidden bg-[var(--color-soft)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.preview}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              {/* 削除ボタン */}
              <button
                type="button"
                onClick={() => handleDelete(img.id)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[var(--color-danger)] text-white rounded-full flex items-center justify-center text-xs shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {/* ファイルサイズ */}
              <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded">
                {formatFileSize(img.file.size)}
              </div>
            </div>
          ))}

          {/* 追加ボタン（まだ追加可能な場合） */}
          {images.length < maxFiles && (
            <button
              type="button"
              onClick={handleClick}
              className="aspect-square rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center gap-1 hover:border-[var(--color-primary)] hover:bg-[var(--color-accent-soft)] transition-all"
            >
              <svg className="w-5 h-5 text-[var(--color-mute)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-[9px] text-[var(--color-mute)]">追加</span>
            </button>
          )}
        </div>
      )}

      {/* ドロップゾーン（画像がない場合） */}
      {images.length === 0 && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-[var(--color-primary)] bg-[var(--color-accent-soft)]"
              : "border-[var(--color-border)] hover:border-[var(--color-mute)] hover:bg-[var(--color-soft)]"
          }`}
        >
          <div className="text-2xl mb-2">📷</div>
          <div className="text-xs font-medium text-[var(--color-sub)]">{label}</div>
          <div className="text-[10px] text-[var(--color-mute)] mt-1">
            {isDragging
              ? "ここにドロップ"
              : `タップまたはドラッグ＆ドロップ（最大${maxFiles}枚）`}
          </div>
        </div>
      )}

      {/* 残り枚数 */}
      {images.length > 0 && (
        <div className="text-[10px] text-[var(--color-mute)] text-right">
          {images.length}/{maxFiles}枚
        </div>
      )}
    </div>
  );
}
