"use client";

export default function LoadingState({ message = "読み込み中..." }: { message?: string }) {
  return (
    <div className="text-center py-16">
      <div className="w-6 h-6 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
      <p className="text-sm text-[var(--color-mute)]">{message}</p>
    </div>
  );
}
