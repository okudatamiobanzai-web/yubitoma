// スケルトン（ローディングプレースホルダー）

export function EventCardSkeleton() {
  return (
    <div className="bg-[var(--color-card)] rounded-2xl shadow-sm border border-[var(--color-border)] overflow-hidden animate-pulse">
      {/* チラシ部分 */}
      <div className="h-40 bg-[var(--color-soft)]" />
      <div className="p-4 space-y-3">
        {/* タグ行 */}
        <div className="flex gap-2">
          <div className="h-5 w-14 bg-[var(--color-soft)] rounded-full" />
          <div className="h-5 w-20 bg-[var(--color-soft)] rounded-full" />
        </div>
        {/* タイトル */}
        <div className="h-5 w-3/4 bg-[var(--color-soft)] rounded" />
        {/* 説明 */}
        <div className="space-y-1.5">
          <div className="h-3 w-full bg-[var(--color-soft)] rounded" />
          <div className="h-3 w-2/3 bg-[var(--color-soft)] rounded" />
        </div>
        {/* 日時・場所 */}
        <div className="flex gap-3">
          <div className="h-3.5 w-28 bg-[var(--color-soft)] rounded" />
          <div className="h-3.5 w-24 bg-[var(--color-soft)] rounded" />
        </div>
        {/* プログレスバー */}
        <div className="h-2 w-full bg-[var(--color-soft)] rounded-full" />
        {/* フッター */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-[var(--color-soft)] rounded-full" />
            <div className="h-3 w-28 bg-[var(--color-soft)] rounded" />
          </div>
          <div className="h-4 w-20 bg-[var(--color-soft)] rounded" />
        </div>
      </div>
    </div>
  );
}

export function EventDetailSkeleton() {
  return (
    <div className="pb-24 animate-pulse">
      {/* ヒーロー */}
      <div className="w-full aspect-[16/9] bg-[var(--color-soft)]" />
      <div className="px-4 -mt-6 relative z-10 space-y-4">
        {/* メインカード */}
        <div className="bg-[var(--color-card)] rounded-2xl shadow-lg p-5 space-y-4">
          <div className="flex gap-2">
            <div className="h-6 w-16 bg-[var(--color-soft)] rounded-full" />
            <div className="h-6 w-20 bg-[var(--color-soft)] rounded-full" />
          </div>
          <div className="h-7 w-4/5 bg-[var(--color-soft)] rounded" />
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--color-soft)] rounded-xl" />
              <div className="space-y-1.5">
                <div className="h-4 w-32 bg-[var(--color-soft)] rounded" />
                <div className="h-3 w-20 bg-[var(--color-soft)] rounded" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--color-soft)] rounded-xl" />
              <div className="space-y-1.5">
                <div className="h-4 w-28 bg-[var(--color-soft)] rounded" />
                <div className="h-3 w-36 bg-[var(--color-soft)] rounded" />
              </div>
            </div>
          </div>
          <div className="h-2 w-full bg-[var(--color-soft)] rounded-full" />
        </div>
        {/* 詳細カード */}
        <div className="bg-[var(--color-card)] rounded-2xl shadow-sm p-5 space-y-3">
          <div className="h-4 w-12 bg-[var(--color-soft)] rounded" />
          <div className="h-3 w-full bg-[var(--color-soft)] rounded" />
          <div className="h-3 w-full bg-[var(--color-soft)] rounded" />
          <div className="h-3 w-2/3 bg-[var(--color-soft)] rounded" />
        </div>
        {/* メンバーカード */}
        <div className="bg-[var(--color-card)] rounded-2xl shadow-sm p-5 space-y-3">
          <div className="h-4 w-24 bg-[var(--color-soft)] rounded" />
          <div className="flex gap-1">
            {[1,2,3].map(i => <div key={i} className="w-10 h-10 bg-[var(--color-soft)] rounded-full" />)}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--color-soft)] rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-3/4 bg-[var(--color-soft)] rounded" />
            <div className="h-3 w-1/2 bg-[var(--color-soft)] rounded" />
          </div>
          <div className="h-5 w-14 bg-[var(--color-soft)] rounded-full" />
        </div>
      ))}
    </div>
  );
}
