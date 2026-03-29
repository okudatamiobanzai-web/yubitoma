import { Event } from "@/lib/types";

export function ProgressBar({ event }: { event: Event }) {
  const attendeeCount = event.attendees?.length ?? 0;

  if (event.event_type === "nomikai") {
    const target = event.min_people;
    const pct = Math.min(100, (attendeeCount / target) * 100);
    return (
      <div>
        <div className="flex justify-between text-xs text-[var(--color-sub)] mb-1">
          <span>{attendeeCount}人参加</span>
          <span>あと{Math.max(0, target - attendeeCount)}人で開催</span>
        </div>
        <div className="w-full bg-[var(--color-soft)] rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${pct >= 100 ? "bg-[var(--color-success)]" : "bg-[var(--color-primary)]"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  // 体験イベント: 売上ベース
  const currentRevenue = attendeeCount * (event.fee_per_person ?? 0);
  const targetRevenue = event.target_revenue ?? 0;
  const pct = targetRevenue > 0 ? Math.min(100, (currentRevenue / targetRevenue) * 100) : 0;

  return (
    <div>
      <div className="flex justify-between text-xs text-[var(--color-sub)] mb-1">
        <span>
          {currentRevenue.toLocaleString()}円 / {targetRevenue.toLocaleString()}円
        </span>
        <span>{attendeeCount}人参加</span>
      </div>
      <div className="w-full bg-[var(--color-soft)] rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${pct >= 100 ? "bg-[var(--color-success)]" : "bg-[var(--color-event)]"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
