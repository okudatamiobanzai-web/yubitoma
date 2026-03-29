"use client";

import { useState, useEffect } from "react";

interface CountdownProps {
  deadline: string;
  compact?: boolean;
}

function calcRemaining(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds, diff };
}

export function Countdown({ deadline, compact = false }: CountdownProps) {
  const [remaining, setRemaining] = useState(calcRemaining(deadline));

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining(calcRemaining(deadline));
    }, 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  if (!remaining) {
    return (
      <span className="text-xs text-[var(--color-danger)] font-bold">
        締切済み
      </span>
    );
  }

  const isUrgent = remaining.diff < 1000 * 60 * 60 * 24; // 24h以内

  if (compact) {
    return (
      <span className={`text-xs font-bold ${isUrgent ? "text-[var(--color-danger)]" : "text-[var(--color-primary)]"}`}>
        {remaining.days > 0
          ? `あと${remaining.days}日${remaining.hours}時間`
          : `あと${remaining.hours}:${String(remaining.minutes).padStart(2, "0")}:${String(remaining.seconds).padStart(2, "0")}`}
      </span>
    );
  }

  return (
    <div className={`rounded-xl p-3 ${isUrgent ? "bg-red-50 border border-[var(--color-danger)]/20" : "bg-[var(--color-accent-soft)] border border-[var(--color-primary)]/10"}`}>
      <div className="text-[10px] text-[var(--color-mute)] mb-1.5">⏰ 募集締め切りまで</div>
      <div className="flex gap-2 justify-center">
        {remaining.days > 0 && (
          <div className="text-center">
            <div className={`text-xl font-bold tabular-nums ${isUrgent ? "text-[var(--color-danger)]" : "text-[var(--color-primary)]"}`}>
              {remaining.days}
            </div>
            <div className="text-[9px] text-[var(--color-mute)]">日</div>
          </div>
        )}
        <div className="text-center">
          <div className={`text-xl font-bold tabular-nums ${isUrgent ? "text-[var(--color-danger)]" : "text-[var(--color-primary)]"}`}>
            {String(remaining.hours).padStart(2, "0")}
          </div>
          <div className="text-[9px] text-[var(--color-mute)]">時間</div>
        </div>
        <div className={`text-xl font-bold ${isUrgent ? "text-[var(--color-danger)]" : "text-[var(--color-primary)]"}`}>:</div>
        <div className="text-center">
          <div className={`text-xl font-bold tabular-nums ${isUrgent ? "text-[var(--color-danger)]" : "text-[var(--color-primary)]"}`}>
            {String(remaining.minutes).padStart(2, "0")}
          </div>
          <div className="text-[9px] text-[var(--color-mute)]">分</div>
        </div>
        <div className={`text-xl font-bold ${isUrgent ? "text-[var(--color-danger)]" : "text-[var(--color-primary)]"}`}>:</div>
        <div className="text-center">
          <div className={`text-xl font-bold tabular-nums ${isUrgent ? "text-[var(--color-danger)]" : "text-[var(--color-primary)]"}`}>
            {String(remaining.seconds).padStart(2, "0")}
          </div>
          <div className="text-[9px] text-[var(--color-mute)]">秒</div>
        </div>
      </div>
    </div>
  );
}
