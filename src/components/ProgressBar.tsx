import { Event } from "@/lib/types";

export function ProgressBar({ event }: { event: Event }) {
  const attendeeCount = event.attendees?.length ?? 0;
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
