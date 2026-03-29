"use client";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="text-4xl mb-4">😵</div>
      <h1 className="text-lg font-bold mb-2">エラーが発生しました</h1>
      <p className="text-sm text-[var(--color-mute)] mb-6 text-center">{error.message}</p>
      <button onClick={reset} className="px-6 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold">
        もう一度試す
      </button>
    </div>
  );
}
