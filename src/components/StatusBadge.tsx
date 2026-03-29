import { EventStatus } from "@/lib/types";

const statusConfig: Record<EventStatus, { label: string; className: string }> = {
  recruiting: { label: "募集中", className: "bg-[var(--color-accent-soft)] text-[var(--color-primary)]" },
  confirmed: { label: "開催確定", className: "bg-[var(--color-accent-soft)] text-[var(--color-primary-dark)] ring-1 ring-[var(--color-primary)]/20" },
  closed: { label: "締切", className: "bg-[var(--color-soft)] text-[var(--color-sub)]" },
  cancelled: { label: "中止", className: "bg-red-50 text-[var(--color-danger)]" },
};

export function StatusBadge({ status }: { status: EventStatus }) {
  const config = statusConfig[status];
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${config.className}`}>
      {config.label}
    </span>
  );
}
